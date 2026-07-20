package session

import (
	"context"
	"time"
)

type Reference struct {
	ID                string
	SubjectID         string
	OrganizationID    *string
	ProviderSessionID *string
	ExpiresAt         time.Time
	RevokedAt         *time.Time
}

func (reference Reference) ActiveAt(now time.Time) bool {
	return reference.RevokedAt == nil && now.Before(reference.ExpiresAt)
}

type Repository interface {
	FindActive(context.Context, string, time.Time) (Reference, error)
	Revoke(context.Context, string, time.Time) error
}
