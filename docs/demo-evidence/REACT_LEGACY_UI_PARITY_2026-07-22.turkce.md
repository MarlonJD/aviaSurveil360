# React Legacy UI Parity Kanıtı — 22 Temmuz 2026

> İngilizce kanonik sürüm:
> [`REACT_LEGACY_UI_PARITY_2026-07-22.md`](REACT_LEGACY_UI_PARITY_2026-07-22.md).
> Çakışma olursa İngilizce kayıt esastır.

## Sonuç

Task 16 `verified locally` durumundadır. React/Go uygulaması
`candidate-only`, release ise `release pending` olarak kalır. Route edilmiş 17
React yüzeyinin tamamı masaüstü, tablet ve mobil görsel, semantik, geometri ve
görünür aksiyon kapılarından geçti. 51 legacy/React görünüm çiftinin manuel
incelemesi, her React yüzeyinin yeni ve ilgisiz bir arayüz olmadığını; kabul
edilen root Vanilla demo'dan tanınabilir biçimde türediğini doğruladı.

Bu sonuç paydaş kabulü değildir ve `production-ready` iddiası taşımaz. Root demo
korunmaktadır. Kabul edilen diğer 69 audit satırı legacy-only kalır. Production
deployment, trafik cutover, legacy kaldırma, production Identity/MFA, records
policy, monitoring/on-call ve disaster recovery ayrı yetki ve kanıt beklediği
için `blocked` durumundadır.

## Kapsam Ve Uygulama Gerçeği

- Dondurulmuş kaynak envanteri 86 sıralı audit satırıdır: 17
  `react-parity`, 69 açık legacy-only kayıt.
- Registry; role selection ve 16 korunan route içerir. Kalan 69 ekran için sahte
  placeholder route oluşturulmadı.
- Potential Finding list/get, immutable CAP revision list/get ve checklist
  template version detail, mock ve HTTP profillerinde gerçek typed read
  vertical'lerdir.
- Normal HTTP şeridi same-origin OIDC session, CSRF, authenticated roles,
  expiry ve logout kullanır. Deterministik canonical-header şeridi ayrıdır.
- Auditee projection'ları organizasyon kapsamlıdır; Internal CAA Note, workload,
  internal risk ve enforcement deliberation alanlarını yapısal olarak dışlar.
- CAP acceptance Finding'i kapatmaz. Official Evidence online-first ve
  versioned kalır; offline dosyalar Inspection Attachment'tır.
- HTTP artifact, root runtime CSS/JavaScript, mock/seed ve canonical-test
  girdilerini içermez.

Task 16 üç eski test varsayımını ürün davranışını değiştirmeden düzeltti: OIDC
logout seçicisi açık Profile menu ile sınırlandı; offline asset testi kabul
edilen role selector görsellerini denetliyor; recovery drill canonical seed'i
açıkça etkinleştiriyor. Bu dosyalar gözden geçirilmiş Task 16 allowlist'ine
eklendi.

## Doğrulama Matrisi

