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
- Create finding
- Complete checklist

## İş kuralları

- Templates are versioned
- Old audits keep old template version
- Non-compliant answer can create finding
- Observation CAP optional by configuration

## UX yönü

Ekran secondary detail öncesinde status, owner, due date ve next action göstermeli. Advanced configuration admin permission arkasında kalmalı.

## MVP acceptance criteria

- Operator audit demo senaryosunu destekler.
- Kritik aksiyonlar audit log'a yazılır.
- Auditee-visible ve internal bilgi ayrılır.
- Kullanıcı primary task'ı ekrandan çıkmadan tamamlayabilir.
