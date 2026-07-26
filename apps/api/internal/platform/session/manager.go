package session

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	identitystore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/jackc/pgx/v5"
)

const (
	idleDuration     = 30 * time.Minute
	absoluteDuration = 8 * time.Hour
	loginStateTTL    = 10 * time.Minute
)

var (
	ErrUnauthenticated = errors.New("unauthenticated")
	ErrCSRF            = errors.New("csrf validation failed")
)

type ManagerDependencies struct {
	Clock       func() time.Time
	IDGenerator func(string) string
	RandomBytes func(int) ([]byte, error)
}

type Manager struct {
	pool        *database.Pool
	aead        cipher.AEAD
	clock       func() time.Time
	idGenerator func(string) string
	randomBytes func(int) ([]byte, error)
}

func NewManager(pool *database.Pool, encryptionKey []byte, dependencies ManagerDependencies) (*Manager, error) {
	if pool == nil {
		return nil, fmt.Errorf("session PostgreSQL pool is required")
	}
	if len(encryptionKey) != 32 {
		return nil, fmt.Errorf("session encryption key must contain exactly 32 bytes")
	}
	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("create session token cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create session token AEAD: %w", err)
	}
	clock := dependencies.Clock
	if clock == nil {
		clock = time.Now
	}
	idGenerator := dependencies.IDGenerator
	if idGenerator == nil {
		idGenerator = randomIdentifier
	}
	randomBytes := dependencies.RandomBytes
	if randomBytes == nil {
		randomBytes = secureRandomBytes
	}
	return &Manager{
		pool: pool, aead: aead, clock: clock, idGenerator: idGenerator, randomBytes: randomBytes,
	}, nil
}

type CreateInput struct {
	SubjectID         string
	Issuer            string
	DisplayName       string
	Email             string
	OrganizationID    string
	Roles             []identity.Role
	ProviderSessionID string
	ProviderTokens    identity.ProviderTokens
}

type BrowserSession struct {
	ID                string
	Token             string
	CSRFToken         string
	ExpiresAt         time.Time
	AbsoluteExpiresAt time.Time
	Principal         identity.Principal
}

