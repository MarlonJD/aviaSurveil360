# Sınırlandırılmış Yükleme Ve HTTP Parity Kanıtı — 2026-07-21

> İngilizce kanonik sürüm:
> [`BOUNDED_UPLOAD_AND_HTTP_PARITY_2026-07-21.md`](BOUNDED_UPLOAD_AND_HTTP_PARITY_2026-07-21.md).
> Bu dosya paydaş aktarımı içindir; çakışma olursa İngilizce sürüm esastır.

## Sonuç

- Kanıt durumu: `verified locally`
- Artefakt durumu: `candidate-only`
- Sürüm durumu: `release pending`
- Production object storage, malware scanning, OIDC/MFA, deployment, traffic
  cutover, legacy removal ve `production-ready` iddiası: `blocked`
- Browser offline foundation (Task 6-8), production sync (Task 12), daha geniş
  role-entry migration (Task 5), final release-candidate packet (Task 13) ve
  production operations: `not run`

Task 11; sınırlandırılmış attachment/Evidence byte akışını, deterministik yerel
scan'i ve ilk gerçek HTTP canonical scenario'yu uygular ve doğrular. Pinned local
PostgreSQL, Keycloak ve S3-compatible object storage kullanır. Deterministik scan
adapter ile local object-storage profile test altyapısıdır; production malware
scanner veya production records repository değildir. Root Vanilla JavaScript
demo davranış referansı olarak korunur.

## Test-First Kanıtı

Upload, storage, worker, HTTP contract ve shared browser testleri davranış yokken
yazıldı. Red/green döngüsü şunları yakalayıp düzeltti:

- `0` veya `x` içeren geçerli dosya adlarını yanlış reddeden filename kontrolü;
- test-only HTTP entry'nin normal HTTP build'e yanlışlıkla girmesi;
- Finding next action ve scan sonrası review state için mock/server farkları;
- public HTTP error içinde internal sentinel prefix görünmesi;
- beklenen validation denial'ın browser console gürültüsü üretmesi;
- worker terminal failure/timeout yollarının görünür ve non-reviewable olmaması;
- upload expiry/retry ile clean/failed Inspection Attachment ayrımı için eksik
  explicit regression kapsamı; ve
- sınırlı local diski doldurabilen Go build temporary/cache davranışı. Profil
  artık task-owned `GOTMPDIR` kullanır, content-addressed cache girdilerini hard
  link ile yeniden kullanır, `-count=1` ile testleri taze yürütür ve yalnız
  task-owned link/geçici çıktıları kaldırır.

## Doğrulanan Upload Ve Worker Sınırları

- Authorized upload session kısa ömürlü, idempotent, 25 MB ile sınırlı ve yalnız
  PDF/JPEG/PNG içindir; unique, non-overwriting quarantine key üretir.
- Completion; server-observed object size ve SHA-256 digest'i, declared
  extension/media type'ı ve server-side MIME sniff sonucunu doğrular.
- Expired incomplete session non-reviewable kalır. Retry fresh key alır ve önceki
  staged object'i overwrite edemez.
- Official Auditee submission; upload, scan ve review state'leri ayrı yeni bir
  immutable Evidence version oluşturur. Önceki version'lar korunur.
- Inspection Attachment Audit/question/response/package/grant scope'unda kalır.
  Clean veya failed attachment otomatik olarak official Evidence version olmaz.
- Object'ler private'dır. Download instruction ve Evidence review yalnız exact
  scan-clean version için verilir; pending, quarantined, failed veya superseded
  version review ya da closure destekleyemez.
- Worker outbox işini lease ve idempotency key ile claim eder. Clean scan exact
  object/version'ı promote eder ve review state'i `PENDING_CAA_REVIEW` yapar.
  Quarantine, scanner failure ve scanner timeout non-reviewable kalır ve
  deterministik operator-visible state üretir.
- Copy sonrası fakat acknowledgement öncesi crash recovery, Evidence version'ı
  duplicate etmez veya object'i overwrite etmez.
- Scan state, Finding transition, audit event, authorized change, object
  metadata ve terminal outbox state tutarlı biçimde kaydedilir.
- Notification delivery, production PDF generation, retention deletion, legal
  disposition, production scanner/provider policy ve production hosting
  uygulanmamış ve iddia edilmemiştir.

## Doğrulanan Gerçek HTTP Parity

- Go API ve worker canonical Cabin Inspection scenario'yu capability-composed
  HTTP Backend contract üzerinden sunar.
- React HTTP build seçili Evidence byte'larını signed PUT ile yükler, server
  record'ı tamamlar, deterministik worker'ı bekler ve yalnız clean immutable
  version'ı review eder.
- Aynı Playwright scenario hem `mock` hem `http` profile altında geçer; Potential
  Finding authority, CAP submission/review separation, organization isolation,
  Internal CAA Note separation, Evidence versioning, closure, report, dashboard
  ve denial invariant'larını kapsar.
- Production-shaped HTTP artifact scan, 7 dosya ve 71 build input üzerinde
  geçti. Mock/seed implementation, local test token/header veya test-profile
  source içermez.

## Taze Doğrulama

Ana komut:

```bash
./scripts/test-http-profile.sh
```

Komut `0` exit code ile tamamlandı ve şunları kanıtladı:

- API ve worker production-command build: geçti
- Full fresh Go race suite ve live integration testleri: geçti
- PostgreSQL migration, pinned local Keycloak OIDC+PKCE ve private local object
  storage integration: geçti
- Evidence expiry/retry, hash/type/size enforcement, immutable version,
  scanner clean/quarantine/failure/timeout ve crash recovery: geçti
- Inspection Attachment scope ve official-Evidence separation: geçti
- OpenAPI example ve TypeScript/Go clean generation: 5/5 geçti
- Tüm module-owned SQLC clean generation: geçti
- React/Vitest: 32/32 geçti
- Demo ve HTTP build: geçti
- HTTP artifact isolation: geçti (7 dosya, 71 input)
- Live `HttpBackend` contract: 9/9 geçti
- Shared Playwright scenario: mock 1/1 ve HTTP 1/1 geçti
- Task-owned API/worker/browser process, container, network, volume, cache link ve
  temporary directory cleanup: geçti

Ek taze gate'ler:

- `go vet ./...`: geçti
- Root Vanilla JavaScript smoke suite: 103/103 geçti
- `git diff --check`: geçti

Bu kanıt yalnız local Task 11 candidate'ını destekler. Sonraki binding slice
Task 6 browser offline foundation'dır. Production release ve cutover bu yetkinin
dışında ve `blocked` kalır.
