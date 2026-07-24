package documents

import (
	"errors"
	"time"
)

var (
	ErrForbidden = errors.New("document forbidden")
	ErrNotFound  = errors.New("document not found")
	ErrNotReady  = errors.New("document not ready")
)

type JobStatus string

const (
	JobPending   JobStatus = "PENDING"
	JobRunning   JobStatus = "RUNNING"
	JobSucceeded JobStatus = "SUCCEEDED"
	JobFailed    JobStatus = "FAILED"
)

type RenderSnapshot struct {
	ReportVersionID  string   `json:"reportVersionId"`
	ReportID         string   `json:"reportId"`
	Kind             string   `json:"kind"`
	OrganizationID   string   `json:"organizationId"`
	AuditID          string   `json:"auditId"`
	FindingIDs       []string `json:"findingIds"`
	ContentHash      string   `json:"contentHash"`
	Version          int64    `json:"version"`
	CreatedBySubject string   `json:"createdBySubject"`
}

type Download struct {
	DocumentVersionID string
	FileName          string
	MediaType         string
	SHA256            string
	SizeBytes         int64
	URL               string
	ExpiresAt         time.Time
}
