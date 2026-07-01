# AviaSurveil360 — Demo Yapı Özeti (Türkçe)

> İngilizce kanonik sürüm: [`BUILD_SUMMARY.md`](BUILD_SUMMARY.md).
> Bu dosya paydaş aktarımı içindir; çakışma olursa İngilizce sürüm esastır.

**Yapı türü:** Paydaş geri bildirimi için yalnızca ön yüz (frontend) V2 tıklanabilir demo.
**Teknoloji:** HTML + CSS + Saf (Vanilla) JavaScript. Sahte veri, istemci tarafı durum
ve küçük bir saklama sınırı arkasında tarayıcıya özel demo kalıcılığı.
**Üretime hazır değildir.** Backend, veritabanı, API, gerçek kimlik doğrulama,
gerçek dosya yükleme, gerçek AI servisi, gerçek düzenleyici doküman alma,
gerçek bildirim servisi, gerçek belge depolama, mobil/çevrimdışı uygulama,
e-imza veya framework geçişi yoktur.

**Tarih bağlamı:** Uygulama "bugün" olarak **15 Haziran 2026** tarihini kullanır;
böylece **Due Soon** / **Overdue** hesapları deterministiktir.

---

## Nasıl çalıştırılır

`index.html` dosyasını doğrudan tarayıcıda açın veya klasörü statik olarak servis edin:

```bash
python3 -m http.server 4360
```

Üst şeritteki **Reset demo**, bu tarayıcıda saklanan demo durumunu temizler ve
başlangıç verisine döndürür.

---

## Değişen dosyalar

| Dosya | Amaç |
|---|---|
| `index.html` | Demo şeridi artık tarayıcıya kayıtlı frontend-only demo olduğunu ve gerçek backend/AI/regülasyon entegrasyonu olmadığını belirtir. |
| `css/styles.css` | Rol bazlı çalışma alanları, Today’s Workbench, Regulatory Trace, offline outbox, AI taslak kontrolleri ve 390px mobil düzeni. |
| `js/data.js` | Backend'e yakın sahte kayıtlar, V2 seed verileri, açık status değerleri ve izole `localStorage` demo saklama yardımcıları. |
| `js/helpers.js` | Seçiciler, status yardımcıları, regulatory trace lookup, outbox yardımcıları ve demo badge yardımcıları. |
| `js/work-items.js` | Audit, finding, CAP/evidence alt satırları, approval, planning ve admin kuyrukları için ortak table-first iş öğesi hazırlama katmanı. |
| `js/views.js` | Mevcut ekranlar, Today’s Workbench, dokuz V2 ekranı, Service Provider Portal çerçevesi, yeniden kullanılabilir Regulatory Trace görünümü ve table-first iş kuyrukları. |
| `js/app.js` | Rol bazlı deneyim navigasyonu, merkezi kalıcılık çağrıları, simüle offline geçişleri, AI karar geçişleri, stabil ID üretimi ve checklist satır seçimi. |
| `docs/demo-evidence/BUILD_SUMMARY.md` | İngilizce kanonik özet. |
| `docs/demo-evidence/BUILD_SUMMARY.turkce.md` | Bu Türkçe paydaş özeti. |
| `tests/table-first-workbench-smoke.test.js` | Table-first satırlar, row-click navigasyon ve auditee gizlilik sınırları için odaklı smoke testi. |

Backend, veritabanı, API, framework geçişi, gerçek dosya saklama, gerçek AI
servisi, gerçek regülasyon içe aktarma veya gerçek bildirim servisi eklenmedi.

---

## Rol bazlı deneyimler ve ekranlar

Demo artık front-end’i üç ana rol bazlı deneyim etrafında sunar:

1. **Inspector Workspace** — günlük operasyon ekranı; atanmış denetimler,
   kanıt inceleme, CAP review, regülasyon arama, risk sinyalleri ve hızlı
   aksiyonlar.
2. **Supervisor / Manager Dashboard** — performans, risk, workload, SSP, CAP
   oversight, surveillance planning ve yönetici görünürlüğü.
3. **Service Provider Portal** — auditee tarafı; bulgular, CAP yükleme,
   CAA’ye görünür cevaplar ve sahte belge/dosya adı paylaşımı.

Admin Preview, demo içi ayar ve şablon önizleme yüzeyi olarak korunur.

Deneyim detayları:

