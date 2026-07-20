# Production Contract Vocabulary

**Status:** `candidate-only` for the explicitly authorized Tasks 2-4 mock-data
slice. This document does not approve a real API, authentication, file storage,
offline behavior, sync, deployment, or production use.

This English document is the canonical mapping between current product/source
language, verified legacy-demo values, the versioned OpenAPI contract, and the
React UI. The matching Turkish document is a stakeholder companion. The source
authority for this slice is the canonical product documentation plus the
verified root Vanilla JavaScript demo.

## Contract rules

- OpenAPI values use stable uppercase identifiers. UI labels remain readable.
- `Due Soon`, `Due Today`, and `Overdue` are computed `DueState` values, not
  Finding lifecycle statuses.
- An Inspector creates an Audit/question/response-scoped `Potential Finding`.
  Only a Lead Inspector decision converts it into a canonical `Finding`.
- CAP submission and CAA CAP review are separate commands. CAP acceptance never
  closes a Finding.
- Evidence submissions create new immutable `EvidenceVersion` records. A newer
  version never overwrites an earlier version.
- `Close` means Evidence was accepted and verified. `Partially Close`,
  `Not Close`, and `Request More Information` leave the Finding open.
- Department Manager authorized closure is a separate, reason-required path.
- Report decisions target exact versions. Department Manager and General
  Manager return/forward only; Executive Director issue/lock never closes a
  Finding.
- `Comment to Auditee` and `Internal CAA Note` are distinct fields. Auditee
  projections structurally omit internal CAA data.
- Regulatory content is a configured reference, expected Evidence, or finding
  basis. It is not legal advice or automatic enforcement.

## Roles and entry routes

Only these eight verified role-entry routes and the canonical Cabin scenario
are `first-production` for Tasks 2-4. Every other legacy route is `later` or
`demo-only` and remains available only in the intact root demo.

| Source / legacy role | OpenAPI `Role` | React UI label | Authorized entry route |
|---|---|---|---|
| `inspector` | `inspector` | CAA Inspector | `inspector-assignments` |
| `leadInspector` | `leadInspector` | Lead Inspector | `lead-review` |
| `manager` | `manager` | Department Manager | `dashboard` |
| `gm` | `gm` | General Manager | `gm-dashboard` |
| `finance` | `finance` | Finance Review | `finance-review` |
| `executiveDirector` | `executiveDirector` | Executive Director | `executive-dashboard` |
| `auditee` | `auditee` | Auditee / Service Provider | `service-provider-cap` |
| `admin` | `admin` | Admin Preview | `templates` |

## Canonical transport values

### Checklist answers

| Product/source label | Legacy value | OpenAPI enum | React UI label |
|---|---|---|---|
| Compliant | `compliant` | `COMPLIANT` | Compliant |
| Non-Compliant | `non_compliant` | `NON_COMPLIANT` | Non-Compliant |
| Observation | `observation` | `OBSERVATION` | Observation |
| Not Applicable | `not_applicable` | `NOT_APPLICABLE` | Not Applicable |
| Not Checked | `not_checked` | `NOT_CHECKED` | Not Checked |

### Computed due state

| Product/source label | Legacy value | OpenAPI enum | React UI label |
|---|---|---|---|
| No Due Date | `none` | `NONE` | No Due Date |
| Not Due | `not_due` | `NOT_DUE` | Not Due |
| Due Soon | `due_soon` | `DUE_SOON` | Due Soon |
| Due Today | `due_today` | `DUE_TODAY` | Due Today |
| Overdue | `overdue` | `OVERDUE` | Overdue |

### Potential Finding status

| Product/source label | Legacy value | OpenAPI enum | React UI label |
|---|---|---|---|
| Pending Lead Review | `pending_lead_review` | `PENDING_LEAD_REVIEW` | Pending Lead Review |
| Returned | `returned` | `RETURNED` | Returned |
| Dismissed | `dismissed` | `DISMISSED` | Dismissed |
| Converted | `converted` | `CONVERTED` | Converted to Finding |

### Finding status

| Product/source label | Legacy value | OpenAPI enum | React UI label |
|---|---|---|---|
| Draft | `DRAFT` | `DRAFT` | Draft |
| Open | `OPEN` | `OPEN` | Open |
| Waiting for CAP | `WAITING_CAP` / `WAITING_FOR_CAP` | `WAITING_FOR_CAP` | Waiting for CAP |
| CAP Submitted | `CAP_SUBMITTED` | `CAP_SUBMITTED` | CAP Submitted |
| CAP Accepted | `CAP_ACCEPTED` | `CAP_ACCEPTED` | CAP Accepted |
| CAP Rejected | `CAP_REJECTED` | `CAP_REJECTED` | CAP Rejected |
| CAP More Information Requested | `CAP_MORE_INFO` | `CAP_MORE_INFORMATION_REQUESTED` | CAP More Information Requested |
| Evidence Required | `EVIDENCE_REQUIRED` | `EVIDENCE_REQUIRED` | CAP Accepted - Evidence Required |
| Evidence Submitted | `EVIDENCE_SUBMITTED` | `EVIDENCE_SUBMITTED` | Evidence Submitted |
| Pending CAA Review | `PENDING_CAA_REVIEW` | `PENDING_CAA_REVIEW` | Pending CAA Review |
| Evidence More Information Requested | `EVIDENCE_MORE_INFO` | `EVIDENCE_MORE_INFORMATION_REQUESTED` | More Information Requested |
| Pending Closure | `PENDING_CLOSURE` | `PENDING_CLOSURE` | Pending Closure |
| Closed | `CLOSED` | `CLOSED` | Closed |
| Escalated | `ESCALATED` | `ESCALATED` | Escalated for Authorized Review |