func (manager *Manager) Create(ctx context.Context, input CreateInput) (BrowserSession, error) {
	if strings.TrimSpace(input.SubjectID) == "" || strings.TrimSpace(input.Issuer) == "" || strings.TrimSpace(input.DisplayName) == "" || strings.TrimSpace(input.OrganizationID) == "" || len(input.Roles) == 0 {
		return BrowserSession{}, fmt.Errorf("subject, issuer, display name, organization, and roles are required")
	}
	for _, role := range input.Roles {
		if !validRole(role) {
			return BrowserSession{}, fmt.Errorf("unsupported role %q", role)
		}
	}
	rawToken, err := manager.opaqueToken(32)
	if err != nil {
		return BrowserSession{}, fmt.Errorf("generate session token: %w", err)
	}
	rawCSRF, err := manager.opaqueToken(32)
	if err != nil {
		return BrowserSession{}, fmt.Errorf("generate CSRF token: %w", err)
	}
	providerCiphertext, err := manager.encryptProviderTokens(input.ProviderTokens)
	if err != nil {
		return BrowserSession{}, err
	}
	now := manager.clock().UTC()
	sessionID := manager.idGenerator("session")
	idleExpiresAt := now.Add(idleDuration)
	absoluteExpiresAt := now.Add(absoluteDuration)
	roles := make([]string, len(input.Roles))
	for index, role := range input.Roles {
		roles[index] = string(role)
	}

	err = database.WithinTransaction(ctx, manager.pool, func(ctx context.Context, transaction pgx.Tx) error {
		if input.OrganizationID == "CAA" && containsRole(input.Roles, identity.RoleAdmin) {
			tag, err := transaction.Exec(ctx, `
				INSERT INTO organizations (
					id, legal_name, organization_type, status, revision, created_at, updated_at
				) VALUES (
					'CAA', 'Civil Aviation Authority', 'AUTHORITY', 'ACTIVE', 1, $1, $1
				)
				ON CONFLICT (id) DO NOTHING
			`, now)
			if err != nil {
				return fmt.Errorf("establish authority organization: %w", err)
			}
			var legalName, organizationType, status string
			if err := transaction.QueryRow(ctx, `
				SELECT legal_name, organization_type, status
				FROM organizations
				WHERE id = 'CAA' AND tombstoned_at IS NULL
			`).Scan(&legalName, &organizationType, &status); err != nil {
				return fmt.Errorf("verify authority organization: %w", err)
			}
			if legalName != "Civil Aviation Authority" ||
				organizationType != "AUTHORITY" ||
				status != "ACTIVE" {
				return ErrUnauthenticated
			}
			if tag.RowsAffected() == 1 {
				if _, err := transaction.Exec(ctx, `
					INSERT INTO audit_events (
						event_id, occurred_at, actor_subject_id, actor_role,
						organization_id, action, entity_type, entity_id,
						entity_version, after_status, operation_id, correlation_id,
						request_id, details
					) VALUES (
						$1, $2, $3, 'admin', 'CAA',
						'identity.authority_organization_established',
						'organization', 'CAA', 1, 'ACTIVE', $4, $4, $4,
						'{"source":"first_admin_oidc_session"}'::jsonb
					)
				`, manager.idGenerator("audit"), now, input.SubjectID,
					"identity-bootstrap:"+input.SubjectID); err != nil {
					return fmt.Errorf("audit authority organization establishment: %w", err)
				}
			}
		}
		var persistedSubjectID string
		if err := transaction.QueryRow(ctx, `
			INSERT INTO identity_references (
				subject_id, issuer, display_name, email, created_at
			)
			VALUES ($1, $2, $3, NULLIF(lower(trim($4)), ''), $5)
			ON CONFLICT (subject_id) DO UPDATE
			SET issuer = EXCLUDED.issuer,
			    display_name = EXCLUDED.display_name,
			    email = COALESCE(EXCLUDED.email, identity_references.email)
			WHERE identity_references.tombstoned_at IS NULL
			RETURNING subject_id
		`, input.SubjectID, input.Issuer, input.DisplayName,
			input.Email, now).Scan(&persistedSubjectID); errors.Is(err, pgx.ErrNoRows) {
			return ErrUnauthenticated
		} else if err != nil {
			return fmt.Errorf("persist authenticated identity reference: %w", err)
		}
		if err := transaction.QueryRow(ctx, `
			INSERT INTO user_profiles (
				subject_id, display_name, organization_id, revision, created_at, updated_at
			) VALUES ($1, $2, $3, 1, $4, $4)
			ON CONFLICT (subject_id) DO UPDATE
			SET organization_id = EXCLUDED.organization_id,
			    updated_at = EXCLUDED.updated_at
			WHERE user_profiles.tombstoned_at IS NULL
			RETURNING subject_id
		`, input.SubjectID, input.DisplayName, input.OrganizationID, now).Scan(&persistedSubjectID); errors.Is(err, pgx.ErrNoRows) {
			return ErrUnauthenticated
		} else if err != nil {
			return fmt.Errorf("persist authenticated user profile: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO user_settings (
				subject_id, notification_preferences, locale, timezone, revision, updated_at
			) VALUES ($1, '{}'::jsonb, 'en', 'UTC', 1, $2)
			ON CONFLICT (subject_id) DO NOTHING
		`, input.SubjectID, now); err != nil {
			return fmt.Errorf("persist authenticated user settings: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO session_references (
				id, subject_id, organization_id, provider_session_id, expires_at, created_at,
				session_token_hash, csrf_token_hash, last_seen_at, absolute_expires_at, roles,
				provider_tokens_ciphertext
			) VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, $6, $9, $10, $11)
		`, sessionID, input.SubjectID, input.OrganizationID, input.ProviderSessionID, idleExpiresAt, now,
			hashToken(rawToken), hashToken(rawCSRF), absoluteExpiresAt, roles, providerCiphertext); err != nil {
			return fmt.Errorf("persist browser session: %w", err)
		}
		return nil
	})
	if err != nil {
		return BrowserSession{}, err
	}
	principal := identity.Principal{
		SubjectID: input.SubjectID, DisplayName: input.DisplayName, OrganizationID: input.OrganizationID, Roles: append([]identity.Role(nil), input.Roles...), SessionID: sessionID,
	}
	return BrowserSession{
		ID: sessionID, Token: rawToken, CSRFToken: rawCSRF, ExpiresAt: idleExpiresAt,
		AbsoluteExpiresAt: absoluteExpiresAt, Principal: principal,
	}, nil
}

func containsRole(roles []identity.Role, expected identity.Role) bool {
	for _, role := range roles {
		if role == expected {
			return true
		}
	}
	return false
}

