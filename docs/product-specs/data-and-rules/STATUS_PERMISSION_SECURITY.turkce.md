# Status, Permission, Security ve Audit Kuralları

## Audit statüleri

Draft, Planned, Scheduled, In Progress, Checklist Completed, Draft Report, Report Issued, Follow-up Open, Closed, Cancelled.

## Finding statüleri

Draft, Open, Waiting for CAP, CAP Submitted, CAP Accepted, CAP Rejected, Evidence Required, Evidence Submitted, Pending CAA Review, More Information Requested, Overdue, Pending Closure, Closed, Escalated.

## CAP statüleri

Draft, Submitted, Pending CAA Review, Accepted, Rejected, More Information Requested, Superseded.

## Evidence statüleri

Uploaded, Pending CAA Review, Accepted, Partially Accepted, Rejected, More Information Requested, Superseded.

## Permissions

| Action | Inspector | Lead Inspector | Department Manager | Finance | General Manager | Executive Director | Auditee | Admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Assigned audit görüntüleme | Yes | Yes | Yes | No | Summary | Summary | Kendi kuruluşu | Yes |
| Announced inspection date coordination | No | Gönder / alternative confirm | Görüntüle | No | Summary | Summary | Kendi kuruluşu için confirm / alternative öner | No |
| Audit oluşturma | Limited | Yes | Yes | No | No | No | No | Yes |
| Checklist tamamlama | Atanmış scope | Yes | No | No | No | No | No | No |
| Finding oluşturma / issue | Create | Review / issue | Yes | No | No | No | No | No |
| CAP / Evidence gönderme | No | No | No | No | No | No | Kendi kuruluşu | No |
| CAP review | Yes | Yes | Summary | No | Summary | Summary | No | No |
| Evidence verification kaydı: Close / Partially Close / Not Close | Yes | Yes | No | No | No | No | No | No |
| Finding closure | Verification `Close` | Verification `Close` | Ayrı authorized path | No | No | No | No | No |
| Budget-required plan review | No | No | Submit | Yalnız approve / return | Review / release stage | Final plan approval (demo) | No | No |
| Preliminary Report review | No | Prepare | Department review | No | Yalnız return / forward | Final decision | Yalnız ED-release edilmiş kendi kuruluşu | No |
| Preliminary Report issue, mock-sign veya lock | No | No | No | No | No | Evet, demo-only | No | No |
| Final Report review | No | Prepare | Department review | No | Yalnız return / forward | Final decision | Yalnız issue edilmiş kendi kuruluşu | No |
| Final Report issue, mock-sign veya lock | No | No | No | No | No | Evet, demo-only | No | No |
| Template configuration | No | Limited | Limited | No | No | No | No | Yes |

## Security rules

- Auditee Messages, Settings, counts, documents, reports, CAP, Evidence ve notifications yüzeylerinde yalnız kendi organization'ını görebilir.
- Auditee advance coordination'ı yalnız CAA request'i release ettikten sonra kendi Routine / Announced inspection kayıtları için görebilir. Ad Hoc / Unannounced ve notice-withheld record advance olarak hiçbir zaman render edilmez.
- Auditee Internal CAA Note, inspector workload, diğer organization, internal risk scoring, private dashboard veya enforcement deliberation göremez.
- Department Manager Preliminary ve Final Report'u General Manager'a ilerletir;
  issue, share, mock-sign veya lock edemez.
- General Manager review intermediate'dır; GM Preliminary veya Final Report'u
  return/forward edebilir fakat issue, share, mock-sign veya lock edemez.
- Bu demo içinde uygun Preliminary veya Final Report'u issue, mock-sign ve lock
  edebilen tek rol Executive Director'dır.
- Service Provider Preliminary Report'u yalnız Executive Director release
  sonrasında ve report `organizationId` kendi kuruluşuyla eşleştiğinde görür.
  `capRequired` approval zincirini değil recipient action'ı değiştirir.
- Finance yalnız budget-required planı approve veya return edebilir; audit scope edit, plan release veya report decision yapamaz.
- Planlama onay sırası: Department Manager -> Finance Review -> GM Review -> Executive Director.
  Finance onayı planı GM Review'a ilerletir. Finance Return for Revision kararı Department Manager'a döner.
  GM, Finance review'u tamamlanmış planı Executive Director'a ilerletebilir veya Department Manager'a döndürebilir.
  Düzeltilen submission tekrar Finance aşamasından geçmelidir. Executive Director onayı planı doğrudan release etmez; GM Release to Department ayrı bir sonraki adım olarak kalır.
- CAP acceptance Finding closure değildir. Report approval open Finding'leri
  kapatmaz ve gerekli Evidence/verification işini bypass etmez. Bu demoda
  `Close`, `Partially Close` veya `Not Close` sonucunu yalnız Inspector ya da
  Lead Inspector kaydeder. `Partially Close` ve `Not Close` Finding'i
  `EVIDENCE_MORE_INFO` durumunda bırakır; yalnız `Close` `CLOSED` yapar.
- CAP verification için `Comment to Auditee` ve `Internal CAA Note` ayrı ve
  zorunludur. Internal note Service Provider'a hiçbir zaman render edilmez.
- Enforcement ayrı configured/authorized süreçtir ve otomatik değildir.
- Submitted evidence asla silinmez.
- Demo traceability browser-local audit history kullanır; production immutable
  audit trail değildir.
- Internal users MFA kullanmalı.
- Sensitive data ve files access control gerektirir.

Implementation kanıtı **demo-only**; focused Node regressions ve `1536x864`, `1366x768`, `1024x768`, `390x844` fresh isolated-browser authority/privacy kontrolleriyle **verified locally** durumundadır. Production identity, authorization, signing, enforcement execution ve immutable audit logging **not run**; **production-readiness not claimed**.

Approval ve timestamp kayıtları browser-local mock record'dur. Attachment'lar
local browser state içindeki mock filename'lardır; secure document storage
uygulanmamıştır.
