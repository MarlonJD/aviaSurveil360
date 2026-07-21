package evidence_test

import (
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/evidence"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/findings"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
)

func TestEvidenceReviewRequiresExactScanCleanImmutableVersion(t *testing.T) {
	t.Parallel()
	inspector := identity.Principal{Roles: []identity.Role{identity.RoleInspector}}
	base := evidence.ReviewInput{
		Actor: inspector, VersionID: "evidence-version-003", VersionRevision: 3, ExpectedVersionRevision: 3,
		ScanStatus: evidence.ScanClean, FindingStatus: findings.StatusPendingCAAReview, Decision: evidence.DecisionClose,
	}
	closed, err := evidence.Review(base)
	if err != nil || closed.FindingStatus != findings.StatusClosed || closed.ClosureBasis != findings.ClosureBasisEvidenceVerified {
		t.Fatalf("clean exact review = %+v, err = %v", closed, err)
	}
	base.ScanStatus = evidence.ScanPending
	if _, err := evidence.Review(base); err == nil {
		t.Fatal("unscanned Evidence reviewed")
	}
	base.ScanStatus = evidence.ScanClean
	base.ExpectedVersionRevision = 2
	if _, err := evidence.Review(base); err == nil {
		t.Fatal("stale Evidence version reviewed")
	}
}

func TestNonClosingEvidenceDecisionsKeepFindingOpen(t *testing.T) {
	t.Parallel()
	inspector := identity.Principal{Roles: []identity.Role{identity.RoleInspector}}
	for decision, expected := range map[evidence.Decision]findings.Status{
		evidence.DecisionPartiallyClose:     findings.StatusPendingClosure,
		evidence.DecisionNotClose:           findings.StatusEvidenceRequired,
		evidence.DecisionRequestInformation: findings.StatusEvidenceMoreInformationRequested,
	} {
		result, err := evidence.Review(evidence.ReviewInput{
			Actor: inspector, VersionID: "evidence-version-003", VersionRevision: 3, ExpectedVersionRevision: 3,
			ScanStatus: evidence.ScanClean, FindingStatus: findings.StatusPendingCAAReview, Decision: decision,
		})
		if err != nil || result.FindingStatus != expected || result.FindingStatus == findings.StatusClosed {
			t.Errorf("decision %s = %+v, err = %v", decision, result, err)
		}
	}
}
