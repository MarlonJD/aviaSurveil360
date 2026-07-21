# Production Contract Vocabulary

**Status:** `verified locally` and `candidate-only` for the explicitly
authorized local candidate through Task 5, including the enabling Tasks 6-12.
Release is `release pending`. This document does not approve production
deployment, traffic cutover, legacy removal, hosting, or production use.

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

These eight verified role-entry routes, the canonical Cabin scenario, and the
Task 5 Core MVP route families below are `first-production` for the local
candidate. Every other legacy route is `later` or `demo-only` and remains
available in the intact root demo.

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

## Task 5 first-production route families

| Route family | Authorized roles | Stable route / operation | Candidate boundary |
|---|---|---|---|
| Organization Registry | Department Manager; organization-scoped Auditee projection | `/department-manager/organizations`; `GET /v1/organizations` | Read-only oversight summary; no Internal CAA fields in Auditee projections. |
| Audit Plan Calendar | Department Manager | `/department-manager/audit-plan`; `GET /v1/planning/items` | Shows current owner/status; cannot bypass approval authority. |
| Surveillance plan decisions | Finance Review, General Manager, Executive Director | `POST /v1/planning/items/{id}/decisions` | Reason-required, idempotent, exact-revision and role/stage checked. |
| Versioned checklist configuration | Admin Preview | `GET /v1/configuration/checklist-template-versions` | Published version preview only; broad editing remains `later`. |
| Due Date reminder configuration | Admin Preview | `GET /v1/configuration/reminder-rules` | Read-only configured rules; no real notification delivery claim. |
| Planning Audit Trail | Admin Preview | `GET /v1/audit-events` | Append-only local candidate projection; no production tamper-evidence claim. |

### Surveillance planning status and decisions

| Current status | Authorized role and decision | Result status | Next owner |
|---|---|---|---|
| `FINANCE_REVIEW` | Finance Review — `APPROVE_BUDGET` | `GM_REVIEW` | General Manager |
| `GM_REVIEW` | General Manager — `FORWARD_FOR_FINAL_APPROVAL` | `EXECUTIVE_DIRECTOR_REVIEW` | Executive Director |
| `EXECUTIVE_DIRECTOR_REVIEW` | Executive Director — `APPROVE_PLAN` | `GM_RELEASE` | General Manager |
| `GM_RELEASE` | General Manager — `RELEASE_PLAN` | `RELEASED` | Department Manager |
| Any active review stage | Current authorized reviewer — `RETURN_FOR_REVISION` | `REVISION_REQUIRED` | Department Manager |

Every planning decision requires a non-empty reason and the exact current
planning revision. Finance approval, final plan approval, and GM release are
separate authorities. Planning approval does not issue a report or close a
Finding.

### Configured reminder offsets

The local candidate exposes read-only rules at 30, 15, and 7 days before the
Due Date, on the Due Date (`0`), and after it (`-1`). These rules are configured
reminder inputs only; real notification delivery remains outside this slice.

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
