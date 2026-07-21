# OPFS Inspection Attachment Recovery Kanıtı — 2026-07-21

## Sonuç

- Kanıt durumu: `verified locally`
- Artifact durumu: `candidate-only`
- Release durumu: `release pending`
- Production deployment, traffic cutover, legacy removal, production MDM/local-data kontrolleri, owner-approved cache disposition ve `production-ready` iddiası: `blocked`
- Task 12 network sync/conflict delivery, Task 5 geniş route migration ve Task 13 final local release-candidate gate: `not run`

Task 8 field `InspectionAttachment` byte'ları için manifest-first OPFS staging ve startup recovery ekler. Kök Vanilla JavaScript demo behavioral reference olarak korunur. Bu task official Auditee `EvidenceVersion` oluşturmaz veya overwrite etmez; attachment registration ya da byte'ları network üzerinden göndermez. Bu sync yolu Task 12 kapsamındadır.

## Test-First Kanıtı

İlk focused run attachment store, hash worker ve recovery modülleri olmadığı için başarısız oldu. Sonraki red/green döngüleri şunları yakalayıp düzeltti:

- causal checklist-response dependency'sini atlamaya çalışan upload testleri;
- verified temporary byte'ları final OPFS path'e geri taşınmayan already-ready manifest; ve
- implement edilmiş ancak React field startup/load yolundan henüz çağrılmayan recovery modülü.

Final suite; manifest creation, source hash, temporary-path creation, her chunk write, flush, stored-byte hash, final promotion, atomic metadata/outbox readiness, upload start ve acknowledgement öncesi/sonrasında termination inject eder.

## Doğrulanan Staging Ve Recovery Sınırı

- Subject-scoped IndexedDB manifest herhangi bir OPFS path oluşturulmadan önce `manifest_created` durumunda commit edilir. Source byte'lar dedicated module Worker içinde hash edilir; bounded chunk'larla temporary path'e yazılır, flush edilir, yeniden okunur, size/hash doğrulanır, promote edilir ve tek typed `REGISTER_INSPECTION_ATTACHMENT` outbox operation ile atomik `ready` commit yapılır.
- Local lifecycle `manifest_created -> writing -> ready -> uploading -> acknowledged` şeklindedir. Modelde `purge_eligible` bulunur ancak owner-approved cache/disposition policy olmadığı için bu duruma geçilemez. Explicit purge disabled kalır.
- PDF, JPEG ve PNG için 25 MB sınırı uygulanır. Empty/oversized file, unsafe filename, duplicate active filename, hash/size mismatch, yanlış assignment, yanlış package/response/Potential Finding scope ve grant command authority eksikliği fail closed olur.
- Registration exact checklist response ve varsa Potential Finding creation operation'a causal dependency taşır. Registration dependency-blocked durumdayken upload başlayamaz. Metadata/outbox, upload/in-flight ve acknowledgement transition'ları atomik commit olur.
- React field mode byte'ları yalnız `InspectionAttachmentStore`/`FieldRepository` üzerinden stage eder, filename ve staging state'i listeler ve görünür `Saved locally — sync pending` durumunu korur. Hiçbir component IndexedDB, OPFS, mock seed state veya remote API'ye doğrudan yazmaz.
- Startup/load reconciliation subject OPFS path'leri ile manifest'leri karşılaştırır. Missing referenced byte görünür blocking recovery error olur ve field edit disabled edilir. Verified temporary byte promote edilir; incomplete, mismatched veya unknown byte quarantine metadata alır ve yerinde korunur.
- Recovery path'lerinin hiçbiri referenced, pending, unknown veya quarantined byte'ı otomatik silmez. Acknowledged local byte da korunur. Explicit browser site-data clearing, unsynced sole copy için irrecoverable boundary olarak literal biçimde belirtilir.
- Official Auditee Evidence ayrı ve immutable kalır. Task 8 Evidence mutation, review, closure, retention veya deletion behavior eklemez.

## Restart Kanıtı

Dedicated persistent-Chrome testi owner-policy-attested checkout kullanır, storage canary için browser'ı restart eder, checklist'i yükler ve origin server'ı durdurur. Checklist response kaydedilir ve PDF offline durumda stage edilir. Aynı profile ile Chrome kapatılıp origin hâlâ durmuşken yeniden açıldığında:

- checklist shell ve worker asset app-shell cache'den yüklenir;
- attachment IndexedDB içinde `ready` kalır;
- exact OPFS byte, byte count ve SHA-256 eşleşir;
- registration outbox response operation'a bağlı `BLOCKED_ON_DEPENDENCY` kalır; ve
- hiçbir local byte silinmez.

Mevcut server-stopped startup, two-client N/N-1 update ve pending/in-flight field restart testleri de yeşil kalır.

## Taze Doğrulama

Aşağıdakiler exit code `0` ile tamamlandı:

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web test`: 15 file, 132/132 test
- focused attachment staging/recovery suite: 35/35 test
- `npm --prefix apps/web run test:e2e:offline`: 4/4 real persistent-Chrome test
- `./scripts/test-http-profile.sh`: full Go race/live PostgreSQL, Keycloak ve MinIO integration; OpenAPI 5/5; SQLC clean generation; React 132/132; live HTTP Backend contract 9/9; mock Playwright 1/1; HTTP Playwright 1/1; iki build; 12 file ve 84 input HTTP artifact isolation; task-owned dependency cleanup
- `npm --prefix apps/web run check:app-shell`: hash worker dahil demo ve HTTP artifact'ları ayrı ayrı 12 file ve 4 asset ile geçti
- Root Vanilla JavaScript smoke suite: 103/103
- `git diff --check`
- `npm --prefix apps/web audit --omit=dev`: production dependency vulnerability 0

Mevcut full development-dependency audit bulgusu `note-open` kalır: `@redocly/openapi-core` üzerinden `js-yaml` içinde iki high-severity transitive development-tool bulgusu. Remediation Task 8'de `not run` ve Task 13 security gate'e atanmış durumdadır.

Task-owned HTTP container, network ve volume'ler profile tarafından kaldırıldı. Browser/process cleanup commit öncesinde ayrıca kontrol edildi. Bu kanıt yalnız local Task 8 candidate'ı destekler. Task 12 typed network sync sıradaki binding slice'tır; production release ve cutover `blocked` kalır.
