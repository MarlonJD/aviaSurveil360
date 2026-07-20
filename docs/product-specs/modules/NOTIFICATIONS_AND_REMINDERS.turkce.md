# Notifications and Reminders — Türkçe

## Amaç

Deterministik browser-local Due Date ve manager-attention event'leri kaydeder.

## Ana alanlar

- Trigger
- Recipient
- Channel
- Subject
- Message
- Timing
- Delivery status

## Ana aksiyonlar

- Manual in-app reminder kaydet
- Configure template
- Enable rule
- View delivery

## İş kuralları

- 30/15/7/due/overdue reminders
- Critical Finding immediate manager-attention record
- Messages link to record
- No sensitive internal info in notifications
- Event'ler idempotent, organization-scoped'dur ve `in_app` /
  `demo_recorded` kullanır
- Overdue escalation enforcement başlatmaz
- Her history yüzeyi `Demo in-app event; no real delivery` yazar

## UX yönü

Ekran secondary detail öncesinde status, owner, due date ve next action göstermeli. Advanced configuration admin permission arkasında kalmalı.

## MVP acceptance criteria

- Operator audit demo senaryosunu destekler.
- Kritik aksiyonlar audit log'a yazılır.
- Auditee-visible ve internal bilgi ayrılır.
- Kullanıcı primary task'ı ekrandan çıkmadan tamamlayabilir.
