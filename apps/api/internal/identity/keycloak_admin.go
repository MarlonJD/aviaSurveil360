package identity

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"net/url"
	"path"
	"strings"
	"time"
)

var ErrKeycloakDuplicateEmail = errors.New("Keycloak user email already exists")

type KeycloakAdminConfig struct {
	BaseURL       string
	Realm         string
	AdminUsername string
	AdminPassword string
	HTTPClient    *http.Client
}

type KeycloakUser struct {
	Email          string
	FirstName      string
	LastName       string
	OrganizationID string
	Roles          []Role
}

type KeycloakAdminClient struct {
	baseURL       *url.URL
	realm         string
	adminUsername string
	adminPassword string
	httpClient    *http.Client
}

func NewKeycloakAdminClient(config KeycloakAdminConfig) (*KeycloakAdminClient, error) {
	baseURL, err := url.Parse(strings.TrimRight(strings.TrimSpace(config.BaseURL), "/"))
	if err != nil || baseURL.Scheme == "" || baseURL.Host == "" {
		return nil, fmt.Errorf("valid Keycloak base URL is required")
	}
	if baseURL.Scheme != "http" && baseURL.Scheme != "https" {
		return nil, fmt.Errorf("Keycloak base URL must use HTTP or HTTPS")
	}
	realm := strings.TrimSpace(config.Realm)
	adminUsername := strings.TrimSpace(config.AdminUsername)
	if realm == "" || adminUsername == "" || config.AdminPassword == "" {
		return nil, fmt.Errorf("Keycloak realm and admin credentials are required")
	}
	httpClient := config.HTTPClient
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 10 * time.Second}
	}
	return &KeycloakAdminClient{
		baseURL:       baseURL,
		realm:         realm,
		adminUsername: adminUsername,
		adminPassword: config.AdminPassword,
		httpClient:    httpClient,
	}, nil
}

func (client *KeycloakAdminClient) ProvisionUser(
	ctx context.Context,
	user KeycloakUser,
) (string, error) {
	user, err := normalizeKeycloakUser(user)
	if err != nil {
		return "", err
	}
	accessToken, err := client.adminAccessToken(ctx)
	if err != nil {
		return "", err
	}
	existing, err := client.findUsersByEmail(ctx, accessToken, user.Email)
	if err != nil {
		return "", err
	}
	if len(existing) > 0 {
		return "", ErrKeycloakDuplicateEmail
	}

	representation := struct {
		Username        string              `json:"username"`
		Email           string              `json:"email"`
		FirstName       string              `json:"firstName"`
		LastName        string              `json:"lastName"`
		Enabled         bool                `json:"enabled"`
		EmailVerified   bool                `json:"emailVerified"`
		Attributes      map[string][]string `json:"attributes"`
		RequiredActions []string            `json:"requiredActions"`
	}{
		Username: user.Email, Email: user.Email,
		FirstName: user.FirstName, LastName: user.LastName,
		Enabled: true, EmailVerified: true,
		Attributes: map[string][]string{
			"organization_id": {user.OrganizationID},
		},
		RequiredActions: []string{"CONFIGURE_TOTP"},
	}
	response, err := client.doJSON(
		ctx,
		http.MethodPost,
		client.adminEndpoint("users"),
		accessToken,
		representation,
		http.StatusCreated,
	)
	if err != nil {
		return "", fmt.Errorf("create Keycloak user: %w", err)
	}
	response.Body.Close()
	subjectID, err := createdSubjectID(response.Header.Get("Location"))
	if err != nil {
		return "", err
	}

	roleRepresentations := make([]keycloakRoleRepresentation, 0, len(user.Roles))
	for _, role := range user.Roles {
		roleRepresentation, err := client.realmRole(ctx, accessToken, role)
		if err != nil {
			return "", err
		}
		roleRepresentations = append(roleRepresentations, roleRepresentation)
	}
	response, err = client.doJSON(
		ctx,
		http.MethodPost,
		client.adminEndpoint(
			"users",
			subjectID,
			"role-mappings",
			"realm",
		),
		accessToken,
		roleRepresentations,
		http.StatusNoContent,
	)
	if err != nil {
		return "", fmt.Errorf("map Keycloak realm roles: %w", err)
	}
	response.Body.Close()
	return subjectID, nil
}