| Kapı | Sonuç |
|---|---|
| Temiz kurulum | `npm --prefix apps/web ci`: geçti; 158 paket kuruldu |
| OpenAPI/generated contracts | `./scripts/check-contracts.sh`: 8/8; lint ve generation geçti |
| SQLC | `./scripts/check-sqlc.sh`: geçti, `sqlc-check: ok` |
| Contract examples | 7/7 geçti |
| Go authority/security | `go test -race -p 1 -count=1 ./...`, canonical HTTP profilinin PostgreSQL, Keycloak ve MinIO bring-up aşamasından sonra geçti |
| React type/unit/contract | typecheck geçti; Vitest 47 dosya / 282 test geçti |
| Build ve boundary | demo/HTTP build geçti; iki app-shell taraması 24 dosya / 16 asset; HTTP artifact 24 dosya / 109 input; parity boundary 17 route / 2 profil |
| Baseline integrity | 51 tracked PNG hash ve metadata kaydının tamamı geçti |
| Root oracle ve ledger | 107/107 geçti |
| Mock browser | 8/8 geçti |
| Visible actions | 3/3 viewport testi geçti; her test 17 yüzeyin tamamını envanterledi |
| Canonical HTTP | Go race/integration, contracts, SQLC, React 282/282, HTTP contract 14/14, mock 8/8, HTTP 10/10 ve worker/outbox observability geçti |
| Normal OIDC | Keycloak login, session projection, role route, CSRF mutation, expiry boundary ve logout dahil 1/1 geçti |
| Gerçek offline | 7/7 geçti |
| Recovery | PostgreSQL ve exact private-object backup/delete/restore geçti; candidate-only drill |
| Visual parity | Primitive gallery ve 51 route/viewport karşılaştırması: 52/52 geçti |
| Dependencies | Tam ve production-only npm audit: 0 vulnerability |
| Cleanup | Task'e ait browser, server, container, network ve volume kaynakları kaldırıldı |

Standalone Go komutu servis orkestrasyonundan önce ayrıca denendi. Önce sandbox
local-port kısıtına, sonra gerekli servisler yokken beklenen fail-closed sonuca
ulaştı. Bu deneme yeşil kanıt sayılmadı. Yetkili sonuç, aynı race komutunun
`scripts/test-http-profile.sh` içinde deterministik servis bring-up sonrasında
çalıştırılmasıdır. İşletim sistemi kaynak sonlandırması veya eski test seçicisi
nedeniyle biten geçici browser koşuları da yeşil kanıt sayılmadı; ilgili tam
komutlar sınırlı harness düzeltmesinden sonra yeniden çalıştırılıp geçti.

## Recovery Kanıtı

- PostgreSQL dump SHA-256:
  `8908103b07f78b5b098db7d01c1b186f57226e91ed20f80d1f4f47dd550dab3a`
- Restore edilen private object: tam 47 byte.
- Restore edilen object SHA-256:
  `ba47f0913c1d12b747062e178b1e346a80a1bf8be2f4b645d08cf0d3cc12d08d`

Bu local recovery rehearsal `candidate-only` kapsamındadır; production RPO/RTO,
disaster recovery, retention veya legal-hold operasyonunu kanıtlamaz.

## Görsel Ortam Ve Bütünlük

- Baseline source commit:
  `e31117b6b48a1a4549f44de4f18ba7da2fd1d340`
- Playwright `1.61.1`; Chromium `149.0.7827.55`; Node `24.16.0`
- Platform: macOS/Darwin arm64, release `25.5.0`
- Viewport'lar: masaüstü `1440×900`, tablet `1024×768`, mobil `390×844`
- Decoded RGBA comparison; maximum per-channel delta `40`.
- Limitler: shell bölgeleri `<= 0.03`; yalnız predeclared adapted content
  bölgeleri `<= 0.08`.
- 51 çiftte toplam mask `0`; maksimum masked ratio `0`.
- Maksimum shell oranları: sidebar `0.02968`, topbar `0.02945`.
- Maksimum adapted oranları: content-header `0.06612`, content `0.07980`.
- Strict role selector maksimum viewport oranı: `0.00309`.
- Final koşu 51 candidate viewport PNG ve 51 machine-readable region-result
  kaydı üretti. 18 contact sheet manuel incelendi.

