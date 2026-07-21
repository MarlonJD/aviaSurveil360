# Production Contract Vocabulary — Türkçe Eşlikçi Doküman

**Durum:** Task 5'e kadar açıkça yetkilendirilen local candidate ve onu
destekleyen Tasks 6-12 için `verified locally` ve `candidate-only`. Release
durumu `release pending`. Bu doküman production deployment, traffic cutover,
legacy removal, hosting veya production kullanım onayı değildir.

Canonical uygulama kaynağı İngilizce
`PRODUCTION_CONTRACT_VOCABULARY.md` dokümanıdır. Bu Türkçe doküman stakeholder
incelemesi için aynı sınırları ve görünen etiketleri açıklar. Bu dilimde kaynak
otoritesi canonical product docs ile doğrulanmış root Vanilla JavaScript
demodur.

## Contract kuralları

- OpenAPI değerleri kararlı büyük harfli identifier kullanır; UI etiketleri
  okunabilir kalır.
- `Due Soon`, `Due Today` ve `Overdue` hesaplanan `DueState` değerleridir;
  Finding lifecycle status değildir.
- Inspector yalnız exact Audit/question/response kapsamında `Potential Finding`
  oluşturur. Canonical `Finding` ancak Lead Inspector dönüşümü ile oluşur.
- Auditee CAP submission ile CAA CAP review ayrı komutlardır. CAP acceptance
  Finding'i kapatmaz.
- Her Evidence submission yeni ve değiştirilemez bir `EvidenceVersion` kaydı
  oluşturur; önceki versiyonun üzerine yazılmaz.
- Yalnız `Close`, Evidence kabul ve doğrulamasına dayalı kapanış üretir.
  `Partially Close`, `Not Close` ve `Request More Information` Finding'i açık
  tutar.
- Department Manager authorized closure ayrı ve reason-required bir yoldur.
- Report kararları exact version hedefler. Department Manager ve General
  Manager yalnız return/forward yapar; Executive Director issue/lock işlemi
  Finding kapatmaz.
- `Comment to Auditee` ile `Internal CAA Note` ayrı alanlardır. Auditee
  projection'larında internal CAA verisi yapısal olarak bulunmaz.
- Regulatory içerik configured reference, expected Evidence veya finding basis
  olarak ele alınır; legal advice veya automatic enforcement değildir.

## Roller ve giriş route'ları

Canonical Cabin scenario, aşağıdaki sekiz doğrulanmış rol giriş route'u ve Task
5 Core MVP route family'leri local candidate için `first-production`
kapsamındadır. Diğer tüm legacy route'lar `later` veya `demo-only` olarak root
demoda korunur.

| Legacy rol | OpenAPI `Role` | UI etiketi | Yetkilendirilen giriş route'u |
|---|---|---|---|
| `inspector` | `inspector` | CAA Inspector | `inspector-assignments` |
| `leadInspector` | `leadInspector` | Lead Inspector | `lead-review` |
| `manager` | `manager` | Department Manager | `dashboard` |
| `gm` | `gm` | General Manager | `gm-dashboard` |
| `finance` | `finance` | Finance Review | `finance-review` |
| `executiveDirector` | `executiveDirector` | Executive Director | `executive-dashboard` |
| `auditee` | `auditee` | Auditee / Service Provider | `service-provider-cap` |
| `admin` | `admin` | Admin Preview | `templates` |

## Task 5 first-production route family'leri

| Route family | Yetkili roller | Kararlı route / operation | Candidate sınırı |
|---|---|---|---|
| Organization Registry | Department Manager; organization-scoped Auditee projection | `/department-manager/organizations`; `GET /v1/organizations` | Read-only oversight özeti; Auditee projection'ında Internal CAA alanı yoktur. |
| Audit Plan Calendar | Department Manager | `/department-manager/audit-plan`; `GET /v1/planning/items` | Current owner/status gösterir; approval authority bypass edilemez. |
| Surveillance plan kararları | Finance Review, General Manager, Executive Director | `POST /v1/planning/items/{id}/decisions` | Reason-required, idempotent, exact-revision ve role/stage kontrollüdür. |
| Versioned checklist configuration | Admin Preview | `GET /v1/configuration/checklist-template-versions` | Yalnız published version preview; geniş editing `later` kalır. |
| Due Date reminder configuration | Admin Preview | `GET /v1/configuration/reminder-rules` | Read-only configured rule; gerçek notification delivery iddiası yoktur. |
| Planning Audit Trail | Admin Preview | `GET /v1/audit-events` | Append-only local candidate projection; production tamper-evidence iddiası yoktur. |

### Surveillance planning status ve kararları

