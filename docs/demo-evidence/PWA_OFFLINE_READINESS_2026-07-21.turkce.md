# PWA App Shell Ve Offline Readiness Kanıtı — 2026-07-21

> İngilizce kanonik sürüm:
> [`PWA_OFFLINE_READINESS_2026-07-21.md`](PWA_OFFLINE_READINESS_2026-07-21.md).
> Bu dosya paydaş aktarımı içindir; çakışma olursa İngilizce sürüm esastır.

## Sonuç

- Kanıt durumu: `verified locally`
- Artefakt durumu: `candidate-only`
- Sürüm durumu: `release pending`
- Production managed-device policy, MDM kanıtı, app-level local encryption,
  deployment, traffic cutover, legacy removal ve `production-ready` iddiası:
  `blocked`
- Atomic field persistence/outbox (Task 7): daha sonra `verified locally`
- Staged OPFS Inspection Attachment (Task 8), production sync (Task 12), daha
  geniş role-entry migration (Task 5) ve final release-candidate packet
  (Task 13): `not run`

Task 6, React candidate için browser PWA app-shell ve explicit managed-profile
offline-readiness temelini uygular. Kendi checkpoint'inde `FieldRepository`,
offline checklist edit, outbox, staged attachment byte veya sync eklememiştir.
Task 7 daha sonra ilk üçünü ekleyip doğruladı; staged byte ve network sync hâlâ
Task 8 ile Task 12 kapsamındadır. Root Vanilla JavaScript demo davranış
referansı olarak korunur.

## Test-First Kanıtı

Readiness, update-policy, Service Worker request-policy, UI ve browser testleri
davranış yokken yazıldı. Red/green döngüsü şunları yakalayıp düzeltti:

- eksik readiness gate, app-shell worker, update coordinator ve offline startup;
- preflight'ta geçen fakat silindiği için aynı user action içindeki grant sonrası
  kontrolde tekrar `ephemeral` olan restart canary;
- worker byte'ını değiştirip minified cache version'ı değiştirmeyen ve bu nedenle
  N cache'i üretmeyen update test server;
- N `1` iken geçersiz `0` version'ını N-1 sayan sınır; ve
- authoritative server outstanding checkout bildirmeden `local package missing`
  sonucunu kesin hüküm gibi gösteren UI metni.

Final restart canary, önceki boot persistence'ı kanıtladıktan sonra aynı browser
boot içinde idempotenttir. Worker, emitted app-shell manifest ile karşılaştırılan
explicit build-version marker içerir.

## Doğrulanan Readiness Sınırı

- On üç result code'un tümü kapsanır: `ready`, `unsupported-browser`,
  `managed-policy-unapproved`, `ephemeral-or-unmanaged-storage`,
  `service-worker-unavailable`, `indexeddb-health-failed`,
  `opfs-health-failed`, `persistence-denied`, `quota-insufficient`,
  `offline-grant-invalid`, `app-version-incompatible`,
  `schema-version-incompatible` ve `protocol-version-incompatible`.
- Official checkout; secure context, current Chrome, explicit owner-policy ve
  encrypted-profile attestation, ready Service Worker, ayrı IndexedDB ve OPFS
  write/read/hash/delete canary, persistent storage, advisory capacity ve
  conservative headroom, browser restart survival, positive N/N-1 version ve
  exact server-issued grant gerektirir.
- `navigator.storage.persist()` yalnız explicit user action içinden istenir.
  Denial offline checkout'ı engeller, online use'u engellemez.
- Capacity açıkça advisory'dir. UI disk reservation veya private-browsing
  detection iddiası yapmaz.
- Grant validation subject, organization, device instance, package ID,
  package version/digest, assignment scope, expiry ve protocol version'ı bağlar.
- Mevcut single-scenario screen canonical Inspector `USR-INSPECTOR-AMINA`
  scope'undadır; farklı scope'taki grant fail-closed olur. Daha geniş
  authenticated role-entry/session-subject wiring hâlâ Task 5 kapsamındadır.
- Task 6 checkpoint'inde foundation IndexedDB yalnız device identity, restart
  canary ve exact-subject immutable checkout snapshot saklıyordu. Task 7 daha
  sonra bunu subject-scoped v2 field schema ve causal outbox'a yükseltti; bkz.
  [Task 7 kanıtı](INDEXEDDB_FIELD_STORAGE_2026-07-21.turkce.md).