func (client *KeycloakAdminClient) ReconcileProvisionedUser(
	ctx context.Context,
	user KeycloakUser,
) (string, bool, error) {
	user, err := normalizeKeycloakUser(user)
	if err != nil {
		return "", false, err
	}
	accessToken, err := client.adminAccessToken(ctx)
	if err != nil {
		return "", false, err
	}
	existing, err := client.findUsersByEmail(ctx, accessToken, user.Email)
	if err != nil {
		return "", false, err
	}
	if len(existing) != 1 {
		return "", false, nil
	}
	candidate := existing[0]
	organizations := candidate.Attributes["organization_id"]
	if candidate.ID == "" ||
		!candidate.Enabled ||
		candidate.Username != user.Email ||
		candidate.Email != user.Email ||
		candidate.FirstName != user.FirstName ||
		candidate.LastName != user.LastName ||
		len(organizations) != 1 ||
		organizations[0] != user.OrganizationID {
		return candidate.ID, false, nil
	}
	response, err := client.doJSON(
		ctx,
		http.MethodGet,
		client.adminEndpoint(
			"users",
			candidate.ID,
			"role-mappings",
			"realm",
		),
		accessToken,
		nil,
		http.StatusOK,
	)
	if err != nil {
		return "", false, fmt.Errorf(
			"list reconciled Keycloak user roles: %w",
			err,
		)
	}
	defer response.Body.Close()
	var mapped []keycloakRoleRepresentation
	if err := decodeLimitedJSON(response.Body, &mapped); err != nil {
		return "", false, fmt.Errorf(
			"decode reconciled Keycloak user roles: %w",
			err,
		)
	}
	actualRoles := make(map[Role]bool)
	for _, mappedRole := range mapped {
		canonical := canonicalRoles([]string{mappedRole.Name})
		if len(canonical) == 1 {
			actualRoles[canonical[0]] = true
		}
	}
	if len(actualRoles) != len(user.Roles) {
		return candidate.ID, false, nil
	}
	for _, role := range user.Roles {
		if !actualRoles[role] {
			return candidate.ID, false, nil
		}
	}
	return candidate.ID, true, nil
}

func (client *KeycloakAdminClient) DisableUser(
	ctx context.Context,
	subjectID string,
) error {
	subjectID = strings.TrimSpace(subjectID)
	if subjectID == "" {
		return fmt.Errorf("Keycloak subject ID is required")
	}
	accessToken, err := client.adminAccessToken(ctx)
	if err != nil {
		return err
	}
	response, err := client.doJSON(
		ctx,
		http.MethodPut,
		client.adminEndpoint("users", subjectID),
		accessToken,
		map[string]bool{"enabled": false},
		http.StatusNoContent,
	)
	if err != nil {
		return fmt.Errorf("disable Keycloak user: %w", err)
	}
	response.Body.Close()

	response, err = client.doJSON(
		ctx,
		http.MethodPost,
		client.adminEndpoint("users", subjectID, "logout"),
		accessToken,
		nil,
		http.StatusNoContent,
	)
	if err != nil {
		return fmt.Errorf("revoke Keycloak user sessions: %w", err)
	}
	response.Body.Close()
	return nil
}