1. **CAA Manager** — Supervisor / Manager Dashboard, yönetim gözetimi, denetim
   planı, bulgular, kuruluşlar, raporlar, SSP/NASP ve CAP effectiveness.
2. **CAA Inspector** — Inspector Workspace, Today’s Workbench,
   denetim/checklist yürütme, bulgu açma, CAP/kanıt inceleme, regülasyon arama,
   AI taslak asistanı ve simüle offline saha ekranı.
3. **Auditee (Airline XYZ)** — Service Provider Portal; kendi bulguları, CAP
   gönderimi, kanıt dosya adı gönderimi, CAA’ye görünür yorumlar ve closure
   status.
4. **Admin Preview** — şablonlar, kullanıcılar, ayarlar, audit log ve
   regulatory preview.

Inspector ana ekranı artık **Today’s Workbench** içinde table-first **My Work
Today** kuyruğu olarak düzenlenmiştir. Kompakt attention strip karar
sinyallerini görünür tutar; kuyruk satırları priority, organization, lifecycle,
owner, next action, due date/target, status ve row action bilgilerini taşır.
Eski A/B/C/D kart bölgeleri ana inspector yüzeyinden kaldırılmıştır.

Table-first desen; audit work queue, bulgu ve CAP/evidence review kuyrukları,
auditee talepleri, yönetici attention listeleri, planning, checklist approvals,
report approvals, organization/admin kuyrukları ve checklist runner içinde de
kullanılır. Checklist execution artık bir seçili soru ve bir aktif detay paneli
olan inspector tablosu gibi çalışır.

Sol navigasyon artık role göre görünen gruplu bilgi mimarisini kullanır:
Dashboard, Oversight, Organisations, Findings & CAPs, Regulations, USOAP / SSP,
Evidence & Documents, Analytics, Knowledge Hub ve Administration.

Eklenen Frontend V2 ekranları:

1. Safety Intelligence Dashboard
2. Organization Risk Profile
3. Regulatory Library
4. Dynamic Inspection Package Builder
5. Offline Field Inspection
6. USOAP Readiness Workspace
7. CAP Effectiveness
8. AI Inspector Assistant Panel
9. SSP/NASP Management Dashboard

V1 iş akışı ekranları erişilebilir kalır: rol seçimi, yönetici/denetçi panoları,
denetim takvimi, denetim detayı, checklist runner, bulgu detayı, Auditee My
Findings, CAP formu, kanıt formu/inceleme, rapor önizleme, admin şablon
önizleme, kuruluşlar, kullanıcılar, ayarlar, raporlar, mesajlar ve audit log.

---

## Demo kalıcılığı

Demo artık `aviasurveil360:v2-demo-state` anahtarı altında şu sahte öğeleri
tarayıcıda saklar:

- oluşturulan bulgular
- CAP gönderimleri ve CAP revision biçimli kayıtlar
- sahte kanıt dosya adları ve evidence version biçimli kayıtlar
- AI accept/edit/reject kararları
- seçilen filtreler
- simüle offline outbox öğeleri

`localStorage` erişimi yalnızca `js/data.js` içinde `loadDemoState`,
`saveDemoState`, `clearDemoState`, `persistAfterAction` ve `initializeState`
yardımcıları arkasındadır. View ve modal kodları doğrudan storage kullanmaz;
merkezi action fonksiyonlarını çağırır.

Bu yalnızca tarayıcıya özel demo kalıcılığıdır. Üretim kalıcılığı, yetkilendirme,
audit saklama, kanıt zinciri veya yasal kayıt değildir.

---

## Simüle offline davranışı

**Offline Field Inspection** ekranında **Simulate offline** kontrolü vardır.
Offline simülasyonu açıkken denetçi sahte bir saha kanıt aksiyonu kaydedebilir.
Bu aksiyon **Offline Outbox** içinde şu mesajla saklanır:

```text
Internet unavailable - saved locally. It will sync automatically when connection returns.
```

Simüle online duruma dönünce bekleyen öğeler `synced_to_demo_state` olur ve audit
log içine `Offline item synced (demo)` kaydı düşer. UI bunu açıkça **Offline
simulated** ve **No production sync** olarak etiketler.

Service worker, şifreli lokal saklama, gerçek attachment queue, mobil uygulama,
conflict engine veya üretim offline sync eklenmedi.

---

## Regulatory Trace

