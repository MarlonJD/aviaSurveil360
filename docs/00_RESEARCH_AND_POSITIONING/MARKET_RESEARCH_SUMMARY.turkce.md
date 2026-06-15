# Pazar Araştırması Özeti

## Ana sonuç

Piyasa surveillance sürecini zaten biliyor: audit planning, checklist, finding, corrective action, evidence, reminder, dashboard ve report. AVIASURVEIL 360 için fırsat yeni regülasyon süreci icat etmek değil, bilinen süreci daha kolay işletilebilir hale getirmek.

## Rakipler ve yakın ürünler ne gösteriyor?

EMPIC; planning, checklist execution, findings/observations, CAP handling, evidence handling ve external stakeholder access gibi geniş surveillance kabiliyetleri anlatıyor. Centrik ve benzer aviation QMS ürünleri documents, dashboard, safety, workflow, risk ve compliance tarafını öne çıkarıyor. iQSMS internal/external audit, auditee guest access ve due-date communication anlatıyor.

Bu sinyaller kullanıcının önerdiği yapının doğru olduğunu gösterir: **Surveillance Plan → Audit Checklist → Finding → CAP → Evidence → Review → Closure → Dashboard**.

## Piyasada görülen ortak kullanılabilirlik boşlukları

Regulator-specific public review azdır; ama aviation QMS/EHS/compliance yorumlarında tekrar eden sorunlar var:

1. Her kullanıcıya çok fazla modül gösterilmesi.
2. Karmaşık navigasyon ve yüksek öğrenme eğrisi.
3. Güçlü ama normal kullanıcı için zor configuration.
4. Uzmanlık isteyen dashboard/reporting.
5. Yoğun veya eski hissettiren UI.
6. Owner, due date ve next action göstermeyen statüler.
7. Auditee süreçlerinin hâlâ e-mail ile yürümesi.
8. CAP acceptance ile finding closure'ın karışması.
9. Evidence'ın e-mail/shared drive'a dağılması.
10. Yönetim raporlarının manuel hazırlanması.

## AVIASURVEIL fırsatı

Core loop'u çok anlaşılır yapan ürün:

- Audit planla.
- Checklist yürüt.
- Finding oluştur.
- CAP al.
- Evidence incele.
- Finding kapat.
- Risk ve overdue gör.

## Tasarım sonucu

Back office configurable olabilir ama UI role-based ve sade kalmalıdır. Workflow engine, taxonomy, evidence repository ve notification engine gibi internal object'ler normal kullanıcı için primary navigation olmamalıdır.


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
