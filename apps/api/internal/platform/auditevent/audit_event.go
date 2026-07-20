package auditevent

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

type Event struct {
	ID             string
	OccurredAt     time.Time
	ActorSubjectID *string
	ActorRole      *string
	OrganizationID *string
	Action         string
	EntityType     string
	EntityID       string
	RequestID      *string
	Details        json.RawMessage
}

func (event Event) Validate() error {
	if event.ID == "" {
		return fmt.Errorf("audit event ID is required")
	}
	if event.OccurredAt.IsZero() {
		return fmt.Errorf("audit event occurrence time is required")
	}
	if event.Action == "" {
		return fmt.Errorf("audit event action is required")
	}
	if event.EntityType == "" || event.EntityID == "" {
		return fmt.Errorf("audit event entity type and ID are required")
	}
	return nil
}

type Recorder interface {
	Append(context.Context, Event) error
}