V2 ekranlarında ve ilgili mevcut yüzeylerde yeniden kullanılabilir **Regulatory
Trace** gösterimi vardır. Sahte kaynak doküman/sürüm, clause veya PQ referansı,
effective date, applicability reason, bağlı checklist/evidence ve approval state
gösterir.

Bu yalnızca demo verisidir. Gerçek düzenleyici materyal içe aktarmaz; yasal,
enforcement, sertifika, USOAP veya closure kararı oluşturmaz.

---

## UI guardrail etiketleri

Gelişmiş yetenekler ekranda açıkça şöyle etiketlenir:

- `Demo data`
- `Mock regulatory library`
- `Offline simulated`
- `AI-generated draft - requires authorized review`
- `Not a legal decision`
- `Frontend-only demo - saved in this browser`
- `No production sync`
- `No real AI service`
- `No real regulatory ingestion`

Korunan ürün kuralları:

- CAP kabulü bulgu kapatma değildir.
- Bulgu yalnızca kanıt kabulünden sonra veya yetkili kapatma ile kapanır.
- Auditee; Internal CAA Note, denetçi iş yükü, başka kuruluşlar, dahili risk
  skoru, regulatory governance veya AI governance verisi görmez.
- `Comment to Auditee` ve `Internal CAA Note` ayrı kalır.
- Mock upload yalnızca dosya adını gösterir/saklar.

---

## Doğrulama sonuçları

Durum: **verified locally** (frontend-only demo).

Çalıştırılan syntax kontrolleri:

```bash
node --check js/data.js
node --check js/helpers.js
node --check js/approval.js
node --check js/planning.js
node --check js/checklists.js
node --check js/inspection.js
node --check js/reports.js
node --check js/work-items.js
node --check js/views.js
node --check js/app.js
```

Playwright ile `index.html` üzerinde tarayıcı smoke testi yapıldı; konsol hatası yok.
Doğrulananlar:

- Inspector Workspace'in `Today’s Workbench` ile açılması
- `Today’s Workbench` içinde table-first `My Work Today` kuyruğu ve kompakt
  attention strip görünmesi
- `New inspection` hızlı aksiyonunun New Audit Wizard ekranını açması
- Supervisor / Manager Dashboard ve SSP/NASP dashboard ekranlarının erişilebilir kalması
- Service Provider Portal çerçevesinin auditee rolünde görünmesi
- dokuz V2 ekranının role uygun navigasyonla erişilebilir olması
- mevcut Operator Audit senaryosunun uçtan uca çalışması
- CAP kabulünden sonra `OPS-2026-001` durumunun `EVIDENCE_REQUIRED` kalması
- kanıt kabulünden sonra `OPS-2026-001` durumunun `CLOSED` olması
- auditee görünümünde `Internal CAA Note`, `Inspector Workload`, regulatory
  governance, AI governance veya başka kuruluş metninin görünmemesi
- refresh sonrası bulgu, CAP, kanıt dosya adı, AI kararı ve offline outbox durumunun korunması
- Reset demo sonrası `localStorage` ve oluşturulan demo durumunun temizlenmesi
- offline outbox'ın beklemeden `synced_to_demo_state` durumuna geçmesi
- audit log içinde `Offline item synced (demo)` kaydı oluşması
- tüm yeni V2 ekranlarında 390px viewport için yatay taşma olmaması

Final browser evidence özeti:

```text
afterIssue: WAITING_CAP
afterSubmitCap: CAP_SUBMITTED
afterAcceptCap: EVIDENCE_REQUIRED
afterSubmitEvidence: EVIDENCE_SUBMITTED
afterAcceptEvidence: CLOSED
aiDecision: edited
outboxStatus after refresh: synced_to_demo_state
reset storage: null
console errors: []
mobile scrollWidth/clientWidth: 390/390 on all V2 screens
Today’s Workbench mobile scrollWidth/clientWidth: 390/390
Service Provider Portal mobile scrollWidth/clientWidth: 390/390
```

### CAA Governance browser QA - 2026-06-29

Durum: CAA Governance frontend-only demo hattı için **desktop ve mobil browser
QA verified locally**.

AviaSurveil360 Agent Harness Runbook aktif CAA Governance iş akışına uygulandı.
Doğrulama frontend-only demo sınırını korudu: backend, veritabanı, API, gerçek
kimlik doğrulama, gerçek upload, gerçek AI servisi, gerçek regülasyon içe
aktarma, gerçek bildirim servisi veya production audit-log hazır oluşu
eklenmedi ve iddia edilmedi.