Takip edilen kaynak SHA-256 değerleri: root `index.html`
`1b02a3a2f5bb459f43f8da8896b401c65336dab3f43f6aff8f6cb53132358574`,
`css/styles.css`
`b8fc4b99934702fa22ad844ebf70026b9b70d94d9106a7926c39377808f757f6`,
`js/app.js`
`ba68a7fde9ccd2fd246317c54fa6b778382f4d26485527761cd4ef3cccfe4c50`,
`js/views.js`
`a580203b8e1e9fad53ffbfd68200a8e3dfd8919e4c20def662b0355782e12359`,
`js/data.js`
`429cd3af4b92e3fd7faaf8ae787c207137940f399118a3e278f1c6c351da4df2`,
UI audit dokümanı
`92a8ab06da1f87fd9e84b45b35fa5c3dc58aa78a6eb7f6f9c9652731e8f74967`,
web lockfile
`6d8de594a8e58754c0486465f0c0b368d37de99304722d51654a48397cd05743`.

## Route Bazlı Reviewer Kaydı

Her satır için baseline yolu
`apps/web/tests/visual-baselines/react-legacy-parity/{viewport}/{surface}.png`,
final React attachment yolu `{viewport}/{surface}.png` biçimindedir. İngilizce
kanonik rapor her route'un desktop/tablet/mobile bölge oranlarını ayrı ayrı
kaydeder. Her viewport'ta mask sayısı `0`, masked ratio `0`, geometri `passed`,
semantik `passed` ve visible actions `passed` (`G/S/A = P/P/P`) sonucundadır.
Reviewer: Codex primary agent. Her satırın disposition değeri:
`accepted-root-demo-parity`.

| Audit | Yüzey | Mod | Her viewport G/S/A | Kabul edilen demo tanınabiliyor mu? |
|---|---|---|---|---|
| ui-audit-076 | admin-home | adapted | P/P/P | Evet |
| ui-audit-007 | audit-detail | adapted | P/P/P | Evet |
| ui-audit-028 | audit-plan | adapted | P/P/P | Evet |
| ui-audit-066 | auditee-home | adapted | P/P/P | Evet |
| ui-audit-022 | cap-review | adapted | P/P/P | Evet |
| ui-audit-008 | checklist-runner | adapted | P/P/P | Evet |
| ui-audit-044 | evidence-review | adapted | P/P/P | Evet |
| ui-audit-059 | executive-home | adapted | P/P/P | Evet |
| ui-audit-058 | finance-home | adapted | P/P/P | Evet |
| ui-audit-009 | finding-detail | adapted | P/P/P | Evet |
| ui-audit-052 | gm-home | adapted | P/P/P | Evet |
| ui-audit-002 | inspector-home | adapted | P/P/P | Evet |
| ui-audit-013 | lead-home | adapted | P/P/P | Evet |
| ui-audit-027 | manager-home | adapted | P/P/P | Evet |
| ui-audit-041 | organization-registry | adapted | P/P/P | Evet |
| ui-audit-030 | report-preview | adapted | P/P/P | Evet |
| ui-audit-001 | role-select | strict | P/P/P | Evet |

Manuel inceleme 17 masaüstü, 17 tablet ve 17 mobil görselin tamamını kapsadı.
Kabul edilen DEMO ribbon, role-specific sidebar/topbar, tipografi, boşluklar,
dense card/table düzeni, lifecycle hierarchy ve responsive stacking doğrulandı.
Farklar yalnız predeclared adapted bölgelerdeki doğru backend seed değer ve
sayılarıdır.

## Cleanup Ve Handoff

Canonical HTTP, OIDC ve recovery script'leri kendilerine ait API, worker,
Vite/static server, PostgreSQL, Keycloak, MinIO, network ve volume kaynaklarını
kaldırdı. Final browser process incelemesinde task'e ait Playwright, webdriver,
remote-debugging Chromium veya Vite kalıntısı bulunmadı. İlgisiz kullanıcı
process'lerine ve korunması istenen untracked workspace yollarına dokunulmadı.

Task 16 sonrasında plan durumu `ready-for-verification` olur. Sıradaki somut
adım, 17 yüzeylik React sonucunun açık paydaş incelemesi ve kabulüdür. Bu kabul
olmadan remediation planı tamamlanmış sayılmaz; production release/cutover için
ayrı bir onaylı operations planı yine gereklidir.
