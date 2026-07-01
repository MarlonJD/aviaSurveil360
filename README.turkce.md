# AviaSurveil360 Planlama Paketi ve Frontend Demo

Bu depo, Sivil Havacılık Otoriteleri için önerilen surveillance, audit,
finding, CAP ve evidence management ürününe ait yapılandırılmış planlama paketi
ile **frontend-only statik clickable demo** içerir.

Çalıştırılabilir demo `index.html`, `css/`, `js/`, mock data, client-side state
ve `tests/` altındaki hedefli Node smoke testlerinden oluşur.

**Demo-only / production-ready değil:** backend, database, API, gerçek
authentication, gerçek authorization enforcement, gerçek file upload, gerçek AI
service, gerçek regulatory ingestion, gerçek notification service, production
audit log veya framework migration yoktur.

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

1. `00_RESEARCH_AND_POSITIONING/MARKET_RESEARCH_SUMMARY.md`
2. `01_PRODUCT_PLAN/PRODUCT_VISION.md`
3. `01_PRODUCT_PLAN/MVP_SCOPE_AND_ROADMAP.md`
4. `02_UX_PLAN/UX_PRINCIPLES.md`
5. `03_WORKFLOWS/MASTER_WORKFLOW.md`
6. `05_SCREEN_SPECS/SCREEN_INVENTORY_AND_FORMS.md`
7. `08_DEMO_AND_BUILD_HANDOFF/CODEX_DEMO_ONLY_PROMPT.md`
8. `DEMO_BUILD_SUMMARY.md`
9. `plans/index.md`

Clickable demo için `index.html` dosyasını doğrudan browser'da açın veya bu
klasörü local static server ile servis edin. Güncel verification status ve demo
sınırları için `docs/DEMO_BUILD_SUMMARY.md` dosyasına bakın.


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