Syntax ve deterministik smoke kontrolleri geçti:

```bash
node --check js/data.js
node --check js/helpers.js
node --check js/approval.js
node --check js/planning.js
node --check js/checklists.js
node --check js/inspection.js
node --check js/reports.js
node --check js/views.js
node --check js/app.js
node tests/approval-smoke.test.js
node tests/checklist-approval-smoke.test.js
node tests/checklist-management-smoke.test.js
node tests/governance-render-smoke.test.js
node tests/inspection-execution-smoke.test.js
node tests/planning-render-smoke.test.js
node tests/planning-release-smoke.test.js
node tests/report-approval-smoke.test.js
node tests/audit-work-queue-smoke.test.js
node tests/demo-boundary-smoke.test.js
```

Desktop browser click-through ile şu governance yolları yerelde doğrulandı:

- Department Manager, General Manager, Finance Review ve Executive Director
  planlama onay zinciri, final `Approved` durumuna kadar.
- `CL-FOPS-v2.4` için General Manager checklist approval.
- Lead Inspector -> Department Manager -> General Manager -> Executive Director
  rapor onay zinciri, `Final Report Locked` durumuna kadar.
- Inspector `Audit Work Queue` ve `Offline Field Inspection` demo sınırı.
- Auditee portal izolasyonu: görünür `Internal CAA Note` veya `Inspector
  Workload` yok.
- Admin `Question Bank`; configured references ve expected evidence görünür.

Yerel screenshot kanıtı
`/private/tmp/aviasurveil360-governance-qa/` altında alındı:

- `01-login-desktop.png`
- `02-planning-approved-desktop.png`
- `03-planning-ready-desktop.png`
- `04-checklist-approved-desktop.png`
- `05-final-report-locked-desktop.png`
- `06-inspector-work-queue-desktop.png`
- `07-offline-field-desktop.png`
- `08-auditee-portal-desktop.png`
- `09-admin-question-bank-desktop.png`
- `10-mobile-planning-approval-verified.png`

Mobil Planning Approval yeniden koşumu:

- `10-mobile-planning-approval.png`, Planning Approval görsel kanıtı olarak
  **kabul edilmedi**. Ekran Manager Dashboard'u yakaladı; zayıf assertion ise
  gizli navigasyon metnini yakalamıştı.
- Kabul edilen yeniden koşum,
  `/private/tmp/aviasurveil360-governance-qa/10-mobile-planning-approval-verified.png`
  dosyasını `http://127.0.0.1:4360/` üzerinden 390px mobil viewport ile yakaladı.
- Kabul edilen kanıt gizli navigasyon metnine değil görünür içeriğe dayanır:
  `Planning Approval — PLAN-2026-Q3-OPS` viewport içinde görünür,
  `Q3 Flight Operations Surveillance Plan` dossier görünür, console
  warning/error listesi boştur ve mobile scrollWidth/clientWidth `390/390`dır.
- Eski blocker note,
  `docs/exec-plans/completed/2026-06-29-governance-browser-qa-mobile-blocker.md`
  içinde kapatıldı.

Görsel QA polish takibi tamamlandı: rapor approval progress kartı sidebar içinde
compact approval rail varyantını kullanıyor; böylece `Department Manager` gibi
uzun governance etiketleri, onay workflow'u değişmeden okunabilir kalıyor.
Geçici browser profiliyle yapılan local headless Chrome QA, report approval
sayfasını, compact rail class'ını, `Department Manager` etiketini
`247px × 17px` olarak ve desktop yatay taşma olmadığını (`1280/1280`) doğruladı.
Screenshot: `/private/tmp/aviasurveil360-report-approval-compact.png`.

### Planning panel sadeleştirmesi - 2026-06-30

Durum: **frontend-only Planning panel güncellemesi verified locally**.

Planlama artık Department Manager, General Manager, Finance Review, Executive
Director ve ilgili Lead Inspector hazırlık işleri için tek bir `Planning`
panelinde toplandı. Eski Planning Board ve Planning Approvals ayrımı yalnızca
mevcut link/test uyumluluğu için wrapper olarak korunur; ayrı top-level
kullanıcı navigasyonu olarak gösterilmez.

