# Checklist Builder and Runner — Türkçe

## Amaç

Create reusable checklists and let inspectors execute them.

## Ana alanlar

- Template name
- Version
- Section
- Question
- Reference
- Expected evidence
- Default severity
- Answer
- Comment
- Attachment

## Ana aksiyonlar

- Create template
- Version template
- Start checklist
- Answer item
- Attach file
- Create Potential Finding
- Complete checklist

## İş kuralları

- Templates are versioned
- Old audits keep old template version
- Non-Compliant veya Observation ile zorunlu comment, Lead Inspector review
  için audit-scoped Potential Finding oluşturabilir
- Kanonik Finding'i yalnız Lead conversion oluşturur
- Observation CAP, Evidence ve Due Date requirement'ları configuration'a göre
  isteğe bağlıdır
- Submitted checklist reopen için Inspector/Lead authority, valid stage ve
  reason gerekir

## UX yönü

Ekran secondary detail öncesinde status, owner, due date ve next action göstermeli. Advanced configuration admin permission arkasında kalmalı.

## MVP acceptance criteria

- Operator audit demo senaryosunu destekler.
- Kritik aksiyonlar audit log'a yazılır.
- Auditee-visible ve internal bilgi ayrılır.
- Kullanıcı primary task'ı ekrandan çıkmadan tamamlayabilir.