func (client *KeycloakAdminClient) UpdateUserAuthority(
	ctx context.Context,
	subjectID,
	organizationID string,
	roles []Role,
) error {
	subjectID = strings.TrimSpace(subjectID)
	organizationID = strings.TrimSpace(organizationID)
	roles, err := normalizeKeycloakRoles(roles)
	if err == nil {
		err = validateKeycloakAuthority(organizationID, roles)
	}
	if subjectID == "" || organizationID == "" || err != nil {
		return fmt.Errorf(
			"Keycloak subject, organization, and approved roles are required",
		)
	}
	accessToken, err := client.adminAccessToken(ctx)
	if err != nil {
		return err
	}
	response, err := client.doJSON(
		ctx,
		http.MethodPut,
		client.adminEndpoint("users", subjectID),
		accessToken,
		map[string]map[string][]string{
			"attributes": {"organization_id": {organizationID}},
		},
		http.StatusNoContent,
	)
	if err != nil {
		return fmt.Errorf("update Keycloak user organization: %w", err)
	}
	response.Body.Close()

	response, err = client.doJSON(
		ctx,
		http.MethodGet,
		client.adminEndpoint("users", subjectID, "role-mappings", "realm"),
		accessToken,
		nil,
		http.StatusOK,
	)
	if err != nil {
		return fmt.Errorf("list Keycloak user realm roles: %w", err)
	}
	var currentRoles []keycloakRoleRepresentation
	if err := decodeLimitedJSON(response.Body, &currentRoles); err != nil {
		response.Body.Close()
		return fmt.Errorf("decode Keycloak user realm roles: %w", err)
	}
	response.Body.Close()
	approvedCurrentRoles := make([]keycloakRoleRepresentation, 0, len(currentRoles))
	for _, currentRole := range currentRoles {
		if len(canonicalRoles([]string{currentRole.Name})) == 1 {
			approvedCurrentRoles = append(approvedCurrentRoles, currentRole)
		}
	}
	if len(approvedCurrentRoles) > 0 {
		response, err = client.doJSON(
			ctx,
			http.MethodDelete,
			client.adminEndpoint("users", subjectID, "role-mappings", "realm"),
			accessToken,
			approvedCurrentRoles,
			http.StatusNoContent,
		)
		if err != nil {
			return fmt.Errorf("remove prior Keycloak application roles: %w", err)
		}
		response.Body.Close()
	}

	roleRepresentations := make([]keycloakRoleRepresentation, 0, len(roles))
	for _, role := range roles {
		roleRepresentation, err := client.realmRole(ctx, accessToken, role)
		if err != nil {
			return err
		}
		roleRepresentations = append(roleRepresentations, roleRepresentation)
	}
	response, err = client.doJSON(
		ctx,
		http.MethodPost,
		client.adminEndpoint("users", subjectID, "role-mappings", "realm"),
		accessToken,
		roleRepresentations,
		http.StatusNoContent,
	)
	if err != nil {
		return fmt.Errorf("map replacement Keycloak realm roles: %w", err)
	}
	response.Body.Close()
	return nil
}

func (client *KeycloakAdminClient) EnableUser(
	ctx context.Context,
	subjectID string,
) error {
	subjectID = strings.TrimSpace(subjectID)
	if subjectID == "" {
		return fmt.Errorf("Keycloak subject ID is required")
	}
	accessToken, err := client.adminAccessToken(ctx)
	if err != nil {
		return err
	}
	response, err := client.doJSON(
		ctx,
		http.MethodPut,
		client.adminEndpoint("users", subjectID),
		accessToken,
		map[string]bool{"enabled": true},
		http.StatusNoContent,
	)
	if err != nil {
		return fmt.Errorf("enable Keycloak user: %w", err)
	}
	response.Body.Close()
	return nil
}

type keycloakRoleRepresentation struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type keycloakUserRepresentation struct {
	ID         string              `json:"id"`
	Username   string              `json:"username"`
	Email      string              `json:"email"`
	FirstName  string              `json:"firstName"`
	LastName   string              `json:"lastName"`
	Enabled    bool                `json:"enabled"`
	Attributes map[string][]string `json:"attributes"`
}

