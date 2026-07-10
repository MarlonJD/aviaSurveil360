# Demo Senaryosu — Cabin Inspection

## Senaryo

Fly Namibia için Cabin Inspection: PBE serviceability ve accessibility doğrulanamadı.

## Aktörler

- CAA Manager
- CAA Inspector
- Fly Namibia Auditee User

## Data

- Audit: 2026 Cabin Inspection - Fly Namibia
- Checklist: Cabin Inspection
- Question: Is the PBE installed, serviceable, accessible, and in compliance with configured cabin emergency equipment requirements?
- Finding: CAB-2026-001
- Severity: Level 1 Critical
- Risk category: Emergency Preparedness
- Finding type: Equipment
- Due date: 30 days

## Akış

1. Manager dashboard açar ve 2026 Cabin Inspection - Fly Namibia planını görür.
2. Fly Namibia için Cabin Inspection planlanmıştır.
3. Inspector bugünkü assigned Cabin Inspection'ı açar.
4. Inspector Cabin Inspection checklist başlatır.
5. Inspector `EM EQ / PBE` sorusunu açar ve Non-Compliant işaretler.
6. Sistem organization, audit, checklist reference, severity ve expected evidence bağlamı prefilled finding form açar.
7. Inspector CAB-2026-001 Finding issue eder.
8. Fly Namibia auditee giriş yapar ve sadece kendi kuruluşuna ait My Findings kayıtlarını görür.
9. Auditee CAP submit eder:
   - Root cause: Pre-flight cabin equipment serviceability checks did not reconcile the PBE position with the deferred defect list.
   - Corrective action: Replace or service the affected PBE, update the cabin defect record, and confirm serviceability before release.
   - Preventive action: Add a supervisor review of emergency equipment checks and monthly sampling of PBE serviceability records.
   - Target completion date: 15 July 2026.
10. Auditee Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf yükler ve PBE_Cabin_Position_Photo.jpg dosya adını mock filename olarak referans verebilir.
11. Inspector CAP'i inceler ve kabul eder. Finding, Evidence Required durumunda açık kalır.
12. Inspector evidence'ı inceler ve kabul eder.
13. Finding yalnızca evidence kabulünden sonra kapanır.
14. Manager dashboard güncellenir.

## Department ve General Manager oversight uzantısı

Aynı Fly Namibia demo verisi management-review yolunu da destekler:

1. Department Manager yalnızca Dashboard, Audits, Reports Approval, Risk
   Dashboard, Inspection Team, Findings Review, CAP Monitoring ve Checklist
   Management rotalarını kullanır.
2. Findings Review, ana `CAB-2026-001` lifecycle'ını değiştirmeden Fly Namibia
   inspection finding'lerini ve ilgili raporu açar.
3. Inspection Team aksiyonları yalnızca manager-scope demo member, schedule,
   note, message, history ve indirilebilir Team Assignment PDF'ini günceller.
4. Preliminary ve Final Report ayrı artifact'lardır. Department Manager ilgili
   artifact için revision isteyebilir, return veya approve kararı verebilir ve
   Final Report ile Executive Summary PDF'lerini indirebilir.
5. Department Manager Final Report onayı raporu configured final authorized
   stage'e iletir; raporu issue veya lock etmez.
6. CAP Monitoring filtre, beş sekmeli detay incelemesi ve görünür update sağlar.
   CAP kabulü veya update, Finding'i kapatmaz.
7. Checklist Management published version'ları korur; tarayıcı-local demo
   package, section ve question değişiklikleri draft/yeni version oluşturur.
8. Risk Dashboard değerleri yalnızca management indicator'dır; otomatik legal,
   enforcement, certificate veya closure aksiyonu tetiklemez.
9. General Manager yalnızca Dashboard, Report Approvals, Departments, Risk
   Dashboard ve Settings rotalarını kullanır. General Manager gerekli yorumla
   Final Report'u return edebilir veya configured final authorization uygular.
10. Bu demoda Final Report'u yalnızca başarılı configured General Manager
    authorization issue ve lock eder.

## Demo mesajı

Sistem, cabin emergency equipment checklist exception'ını izlenebilir CAA-auditee CAP ve evidence workflow'una dönüştürür. Workbook'tan türetilen checklist yalnızca demo/mock configuration verisidir; yasal veya düzenleyici kaynak değildir.
