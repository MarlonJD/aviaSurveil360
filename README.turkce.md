# AviaSurveil360 Planlama Paketi, Frontend Demo ve React Candidate

Bu depo, Sivil Havacılık Otoriteleri için önerilen surveillance, audit,
Finding, CAP ve Evidence management ürününe ait yapılandırılmış planlama
paketini, orijinal **frontend-only statik clickable demo**yu ve ayrı bir
`candidate-only` React mock dilimini içerir.

Korunan legacy demo `index.html`, `css/`, `js/`, browser-local mock state ve
`tests/` altındaki Node smoke testlerinden oluşur. Yetkilendirilen ilk
çalıştırılabilir React dilimi `apps/web/` altındadır; TypeScript, Vite, tek
`Backend` arkasında deterministik in-memory mock data ve `api/openapi/`
altındaki versioned OpenAPI contract'ı kullanır.

**Candidate-only / production-ready değil:** real backend, database, deployed
API, authentication, production authorization enforcement, real file
upload/storage, production Evidence chain of custody, PWA/offline persistence,
production synchronization, deployment veya cutover yoktur. `HttpBackend`
yalnız fake-fetch ile test edilmiştir. Root demo, removal-blocking behavior
oracle olarak korunur.

## Ürün tanımı

**AviaSurveil360**, CAA ekiplerinin audit planlamasına, checklist yürütmesine,
finding oluşturmasına, auditee CAP cevabı almasına, evidence incelemesine, due
date takibine, finding kapatmasına ve oversight performansını izlemesine yardım
eden task-based oversight platformudur.

## Ana ürün tezi

İlk aşamada EMPIC gibi karmaşık enterprise ekranı yapılmamalı. Her rolün sıradaki aksiyonunu hemen anladığı sade, role-based ürün yapılmalı:

- Inspector: Bugün neyi denetlemeli veya incelemeliyim?
- Auditee: CAA kuruluşumdan ne istiyor?
- Manager: Nerede risk, gecikme veya iş yükü var?
- Admin: Hangi template veya rule configure edilmeli?

## Önerilen okuma sırası

1. `docs/index.md`
2. `docs/product-specs/index.md`
3. `docs/demo-handoff/CODEX_DEMO_ONLY_PROMPT.md`
4. `docs/demo-evidence/BUILD_SUMMARY.md`
5. `docs/exec-plans/index.md`
6. `docs/demo-evidence/REACT_MOCK_SLICE_2026-07-20.turkce.md`

Clickable demo için `index.html` dosyasını doğrudan browser'da açın veya bu
klasörü local static server ile servis edin. Güncel verification status ve demo
sınırları için `docs/demo-evidence/BUILD_SUMMARY.md` dosyasına bakın.

React mock candidate için:

```bash
npm --prefix apps/web ci
npm --prefix apps/web run dev:demo
```

Doğrulanan exact scope, command, transcript ve exclusion'lar için
`docs/demo-evidence/REACT_MOCK_SLICE_2026-07-20.turkce.md` dosyasına bakın.


## Kaynak Notları
- EMPIC Solutions — surveillance layer, checklist, finding, CAP, evidence ve external stakeholder access: https://www.empic.aero/solutions/
- EMPIC-EAP booklet — external stakeholder web client ve corrective action handling: https://www.empic.aero/wp-content/uploads/2022/05/Booklet_202205_eng.pdf
- TrustFlight Centrik 5 QMS — aviation quality, safety, risk, workflow, documents ve dashboards: https://www.trustflight.com/products/centrik-5-qms/
- ASQS/iQSMS Quality Management Module via Aircraft IT — internal/external audit, auditee guest users, due-date e-mail ve finding status: https://www.aircraftit.com/vendors/comply365-2/quality-management-module/
- ICAO / UK CAAi audit training material — oversight activity, audit reports, findings ve observations: https://www.icao.int/sites/default/files/APAC/Meetings/2025/2025%20COSCAP%20SEA%20AND%20UK%20CAAi%20AGA%20CERT%20AND%20SURV/5-Presentations/08-Conducting-Audits_v02_COSCAP.pdf
- Irish Aviation Authority UAM-020 — root cause, CAP, target completion ve evidence beklentileri: https://www.iaa.ie/docs/default-source/publications/advisory-memoranda/uas-advisory-memoranda-%28uam%29/uam-020---guidance-on-the-competent-authority-oversight-audits.pdf
- ANAO CASA surveillance audit report — regulator surveillance içinde planning, data, tracking ve reporting eksikleri: https://www.anao.gov.au/work/performance-audit/civil-aviation-safety-authority-planning-and-conduct-surveillance-activities
- UK CAA compliance monitoring sample checklist/finding form: https://www.caa.co.uk/media/0g3ekh5a/sample-compliance-monitioring-audit-checklists-and-findings-form-1.docx
- FOCA supervision review — Level 1/Level 2 finding handling örnekleri: https://www.newsd.admin.ch/newsd/message/attachments/66693.pdf
- GOV.UK Design System / Service Manual — sade form ve question-page prensipleri: https://design-system.service.gov.uk/patterns/question-pages/ ve https://www.gov.uk/service-manual/design/form-structure
- Nielsen Norman Group — complex application ve dashboard usability prensipleri: https://www.nngroup.com/articles/complex-application-design/ ve https://www.nngroup.com/articles/dashboards-preattentive/