### CAP status

| Product/source label | Legacy value | OpenAPI enum | React UI label |
|---|---|---|---|
| Draft | `draft` | `DRAFT` | Draft |
| Submitted | `submitted` | `SUBMITTED` | Submitted |
| Pending CAA Review | `pending_review` | `PENDING_CAA_REVIEW` | Pending CAA Review |
| Accepted | `accepted` | `ACCEPTED` | Accepted |
| Rejected | `rejected` | `REJECTED` | Rejected |
| More Information Requested | `more_info` | `MORE_INFORMATION_REQUESTED` | More Information Requested |
| Superseded | `superseded` | `SUPERSEDED` | Superseded |

### Evidence state

| Dimension | Product/source labels | OpenAPI values |
|---|---|---|
| Upload | Pending, Uploading, Uploaded, Failed | `PENDING`, `UPLOADING`, `UPLOADED`, `FAILED` |
| Scan | Pending, Clean, Quarantined, Failed | `PENDING`, `CLEAN`, `QUARANTINED`, `FAILED` |
| Review | Not Ready, Pending CAA Review, Accepted, Partially Accepted, Rejected, More Information Requested | `NOT_READY`, `PENDING_CAA_REVIEW`, `ACCEPTED`, `PARTIALLY_ACCEPTED`, `REJECTED`, `MORE_INFORMATION_REQUESTED` |

### Severity

| Product/source label | Legacy value | OpenAPI enum | React UI label |
|---|---|---|---|
| Level 1 Critical | `critical` / `Level 1 Critical` | `LEVEL_1_CRITICAL` | Level 1 Critical |
| Level 2 Major | `major` / `Level 2 Major` | `LEVEL_2_MAJOR` | Level 2 Major |
| Level 3 Minor | `minor` / `Level 3 Minor` | `LEVEL_3_MINOR` | Level 3 Minor |
| Observation | `observation` | `OBSERVATION` | Observation |

### Evidence review decisions

| Source action | OpenAPI decision | Finding result | Closure basis |
|---|---|---|---|
| Close | `CLOSE` | `CLOSED` | `EVIDENCE_VERIFIED` |
| Partially Close | `PARTIALLY_CLOSE` | `EVIDENCE_MORE_INFORMATION_REQUESTED` | none |
| Not Close | `NOT_CLOSE` | `EVIDENCE_MORE_INFORMATION_REQUESTED` | none |
| Request More Information | `REQUEST_MORE_INFORMATION` | `EVIDENCE_MORE_INFORMATION_REQUESTED` | none |

### Report approval status

| Product/source label | OpenAPI enum | React UI label |
|---|---|---|
| Draft | `DRAFT` | Draft |
| Department Review | `DEPARTMENT_REVIEW` | Department Review |
| General Manager Review | `GM_REVIEW` | General Manager Review |
| Executive Director Review | `EXECUTIVE_DIRECTOR_REVIEW` | Executive Director Review |
| Returned | `RETURNED` | Returned |
| Issued | `ISSUED` | Issued |
| Locked | `LOCKED` | Locked |

## Canonical Cabin identifiers

| Object | Stable candidate identifier / value |
|---|---|
| Organization | `ORG-FLY-NAMIBIA` / Fly Namibia |
| Audit | `AUD-2026-001` / 2026 Cabin Inspection - Fly Namibia |
| Inspection package | `PKG-CAB-2026-001` |
| Checklist template version | `CTV-CABIN-1` |
| PBE question | `CAB-EMEQ-PBE-001` |
| Assigned Inspector | `USR-INSPECTOR-AMINA` |
| Other Inspector | `USR-INSPECTOR-DAVID` |
| Potential Finding | `PF-2026-001` |
| Finding | `FND-CAB-2026-001` / `CAB-2026-001` |
| CAP revision | `CAP-CAB-2026-001-R1` |
| Evidence version 1 | `EV-CAB-2026-001-V1` |
| Evidence version 2 | `EV-CAB-2026-001-V2` |
| Report version | `RPT-CAB-2026-001-V1` |
| Evidence filename | `Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf` |

The stable candidate identifiers support deterministic mock and fake-fetch
tests. They are not production public-number allocation or records policy.