func (manager *Manager) Authenticate(ctx context.Context, rawToken string) (identity.Principal, error) {
	if strings.TrimSpace(rawToken) == "" {
		return identity.Principal{}, ErrUnauthenticated
	}
	now := manager.clock().UTC()
	var principal identity.Principal
	err := database.WithinTransaction(ctx, manager.pool, func(ctx context.Context, transaction pgx.Tx) error {
		tokenHash := hashToken(rawToken)
		record, err := identitystore.New(transaction).GetSessionForAuthentication(ctx, &tokenHash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrUnauthenticated
			}
			return fmt.Errorf("read browser session: %w", err)
		}
		if !record.ExpiresAt.Valid || !record.AbsoluteExpiresAt.Valid || record.RevokedAt.Valid ||
			!now.Before(record.ExpiresAt.Time) || !now.Before(record.AbsoluteExpiresAt.Time) {
			return ErrUnauthenticated
		}
		principal.SessionID = record.ID
		principal.SubjectID = record.SubjectID
		identityReference, err := identitystore.New(transaction).GetIdentityReference(ctx, record.SubjectID)
		if err != nil {
			return fmt.Errorf("read authenticated identity reference: %w", err)
		}
		principal.DisplayName = identityReference.DisplayName
		profile, err := identitystore.New(transaction).GetProfile(ctx, record.SubjectID)
		if err == nil {
			principal.DisplayName = profile.DisplayName
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("read authenticated user profile: %w", err)
		}
		if record.OrganizationID != nil {
			principal.OrganizationID = *record.OrganizationID
		}
		principal.Roles = make([]identity.Role, len(record.Roles))
		for index, role := range record.Roles {
			principal.Roles[index] = identity.Role(role)
			if !validRole(principal.Roles[index]) {
				return ErrUnauthenticated
			}
		}
		nextIdleExpiry := now.Add(idleDuration)
		if nextIdleExpiry.After(record.AbsoluteExpiresAt.Time) {
			nextIdleExpiry = record.AbsoluteExpiresAt.Time
		}
		if _, err := transaction.Exec(ctx, `
			UPDATE session_references SET last_seen_at = $2, expires_at = $3 WHERE id = $1
		`, principal.SessionID, now, nextIdleExpiry); err != nil {
			return fmt.Errorf("refresh browser session idle expiry: %w", err)
		}
		return nil
	})
	if err != nil {
		return identity.Principal{}, err
	}
	return principal, nil
}

func (manager *Manager) ValidateCSRF(ctx context.Context, sessionID, rawCSRF string) error {
	if strings.TrimSpace(sessionID) == "" || strings.TrimSpace(rawCSRF) == "" {
		return ErrCSRF
	}
	var storedHash string
	var expiresAt, absoluteExpiresAt time.Time
	var revokedAt *time.Time
	if err := manager.pool.QueryRow(ctx, `
		SELECT csrf_token_hash, expires_at, absolute_expires_at, revoked_at
		FROM session_references WHERE id = $1
	`, sessionID).Scan(&storedHash, &expiresAt, &absoluteExpiresAt, &revokedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrCSRF
		}
		return fmt.Errorf("read session CSRF authority: %w", err)
	}
	now := manager.clock().UTC()
	actualHash := hashToken(rawCSRF)
	if revokedAt != nil || !now.Before(expiresAt) || !now.Before(absoluteExpiresAt) || subtle.ConstantTimeCompare([]byte(storedHash), []byte(actualHash)) != 1 {
		return ErrCSRF
	}
	return nil
}

