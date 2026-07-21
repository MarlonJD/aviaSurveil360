package identity

import (
	"context"
	"crypto/subtle"
	"fmt"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

type RemoteOIDCConfig struct {
	IssuerURL    string
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type RemoteOIDCProvider struct {
	oauthConfig oauth2.Config
	verifier    *oidc.IDTokenVerifier
}

func NewRemoteOIDCProvider(ctx context.Context, config RemoteOIDCConfig) (*RemoteOIDCProvider, error) {
	if strings.TrimSpace(config.IssuerURL) == "" || strings.TrimSpace(config.ClientID) == "" || strings.TrimSpace(config.ClientSecret) == "" || strings.TrimSpace(config.RedirectURL) == "" {
		return nil, fmt.Errorf("OIDC issuer, client ID, client secret, and redirect URL are required")
	}
	provider, err := oidc.NewProvider(ctx, config.IssuerURL)
	if err != nil {
		return nil, fmt.Errorf("discover OIDC provider: %w", err)
	}
	return &RemoteOIDCProvider{
		oauthConfig: oauth2.Config{
			ClientID: config.ClientID, ClientSecret: config.ClientSecret, Endpoint: provider.Endpoint(),
			RedirectURL: config.RedirectURL, Scopes: []string{oidc.ScopeOpenID, "profile"},
		},
		verifier: provider.Verifier(&oidc.Config{ClientID: config.ClientID}),
	}, nil
}

func (provider *RemoteOIDCProvider) AuthorizationURL(state, nonce, pkceChallenge string) string {
	return provider.oauthConfig.AuthCodeURL(
		state,
		oidc.Nonce(nonce),
		oauth2.SetAuthURLParam("code_challenge", pkceChallenge),
		oauth2.SetAuthURLParam("code_challenge_method", "S256"),
	)
}

func (provider *RemoteOIDCProvider) Exchange(ctx context.Context, code, pkceVerifier, expectedNonce string) (OIDCIdentity, error) {
	if strings.TrimSpace(code) == "" || strings.TrimSpace(pkceVerifier) == "" || strings.TrimSpace(expectedNonce) == "" {
		return OIDCIdentity{}, fmt.Errorf("authorization code, PKCE verifier, and expected nonce are required")
	}
	token, err := provider.oauthConfig.Exchange(ctx, code, oauth2.VerifierOption(pkceVerifier))
	if err != nil {
		return OIDCIdentity{}, fmt.Errorf("exchange OIDC authorization code: %w", err)
	}
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok || rawIDToken == "" {
		return OIDCIdentity{}, fmt.Errorf("OIDC token response omitted id_token")
	}
	verifiedToken, err := provider.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return OIDCIdentity{}, fmt.Errorf("verify OIDC ID token: %w", err)
	}
	if !constantTimeEqual(verifiedToken.Nonce, expectedNonce) {
		return OIDCIdentity{}, fmt.Errorf("OIDC ID token nonce mismatch")
	}
	var claims struct {
		Name              string   `json:"name"`
		PreferredUsername string   `json:"preferred_username"`
		OrganizationID    string   `json:"organization_id"`
		Roles             []string `json:"roles"`
		SID               string   `json:"sid"`
		RealmAccess       struct {
			Roles []string `json:"roles"`
		} `json:"realm_access"`
	}
	if err := verifiedToken.Claims(&claims); err != nil {
		return OIDCIdentity{}, fmt.Errorf("decode verified OIDC claims: %w", err)
	}
	if strings.TrimSpace(verifiedToken.Subject) == "" || strings.TrimSpace(claims.OrganizationID) == "" {
		return OIDCIdentity{}, fmt.Errorf("verified OIDC subject and organization_id are required")
	}
	roles := canonicalRoles(append(append([]string(nil), claims.Roles...), claims.RealmAccess.Roles...))
	if len(roles) == 0 {
		return OIDCIdentity{}, fmt.Errorf("verified OIDC token contains no supported AviaSurveil360 role")
	}
	displayName := strings.TrimSpace(claims.Name)
	if displayName == "" {
		displayName = strings.TrimSpace(claims.PreferredUsername)
	}
	if displayName == "" {
		displayName = verifiedToken.Subject
	}
	return OIDCIdentity{
		SubjectID: verifiedToken.Subject, Issuer: verifiedToken.Issuer, DisplayName: displayName,
		OrganizationID: strings.TrimSpace(claims.OrganizationID), Roles: roles,
		ProviderSessionID: strings.TrimSpace(claims.SID),
		Tokens: ProviderTokens{
			AccessToken: token.AccessToken, RefreshToken: token.RefreshToken, IDToken: rawIDToken, Expiry: token.Expiry,
		},
	}, nil
}

func canonicalRoles(rawRoles []string) []Role {
	seen := map[Role]bool{}
	roles := make([]Role, 0, len(rawRoles))
	for _, rawRole := range rawRoles {
		role := Role(strings.TrimSpace(rawRole))
		switch role {
		case RoleInspector, RoleLeadInspector, RoleDepartmentManager, RoleGeneralManager,
			RoleFinance, RoleExecutiveDirector, RoleAuditee, RoleAdmin:
			if !seen[role] {
				seen[role] = true
				roles = append(roles, role)
			}
		}
	}
	return roles
}

func constantTimeEqual(actual, expected string) bool {
	if len(actual) != len(expected) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(actual), []byte(expected)) == 1
}