- OPFS etkileşimi yalnız health canary'dir. Staged Inspection Attachment byte ve
  recovery hâlâ Task 8 kapsamındadır.
- UI explicit site-data loss sınırını söyler. Authoritative outstanding-checkout
  raporu olmadan paketin kayıp olduğunu iddia etmez.

## Doğrulanan App-Shell Ve Update Sınırı

- Üretilen demo ve HTTP artefaktları matching positive app-shell version, asset
  manifest ve module Service Worker içerir.
- Cache Storage yalnız navigation shell, versioned static asset ve allowlisted
  public build configuration içindir. API, auth, health, test, report, başka
  business-record, mutation ve cross-origin request network-only kalır.
- Authenticated API response için generic stale-while-revalidate yoktur.
- Worker otomatik `skipWaiting`, client claim veya old-cache deletion yapmaz.
- App-shell, IndexedDB schema, package schema ve sync protocol version'ları
  positive N/N-1 policy ile bağımsız değerlendirilir.
- Pending outbox/package/attachment work activation'ı erteler. Tek browser lock
  update decision'ını serialize eder; broadcast channel tab'ler arasında taşır.
- Her migration boundary failure sonrası read-only recovery açar; migration
  sırasında edit durur. N-1 shell rollback database/package/protocol downgrade
  yapamaz.
- Gerçek iki-page Chrome testi, N-1 active kalırken waiting N worker kurar; iki
  shell cache'in, IndexedDB pending-work sentinel'ın ve OPFS byte'larının
  korunduğunu kanıtlar. Sentinel'lar preservation policy kanıtıdır; Task 7/8
  implementation'ı değildir.

## Gerçek Offline Startup Kanıtı

Offline test dedicated temporary Chrome profile ve localhost secure context
kullandı. Candidate online ziyaret edildi, explicit readiness flow tamamlandı,
ordinary page reload'un hâlâ `blocked` kaldığı kanıtlandı, Chrome kapatılıp aynı
profile ile açıldı, package checkout yapıldı, Chrome tekrar kapatıldı ve origin
server durduruldu. Fresh Chrome process daha sonra Audit
shell'i ve `PKG-CAB-2026-001` snapshot'ını local app-shell/IndexedDB state'ten
açarken direct `/v1/` network probe başarısız oldu. Bu, yalnız DevTools
page-offline emulation'dan daha güçlü kanıttır.

Update-recovery testi iki page, gerçek waiting Service Worker, N/N-1 cache,
IndexedDB/OPFS sentinel ve explicit Chrome site-data clearing kullandı. Clearing
sonrası local snapshot yoktu ve irreversible local-data warning görünürdü.

## Taze Doğrulama

Aşağıdakiler `0` exit code ile tamamlandı:

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web test`: 12 file, 76/76 test
- `npm --prefix apps/web run build:demo`
- `npm --prefix apps/web run build:http`
- `npm --prefix apps/web run check:app-shell`: demo ve HTTP artefaktları geçti
- `node apps/web/scripts/assert-http-artifact.mjs apps/web/dist/http`: 10 file,
  75 input; mock/seed veya local test-profile path yok
- `npm --prefix apps/web run test:e2e:offline`: 2/2 real-browser test
- `npm --prefix apps/web run test:e2e:mock`: 1/1 canonical scenario
- `./scripts/test-http-profile.sh`: full Go race/live integration suite,
  OpenAPI 5/5, SQLC clean generation, React 76/76, live HTTP contract 9/9,
  mock Playwright 1/1, HTTP Playwright 1/1, iki build, artifact isolation ve
  task-owned dependency cleanup
- `go vet ./...` (`apps/api` içinden)
- Root Vanilla JavaScript smoke suite: 103/103
- `git diff --check`

Browser-process ve local-container cleanup, browser ve HTTP profile sonrasında
kontrol edildi. Task-owned Chrome, Playwright, Vite, API/worker process,
container, network veya volume kalmadı.

Bu kanıt yalnız local Task 6 candidate'ını destekler. Task 7 daha sonra
`verified locally` oldu; sıradaki binding slice Task 8 manifest-first OPFS
Inspection Attachment recovery'dir. Production release ve cutover bu yetkinin
dışında ve `blocked` kalır.
