# Finding CAP Evidence Workflow — Türkçe

## Amaç

Manage finding follow-up from issue to closure.

## Adımlar

1. Create finding
2. Issue to auditee
3. Service Provider root cause, corrective action, preventive action,
   responsible person, target completion date ve mock Evidence filename sunar
4. CAA reviews CAP
5. CAP accepted veya returned olur; acceptance Finding'i açık bırakır
6. Gerektiğinde Service Provider yeni mock Evidence filename/version yükler
7. Inspector veya Lead Inspector latest Evidence version'ı review eder ve
   `Close`, `Partially Close` ya da `Not Close` kaydeder
8. `Close` Finding'i kapatır; diğer sonuçlar kalan aksiyon veya Evidence ister
   ve Finding'i açık tutar
9. İzin verilen authorized closure ayrı, reason-required bir yoldur ve CAP
   verification sonucu oluşturmaz

## Kurallar

- CAP accepted is not closure.
- `Close`, Finding'i `CLOSED` durumuna taşır ve `evidence-verified` closure kaydeder.
- `Partially Close` ile `Not Close`, Finding'i `EVIDENCE_MORE_INFO` durumuna
  taşır ve `findingClosed: false` kaydeder.
- Her CAP verification sonucu ayrı `Comment to Auditee` ve `Internal CAA Note`
  gerektirir.
- Bu demoda CAP verification sonucunu yalnız Inspector veya Lead Inspector kaydeder.
- Evidence version ve CAP verification history append-only'dir; önceki Evidence
  kaydı overwrite veya delete edilmez.
- Authorized closure ayrı authority gerektirir ve Evidence verification gibi gösterilmez.
- Enforcement ayrı authorized review'a referral olarak kalır; otomatik sanction uygulamaz.

## UX notları

- Current owner, due date ve next action ekranın üstünde gösterilmeli.
- History timeline/tab içinde kalmalı, primary content olmamalı.
- Primary button next action ile aynı dili kullanmalı.
- Latest result, actor, timestamp, Evidence version, Finding'in açık kalıp
  kalmadığı ve next action gösterilmelidir.
- `Internal CAA Note` Service Provider'a hiçbir zaman gösterilmemelidir.
