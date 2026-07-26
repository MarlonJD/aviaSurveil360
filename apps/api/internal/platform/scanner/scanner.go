package scanner

import (
	"bytes"
	"context"
	"io"
	"time"
)

type Result struct {
	Clean            bool
	Reason           string
	EngineVersion    string
	SignatureVersion string
	ScannedAt        time.Time
}

type Scanner interface {
	Scan(context.Context, io.Reader) (Result, error)
}

// SignatureScanner is deterministic and deliberately restricted to test
// profiles. Production configuration rejects this scanner mode.
type SignatureScanner struct {
	Clock func() time.Time
}

func (scanner SignatureScanner) Scan(_ context.Context, reader io.Reader) (Result, error) {
	body, err := io.ReadAll(reader)
	if err != nil {
		return Result{}, err
	}
	now := time.Now
	if scanner.Clock != nil {
		now = scanner.Clock
	}
	result := Result{
		Clean:            true,
		EngineVersion:    "deterministic-test",
		SignatureVersion: "eicar-v1",
		ScannedAt:        now().UTC(),
	}
	if bytes.Contains(body, []byte("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
		result.Clean = false
		result.Reason = "deterministic test signature detected"
	}
	return result, nil
}