func (client *KeycloakAdminClient) adminAccessToken(
	ctx context.Context,
) (string, error) {
	form := url.Values{
		"client_id":  {"admin-cli"},
		"grant_type": {"password"},
		"password":   {client.adminPassword},
		"username":   {client.adminUsername},
	}
	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		client.endpoint("realms", "master", "protocol", "openid-connect", "token"),
		strings.NewReader(form.Encode()),
	)
	if err != nil {
		return "", fmt.Errorf("create Keycloak admin token request: %w", err)
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	request.Header.Set("Accept", "application/json")
	response, err := client.httpClient.Do(request)
	if err != nil {
		return "", fmt.Errorf("request Keycloak admin token: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf(
			"request Keycloak admin token: unexpected HTTP status %d",
			response.StatusCode,
		)
	}
	var token struct {
		AccessToken string `json:"access_token"`
	}
	if err := decodeLimitedJSON(response.Body, &token); err != nil {
		return "", fmt.Errorf("decode Keycloak admin token: %w", err)
	}
	if strings.TrimSpace(token.AccessToken) == "" {
		return "", fmt.Errorf("Keycloak admin token response omitted access_token")
	}
	return token.AccessToken, nil
}

func (client *KeycloakAdminClient) findUsersByEmail(
	ctx context.Context,
	accessToken,
	email string,
) ([]keycloakUserRepresentation, error) {
	endpoint, err := url.Parse(client.adminEndpoint("users"))
	if err != nil {
		return nil, fmt.Errorf("construct Keycloak user query: %w", err)
	}
	query := endpoint.Query()
	query.Set("email", email)
	query.Set("exact", "true")
	endpoint.RawQuery = query.Encode()

	response, err := client.doJSON(
		ctx,
		http.MethodGet,
		endpoint.String(),
		accessToken,
		nil,
		http.StatusOK,
	)
	if err != nil {
		return nil, fmt.Errorf("query Keycloak user email: %w", err)
	}
	defer response.Body.Close()
	var users []keycloakUserRepresentation
	if err := decodeLimitedJSON(response.Body, &users); err != nil {
		return nil, fmt.Errorf("decode Keycloak user query: %w", err)
	}
	return users, nil
}

func (client *KeycloakAdminClient) realmRole(
	ctx context.Context,
	accessToken string,
	role Role,
) (keycloakRoleRepresentation, error) {
	response, err := client.doJSON(
		ctx,
		http.MethodGet,
		client.adminEndpoint("roles", string(role)),
		accessToken,
		nil,
		http.StatusOK,
	)
	if err != nil {
		return keycloakRoleRepresentation{}, fmt.Errorf(
			"resolve Keycloak realm role %q: %w",
			role,
			err,
		)
	}
	defer response.Body.Close()
	var representation keycloakRoleRepresentation
	if err := decodeLimitedJSON(response.Body, &representation); err != nil {
		return keycloakRoleRepresentation{}, fmt.Errorf(
			"decode Keycloak realm role %q: %w",
			role,
			err,
		)
	}
	if representation.ID == "" || representation.Name != string(role) {
		return keycloakRoleRepresentation{}, fmt.Errorf(
			"Keycloak realm role %q has an invalid representation",
			role,
		)
	}
	return representation, nil
}

func (client *KeycloakAdminClient) doJSON(
	ctx context.Context,
	method,
	endpoint,
	accessToken string,
	body any,
	expectedStatus int,
) (*http.Response, error) {
	var requestBody io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("encode Keycloak request: %w", err)
		}
		requestBody = bytes.NewReader(encoded)
	}
	request, err := http.NewRequestWithContext(
		ctx,
		method,
		endpoint,
		requestBody,
	)
	if err != nil {
		return nil, fmt.Errorf("create Keycloak request: %w", err)
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Authorization", "Bearer "+accessToken)
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	response, err := client.httpClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("perform Keycloak request: %w", err)
	}
	if response.StatusCode != expectedStatus {
		response.Body.Close()
		return nil, fmt.Errorf(
			"Keycloak request returned unexpected HTTP status %d",
			response.StatusCode,
		)
	}
	return response, nil
}

