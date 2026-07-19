# Audit Planning — Türkçe

## Amaç

Create annual and ad hoc audit/inspection plans.

## Ana alanlar

- Audit ID
- Organization
- Audit type
- Inspection category
- Advance-notice policy
- Domain
- Planned date
- Location
- Remote/on-site
- Lead inspector
- Team
- Checklist template
- Scope
- Status

## Ana aksiyonlar

- Annual planning'i Finance review'a submit etme
- Finance-reviewed planı General Manager ve Executive Director approval'dan ilerletme
- Executive Director approval sonrasında `GM Release to Department` uygulama
- Release edilmiş planı Department içinde hazırlama
- Create audit
- Schedule
- Reschedule
- Assign inspector
- Select checklist
- Publish plan
- Advance notice gerektiğinde Service Provider coordination package gönderme
- Proposed date confirm etme veya Service Provider alternative date'ini kabul
  etme

## İş kuralları

- Manual scheduling is MVP
- Annual planning Department Manager -> Finance -> General Manager -> Executive
  Director -> GM Release to Department -> Department preparation sırasını izler.
- Executive Director approval planı release etmez. General Manager release
  ayrı ve kaydedilen bir next action olarak kalır.
- Audit type determines default templates
- Service Provider'ın önceden bilgilendirilip bilgilendirilmeyeceğini
  inspection type/configuration belirler.
- Routine / Announced inspection, Lead Inspector belirlendikten sonra proposed
  date, checklist ve relevant information paylaşır.
- Ad Hoc / Unannounced inspection Service Provider coordination adımını atlar.
- Service Provider proposed date'i confirm edebilir veya alternative
  önerebilir; execution ready olmadan önce alternative CAA tarafından kabul
  edilmelidir.
- Reschedule requires reason
- Completed audits cannot be deleted

## UX yönü

Ekran secondary detail öncesinde status, owner, due date ve next action göstermeli. Advanced configuration admin permission arkasında kalmalı.

## MVP acceptance criteria

- Operator audit demo senaryosunu destekler.
- Kritik aksiyonlar audit log'a yazılır.
- Auditee-visible ve internal bilgi ayrılır.
- Advance-notice-required inspection yalnız configured coordination package'ı
  eşleşen Service Provider kuruluşuna gösterir.
- Executive Director planning approval sonrasında next action `GM Release to
  Department` olarak kalır.
- Kullanıcı primary task'ı ekrandan çıkmadan tamamlayabilir.
