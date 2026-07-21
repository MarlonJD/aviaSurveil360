package integration_test

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"html"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"regexp"
	"strings"
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
)

func TestPinnedLocalKeycloakCompletesRealAuthorizationCodePKCEFlow(t *testing.T) {
	issuerURL := requiredTestEnv(t, "AVIA_TEST_OIDC_ISSUER_URL")
	clientID := requiredTestEnv(t, "AVIA_TEST_OIDC_CLIENT_ID")
	clientSecret := requiredTestEnv(t, "AVIA_TEST_OIDC_CLIENT_SECRET")
	redirectURL := requiredTestEnv(t, "AVIA_TEST_OIDC_REDIRECT_URL")
	provider, err := identity.NewRemoteOIDCProvider(context.Background(), identity.RemoteOIDCConfig{
		IssuerURL: issuerURL, ClientID: clientID, ClientSecret: clientSecret, RedirectURL: redirectURL,
	})
	if err != nil {
		t.Fatalf("discover local Keycloak: %v", err)
	}
	const state = "local-keycloak-state"
	const nonce = "local-keycloak-nonce"
	const verifier = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY"
	challengeHash := sha256.Sum256([]byte(verifier))
	challenge := base64.RawURLEncoding.EncodeToString(challengeHash[:])

	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatalf("create OIDC cookie jar: %v", err)
	}
	client := &http.Client{Jar: jar}
	authorizationURL := provider.AuthorizationURL(state, nonce, challenge)
	loginResponse, err := client.Get(authorizationURL)
	if err != nil {
		t.Fatalf("open local Keycloak login: %v", err)
	}
	loginBody, err := io.ReadAll(loginResponse.Body)
	_ = loginResponse.Body.Close()
	if err != nil || loginResponse.StatusCode != http.StatusOK {
		t.Fatalf("read local Keycloak login = status %d, err %v", loginResponse.StatusCode, err)
	}
	formTagPattern := regexp.MustCompile(`(?s)<form[^>]*id="kc-form-login"[^>]*>`)
	actionPattern := regexp.MustCompile(`action="([^"]+)"`)
	formTag := formTagPattern.Find(loginBody)
	actionMatch := actionPattern.FindSubmatch(formTag)
	if len(actionMatch) != 2 {
		t.Fatalf("local Keycloak login form action not found")
	}
	actionURL := html.UnescapeString(string(actionMatch[1]))
	values := url.Values{
		"username":     {"inspector.local"},
		"password":     {"LocalInspectorPass123!"},
		"credentialId": {""},
	}
	client.CheckRedirect = func(request *http.Request, _ []*http.Request) error {
		if request.URL.String() == redirectURL || strings.HasPrefix(request.URL.String(), redirectURL+"?") {
			return http.ErrUseLastResponse
		}
		return nil
	}
	callbackResponse, err := client.PostForm(actionURL, values)
	if err != nil {
		t.Fatalf("submit local Keycloak login: %v", err)
	}
	callbackBody, readErr := io.ReadAll(callbackResponse.Body)
	_ = callbackResponse.Body.Close()
	if readErr != nil {
		t.Fatalf("read local Keycloak callback: %v", readErr)
	}
	location := callbackResponse.Header.Get("Location")
	if callbackResponse.StatusCode != http.StatusFound || !strings.HasPrefix(location, redirectURL+"?") {
		t.Fatalf("local Keycloak callback = status %d, location %q, body %s", callbackResponse.StatusCode, location, callbackBody)
	}
	callbackURL, err := url.Parse(location)
	if err != nil {
		t.Fatalf("parse local Keycloak callback: %v", err)
	}
	if callbackURL.Query().Get("state") != state || callbackURL.Query().Get("code") == "" {
		t.Fatalf("local Keycloak callback query = %v", callbackURL.Query())
	}
	authenticated, err := provider.Exchange(context.Background(), callbackURL.Query().Get("code"), verifier, nonce)
	if err != nil {
		t.Fatalf("exchange local Keycloak authorization code: %v", err)
	}
	if authenticated.SubjectID == "" || authenticated.OrganizationID != "caa" || !containsIdentityRole(authenticated.Roles, identity.RoleInspector) {
		t.Fatalf("local Keycloak verified identity = %+v", authenticated)
	}
	if authenticated.Tokens.AccessToken == "" || authenticated.Tokens.RefreshToken == "" || authenticated.Tokens.IDToken == "" {
		t.Fatalf("local Keycloak server tokens incomplete: %+v", authenticated.Tokens)
	}
}

func requiredTestEnv(t *testing.T, key string) string {
	t.Helper()
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		t.Fatalf("%s is required; run ./scripts/test-http-profile.sh", key)
	}
	return value
}

func containsIdentityRole(roles []identity.Role, expected identity.Role) bool {
	for _, role := range roles {
		if role == expected {
			return true
		}
	}
	return false
}