func (client *KeycloakAdminClient) endpoint(segments ...string) string {
	endpoint := *client.baseURL
	escapedSegments := make([]string, len(segments))
	for index, segment := range segments {
		escapedSegments[index] = url.PathEscape(segment)
	}
	endpoint.Path = strings.TrimRight(endpoint.Path, "/") +
		"/" + strings.Join(escapedSegments, "/")
	return endpoint.String()
}

func (client *KeycloakAdminClient) adminEndpoint(segments ...string) string {
	return client.endpoint(
		append([]string{"admin", "realms", client.realm}, segments...)...,
	)
}

func normalizeKeycloakUser(user KeycloakUser) (KeycloakUser, error) {
	user.Email = strings.ToLower(strings.TrimSpace(user.Email))
	user.FirstName = strings.TrimSpace(user.FirstName)
	user.LastName = strings.TrimSpace(user.LastName)
	user.OrganizationID = strings.TrimSpace(user.OrganizationID)
	address, err := mail.ParseAddress(user.Email)
	if err != nil || address.Address != user.Email ||
		user.FirstName == "" ||
		user.LastName == "" ||
		user.OrganizationID == "" {
		return KeycloakUser{}, fmt.Errorf(
			"Keycloak email, name, organization, and roles are required",
		)
	}
	roles, err := normalizeKeycloakRoles(user.Roles)
	if err != nil {
		return KeycloakUser{}, fmt.Errorf(
			"Keycloak roles must be unique approved AviaSurveil360 roles",
		)
	}
	if err := validateKeycloakAuthority(user.OrganizationID, roles); err != nil {
		return KeycloakUser{}, err
	}
	user.Roles = roles
	return user, nil
}

func normalizeKeycloakRoles(roles []Role) ([]Role, error) {
	rawRoles := make([]string, len(roles))
	for index, role := range roles {
		rawRoles[index] = string(role)
	}
	normalized := canonicalRoles(rawRoles)
	if len(normalized) == 0 || len(normalized) != len(roles) {
		return nil, fmt.Errorf(
			"Keycloak roles must be unique approved AviaSurveil360 roles",
		)
	}
	return normalized, nil
}

func validateKeycloakAuthority(
	organizationID string,
	roles []Role,
) error {
	hasAuditeeRole := false
	hasCAARole := false
	for _, role := range roles {
		switch role {
		case RoleAuditee:
			hasAuditeeRole = true
		case RoleInspector, RoleLeadInspector, RoleDepartmentManager,
			RoleGeneralManager, RoleFinance, RoleExecutiveDirector, RoleAdmin:
			hasCAARole = true
		}
	}
	if hasAuditeeRole && (hasCAARole || organizationID == "CAA") {
		return fmt.Errorf(
			"Keycloak Auditee authority must remain outside the CAA organization",
		)
	}
	if hasCAARole && organizationID != "CAA" {
		return fmt.Errorf(
			"Keycloak CAA authority requires the exact CAA organization",
		)
	}
	return nil
}

func createdSubjectID(location string) (string, error) {
	parsed, err := url.Parse(strings.TrimSpace(location))
	if err != nil || parsed.Path == "" {
		return "", fmt.Errorf("Keycloak create response omitted a valid Location")
	}
	subjectID, err := url.PathUnescape(path.Base(parsed.Path))
	if err != nil || subjectID == "" || subjectID == "." || subjectID == "/" {
		return "", fmt.Errorf("Keycloak create response omitted a valid subject ID")
	}
	return subjectID, nil
}

func decodeLimitedJSON(reader io.Reader, output any) error {
	return json.NewDecoder(io.LimitReader(reader, 1<<20)).Decode(output)
}
