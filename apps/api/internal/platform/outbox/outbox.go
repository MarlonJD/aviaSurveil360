package outbox

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

type Message struct {
	ID            string
	Topic         string
	AggregateType string
	AggregateID   string
	Payload       json.RawMessage
	AvailableAt   time.Time
	AttemptCount  int
}

func (message Message) Validate() error {
	if message.ID == "" {
		return fmt.Errorf("outbox message ID is required")
	}
	if message.Topic == "" {
		return fmt.Errorf("outbox topic is required")
	}
	if message.AggregateType == "" || message.AggregateID == "" {
		return fmt.Errorf("outbox aggregate type and ID are required")
	}
	if len(message.Payload) == 0 {
		return fmt.Errorf("outbox payload is required")
	}
	if message.AvailableAt.IsZero() {
		return fmt.Errorf("outbox availability time is required")
	}
	return nil
}

type Repository interface {
	Enqueue(context.Context, Message) error
	Claim(context.Context, int, time.Time) ([]Message, error)
	MarkDelivered(context.Context, string, time.Time) error
	MarkFailed(context.Context, string, string, time.Time) error
}