| Current status | Yetkili rol ve karar | Result status | Next owner |
|---|---|---|---|
| `FINANCE_REVIEW` | Finance Review — `APPROVE_BUDGET` | `GM_REVIEW` | General Manager |
| `GM_REVIEW` | General Manager — `FORWARD_FOR_FINAL_APPROVAL` | `EXECUTIVE_DIRECTOR_REVIEW` | Executive Director |
| `EXECUTIVE_DIRECTOR_REVIEW` | Executive Director — `APPROVE_PLAN` | `GM_RELEASE` | General Manager |
| `GM_RELEASE` | General Manager — `RELEASE_PLAN` | `RELEASED` | Department Manager |
| Her active review stage | Current authorized reviewer — `RETURN_FOR_REVISION` | `REVISION_REQUIRED` | Department Manager |

Her planning kararı non-empty reason ve exact current planning revision ister.
Finance approval, final plan approval ve GM release ayrı authority'lerdir.
Planning approval report issue etmez veya Finding kapatmaz.

### Configured reminder offset'leri

Local candidate Due Date'ten 30, 15 ve 7 gün önce, Due Date üzerinde (`0`) ve
sonrasında (`-1`) read-only rule'lar gösterir. Bunlar yalnız configured reminder
input'larıdır; gerçek notification delivery bu dilimin dışındadır.

## Canonical görünen etiketler

| Alan | OpenAPI değerleri | UI etiketleri |
|---|---|---|
| Checklist answer | `COMPLIANT`, `NON_COMPLIANT`, `OBSERVATION`, `NOT_APPLICABLE`, `NOT_CHECKED` | Compliant, Non-Compliant, Observation, Not Applicable, Not Checked |
| Due state | `NONE`, `NOT_DUE`, `DUE_SOON`, `DUE_TODAY`, `OVERDUE` | No Due Date, Not Due, Due Soon, Due Today, Overdue |
| Potential Finding | `PENDING_LEAD_REVIEW`, `RETURNED`, `DISMISSED`, `CONVERTED` | Pending Lead Review, Returned, Dismissed, Converted to Finding |
| Severity | `LEVEL_1_CRITICAL`, `LEVEL_2_MAJOR`, `LEVEL_3_MINOR`, `OBSERVATION` | Level 1 Critical, Level 2 Major, Level 3 Minor, Observation |
| CAP | `DRAFT`, `SUBMITTED`, `PENDING_CAA_REVIEW`, `ACCEPTED`, `REJECTED`, `MORE_INFORMATION_REQUESTED`, `SUPERSEDED` | Draft, Submitted, Pending CAA Review, Accepted, Rejected, More Information Requested, Superseded |
| Evidence review | `NOT_READY`, `PENDING_CAA_REVIEW`, `ACCEPTED`, `PARTIALLY_ACCEPTED`, `REJECTED`, `MORE_INFORMATION_REQUESTED` | Not Ready, Pending CAA Review, Accepted, Partially Accepted, Rejected, More Information Requested |

## Finding lifecycle eşlemesi

| OpenAPI enum | React UI etiketi |
|---|---|
| `DRAFT` | Draft |
| `OPEN` | Open |
| `WAITING_FOR_CAP` | Waiting for CAP |
| `CAP_SUBMITTED` | CAP Submitted |
| `CAP_ACCEPTED` | CAP Accepted |
| `CAP_REJECTED` | CAP Rejected |
| `CAP_MORE_INFORMATION_REQUESTED` | CAP More Information Requested |
| `EVIDENCE_REQUIRED` | CAP Accepted - Evidence Required |
| `EVIDENCE_SUBMITTED` | Evidence Submitted |
| `PENDING_CAA_REVIEW` | Pending CAA Review |
| `EVIDENCE_MORE_INFORMATION_REQUESTED` | More Information Requested |
| `PENDING_CLOSURE` | Pending Closure |
| `CLOSED` | Closed |
| `ESCALATED` | Escalated for Authorized Review |

## Evidence review sonuçları

| UI action | OpenAPI decision | Finding sonucu |
|---|---|---|
| Close | `CLOSE` | `CLOSED`; closure basis `EVIDENCE_VERIFIED` |
| Partially Close | `PARTIALLY_CLOSE` | Açık; `EVIDENCE_MORE_INFORMATION_REQUESTED` |
| Not Close | `NOT_CLOSE` | Açık; `EVIDENCE_MORE_INFORMATION_REQUESTED` |
| Request More Information | `REQUEST_MORE_INFORMATION` | Açık; `EVIDENCE_MORE_INFORMATION_REQUESTED` |

Canonical scenario; Fly Namibia `AUD-2026-001` Cabin Inspection içindeki
`CAB-EMEQ-PBE-001` PBE sorusundan `PF-2026-001`, Lead dönüşümü ile
`CAB-2026-001`, ayrı CAP submission/review, versiyonlu Evidence ve yalnız
Evidence doğrulamasından sonra closure akışıdır. Mock Evidence dosya adı
`Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf` olarak görünür.

Bu identifier'lar deterministic mock ve fake-fetch testleri içindir. Production
public-number allocation veya records policy değildir.
