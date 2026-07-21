package identity_test

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
)

func TestRemoteOIDCProviderUsesDiscoveryAuthorizationCodePKCEAndVerifiedClaims(t *testing.T) {
	t.Parallel()
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate signing key: %v", err)
	}
	const clientID = "aviasurveil360"
	const clientSecret = "oidc-client-secret"
	const expectedNonce = "expected-nonce"
	var server *httptest.Server
	mux := http.NewServeMux()
	mux.HandleFunc("/.well-known/openid-configuration", func(writer http.ResponseWriter, _ *http.Request) {
		writeOIDCTestJSON(writer, map[string]any{
			"issuer": server.URL, "authorization_endpoint": server.URL + "/authorize",
			"token_endpoint": server.URL + "/token", "jwks_uri": server.URL + "/keys",
			"response_types_supported": []string{"code"}, "subject_types_supported": []string{"public"},
			"id_token_signing_alg_values_supported": []string{"RS256"},
		})
	})
	mux.HandleFunc("/keys", func(writer http.ResponseWriter, _ *http.Request) {
		writeOIDCTestJSON(writer, map[string]any{"keys": []any{map[string]any{
			"kty": "RSA", "kid": "test-key", "use": "sig", "alg": "RS256",
			"n": base64.RawURLEncoding.EncodeToString(privateKey.PublicKey.N.Bytes()),
			"e": base64.RawURLEncoding.EncodeToString(big.NewInt(int64(privateKey.PublicKey.E)).Bytes()),
		}}})
	})
	mux.HandleFunc("/token", func(writer http.ResponseWriter, request *http.Request) {
		username, password, ok := request.BasicAuth()
		if !ok || username != clientID || password != clientSecret {
			t.Errorf("token client authentication = %q/%q, ok %t", username, password, ok)
		}
		if err := request.ParseForm(); err != nil {
			t.Errorf("parse token form: %v", err)
		}
		if request.Form.Get("grant_type") != "authorization_code" || request.Form.Get("code") != "authorization-code" || request.Form.Get("code_verifier") != "pkce-verifier" {
			t.Errorf("token form = %v", request.Form)
		}
		now := time.Now().UTC()
		idToken := signedOIDCTestToken(t, privateKey, map[string]any{
			"iss": server.URL, "sub": "inspector-oidc", "aud": clientID,
			"iat": now.Unix(), "exp": now.Add(time.Hour).Unix(), "nonce": expectedNonce,
			"name": "OIDC Inspector", "organization_id": "caa", "roles": []string{"inspector", "leadInspector"},
			"sid": "provider-session-001",
		})
		writeOIDCTestJSON(writer, map[string]any{
			"access_token": "server-access-token", "refresh_token": "server-refresh-token",
			"token_type": "Bearer", "expires_in": 3600, "id_token": idToken,
		})
	})
	server = httptest.NewServer(mux)
	defer server.Close()

	provider, err := identity.NewRemoteOIDCProvider(context.Background(), identity.RemoteOIDCConfig{
		IssuerURL: server.URL, ClientID: clientID, ClientSecret: clientSecret,
		RedirectURL: "https://avia.example/auth/callback",
	})
	if err != nil {
		t.Fatalf("new remote OIDC provider: %v", err)
	}
	authorizationURL, err := url.Parse(provider.AuthorizationURL("state-value", expectedNonce, "pkce-challenge"))
	if err != nil {
		t.Fatalf("parse authorization URL: %v", err)
	}
	query := authorizationURL.Query()
	for key, expected := range map[string]string{
		"client_id": clientID, "redirect_uri": "https://avia.example/auth/callback", "response_type": "code",
		"state": "state-value", "nonce": expectedNonce, "code_challenge": "pkce-challenge", "code_challenge_method": "S256",
	} {
		if query.Get(key) != expected {
			t.Errorf("authorization %s = %q, want %q", key, query.Get(key), expected)
		}
	}

	authenticated, err := provider.Exchange(context.Background(), "authorization-code", "pkce-verifier", expectedNonce)
	if err != nil {
		t.Fatalf("exchange authorization code: %v", err)
	}
	if authenticated.SubjectID != "inspector-oidc" || authenticated.Issuer != server.URL || authenticated.OrganizationID != "caa" || authenticated.DisplayName != "OIDC Inspector" || authenticated.ProviderSessionID != "provider-session-001" {
		t.Fatalf("verified identity = %+v", authenticated)
	}
	if len(authenticated.Roles) != 2 || authenticated.Roles[0] != identity.RoleInspector || authenticated.Roles[1] != identity.RoleLeadInspector {
		t.Fatalf("verified roles = %+v", authenticated.Roles)
	}
	if authenticated.Tokens.AccessToken != "server-access-token" || authenticated.Tokens.RefreshToken != "server-refresh-token" || authenticated.Tokens.IDToken == "" {
		t.Fatalf("server provider tokens = %+v", authenticated.Tokens)
	}
	if _, err := provider.Exchange(context.Background(), "authorization-code", "pkce-verifier", "wrong-nonce"); err == nil || !strings.Contains(strings.ToLower(err.Error()), "nonce") {
		t.Fatalf("wrong nonce error = %v", err)
	}
}

func signedOIDCTestToken(t *testing.T, key *rsa.PrivateKey, claims map[string]any) string {
	t.Helper()
	header, err := json.Marshal(map[string]string{"alg": "RS256", "kid": "test-key", "typ": "JWT"})
	if err != nil {
		t.Fatalf("encode token header: %v", err)
	}
	payload, err := json.Marshal(claims)
	if err != nil {
		t.Fatalf("encode token claims: %v", err)
	}
	unsigned := base64.RawURLEncoding.EncodeToString(header) + "." + base64.RawURLEncoding.EncodeToString(payload)
	digest := sha256.Sum256([]byte(unsigned))
	signature, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, digest[:])
	if err != nil {
		t.Fatalf("sign ID token: %v", err)
	}
	return fmt.Sprintf("%s.%s", unsigned, base64.RawURLEncoding.EncodeToString(signature))
}

func writeOIDCTestJSON(writer http.ResponseWriter, value any) {
	writer.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(writer).Encode(value)
}
