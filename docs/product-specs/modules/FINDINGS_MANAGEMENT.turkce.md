# Findings Management — Türkçe

## Amaç

Create, issue, track and close findings.

## Ana alanlar

- Finding number
- Audit
- Organization
- Title
- Description
- Reference
- Severity
- Due date
- Status
- Owner
- Next action
- CAP required
- Evidence required
- Repeat flag

## Ana aksiyonlar

- Potential Finding review et
- Potential Finding'i return, dismiss veya convert et
- Review CAP
- Review evidence
- Request more info
- Close
- Escalate

## İş kuralları

- Issued findings cannot be deleted
- CAP accepted does not close finding
- Observation varsayılan olarak CAP, Evidence veya Due Date gerektirmez
- Evidence `Close`, evidence-verified closure kaydeder; authorized closure ayrı
  Department Manager ve reason-required yoldur
- Internal notes separated
- Critical/overdue findings appear on manager dashboard

## UX yönü

Ekran secondary detail öncesinde status, owner, due date ve next action göstermeli. Advanced configuration admin permission arkasında kalmalı.

## MVP acceptance criteria

- Operator audit demo senaryosunu destekler.
- Kritik aksiyonlar audit log'a yazılır.
- Auditee-visible ve internal bilgi ayrılır.
- Kullanıcı primary task'ı ekrandan çıkmadan tamamlayabilir.
