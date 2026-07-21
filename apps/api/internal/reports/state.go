package reports

import (
	"fmt"
	"strings"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
)

type Status string
type Decision string

const (
	StatusDraft                   Status   = "DRAFT"
	StatusDepartmentReview        Status   = "DEPARTMENT_REVIEW"
	StatusGeneralManagerReview    Status   = "GM_REVIEW"
	StatusExecutiveDirectorReview Status   = "EXECUTIVE_DIRECTOR_REVIEW"
	StatusReturned                Status   = "RETURNED"
	StatusIssued                  Status   = "ISSUED"
	StatusLocked                  Status   = "LOCKED"
	DecisionForward               Decision = "FORWARD"
	DecisionReturn                Decision = "RETURN"
	DecisionIssue                 Decision = "ISSUE"
)

type DecideInput struct {
	Actor           identity.Principal
	Status          Status
	Version         int64
	ExpectedVersion int64
	Decision        Decision
	Reason          string
}

type DecideResult struct {
	Status Status
}

func Decide(input DecideInput) (DecideResult, error) {
	if input.Version != input.ExpectedVersion {
		return DecideResult{}, fmt.Errorf("stale report version")
	}
	switch input.Status {
	case StatusDepartmentReview:
		if !input.Actor.HasRole(identity.RoleDepartmentManager) {
			return DecideResult{}, fmt.Errorf("report is outside Department Manager authority")
		}
		return returnOrForward(input, StatusGeneralManagerReview)
	case StatusGeneralManagerReview:
		if !input.Actor.HasRole(identity.RoleGeneralManager) {
			return DecideResult{}, fmt.Errorf("report is outside General Manager authority")
		}
		return returnOrForward(input, StatusExecutiveDirectorReview)
	case StatusExecutiveDirectorReview:
		if !input.Actor.HasRole(identity.RoleExecutiveDirector) || input.Decision != DecisionIssue {
			return DecideResult{}, fmt.Errorf("only Executive Director can issue this report")
		}
		return DecideResult{Status: StatusLocked}, nil
	default:
		return DecideResult{}, fmt.Errorf("report stage is not decidable")
	}
}

func returnOrForward(input DecideInput, forward Status) (DecideResult, error) {
	switch input.Decision {
	case DecisionForward:
		return DecideResult{Status: forward}, nil
	case DecisionReturn:
		if strings.TrimSpace(input.Reason) == "" {
			return DecideResult{}, fmt.Errorf("report return reason is required")
		}
		return DecideResult{Status: StatusReturned}, nil
	default:
		return DecideResult{}, fmt.Errorf("unsupported report decision at this stage")
	}
}
