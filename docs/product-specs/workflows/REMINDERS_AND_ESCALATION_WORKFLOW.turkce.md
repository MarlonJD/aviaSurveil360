# Reminders and Escalation Workflow — Türkçe

## Amaç

Gerçek notification delivery veya production scheduling iddiası olmadan
deterministik browser-local reminder ve manager-attention event'lerini gösterir.

## Adımlar

1. Exact calendar-day stage'i türet: 30 days, 15 days, 7 days, due today,
   overdue veya none
2. Her uygun stage ve Finding için tek, idempotent Auditee event'i kaydet
3. Açık Level 1 Critical Finding için immediate manager attention kaydet
4. Overdue Finding için manager escalation event'i kaydet
5. User-triggered manual reminder'ı ayrı audit-log event'i olarak tut
6. Stage, recipient, date, `demo_recorded` status ve demo boundary'yi göster

## Kurallar

- Event ID'leri deterministiktir; aynı Finding ve stage için duplicate oluşmaz.
- Her event organization-scoped'dur, `in_app` channel ve `demo_recorded`
  delivery status kullanır.
- Auditee view yalnız o organization'a ait Auditee-recipient event'leri gösterir.
- Her history yüzeyi `Demo in-app event; no real delivery` yazar.
- Manager attention ve overdue escalation enforcement başlatmaz, Finding
  kapatmaz veya production delivery ima etmez.

## UX notları

- Current owner, due date ve next action ekranın üstünde gösterilmeli.
- Reminder history okunabilir olmalı ancak Finding next action'ına göre
  secondary kalmalıdır.
- Primary button next action ile aynı dili kullanmalı.
