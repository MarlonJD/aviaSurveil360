# Local Release-Candidate Kanıtı — 2026-07-21

> İngilizce kanonik sürüm: [`LOCAL_RELEASE_CANDIDATE_2026-07-21.md`](LOCAL_RELEASE_CANDIDATE_2026-07-21.md).

## Sonuç

- Local release-candidate önerisi: `GO`
- Kanıt durumu: `verified locally`
- Artifact durumu: `candidate-only`
- Release durumu: `release pending`
- Production deployment ve cutover kararı: `NO-GO` ve `blocked`
- Production hosting, production OIDC/MFA, traffic routing, legacy removal ve `production-ready` iddiası: `blocked`

Task 13, Tasks 5-13 için yetkilendirilen local verification paketini tamamlar. React/Vite mock ve HTTP entry'leri, tek modüllü Go API/worker, PostgreSQL authority yolu, local Keycloak exchange, private MinIO-compatible object flow, deterministik scanner, yalnız field kapsamındaki browser persistence, foreground sync ve approved route family'leri gerekli local gate'leri geçer. Root Vanilla JavaScript demo, removal-blocking behavioral reference olarak bozulmadan kalır.

Bu karar deployment, production traffic, cutover veya legacy archival/removal yetkisi vermez. Ayrı onaylı production release/operations plan bu yetkili dilimde yoktur; bu nedenle local candidate `GO` alsa da production `blocked` kalır.

## Test-First Düzeltmeler

- İlk API security testi, security header ve rate-limit middleware bulunmadığı için compile olmadı. Final middleware API'ye uygun CSP/defensive header, login ve mutation request-class limitleri, yalnız socket peer kullanımı ve `Retry-After` içeren kapalı `429` problem response uygular.
- İlk worker observability testi, test edilebilir batch reporting boundary bulunmadığı için compile olmadı. Worker artık structured completed/failed batch record üretir; live profile scan işinin terminal outbox row bırakmadan boşaldığını kanıtlar.
- Recovery komutu önce `scripts/test-local-recovery.sh` bulunmadığı için başarısız oldu. Final local-only drill izole PostgreSQL backup'ını ve exact MinIO object byte'larını restore eder, fingerprint/hash/metadata doğrular ve yalnız dedicated resource'larını temizler.
- CSP testi ilk olarak build-policy module bulunmadığı için düştü. Sonraki red koşular TypeScript inclusion, Vite development style ve keyboard focus-outline kusurlarını yakaladı. Final demo/HTTP artifact'leri explicit production CSP kullanır; local Vite izinleri development-only kalır.
- İlk live conflict browser koşusu restart-canary readiness gate'inde durdu. Ortak real-IndexedDB test precondition'ı sonrası typed conflict presentation, local-draft preservation, explicit re-entry ve authoritative revision ilerlemesi geçti.
- İlk tam offline koşu geniş dosya pattern'i nedeniyle iki HTTP-only testi de seçti. Offline proje bu HTTP dosyasını skip üretmeden açıkça dışlar; amaçlanan real-offline matrix 6/6 geçer.
- İlk full dependency audit, `@redocly/openapi-core` üzerinden `js-yaml` içinde iki high-severity development-tool bulgusu raporladı. Dar ve lock-compatible `js-yaml` 4.3.0 override'ı sonrası clean install, contract generation, full audit ve production-only audit sıfır vulnerability ile geçti.

## Taze Verification Matrix

2026-07-21 tarihinde aşağıdaki başarılı sonuçların tamamı exit code `0` ile tamamlandı:

| Gate | Sonuç |
|---|---|
| Clean dependency install | 158 package kuruldu, 159 audit edildi, 0 vulnerability |
| OpenAPI ve generated-contract drift | 6/6; example, Auditee closed projection, sync union, first-production route ve TypeScript/Go generation clean |
| React type/unit/component | TypeScript geçti; Vitest 17 file, 148/148 test, 0 skipped |
| Build ve artifact sınırları | Demo/HTTP build geçti; HTTP scan 12 file ve 89 build input; mock/seed/demo-public/test-profile input yok |
| App shell ve CSP | Demo/HTTP için 12 file ve 4 shell asset taraması geçti; production policy unsafe inline/eval ve wildcard source içermez |
| Go build/vet/race ve live integration | API/worker build ve `go vet` geçti; isolated HTTP profile full Go race ile live PostgreSQL/Keycloak/MinIO integration, migration, upload/scan, raw authorization, sync ve cleanup'ı geçti |
| Live HTTP Backend contract | 11/11 |
| Mock browser profile | 5/5; canonical lifecycle, bütün approved first-production entry'ler desktop/tablet/mobile, keyboard/focus/target, stable reset ve sıfır unexpected console issue |
| HTTP browser profile | 7/7; aynı parity matrix, lost acknowledgement, foreground recovery, explicit stale-revision conflict çözümü ve deliberate aborted acknowledgement dışında sıfır unexpected console issue |
| Real offline browser profile | 6/6 isolated Chrome profile: stopped-origin restart, IndexedDB pending/in-flight recovery, exact OPFS byte/hash recovery, two-client N/N-1 update/rollback, managed-policy/persistence denial ve advisory quota denial |
| Root legacy ve parity oracle | 106/106, 0 skipped; root demo değişmedi |
| Focused security ve worker | API CSP/header, rate limit, session/CSRF/authentication ve worker batch reporting geçti |
| Dependency audit | Full npm audit: 0 total; production-only npm audit: 0 total |
| Dependency inventory | CycloneDX 1.5 npm SBOM: 158 component, SHA-256 `1a41728b6fafc6c22d534f67f48e9da13692613efca8988c025215a360f1c584`; Go API/worker runtime inventory: 30 module, SHA-256 `700e3fe011a93252e95216e33d6400260508cf85337a1b403b7d24ac30676569` |
| PostgreSQL recovery | Isolated dump/restore ve canonical fingerprint comparison geçti; drill SHA-256 `09db7e26161122de4976d1915e4c4dab7767cf27f00ff2fc0aab9aa1728e82a1` |
| Object-store recovery | Exact private object, 47 byte, metadata ve SHA-256 `ba47f0913c1d12b747062e178b1e346a80a1bf8be2f4b645d08cf0d3cc12d08d` restore edilip doğrulandı |
| Worker/outbox observability | Live profile completed scan batch gördü; pending scan-request 0 ve terminal scan-request 0 |