`Department Manager -> GM -> Finance Review -> Executive Director` onay zinciri
korundu. Executive Director onayından sonra Planning paneli görünür biçimde `GM
Release to Department`, Department Manager kabulü, Lead Inspector ataması,
team/date/resource önerisi, Department Manager confirmation ve `Ready for
Execution` adımlarına devam eder.

`Audit Work Queue` saha/denetim iş kuyruğu olarak kaldı. Ayrı bir planning
governance modülü değildir.

Bu davranış hâlâ mock/demo davranışıdır: backend, gerçek kimlik doğrulama,
gerçek yetkilendirme servisi, gerçek finans entegrasyonu, gerçek upload/storage,
e-signature servisi veya gerçek doküman üretimi eklenmedi.

Rendered browser smoke geçici local static server ile
`http://127.0.0.1:8765/` üzerinde çalıştırıldı; console warning/error listesi
boştu ve Planning workspace ile Audit Work Queue kanıt ekranlarında desktop
scrollWidth/clientWidth `1280/1280` kaldı.

### Table-first surveillance workbench UX - 2026-07-01

Durum: frontend-only table-first workbench güncellemesi için **verified
locally**.

Demo, değişen queue yüzeylerinde kart yığınları yerine operasyonel tabloları
öne alır. Satırlar mevcut detail sayfalarına navigasyonu korur; owner, next
action, due date/target, status, severity/priority, izin verilen yerlerde
audit/organization bağlamı ve satır aksiyonlarını gösterir. CAP/evidence alt
satırları, lifecycle kurallarını değiştirmeden görünür hale getirilmiştir.

Doğrulanan ürün guardrail'leri:

- CAP accepted hâlâ closure değildir; accepted CAP satırları closure öncesi
  evidence gerektiğini açıkça söyler.
- Evidence version history korunur; eski evidence kayıtları konsept olarak
  overwrite edilmez.
- Auditee kullanıcıları yalnızca Airline XYZ portal verisini görür; Internal
  CAA Note, başka kuruluşlar, inspector workload veya internal risk scoring
  görmez.
- Oversight Health Index yalnızca yönetim göstergesidir; otomatik enforcement,
  suspension veya closure tetiklemez.
- Backend, veritabanı, API, gerçek authentication, gerçek file upload/storage,
  gerçek AI servisi, gerçek regulatory ingestion, gerçek notification service,
  framework migration, branch, commit veya push eklenmedi.

Ek local kontroller geçti:

```bash
node tests/table-first-workbench-smoke.test.js
node tests/checklist-comment-render-smoke.test.js
node tests/inspector-nav-smoke.test.js
node tests/lead-inspector-nav-smoke.test.js
node tests/lead-inspector-workspace-smoke.test.js
```

Browser QA, geçici static server ile `http://127.0.0.1:8765/` üzerinde in-app
Browser kullanılarak yapıldı. Doğrudan `file://` navigasyonu browser policy
tarafından engellendiği için daha güvenli static preview yolu olarak local HTTP
server kullanıldı. `Audit Work Queue` -> `AUD-2026-001` row-click navigasyonu,
checklist Q2 non-compliant -> `PF-2026-001`, auditee portal izolasyonu,
manager OHI guardrail metni ve desktop/390px mobile viewport için page-level
yatay taşma olmaması doğrulandı. Güncel table-first screenshot kanıtı
`qa/screenshots/table-first-2026-07-01/` altındadır (git tarafından ignore
edilir).

---

## Sahte öğeler ve kısıtlar

- Rol seçimi gerçek kimlik doğrulama değildir.
- Tarayıcı kalıcılığı üretim storage değildir.
- Kanıt yalnızca dosya adı yakalar; dosya okunmaz veya yüklenmez.
- Regulatory Library mock/source-shaped veridir.
- USOAP readiness resmi ICAO assessment değildir ve EI iyileşmesi iddiası yoktur.
- SSP/NASP yalnızca izlemeyi destekler; otomatik state safety determination değildir.
- AI önerileri yalnızca taslaktır; resmi çıktı yayımlayamaz.
- Offline outbox simüledir; mobil/offline-ready implementation değildir.
- Audit log demo durumudur; değiştirilemez audit evidence değildir.
- `README.md`, `README.turkce.md` ve `MANIFEST.md` artık mevcut planlama paketi
  + frontend-only static clickable demo şeklini anlatır; production-readiness
  yine iddia edilmez.
