# Demo Senaryosu — Cabin Inspection

## Senaryo

Airline XYZ için Cabin Inspection: PBE serviceability ve accessibility doğrulanamadı.

## Aktörler

- CAA Manager
- CAA Inspector
- Airline XYZ Auditee User

## Data

- Audit: 2026 Cabin Inspection
- Checklist: Cabin Inspection
- Question: Is the PBE installed, serviceable, accessible, and in compliance with configured cabin emergency equipment requirements?
- Finding: CAB-2026-001
- Severity: Level 1 Critical
- Risk category: Emergency Preparedness
- Finding type: Equipment
- Due date: 30 days

## Akış

1. Manager dashboard açar ve Airline XYZ için 2026 Cabin Inspection planını görür.
2. Airline XYZ için Cabin Inspection planlanmıştır.
3. Inspector bugünkü assigned Cabin Inspection'ı açar.
4. Inspector Cabin Inspection checklist başlatır.
5. Inspector `EM EQ / PBE` sorusunu açar ve Non-Compliant işaretler.
6. Sistem organization, audit, checklist reference, severity ve expected evidence bağlamı prefilled finding form açar.
7. Inspector CAB-2026-001 Finding issue eder.
8. Airline XYZ auditee giriş yapar ve sadece kendi kuruluşuna ait My Findings kayıtlarını görür.
9. Auditee CAP submit eder:
   - Root cause: Pre-flight cabin equipment serviceability checks did not reconcile the PBE position with the deferred defect list.
   - Corrective action: Replace or service the affected PBE, update the cabin defect record, and confirm serviceability before release.
   - Preventive action: Add a supervisor review of emergency equipment checks and monthly sampling of PBE serviceability records.
   - Target completion date: 15 July 2026.
10. Auditee PBE_Serviceability_Record_CAB-2026-001.pdf yükler ve PBE_Cabin_Position_Photo.jpg dosya adını mock filename olarak referans verebilir.
11. Inspector CAP'i inceler ve kabul eder. Finding, Evidence Required durumunda açık kalır.
12. Inspector evidence'ı inceler ve kabul eder.
13. Finding yalnızca evidence kabulünden sonra kapanır.
14. Manager dashboard güncellenir.

## Demo mesajı

Sistem, cabin emergency equipment checklist exception'ını izlenebilir CAA-auditee CAP ve evidence workflow'una dönüştürür. Workbook'tan türetilen checklist yalnızca demo/mock configuration verisidir; yasal veya düzenleyici kaynak değildir.