Supported local browser kanıtı isolated test profile ile Google Chrome `150.0.7871.129` kullanır. Toolchain Node `24.16.0`, npm `11.13.0` ve Darwin arm64 üzerinde Go `1.26.4` idi.

## Security Ve Operational Sınır İncelemesi

- Same-origin session, OIDC state/PKCE, secure cookie, CSRF, expiry/revocation, role, organization, assignment, direct-ID, list, pull ve conflict sınırları focused/live Go testlerini geçer. Configured local Keycloak flow production Identity kanıtı değildir.
- Raw Auditee JSON testleri Finding, CAP, Evidence, report, assignment, dashboard, direct-ID/list ve sync projection'larını Internal CAA, başka organization, workload/risk, unreleased report ve enforcement verisi için tarar.
- Official Evidence upload private, PDF/JPEG/PNG ve 25 MB ile bounded, server-observed, non-overwriting, immutable-by-version, scan-clean olana dek quarantined ve review/download/closure için gated kalır. Offline Inspection Attachment official Evidence'dan ayrıdır.
- Field record'lar subject-scoped'dur; official checkout managed-policy, persistence, storage health, version, grant veya advisory-capacity gate eksikliğinde reddedilir. Site-data clearing irrecoverable unsynced-copy boundary olarak açıktır. App-level encryption veya production MDM kanıtı iddia edilmez.
- CSP ve request-rate control local olarak doğrulandı. Production reverse proxy/WAF/distributed counter ve external penetration test ayrı evidence'dır.
- Local PostgreSQL/object-store restore ve prior-shell rollback rehearsal geçti. Bu sonuçlar production RPO/RTO, provider recovery veya DR ownership kurmaz.
- Worker log ve outbox state local profile'da observable'dır. Production metrics, alert, SLO, paging ve on-call configure edilmedi.

## External Production Gap'leri

Bu gap'ler local candidate'ı engellemez; production'ı engeller. Tamamı [tech-debt tracker](../exec-plans/tech-debt-tracker.md) içinde kayıtlıdır:

| Gap | Owner | Durum |
|---|---|---|
| Production OIDC/MFA, secret, identity operations ve external security review | Security + Identity | `blocked` |
| Production provider/region, trusted build/provenance, deployment, migration, backup/restore, RPO/RTO, monitoring, SLO ve on-call | Platform + Operations | `blocked` |
| Retention, legal hold, disposition, records classification ve tamper-evidence acceptance | Records + Legal + Security | `blocked` |
| Production managed-device/browser policy, app-level local-data encryption/key ownership ve site-data incident procedure | Security + CAA Operations + Records | `blocked` |
| Pilot acceptance, release authority, routing, rollback threshold ve legacy cutover/removal kararı | Product + Platform + Operations + QA | `blocked` |
| Ayrı onaylı production release/operations plan | Product + Platform + Operations + QA | `blocked`; bu dilimde authorize edilmedi veya oluşturulmadı |

## Reproduction Command'ları

```bash
npm --prefix apps/web ci
npm --prefix apps/web run contracts:check
npm --prefix apps/web run typecheck
npm --prefix apps/web test
npm --prefix apps/web run build:demo
npm --prefix apps/web run build:http
node apps/web/scripts/assert-http-artifact.mjs apps/web/dist
npm --prefix apps/web run check:app-shell
GOCACHE=/private/tmp/aviasurveil360-go-cache go -C apps/api build ./cmd/api ./cmd/worker
GOCACHE=/private/tmp/aviasurveil360-go-cache go -C apps/api vet ./...
./scripts/test-http-profile.sh
npm --prefix apps/web run test:e2e:offline
./scripts/test-local-recovery.sh
node --test tests/*.test.js tests/parity/react-legacy-parity.test.mjs
```

Network-backed dependency audit'leri `npm audit --json` ve `npm audit --omit=dev --json` ile ayrı çalıştırıldı. SBOM/runtime inventory task-owned temporary path'lerde üretildi ve release artifact olarak depoya eklenmedi.

## Final Scope Statement

Tasks 5-13 authorized local candidate için tamamlandı ve `verified locally`. Sonuç `candidate-only` ve `release pending`. Production deployment, production traffic, cutover, legacy removal ve `production-ready`; explicit authorization, ayrı onaylı production release/operations plan ve fresh external evidence gelene kadar `blocked` kalır.
