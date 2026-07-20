package idempotency

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"time"
)

var ErrOperationIDReuse = errors.New("operation ID was reused with a different semantic payload")

type Response struct {
	Scope           string
	OperationID     string
	SemanticHash    string
	ResponseStatus  int
	ResponseHeaders json.RawMessage
	ResponseBody    json.RawMessage
	CreatedAt       time.Time
}

func SemanticHash(payload any) (string, error) {
	canonical, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	hash := sha256.Sum256(canonical)
	return hex.EncodeToString(hash[:]), nil
}

type Repository interface {
	Find(context.Context, string, string) (Response, error)
	Save(context.Context, Response) error
}