func (manager *Manager) Revoke(ctx context.Context, sessionID string) error {
	if strings.TrimSpace(sessionID) == "" {
		return ErrUnauthenticated
	}
	now := manager.clock().UTC()
	return database.WithinTransaction(ctx, manager.pool, func(ctx context.Context, transaction pgx.Tx) error {
		var subjectID string
		var organizationID *string
		var roles []string
		if err := transaction.QueryRow(ctx, `
			UPDATE session_references
			SET revoked_at = COALESCE(revoked_at, $2), provider_tokens_ciphertext = NULL
			WHERE id = $1
			  AND revoked_at IS NULL
			RETURNING subject_id, organization_id, roles
		`, sessionID, now).Scan(&subjectID, &organizationID, &roles); errors.Is(err, pgx.ErrNoRows) {
			return ErrUnauthenticated
		} else if err != nil {
			return fmt.Errorf("revoke browser session: %w", err)
		}
		actorRole := ""
		if len(roles) > 0 {
			actorRole = roles[0]
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO audit_events (
				event_id, occurred_at, actor_subject_id, actor_role, organization_id,
				action, entity_type, entity_id, entity_version, after_status, details
			) VALUES (
				$1, $2, $3, NULLIF($4, ''), $5,
				'SESSION_REVOKED', 'SESSION', $6, 1, 'REVOKED', '{}'::jsonb
			)
		`, manager.idGenerator("audit-session"), now, subjectID, actorRole, organizationID, sessionID); err != nil {
			return fmt.Errorf("append session revocation audit event: %w", err)
		}
		return nil
	})
}

type LoginRequest struct {
	State         string
	Nonce         string
	PKCEChallenge string
	ReturnTo      string
}

type LoginState struct {
	Nonce        string
	PKCEVerifier string
	ReturnTo     string
}

func (manager *Manager) NewLoginState(ctx context.Context, returnTo string) (LoginRequest, error) {
	state, err := manager.opaqueToken(32)
	if err != nil {
		return LoginRequest{}, fmt.Errorf("generate OIDC state: %w", err)
	}
	nonce, err := manager.opaqueToken(32)
	if err != nil {
		return LoginRequest{}, fmt.Errorf("generate OIDC nonce: %w", err)
	}
	verifier, err := manager.opaqueToken(32)
	if err != nil {
		return LoginRequest{}, fmt.Errorf("generate PKCE verifier: %w", err)
	}
	returnTo = safeReturnTo(returnTo)
	now := manager.clock().UTC()
	if _, err := manager.pool.Exec(ctx, `
		INSERT INTO oidc_login_states (state_hash, nonce, pkce_verifier, return_to, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, hashToken(state), nonce, verifier, returnTo, now.Add(loginStateTTL), now); err != nil {
		return LoginRequest{}, fmt.Errorf("persist OIDC login state: %w", err)
	}
	challengeHash := sha256.Sum256([]byte(verifier))
	return LoginRequest{
		State: state, Nonce: nonce, PKCEChallenge: base64.RawURLEncoding.EncodeToString(challengeHash[:]), ReturnTo: returnTo,
	}, nil
}

func (manager *Manager) ConsumeLoginState(ctx context.Context, rawState string) (LoginState, error) {
	if strings.TrimSpace(rawState) == "" {
		return LoginState{}, ErrUnauthenticated
	}
	var state LoginState
	err := manager.pool.QueryRow(ctx, `
		DELETE FROM oidc_login_states
		WHERE state_hash = $1 AND expires_at > $2
		RETURNING nonce, pkce_verifier, return_to
	`, hashToken(rawState), manager.clock().UTC()).Scan(&state.Nonce, &state.PKCEVerifier, &state.ReturnTo)
	if errors.Is(err, pgx.ErrNoRows) {
		return LoginState{}, ErrUnauthenticated
	}
	if err != nil {
		return LoginState{}, fmt.Errorf("consume OIDC login state: %w", err)
	}
	return state, nil
}

func (manager *Manager) encryptProviderTokens(tokens identity.ProviderTokens) ([]byte, error) {
	plaintext, err := json.Marshal(tokens)
	if err != nil {
		return nil, fmt.Errorf("encode provider tokens: %w", err)
	}
	nonce, err := manager.randomBytes(manager.aead.NonceSize())
	if err != nil {
		return nil, fmt.Errorf("generate provider-token nonce: %w", err)
	}
	if len(nonce) != manager.aead.NonceSize() {
		return nil, fmt.Errorf("provider-token nonce has invalid length")
	}
	return manager.aead.Seal(append([]byte(nil), nonce...), nonce, plaintext, nil), nil
}

func (manager *Manager) opaqueToken(size int) (string, error) {
	bytes, err := manager.randomBytes(size)
	if err != nil {
		return "", err
	}
	if len(bytes) != size {
		return "", fmt.Errorf("random source returned %d bytes, expected %d", len(bytes), size)
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func hashToken(raw string) string {
	hash := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(hash[:])
}

func safeReturnTo(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.IsAbs() || parsed.Host != "" || !strings.HasPrefix(parsed.Path, "/") || strings.HasPrefix(parsed.Path, "//") || strings.Contains(raw, "\\") {
		return "/"
	}
	return parsed.RequestURI()
}

func validRole(role identity.Role) bool {
	switch role {
	case identity.RoleInspector, identity.RoleLeadInspector, identity.RoleDepartmentManager,
		identity.RoleGeneralManager, identity.RoleFinance, identity.RoleExecutiveDirector,
		identity.RoleAuditee, identity.RoleAdmin:
		return true
	default:
		return false
	}
}

func secureRandomBytes(size int) ([]byte, error) {
	value := make([]byte, size)
	if _, err := rand.Read(value); err != nil {
		return nil, err
	}
	return value, nil
}

func randomIdentifier(prefix string) string {
	value, err := secureRandomBytes(16)
	if err != nil {
		panic(fmt.Sprintf("generate session identifier: %v", err))
	}
	return prefix + "-" + hex.EncodeToString(value)
}
