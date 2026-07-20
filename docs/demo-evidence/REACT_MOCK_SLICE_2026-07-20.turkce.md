# React Mock İlk Çalıştırılabilir Dilim Kanıtı — 2026-07-20

## Durum

- Implementation scope: yalnız Task 2-4.
- Local sonuç: `verified locally`.
- Olgunluk: `candidate-only`.
- Release: `release pending`.
- Real HTTP/API, Go, offline, deployment, cutover ve production kanıtı: `not run`.
- Task 5-13 ve çözümlenmemiş owner kararları: ayrı authorization olmadan `blocked`.

Bu kanıt yalnız active production-transition planında açıkça yetkilendirilen
mock-data ilk çalıştırılabilir dilimi kapsar. AviaSurveil360 için
`production-ready` iddiası oluşturmaz.

## Uygulanan Dilim

Task 2; kanonik İngilizce/Türkçe contract vocabulary, checked example ve
generated TypeScript transport type içeren minimal versioned OpenAPI contract,
çalıştırılabilir dokuz kayıtlı behavior ledger ve `apps/web/` altında build
time'da ayrılan React demo/HTTP entry'lerini ekler.

Task 3; tek capability-composed `Backend`, deterministik
`MemoryMockStore`/`MockBackend`, yalnız deterministik fake-fetch mapper
testleriyle doğrulanan ince typed `HttpBackend`, reusable backend contract
testleri ve HTTP build'de mock/seed input bulunmasını reddeden artifact check
ekler.

Task 4, tam kanonik Cabin Inspection route akışını React mock mode'da ekler.
Her kanonik mutation `Backend` üzerinden gönderilir; hiçbir component kanonik
mock record'u sahiplenmez veya doğrudan değiştirmez. Root Vanilla JavaScript
demo davranış referansı olarak korunur; değiştirilmez veya kaldırılmaz.

`FieldRepository`, IndexedDB davranışı, OPFS, Service Worker/PWA davranışı,
sync engine, Go service, database, object storage, real identity, real upload,
deployment veya production cutover eklenmedi.

## Normalize Kanonik Transcript

| Invariant | Doğrulanan değer |
|---|---|
| Exact Audit/question | `AUD-2026-001` / `CAB-EMEQ-PBE-001` |
| Potential Finding | `PF-2026-001` / `PENDING_LEAD_REVIEW` |
| Converted Finding | `CAB-2026-001` / `WAITING_FOR_CAP` |
| CAP submission | `CAP_SUBMITTED` |
| CAP acceptance | `EVIDENCE_REQUIRED`; Finding açık kalır |
| Evidence version 1 | `PARTIALLY_CLOSE` -> `EVIDENCE_MORE_INFORMATION_REQUESTED` |
| Evidence version 2 | `NOT_CLOSE` -> `EVIDENCE_MORE_INFORMATION_REQUESTED` |
| Evidence version 3 | `CLOSE` -> `CLOSED` |
| Closure basis | `EVIDENCE_VERIFIED` |
| Immutable Evidence history | 3 version korunur |
| Report decision | `LOCKED`; issue Finding'i kapatmaz |
| Manager projection | Verified closure sonrasında 1 closed Finding |
| Auditee projection | Yalnız Fly Namibia; internal CAA veya başka organization verisi yok |

Browser senaryosu ayrıca başka Inspector'a ait checklist sorusunun read-only
olduğunu, kanonik Finding öncesinde Lead conversion gerektiğini, CAP submission
ile CAA review'un ayrı olduğunu, `Comment to Auditee` ile `Internal CAA Note`
alanlarının CAA tarafında ayrı kaldığını, authorized closure'ın reason-required
ayrı Department Manager yolu olduğunu ve unreleased report'un Auditee için
erişilemez olduğunu doğrular.

## Doğrulama Kanıtı

Aşağıdaki başarılı sonuçların tamamı 2026-07-20 tarihinde `verified locally`
durumundadır.

| Gate | Sonuç |
|---|---|
| Locked install | `npm --prefix apps/web ci` geçti |
| Contract lint/example/regeneration diff | `npm --prefix apps/web run contracts:check` geçti |
| TypeScript | `npm --prefix apps/web run typecheck` geçti |
| Unit/component/backend | 8 Vitest dosyasında 32/32 assertion geçti |
| Focused Auditee component/backend boundary | 11/11 assertion geçti |
| OpenAPI ve behavior-ledger Node gate | 7/7 assertion geçti |
| Kanonik mock browser scenario | 1/1 Playwright scenario, page veya console warning/error olmadan geçti |
| Demo build | 92 module başarıyla build edildi |
| HTTP build | 169 module başarıyla build edildi |
| HTTP artifact isolation | 7 file ve 71 input tarandı; mock/seed input veya demo-public artifact bulunmadı |
| Korunan legacy behavior oracle | Root Node testleri 103/103 geçti |
| Browser/server cleanup | Task-owned Vite, Playwright, headless Chrome veya remote-debugging Chrome process kalmadı |

Test-first browser koşumu ilk olarak port edilmemiş ilk React route olan
`/inspector/inspector-assignments` noktasında fail etti. Tamamlanan
implementation aynı senaryoyu geçti ve normalize transcript'i ekledi.

## Kanıt Sınırları

- `HttpBackend` yalnız fake-fetch mapping testleriyle doğrulandı. Real HTTP
  conformance `not run`.
- Mock file selection yalnız filename ve size kaydeder. Real upload, scan,
  object storage ve chain-of-custody kanıtı `not run`.
- Browser persistence, offline restart, IndexedDB, OPFS, PWA update davranışı
  ve sync `not run`.
- Real authentication, authorization enforcement, OIDC/MFA, CSRF policy,
  session revocation ve production Auditee isolation `not run`.
- Deployment, production release approval, traffic cutover ve legacy removal
  `blocked`; ayrı authorization gerektirir.

Dilim, `candidate-only` local artifact olarak stakeholder/user review'a
hazırdır. Production release değildir.
