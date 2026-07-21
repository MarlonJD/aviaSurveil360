# Idempotent Foreground Sync Kanıtı — 2026-07-21

## Sonuç

- Kanıt durumu: `verified locally`
- Artifact durumu: `candidate-only`
- Release durumu: `release pending`
- Task 5 geniş `first-production` route migration ve Task 13 local release-candidate paketi: `not run`
- Production deployment, traffic cutover, legacy removal, production MDM/security operations, owner-approved local attachment disposition ve `production-ready` iddiası: `blocked`

Task 12 field-only React working set'i typed one-operation push/pull sync ile gerçek Go HTTP profile'a bağlar. Kök Vanilla JavaScript demo behavioral reference olarak bozulmadan korunur. Bu task automatic conflict merge, yalnız background'a bağlı delivery, destructive local-byte cleanup, production deployment veya production-readiness iddiası eklemez.

## Test-First Kanıtı

İlk focused koşular server operation service, client foreground engine, reconciliation method'ları ve HTTP offline-sync senaryosu bulunmadığı için başarısız oldu. Sonraki red/green döngüleri şunları yakalayıp düzeltti:

- causal dependant'ları superseded operation'a bağlı kalan sonraki never-sent response edit'i ve explicit conflict re-entry;
- browser bağlantısı kesildikten sonra denenip dedicated hash-worker modülünü artık fetch edemeyen attachment staging;
- deliberate lost-ack route abort'un beklenen transport failure yerine unexpected browser console error sayılması; ve
- test-profile wrapper kapandıktan sonra child API binary bırakan `go run` yaşam döngüsü.

Final testler duplicate delivery, değişmiş client timestamp ile same-ID/same-semantic replay, different-payload ID reuse, lost acknowledgement, stale revision, repeated edit, prior operation in-flight iken edit, causal Potential Finding ve attachment delivery, actor/device/time trust boundary'leri, expired/revoked grant, changed assignment, withdrawn package, invalid domain input, cursor replay/scope/restart/history expiry, tombstone, package revocation, forbidden-field scan, attachment retry, two-tab contention ve Background Sync registration bulunmamasını kapsar.

## Doğrulanan Server Sınırı

- Endpoint tek bir closed-union `FieldSyncOperation` decode eder, unknown field'ları reddeder ve subject, organization, role ile session bilgisini client payload yerine authenticated principal'dan türetir.
- Current offline grant, session, device, package ID/version/digest, assignment revision, question scope ve allowed command type mutation'dan önce kontrol edilir. Expired/revoked grant terminal typed error; changed assignment ve withdrawn package authorized typed conflict döndürür.
- Semantic idempotency hash `clientOccurredAt` alanını dışarıda bırakır. Aynı operation ID ve semantic payload exact stored acknowledgement'ı replay eder; aynı ID'nin farklı semantic payload ile kullanılması fail olur.
- Her accepted command domain mutation, full idempotency response, audit event, authorized sync change ve server outbox message'ı tek PostgreSQL transaction içinde yazar. Retryable infrastructure failure applied command olarak kaydedilmez.
- Checklist response expected revision kullanır. Potential Finding creation acknowledged response revision'ı doğrular. Attachment registration authoritative Potential Finding'i causal operation ID üzerinden çözer. Checklist submission server-shaped kalır ve assigned field work gerektirir.
- Pull cursor'ları subject, organization, package, grant, device, projection version ve high-water mark'a scoped opaque database token'lardır. Yalnız closed authorized projection, tombstone ve revocation döner; Internal CAA field'ları yapısal olarak bulunmaz. Cursor scope mismatch fail olur, cursor replay stabildir, yeni service instance PostgreSQL state'ten devam eder ve expired history unsafe row döndürmeden `resnapshotRequired` verir.

## Doğrulanan Client Reconciliation

