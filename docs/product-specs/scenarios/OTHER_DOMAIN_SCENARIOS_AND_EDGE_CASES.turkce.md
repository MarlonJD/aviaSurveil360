# Diğer Domain Senaryoları ve Edge Case'ler

## Aerodrome Inspection

Finding: AER-2026-004 — Runway lighting maintenance records incomplete.

Flow aynı product object'leri kullanır: Organization, Audit, Checklist, Finding, CAP, Evidence, Closure.

## ANSP Audit

Finding: ANS-2026-002 — ATC competency assessment records missing.

Flow aynıdır; sadece checklist template ve regulation references değişir.

## Training Organization Audit

Finding: ATO-2026-008 — Instructor qualification records not current.

Bu ileride AviaLicense ile bağlanabilir; o ATO'dan gelen certificate'lar licensing application'da kullanılıyorsa warning üretir.

## Security Inspection

Finding: SEC-2026-003 — Access control log review not performed.

Restricted visibility ve special permissions gerektirebilir.

## Edge cases

### CAP rejected

Finding open kalır. Auditee reason görür ve revision submit eder.

### Evidence rejected

Evidence version kalır. Auditee yeni version upload eder.

### Due date missed

Finding overdue olur. Inspector, auditee ve manager notified olur.

### Level 1 Critical

Manager hemen notified olur. Enforcement review recommended olabilir.

### Observation

CAP ve evidence optional olabilir. Observation critical finding KPI'larını şişirmemeli.

### Extension request

Phase 2 feature. Auditee extension request yapar; CAA approve/reject eder; audit trail karar kaydeder.
