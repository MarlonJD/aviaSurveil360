package httpapi

import (
	"fmt"
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
)

func TestPublicErrorTitleRemovesSentinelPrefix(t *testing.T) {
	err := fmt.Errorf("%w: authorized closure reason is required", application.ErrConflict)
	if got := publicErrorTitle(err); got != "Authorized closure reason is required." {
		t.Fatalf("public error title = %q", got)
	}
}
