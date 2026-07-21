# IndexedDB Field Storage Ve Outbox Kanıtı — 2026-07-21

## Sonuç

- Kanıt durumu: `verified locally`
- Artifact durumu: `candidate-only`
- Release durumu: `release pending`
- Production deployment, traffic cutover, legacy removal, production MDM/local-data kontrolleri ve `production-ready` iddiası: `blocked`
- Task 8 OPFS Inspection Attachment byte'ları, Task 12 network sync/conflict delivery, Task 5 geniş route migration ve Task 13 final local release-candidate gate: `not run`

Task 7, Task 6'nın yalnız checkout snapshot'ı içeren IndexedDB temelini tam subject-scoped field working set ve typed causal outbox ile genişletir. Kök Vanilla JavaScript demo değişmeden behavioral reference olarak kalır. Bu task OPFS attachment byte'ı eklemez ve outbox operation'ını server'a göndermez.

## Test-First Kanıtı

Field testleri önce mevcut olmayan `db`, schema-migration, repository ve outbox modüllerine karşı çalıştırıldı. Red/green döngüsü şunları yakalayıp düzeltti:

- outbox row yazılmadan Dexie transaction'ın erken commit olmasına izin veren SHA-256 Promise'i;
- released v1-to-v2 migration içindeki aynı external-Promise riski;
- future-issued grant'i kabul etmeye çalışan hatalı recovery test saati;
- grant expiry sonrasında devam edebilen local write riski;
- tek immutable package question için ikinci active response identity; ve
- commit öncesi projection'ı ilk anda gözleyen React field-state testi.

Final implementation cryptographic işler için Dexie transaction tracking kullanır ve tanımlı her entity/outbox failure boundary'sini test eder.

## Doğrulanan Storage Ve Yetki Sınırı

- Schema v2; package, offline grant, checklist response, Potential Finding draft, attachment manifest, outbox operation ve sync cursor için subject-compound store'lar içerir. Task 6 foundation store güvenli migration/recovery için korunur.
- Checkout exact subject, organization, device, package ID/version/digest, assignment scope, positive N/N-1 package schema, protocol, issue time, grant expiry ve package expiry değerlerini doğrular.
- Repository mutation method'ları actor ID kabul etmez. Repository construction sırasında verilen session subject'e bir kez bağlanır; tüm primary key ve query'ler subject-scoped kalır. Mevcut canonical route fixed test subject kullanır; daha geniş authenticated role/session wiring hâlâ Task 5 kapsamındadır.
- Checklist response, Potential Finding draft veya checklist submission ile typed outbox operation ya atomik birlikte commit olur ya da ikisi de abort olur. Injected quota/termination failure önceki snapshot'ı değiştirmez.
- `NOT_CHECKED` gerçek answer olarak saklanır. Immutable allowed-answer, assignment ve comment-required kuralları local uygulanır; başka Inspector'a ait question disabled/read-only kalır.
- Unsent response edit önceki unsent row'u supersede eder. `IN_FLIGHT` request body ve digest değişmez; sonraki edit bu operation'a bağlı `BLOCKED_ON_DEPENDENCY` olarak saklanır.
- Potential Finding ve checklist-submit command'ları causal dependency'leri korur. Aynı operation replay idempotent'tir; farklı payload ile ID reuse fail closed olur.
- Pull change ve cursor atomik commit olur. Out-of-scope change transaction'ı başarısız kılar. Logout/user switch kayıt silmeden lock eder; expiry lock, revoke/corruption/incompatibility ise recovery verisini koruyarak quarantine eder.
- Submitted checklist local read-only'dir. UI reasoned reopen için yeniden bağlantı gerektiğini ve reopen'ın offline command olmadığını belirtir.
- `localStorage` business-record write, component'ten mock-store write veya logout deletion eklenmedi.

## Migration Ve Restart Recovery

- Her released schema kapsandı: released Task 6 v1 checkout snapshot tam v2 field schema'ya yükselir; legacy foundation record recovery için korunur.
- `before-expand`, `after-expand`, `after-copy` ve `before-contract` failure injection read-only recovery açar ve v1 verisini korur.
- Positive N/N-1 compatibility; zero, future ve N-1'den eski schema version'ları reddeder.
- Dedicated persistent-Chrome testi gerekli browser close/reopen işlemini yapar, origin server'ı durdurur, offline response commit eder, ilk operation'ı `IN_FLIGHT` yapar, causally blocked sonraki edit'i commit eder, Chrome'u kapatır ve server hâlâ kapalıyken aynı profile'ı yeniden açar.
- Restart edilen field ekranı son response'u ve exact `Saved locally — sync pending (2)` durumunu geri yükler. IndexedDB bir immutable in-flight operation, ona bağlı successor ve pending response'u korur.
- İki Task 6 browser testi de yeşil kalır: real server-stopped startup ve two-page N/N-1 app-shell update preservation.

## Taze Doğrulama

Aksi audit sonucu açıkça belirtilmedikçe aşağıdakiler exit code `0` ile tamamlandı:

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web test`: 14 file, 97/97 test
- focused FieldRepository suite: 20/20 test
- `npm --prefix apps/web run test:e2e:offline`: 3/3 real persistent-Chrome test
- `./scripts/test-http-profile.sh`: full Go race/live PostgreSQL, Keycloak ve MinIO integration; OpenAPI 5/5; SQLC clean generation; React 97/97; live HTTP Backend contract 9/9; mock Playwright 1/1; HTTP Playwright 1/1; iki build; 10 file ve 81 input HTTP artifact isolation; task-owned dependency cleanup
- `npm --prefix apps/web run check:app-shell`: demo ve HTTP artifact'ları ayrı ayrı 10 file ve 3 asset ile geçti
- Root Vanilla JavaScript smoke suite: 103/103
- `git diff --check`
- `npm --prefix apps/web audit --omit=dev --json`: production dependency vulnerability 0

Full development-dependency audit passing gate değildir; `verified locally` bir bulgudur: `@redocly/openapi-core` üzerinden `js-yaml` içinde iki high-severity transitive development-tool bulgusu raporlar. Remediation Task 7'de `not run` ve Task 13 security gate için takip edilir. Production dependency audit içinde bulunmaz ve Task 7 feature sonucunu değiştirmez.

Offline ve HTTP profile sonrasında browser-process ve local-container cleanup kontrol edildi. Task-owned Chrome, Playwright, Vite, API/worker process, container, network veya volume kalmadı.

Bu kanıt yalnız local Task 7 candidate'ı destekler. Task 8 manifest-first OPFS Inspection Attachment recovery sıradaki binding slice'tır. Production release ve cutover bu yetkinin dışındadır ve `blocked` kalır.
