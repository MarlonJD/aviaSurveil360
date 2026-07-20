# Demo Senaryosu — Cabin Inspection

## Senaryo

Fly Namibia için Cabin Inspection: PBE serviceability ve accessibility doğrulanamadı.

## Aktörler

- CAA Manager
- CAA Inspector
- Lead Inspector
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
5. Inspector `EM EQ / PBE` sorusunu açar, Non-Compliant işaretler ve bu exact
   Audit için zorunlu comment'i kaydeder.
6. AviaSurveil360, Lead Inspector incelemesi için audit-scoped bir Potential
   Finding oluşturur; Finding'i sessizce issue etmez veya rol değiştirmez.
7. Lead Inspector Potential Finding'i return, dismiss veya convert edebilir.
   Conversion; Audit, organization, configured reference, severity, CAP
   requirement ve Evidence requirement alanlarını taşıyan kanonik
   CAB-2026-001 Finding kaydını oluşturur.
8. Fly Namibia auditee giriş yapar ve sadece kendi kuruluşuna ait My Findings kayıtlarını görür.
9. Auditee CAP submit eder:
   - Root cause: Pre-flight cabin equipment serviceability checks did not reconcile the PBE position with the deferred defect list.
   - Corrective action: Replace or service the affected PBE, update the cabin defect record, and confirm serviceability before release.
   - Preventive action: Add a supervisor review of emergency equipment checks and monthly sampling of PBE serviceability records.
   - Target completion date: 15 July 2026.
10. Auditee Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf yükler ve PBE_Cabin_Position_Photo.jpg dosya adını mock filename olarak referans verebilir.
11. Inspector CAP'i inceler ve kabul eder. Finding, Evidence Required durumunda açık kalır.
12. Inspector latest Evidence version'ı inceler ve `Close` kaydeder.
13. Finding, `Evidence accepted and verified` closure basis'i ile kapanır.
    `Partially Close` ve `Not Close` Finding'i açık tutar.
14. Manager dashboard güncellenir.

Observation varsayılan olarak CAP, Evidence veya Due Date gerektirmez; Lead
Inspector conversion sırasında bu requirement'ları açıkça configure edebilir.
CAP acceptance hiçbir zaman Finding'i kapatmaz. Evidence-verified closure ile
reason-required ve audit-logged authorized closure ayrı yollardır. 30/15/7-day,
due-today, overdue ve manager-attention kayıtları deterministik browser-local
demo event'leridir. `Demo in-app event; no real delivery` sınırını gösterir;
production scheduling, notification delivery veya automatic enforcement
değildir.

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
   Final Report'u return edebilir veya Executive Director'a ilerletebilir; GM
   issue, sign veya lock edemez.
10. Executive Director selected Final Report'u inceler ve demo approval mark
    uygulayabilen, report'u issue ve lock edebilen tek roldür.
11. Executive Director report approval, gerekli CAP, Evidence veya verification
    işi açıkken `CAB-2026-001` kaydını kapatmaz.

## Demo mesajı

Sistem, cabin emergency equipment checklist exception'ını izlenebilir CAA-auditee CAP ve evidence workflow'una dönüştürür. Workbook'tan türetilen checklist yalnızca demo/mock configuration verisidir; yasal veya düzenleyici kaynak değildir.
