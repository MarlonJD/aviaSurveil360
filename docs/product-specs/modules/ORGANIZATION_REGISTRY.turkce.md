# Organization Registry — Türkçe

## Amaç

Maintain audited organizations and their oversight profile.

## Ana alanlar

- Organization ID
- Legal name
- Organization type
- Approval/certificate number
- Status
- Responsible CAA department
- Accountable manager
- Primary contact
- Locations
- Risk profile
- Open findings
- Last audit
- Next audit

## Ana aksiyonlar

- Create organization
- Edit organization
- View profile
- Assign department
- Add contact
- View audits
- View findings

## İş kuralları

- Every audit links to organization
- Auditee users see only their organization
- Suspended/expired status creates warning
- Organization profile shows risk/open findings first

## UX yönü

Ekran secondary detail öncesinde status, owner, due date ve next action göstermeli. Advanced configuration admin permission arkasında kalmalı.

## MVP acceptance criteria

- Operator audit demo senaryosunu destekler.
- Kritik aksiyonlar audit log'a yazılır.
- Auditee-visible ve internal bilgi ayrılır.
- Kullanıcı primary task'ı ekrandan çıkmadan tamamlayabilir.
