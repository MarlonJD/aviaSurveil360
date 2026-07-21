# Kanonik Yetki Temeli Kanıtı — 2026-07-21

> İngilizce kanonik sürüm:
> [`CANONICAL_AUTHORITY_FOUNDATION_2026-07-21.md`](CANONICAL_AUTHORITY_FOUNDATION_2026-07-21.md).
> Bu dosya paydaş aktarımı içindir; çakışma olursa İngilizce sürüm esastır.

## Sonuç

- Kanıt durumu: `verified locally`
- Artefakt durumu: `candidate-only`
- Sürüm durumu: `release pending`
- Production OIDC/MFA, deployment, traffic cutover ve legacy removal: `blocked`
- Object upload/storage, malware scanning, real HTTP scenario parity, IndexedDB,
  OPFS, PWA offline behavior, sync push/pull ve production operations: `not run`

Task 10 server-side authority temelini uygular ve doğrular. Task 11
attachment/Evidence byte akışlarını, Task 12 sync'i, Task 13 release
verification'ını veya production behavior'ı tamamlanmış saymaz. Root Vanilla
JavaScript demo davranış referansı olarak korunur.

## Test-First Kanıtı

Domain state-machine, authorization, raw projection, idempotency, migration,
session, OIDC ve offline-grant testleri uygulamaları yokken yazıldı. Integration
profile daha sonra iki gerçek local-provider kusurunu yakaladı: seeded Keycloak
user tamamlanmış bir profile ihtiyaç duyuyordu ve desteklenmeyen
`offline_access` isteği authorization code'u tüketiyordu. Realm fixture ve
istenen scope'lar düzeltildi; tam profil başarıyla yeniden çalıştırıldı.
Final review ayrıca sabit browser-cookie expiry'nin aktif rolling-idle session'ı
erken sonlandıracağını buldu. Regression test önce başarısız oldu;
browser-session cookie artık idle ve absolute expiry'yi server authority altında
bırakır ve targeted test full rerun öncesinde geçti.

## Doğrulanan Yetki Temeli

- Domain kuralları `identity`, `organizations`, `planning`, `inspections`,
  `checklists`, `potentialfindings`, `findings`, `caps`, `evidence`, `reports`,
  `sync` ve `auditlog` modüllerine ayrıldı; checked, module-owned PostgreSQL
  store'ları bulunur.
- Inspector yalnız Audit/question/response-scoped Potential Finding
  oluşturabilir. Lead authority, reason-required return/dismiss,
  severity-selected conversion ve atomic canonical Finding/public-number
  oluşturma uygulanır.
- CAP submission ile CAA review ayrı exact-revision komutlarıdır. CAP kabulü
  Finding'i açık bırakır; rejected ve more-information CAP'ler, önceki
  revision'lar korunarak yeniden sunulabilir.
- Evidence review exact, scan-clean, immutable Evidence version'a bağlanır.
  Evidence-verified closure, partial/not-close/request-more-information sonucu
  ve reason-required Department Manager authorized closure birbirinden ayrıdır.
- Submitted checklist yalnız permitted, stage-valid ve reason-required online
  reopen ile açılır. Checklist template/inspection package snapshot'ları, CAP
  revision'ları, Evidence version'ları, review decision'ları ve report
  version'ları overwrite girişimini reddeder.
- Report decision exact version'a bağlanır; Department Manager ve General
  Manager yalnız return/forward yapabilir. Executive Director issue işlemi
  report'u kilitler ve Finding'i kapatmaz.
- Her başarılı status transition aynı transaction'da mutation,
  server-computed semantic idempotency hash ve full response, tam bir domain
  audit event, authorized sync change ve outbox message kaydeder. Lost
  acknowledgement aynı response'u replay eder; changed-payload operation-ID
  reuse ikinci mutation veya transition event üretmeden başarısız olur.
- Audit row'ları database-enforced append-only'dir ve actor, organization,
  entity/version, before/after state, reason, server time,
  operation/correlation ID ve uygun olduğunda closure basis kaydeder.
  Tamper-evidence iddiası yoktur.
- Auditee list/direct-object erişimi organization-scoped'dur. Closed raw JSON
  projection'ları Findings, CAPs, Evidence, released reports, assignments,
  dashboard, sync changes ve safe conflicts alanlarını kapsar; Internal CAA
  Note, başka organization, private workload/risk, unreleased report veya
  enforcement deliberation içermez.
- Same-origin BFF; OIDC Authorization Code + PKCE, one-time state ve nonce
  doğrulamasını tamamlar. Provider token'ları AES-GCM altında server-side kalır;
  opaque browser ve CSRF token'ları yalnız hash olarak tutulur. Browser session;
  Secure, HttpOnly, SameSite cookie, mutation CSRF kontrolü, 30-minute rolling
  idle expiry, eight-hour absolute expiry ve explicit revoke uygular.
- Pinned local Keycloak profile; issuer, signature, audience, nonce,
  organization ve canonical role kontrolleriyle gerçek Authorization Code +
  PKCE exchange'i tamamlar. Bu local-provider kanıtıdır; production OIDC/MFA
  kanıtı değildir.
- Server-issued offline grant; subject ve organization'ı active session'dan
  türetir, device/package version/digest/assignment revision/question/allowed
  command scope'unu bağlar. Expiry/skew, reassignment, package withdrawal, user
  switch, logout/session revoke, device-loss revoke ve late authorization kapalı
  başarısız olur.
- Forward migration `000003_authority_foundation` ve retained N-1 fixture canlı
  PostgreSQL üzerinde geçer; on iki module store çıktısı drift olmadan yeniden
  üretilir.

## Taze Doğrulama

Ana komut:

```bash
./scripts/test-http-profile.sh
```

Komut `0` exit code ile tamamlandı ve şunları kanıtladı:

- API ve worker build: geçti
- Domain ve live PostgreSQL integration dahil full Go race suite: geçti
- Empty install ve retained N-1 migration upgrade: geçti
- Pinned local Keycloak Authorization Code + PKCE integration: geçti
- OpenAPI example ve TypeScript/Go generation drift: geçti
- Tüm module-owned SQLC generation drift: geçti
- Task-owned Keycloak/PostgreSQL container, volume ve network cleanup: geçti

Ek taze gate'ler:

- `go vet ./...`: geçti
- React/Vitest: 32/32 geçti
- Root Vanilla JavaScript smoke suite: 103/103 geçti
- React demo build: geçti
- React HTTP build: geçti
- `git diff --check`: geçti

Bu kanıt yalnız local Task 10 authority candidate'ını destekler. Sonraki
binding slice Task 11'dir. `production-ready` iddiası ayrı release/operations
gate nedeniyle `blocked` kalır.
