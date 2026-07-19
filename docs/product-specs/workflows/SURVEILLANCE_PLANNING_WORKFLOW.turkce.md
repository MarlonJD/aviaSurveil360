# Surveillance Planning Workflow — Türkçe

## Amaç

Karmaşık bir scheduling aracı oluşturmadan annual, routine ve ad hoc audit
planları üretmek ve execution öncesinde configured advance-notice policy'yi
uygulamak.

## Adımlar

1. Department Manager annual planning hazırlar ve submit eder
2. Finance budget ve resource review yapar
3. General Manager planı review eder ve ilerletir
4. Executive Director demo-only mock mark ile planı approve eder
5. General Manager ayrı `GM Release to Department` adımını uygular
6. Department release edilmiş planı hazırlar
7. Period/year, organization, audit type, domain, location ve planned date seç
8. Department Manager Lead Inspector atar
9. Lead Inspector inspection team ve checklist template atar
10. Configured advance-notice policy'yi değerlendir
11. Routine / Announced inspection için proposed date, checklist ve relevant
   information paketini Service Provider'a gönder
12. Service Provider proposed date'i confirm eder veya alternative date önerir;
    alternative date'i CAA confirm eder
13. Ad Hoc / Unannounced inspection için advance notification adımını atla ve
    coordination package'ı Service Provider'a gösterme
14. Inspection team ve schedule'ı execution için ready yap
15. Calendar'a publish et

## Kurallar

- Manual scheduling in MVP
- Planning approval sırası Department Manager -> Finance -> General Manager ->
  Executive Director -> GM Release to Department -> Department preparation'dır.
- Executive Director approval preparation'ı `not_released` durumunda bırakır;
  ayrı General Manager release adımını birleştirmez veya bypass etmez.
- Risk score informational only in MVP
- Reschedule requires reason
- Published audit appears on inspector dashboard
- Advance notice gerekip gerekmediğini inspection type/configured policy
  belirler; UI rengi veya free text'ten türetilmez.
- Routine / Announced execution, proposed date confirm edilmeden veya Service
  Provider alternative'ı CAA tarafından kabul edilmeden ready olmaz.
- Ad Hoc / Unannounced inspection advance Service Provider notification,
  portal request veya shared checklist package üretmez.
- Demo notification ve date response browser-local kalır; gerçek email,
  calendar invitation veya external delivery iddia edilmez.

## UX notları

- Current owner, due date ve next action ekranın üstünde gösterilmeli.
- History timeline/tab içinde kalmalı, primary content olmamalı.
- Primary button next action ile aynı dili kullanmalı.