- `FieldRepository` tek field mutation boundary olarak kalır. React component'leri IndexedDB, OPFS, mock seed state veya HTTP endpoint'lere doğrudan yazmaz.
- Never-sent response draft'ları coalesce edilebilir. In-flight payload freeze edilir; sonraki edit distinct operation olur ve authoritative revision'ı bekler. Acknowledgement, sonraki local draft'ı overwrite etmeden authoritative identity/revision'ı günceller.
- Potential Finding creation response acknowledgement'ını bekler. Attachment registration response ve Potential Finding operation'larını bekler, ardından bounded `beginUpload -> PUT -> completeUpload` delivery öncesi authoritative ID'leri kaydeder.
- Expired upload URL ve transport failure retryable state'e döner. Local attachment byte'ları acknowledgement veya retry sonrasında korunur; hiçbir sync/recovery path bunları otomatik silmez.
- Tek foreground package owner Web Locks ile seçilir; BroadcastChannel diğer tab'lere status yayınlar. Server idempotency duplicate safeguard olarak kalır.
- Startup, foreground visibility, `online`, manual Sync now ve app-open/page-show trigger'ları aynı engine'i çalıştırır. Service Worker Background Sync registration yapılmaz ve başarı için gerekli değildir.
- Yalnız retryable transport/infrastructure result otomatik release edilir. `conflict`, `forbidden` ve `invalid` result explicit user action'a kadar terminal kalır. UI local draft'ı korur, authorized conflict summary gösterir ve authoritative revision'a karşı re-entry ister. `resnapshotRequired`, pending operation veya attachment manifest'i overwrite etmeden edit'i kilitler.

## Gerçek HTTP Senaryosu

HTTP Playwright senaryosu canonical Cabin package'ı checkout eder, Non-Compliant response kaydeder, local Potential Finding oluşturur, PDF stage eder ve daha sonra offline edit yapar. İlk sync operation API'de deliberate olarak commit edilir ve response lost acknowledgement üretmek için abort edilir. Manual foreground retry stored acknowledgement'ı replay eder, authoritative `PF-2026-001` kaydını causal olarak oluşturur, attachment'ı register/upload eder, local byte'ları korur ve pending work'ü boşaltır. Sonraki offline Observation edit'i `online` foreground trigger ile delivery edilir ve authoritative revision 2'ye ulaşır.

Deliberate route abort'tan gelen beklenen browser `net::ERR_FAILED` kaydı açıkça assert edilir. Bunun dışındaki warning/error console kayıtları boş kalır.

## Taze Doğrulama

Aşağıdakiler exit code `0` ile tamamlandı:

- `./scripts/test-http-profile.sh`: direct temporary API/worker binary'leri; full Go `-race` package ve live PostgreSQL/Keycloak/MinIO integration suite; OpenAPI 5/5; SQLC clean generation; TypeScript; React/Vitest 16 file ve 143/143 test; demo ve HTTP build; 12 file ve 86 input HTTP artifact scan; live HTTP Backend contract 9/9; mock Playwright 1/1; HTTP Playwright 2/2; container/network/volume cleanup
- Focused sync, field-repository ve attachment suite'leri: 66/66 test
- `go vet ./...`
- Kök Vanilla JavaScript smoke suite: 103/103
- `git diff --check`
- Post-run kontrolleri: Task-owned container, API/worker listener, Playwright veya test Chrome process kalmadı

HTTP artifact mock, seed ve test-profile input'larından arınmış kalır. Deterministic scanner, local Keycloak, PostgreSQL ve MinIO-compatible object store yalnız test infrastructure'dır.

## Kalan Sınır

Task 5 route migration ve Task 13 final release-candidate paketi `not run` durumundadır. Bilinen development-tool transitive audit bulgusu Task 13 için `note-open` kalır. Production identity/MDM, secrets, hosted provider ve region, monitoring/on-call, backup/restore/DR acceptance, retention/legal hold, owner-approved attachment cache disposition, deployment, traffic cutover ve legacy removal ayrı onaylı release/operations plan arkasında `blocked` kalır. Bu kanıt yalnız locally verified `candidate-only` Task 12 sonucunu destekler.
