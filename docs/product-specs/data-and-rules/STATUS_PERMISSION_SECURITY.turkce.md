# Status, Permission, Security ve Audit Kuralları

## Audit statüleri

Draft, Planned, Scheduled, In Progress, Checklist Completed, Draft Report, Report Issued, Follow-up Open, Closed, Cancelled.

## Finding statüleri

Draft, Open, Waiting for CAP, CAP Submitted, CAP Accepted, CAP Rejected, Evidence Required, Evidence Submitted, Pending CAA Review, More Information Requested, Overdue, Pending Closure, Closed, Escalated.

## CAP statüleri

Draft, Submitted, Pending CAA Review, Accepted, Rejected, More Information Requested, Superseded.

## Evidence statüleri

Uploaded, Pending CAA Review, Accepted, Rejected, More Information Requested, Superseded.

## Permissions

| Action | Inspector | Lead Inspector | Department Manager | Finance | General Manager | Executive Director | Auditee | Admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Assigned audit görüntüleme | Yes | Yes | Yes | No | Summary | Summary | Kendi kuruluşu | Yes |
| Audit oluşturma | Limited | Yes | Yes | No | No | No | No | Yes |
| Checklist tamamlama | Atanmış scope | Yes | No | No | No | No | No | No |
| Finding oluşturma / issue | Create | Review / issue | Yes | No | No | No | No | No |
| CAP / Evidence gönderme | No | No | No | No | No | No | Kendi kuruluşu | No |
| CAP / Evidence review | Yes | Yes | Yes | No | Summary | Summary | No | No |
| Finding closure | Configurable recommendation | Recommend | Authorized path | No | No | No | No | No |
| Budget-required plan review | No | No | Submit | Yalnız approve / return | Review / release stage | Final plan approval (demo) | No | No |
| Final Report review | No | Prepare | Department review | No | Yalnız return / forward | Final decision | Yalnız issue edilmiş kendi kuruluşu | No |
| Final Report issue, mock-sign veya lock | No | No | No | No | No | Evet, demo-only | No | No |
| Template configuration | No | Limited | Limited | No | No | No | No | Yes |

## Security rules

- Auditee Messages, Settings, counts, documents, reports, CAP, Evidence ve notifications yüzeylerinde yalnız kendi organization'ını görebilir.
- Auditee Internal CAA Note, inspector workload, diğer organization, internal risk scoring, private dashboard veya enforcement deliberation göremez.
- General Manager review intermediate'dır; GM Final Report'u return/forward edebilir fakat issue, mock-sign veya lock edemez.
- Bu demo içinde uygun Final Report'u issue, mock-sign ve lock edebilen tek rol Executive Director'dır.
- Finance yalnız budget-required planı approve veya return edebilir; audit scope edit, plan release veya report decision yapamaz.
- Planlama onay sırası: Department Manager -> Finance Review -> GM Review -> Executive Director.
  Finance onayı planı GM Review'a ilerletir. Finance Return for Revision kararı Department Manager'a döner.
  GM, Finance review'u tamamlanmış planı Executive Director'a ilerletebilir veya Department Manager'a döndürebilir.
  Düzeltilen submission tekrar Finance aşamasından geçmelidir. Executive Director onayı planı doğrudan release etmez; GM Release to Department ayrı bir sonraki adım olarak kalır.
- CAP acceptance Finding closure değildir. Report approval open Finding'leri kapatmaz ve gerekli Evidence/verification işini bypass etmez.
- Enforcement ayrı configured/authorized süreçtir ve otomatik değildir.
- Submitted evidence asla silinmez.
- Critical actions audit trail gerektirir.
- Internal users MFA kullanmalı.
- Sensitive data ve files access control gerektirir.

Implementation kanıtı **demo-only**; focused Node regressions ve `1536x864`, `1366x768`, `1024x768`, `390x844` fresh isolated-browser authority/privacy kontrolleriyle **verified locally** durumundadır. Production identity, authorization, signing, enforcement execution ve immutable audit logging **not run**; **production-readiness not claimed**.
