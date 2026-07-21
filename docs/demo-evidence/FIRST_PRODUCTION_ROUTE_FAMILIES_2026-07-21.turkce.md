# First-Production Route Family Kanıtı — 2026-07-21

## Sonuç

- Kanıt durumu: `verified locally`
- Artifact durumu: `candidate-only`
- Release durumu: `release pending`
- Task 13 local release-candidate paketi: `not run`
- Production deployment, traffic cutover, legacy removal, production hosting ve `production-ready` iddiası: `blocked`

Task 5, owner-approved Core MVP `first-production` route family'lerini canonical Cabin Inspection scenario'nun kullandığı aynı React uygulamasına ve capability-composed `Backend` sözleşmesine taşır. Root Vanilla JavaScript demo behavioral reference olarak bozulmadan kalır ve bütün `later` ile `demo-only` kavramları taşımaya devam eder.

## Test-First Kanıtı

İlk focused koşular versioned OpenAPI contract'ta organization route bulunmadığı, behavior ledger hâlâ version 2 olduğu ve reusable Backend contract organization/planning capability'lerini içermediği için başarısız oldu. İlk tam real-HTTP koşu daha sonra her viewport'ta iki unexpected 404 console kaydı yakaladı: Department Manager dashboard, canonical Finding scenario tarafından oluşturulmadan önce onu fetch etmeye çalışıyordu. Dashboard server-shaped Finding list projection kullanacak ve canonical item'ı yalnız mevcutsa seçecek biçimde düzeltildi.

Final route-family testleri exact entity identity, role/stage/revision authority, organization scope, decision reason, idempotent replay, payload-drift rejection, Auditee-safe projection, anlamlı görünür kontrol, audit-event üretimi ve mock/HTTP profile'larda aynı desktop/tablet/mobile scenario'yu kapsar.

## Uygulanan Route Family'leri

- Organization Registry: Department Manager aktif oversight organization'ları görür; Auditee yalnız kendi organization'ı ile sınırlıdır ve Internal CAA field'ları projection'da yapısal olarak bulunmaz.
- Audit Plan Calendar: Department Manager exact planning item, scheduled date, current status, current owner, budget ve next action bilgisini görür.
- Planning authority zinciri: Finance `APPROVE_BUDGET` -> General Manager `FORWARD_FOR_FINAL_APPROVAL` -> Executive Director `APPROVE_PLAN` -> General Manager `RELEASE_PLAN`. Her komut reason ve exact expected revision ister. `RETURN_FOR_REVISION` görünüşte bir placeholder değil, gerçek server-shaped transition'dır.
- Versioned configuration preview: Admin Preview published checklist-template version'larını ve 30, 15, 7, 0 ve -1 günlük deterministik Due Date reminder rule'larını okur. Geniş configuration ve regulatory authoring bu dilimin dışındadır.
- Planning Audit Trail: Admin Preview append-only planning decision projection'ını okur. Bu local candidate production tamper-evidence iddiasında bulunmaz.

Behavior ledger version 3 ve 15 executable entry içerir: sekiz role entry, canonical Cabin workflow action ve altı Task 5 route-family action. Accepted difference'lar açıkça kaydedilir; lifecycle, authority, organization-isolation veya privacy invariant'larını zayıflatmaz.

## Contract Ve Yetki Sınırı

- OpenAPI versioned organization, planning, checklist-template-version, reminder-rule ve audit-event projection'ları ile planning decision komutunu ekler.
- `Backend` tek capability-composed application contract olarak kalır. `MemoryMockStore`/`MockBackend` ve generated transport kullanan ince `HttpBackend` aynı reusable contract'ı karşılar.
- Go planning service exact row'u lock eder, actor'ı authenticated principal'dan türetir, role/stage/revision kontrolü uygular ve planning update, audit event, idempotency result ile outbox message'ı tek PostgreSQL transaction içinde kaydeder.
- Admin configuration ve audit projection'ları server tarafında authorize edilir. Browser route bir authorization control olarak kabul edilmez.
- Bütün canonical mock mutation'lar `Backend` arkasında kalır. Task 5 ikinci repository family eklemez ve mevcut field-only `FieldRepository` sınırını bypass etmez.
- Normal HTTP build artifact mock, seed, demo-public ve test-profile input'larından arınmış kalır.

## Taze Doğrulama

Aşağıdakiler exit code `0` ile tamamlandı:

- `./scripts/test-http-profile.sh`: direct API/worker build; migration v6 ve retained N-1 upgrade dahil full Go `-race` package ve live PostgreSQL/Keycloak/MinIO integration suite; OpenAPI 6/6; clean SQLC regeneration; TypeScript; React/Vitest 16 file ve 146/146 test; demo ve HTTP build; 12 file ve 89 input HTTP artifact scan; live HTTP Backend contract 11/11; mock Playwright 4/4; HTTP Playwright 5/5; container/network/volume cleanup
- Focused mock Backend contract: 11/11
- Focused router ve Backend testleri: 14/14
- Focused fake-fetch `HttpBackend` mapper testleri: 7/7
- Focused OpenAPI ve behavior-ledger assertion'ları: 8/8
- Yalnız first-production route matrix: mock 3/3 ve HTTP 3/3; 1440x900, 820x1180 ve 390x844

Her route-matrix viewport'u anlamlı role content, sıfır critical horizontal overflow ve sıfır unexpected browser console warning/error ile geçti. Tam HTTP scenario canonical lifecycle, offline-sync ve raw forbidden-field kontrollerini de korudu. Final static/process gate'leri Task 5 plan sonucunda kaydedilir.

## Korunan Ve Ertelenen Kapsam

Root `index.html`, `css/`, `js/` ve legacy testler değişmedi. AI, advanced risk/BI, broad regulatory editing, USOAP/SSP expansion, enforcement case management ve generic workflow surface'leri intact demo içinde `later` veya `demo-only` kalır. Bu checkpoint'te Task 13 `not run` durumundadır. Production provider seçimi, real production OIDC/MFA, MDM, secrets, monitoring/on-call, retention/legal hold, backup/restore ve disaster-recovery acceptance, deployment, traffic routing, cutover ve legacy removal ayrı onaylı release/operations plan arkasında `blocked` kalır.
