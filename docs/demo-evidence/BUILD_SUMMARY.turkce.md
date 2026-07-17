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
| `index.html` | Demo şeridi frontend-only tarayıcı kalıcılığını belirtir; asset query token doğrulanmış manager-workspace UI'ını kapsar. |
| `css/styles.css` | Kısıtlı Department/General Manager workbench'leri, split pane'ler, sticky satır aksiyonları, sınırlandırılmış menü/drawer'lar ve 390px mobil davranış dahil rol bazlı responsive UI. |
| `js/data.js` | Backend'e yakın sahte kayıtlar, workbook-derived Cabin Inspection verisi, manager/GM demo kayıtları, açık status değerleri ve izole `localStorage` yardımcıları. |
| `js/helpers.js` | Seçiciler, status yardımcıları, Cabin/PBE regulatory trace lookup, outbox yardımcıları ve demo badge yardımcıları. |
| `js/work-items.js` | Audit, finding, CAP/evidence alt satırları, approval, planning ve admin kuyrukları için ortak table-first iş öğesi hazırlama katmanı. |
| `js/manager-workspaces.js` | Saf Department/General Manager projection ve mutation'ları, ayrı rapor kararları, CAP/checklist/risk yardımcıları ve bağımlılıksız demo PDF üretimi. |
| `js/views.js` | Mevcut ekranlara ek olarak Cabin Inspection akışı, kısıtlı manager/GM dashboard'ları, Findings Review, Inspection Team, Reports Approval, CAP Monitoring, Checklist Management ve Risk Dashboard'ları. |
| `js/app.js` | Rol bazlı navigasyon, merkezi kalıcılık, manager/GM etkileşim dispatch'i, PDF/CSV indirmeleri, Cabin Inspection lifecycle geçişleri ve stabil ID üretimi. |
| `docs/demo-evidence/BUILD_SUMMARY.md` | İngilizce kanonik özet. |
| `docs/demo-evidence/BUILD_SUMMARY.turkce.md` | Bu Türkçe paydaş özeti. |
| `tests/*.test.js` | Cabin Inspection yolu, Department/General Manager workspaces, lifecycle/yetkilendirme sınırları, geçerli PDF üretimi, responsive kontratlar ve demo sınırları için smoke kapsamı. |

Backend, veritabanı, API, framework geçişi, gerçek dosya saklama, gerçek AI
servisi, gerçek regülasyon içe aktarma veya gerçek bildirim servisi eklenmedi.

---

## Rol bazlı deneyimler ve ekranlar

Demo artık front-end’i üç ana rol bazlı deneyim etrafında sunar:

1. **Inspector Workspace** — atanmış denetimler, CAP review ve draft report
   takibi için sade günlük operasyon yüzeyi.
2. **Supervisor / Manager Dashboard** — performans, risk, workload, SSP, CAP
   oversight, surveillance planning ve yönetici görünürlüğü.
3. **Service Provider Portal** — auditee tarafı; bulgular, CAP yükleme,
   CAA’ye görünür cevaplar ve sahte belge/dosya adı paylaşımı.

Admin Preview, demo içi ayar ve şablon önizleme yüzeyi olarak korunur.

Deneyim detayları:

1. **CAA Manager** — Supervisor / Manager Dashboard, yönetim gözetimi, denetim
   planı, bulgular, kuruluşlar, raporlar, SSP/NASP ve CAP effectiveness.
2. **CAA Inspector** — Inspector Workspace, My Inspections ana ekranı,
   denetim/checklist yürütme, bulgu açma, CAP/kanıt inceleme ve draft report
   takibi.
3. **Auditee (Fly Namibia)** — Service Provider Portal; kendi bulguları, CAP
   gönderimi, kanıt dosya adı gönderimi, CAA’ye görünür yorumlar ve closure
   status.
4. **Admin Preview** — şablonlar, kullanıcılar, ayarlar, audit log ve
   regulatory preview.

Inspector ana ekranı artık sadeleştirilmiş **My Inspections** çalışma alanıdır.
Bu ana yüzeyde guardrail pill satırı, attention strip ve hızlı aksiyon buton
satırı saklanır. İlk görünüm dört KPI kartına ve üç sade tabloya odaklanır:
Assigned Inspections, CAP Reviews ve Draft Reports.

**My Inspections** içindeki canonical scenario **Open** aksiyonu Fly Namibia
**Cabin Inspection** execution workspace'ine gider. Ekran altı source-derived
Cabin section'ı, exact assignment/execution Question ID'lerini, per-Inspector
assignment scope'u, compliance kontrolü, yorum kutusu, mock attachment adı ve
download/draft save/one-time Lead Inspector submission browser-local
aksiyonlarını gösterir.

Lead Inspector assignment overview sunuma hazırdır: **Preview Checklist**,
**View Details** ve **View Team** seçili Cabin Inspection paketinden beslenen
birbirinden farklı modallar açar. Checklist modalı altı runnable sorunun ve
configured reference'ların tamamını; kapsam modalı altı bölümü, konumu, süreyi
ve `126 source rows / 6 runnable questions` sınırını; ekip modalı ise Lead
Inspector ile güncel Inspector workload'unu gösterir. Ortak asset sürümü
yenilendiği için normal sayfa yenilemesi eski tek bölümlü Flight Operations
yüzeyi yerine bu durumu yükler.

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

## Ana Cabin Inspection senaryosu

Ana ilk çalıştırma hikayesi artık workbook-derived Cabin Inspection demo
verisine dayanır:

1. CAA Manager, `2026 Cabin Inspection - Fly Namibia` planını görür.
2. CAA Inspector, Fly Namibia Cabin Inspection denetimini açar ve
   `Cabin Inspection` checklist'ini yürütür.
3. Inspector, `EM EQ / PBE` sorusunu `Non-Compliant` işaretler.
4. Lead Inspector, `PF-2026-001` potential finding'ini
   `Finding CAB-2026-001` olarak dönüştürür.
5. Fly Namibia root cause, corrective action, preventive action, target
   completion date ve mock evidence dosya adlarını gönderir.
6. Lead Inspector CAP'i kabul eder; bulgu
   `CAP Accepted - Evidence Required` durumunda kalır.
7. Fly Namibia `Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf` dosya adını mock
   evidence olarak gönderir.
8. Lead Inspector evidence kabul eder ve bulgu kapanır.

Kaynak workbook profili mock/configured checklist kaynağı olarak temsil edilir:
`GALLEY`, `LAV`, `PAX SEAT`, `EM EQ`, `VID+CREW SEAT` ve
`COCKPIT+CAB GEN COND+EXITS` bölümlerinde 126 Cabin Inspection satırı. Demo
hızlı yürüsün diye yalnızca seçilmiş 6 soru çalıştırılır. Workbook canlı import,
hukuki kaynak, gerçek regulatory ingestion kaynağı veya production checklist
repository değildir.

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

Durum: Cabin Inspection frontend-only senaryosu için **verified locally**.

Çalıştırılan syntax kontrolleri geçti:

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

`tests/*.test.js` altındaki tüm doğrudan Node smoke testleri yerelde geçti.

Tarayıcı smoke doğrulaması in-app Browser ile
`http://127.0.0.1:4173/index.html` üzerinden yapıldı. Doğrudan `file://`
navigasyonu browser policy tarafından engellendiği için render kontrolünde
lokal HTTP server kullanıldı. Console warning/error listesi boştu.

Doğrulananlar:

- role-select metni `Finding CAB-2026-001` ve `Cabin Inspection` gösteriyor
- audit calendar, Fly Namibia için `Cabin Safety` altında
  `2026 Cabin Inspection - Fly Namibia` gösteriyor
- checklist runner varsayılan olarak `EM EQ / PBE` sorusunu açıyor ve workbook
  bölüm profilini gösteriyor
- PBE satırını `Non-Compliant` işaretlemek `PF-2026-001` oluşturuyor
- Lead Inspector pending potential finding'i görüyor ve `Level 1 Critical`,
  `Emergency Preparedness`, `Equipment` alanlarıyla `CAB-2026-001` bulgusuna
  dönüştürüyor
- Fly Namibia yalnızca kendi auditee portal verisini görüyor ve CAP detaylarını
  gönderiyor
- CAP kabulü bulguyu kapatmıyor; durum
  `CAP Accepted - Evidence Required` oluyor
- Fly Namibia mock evidence dosya adı olarak
  `Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf` gönderiyor
- evidence kabulü `CAB-2026-001` bulgusunu kapatıyor
- Manager Dashboard, `CAB-2026-001` bulgusunu CAP/evidence alt satırlarıyla
  birlikte yakın zamanda kapanmış scenario update olarak gösteriyor
- `Comment to Auditee` ve `Internal CAA Note` review modal'larında ayrı kalıyor
- backend, veritabanı, API, gerçek authentication, gerçek upload/storage,
  gerçek regulatory ingestion, gerçek AI servisi, production audit log,
  framework migration veya deployment eklenmedi

Final Cabin Inspection browser evidence özeti:

```text
potentialFinding: PF-2026-001
convertedFinding: CAB-2026-001
afterConvert: WAITING_CAP
afterSubmitCap: CAP_SUBMITTED
afterAcceptCap: EVIDENCE_REQUIRED
afterSubmitEvidence: EVIDENCE_SUBMITTED
afterAcceptEvidence: CLOSED
managerDashboard: CAB-2026-001 visible as Closed with CAP/evidence rows
mockEvidenceFilename: Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf
console errors/warnings: []
browser preview: http://127.0.0.1:4173/index.html
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
- Lead Inspector -> Department Manager -> General Manager intermediate review
  -> Executive Director final decision zinciri, `Final Report Issued` ve
  `Final Report Locked` durumuna kadar.
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

Güncel planning onay zinciri `Department Manager -> Finance Review -> GM Review
-> Executive Director` şeklindedir. Finance ve GM revision return kararları
Department Manager'a gider; düzeltilen kayıt Finance aşamasından yeniden geçer.
Executive Director onayından sonra Planning paneli görünür biçimde `GM
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
- Auditee kullanıcıları yalnızca Fly Namibia portal verisini görür; Internal
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

### Daha derin table-first workbench sadeleştirmesi - 2026-07-02

Durum: frontend-only daha derin table-first geçişi için **lokal olarak
doğrulandı**.

Bu geçiş, paylaşılan work-item satırı etrafında kalan kart/dashboard
tekrarlarını kaldırdı ve 2026-07-02 screenshot QA setindeki bilinen iki layout
hatasını düzeltti. Değişen dosyalar: `css/styles.css`, `js/views.js`,
`js/work-items.js`. Yeni izlenen dosya eklenmediği için `MANIFEST.md`
değişmedi.

Ekran değişiklikleri:

- **Inspector My Inspections** — ana inspector yüzeyi dört KPI kartı ile
  Assigned Inspections, CAP Reviews ve Draft Reports tablolarına sadeleştirildi.
  Guardrail pill'leri, attention strip ve hızlı aksiyon satırı bu ana ekranda
  saklandı.
- **Audit Work Queue** — gereksiz attention strip kaldırıldı; Active/Completed
  filtre chip'leri satır sayılarını doğrudan taşıyor.
- **Checklist Runner** — progress kartı tek satırlık progress bandına
  dönüştürüldü (demo senaryo ipucu küçük metin olarak korundu). Mobilde aktif
  soru paneli artık soru tablosunun üstünde.
- **Finding dosyası** — next-action bandı artık Due Date gösteriyor; lifecycle
  stepper kutu olmadan, closure kuralı notuyla birlikte; ölü (kullanılmayan)
  Internal CAA Notes render bloğu silindi (gating'li panel tek render yolu
  olarak kaldı).
- **Auditee My CAA Requests** — attention pill'leri auditee'nin aksiyon
  alabileceği dörde indirildi (CAP required, Evidence required, Due Soon,
  Overdue); sayfa amacı artık "CAA'nın kuruluşunuzdan ne istediği ve ne
  zamana kadar" diyor.
- **Manager Dashboard** — OHI guardrail callout kutusu, aynı ifadeyle tek
  satırlık guardrail notuna dönüştürüldü.
- **Organization Risk Profile** — tek bir risk header bandı (skor, band,
  driver'lar, regulatory trace, operating-context bilgileri) ve tam genişlik
  Findings / Audit History tablolarıyla yeniden yapılandırıldı. 2026-07-02 QA
  setindeki tek desktop 1920px yatay taşma böylece düzeltildi.
- **Paylaşılan work item satırı** — neredeyse her kuyrukta `Status` sütununu
  tekrarlayan `Lifecycle` sütunu kaldırıldı; benzersiz olan risk band
  değerleri satır alt başlıklarına taşındı. Status badge'leri ve priority
  pill'leri artık hücre dışına taşmak yerine hücre içinde sarıyor.

Mobil desen: 640px altında paylaşılan work-queue tabloları, tablo kavramını
koruyan yığılmış satırlar olarak render ediliyor — priority rayı, priority
pill ve status badge, başlık, kalın next action, due metni ve satır aksiyon
butonu. Owner yalnızca doluysa gösterilir; organizasyon ve diğer ikincil
alanlar satırın detay sayfasında bir dokunuş uzaklıkta kalır. Satır tıklaması
aynı detay rotalarını açmaya devam ediyor.

Doğrulama (lokal olarak doğrulandı):

- Tüm `js/*.js` dosyaları için `node --check` geçti.
- `tests/` altındaki 17 Node smoke testinin tamamı geçti
  (`table-first-workbench-smoke`, `demo-boundary-smoke` ve
  `checklist-comment-render-smoke` dahil).
- Eski table-first lifecycle smoke path artık yukarıda belgelenen Cabin
  Inspection senaryosu ile superseded durumdadır: `PF-2026-001`,
  `CAB-2026-001` bulgusuna dönüşür; CAP kabulü evidence gereksinimini korur;
  evidence kabulü bulguyu kapatır ve evidence version geçmişi korunur.
- Auditee gizliliği yeniden doğrulandı: portal render'ında `Internal CAA
  Note`, başka kuruluş, inspector workload veya internal risk scoring yok.
- Değişikliklerden sonra taze Playwright screenshot seti alındı:
  `qa/screenshots/playwright-2026-07-02/` (git tarafından ignore edilir) —
  70 rota x desktop 1920x1080 ve mobile 390x844, 140 capture, 0 capture
  hatası, 0 console uyarı/hata, 0 desktop taşma (önceden 1), 0 mobile taşma.

Bilinen kalan UX notları (blocker değil): özel admin/config tabloları
(question bank, regulatory library, audit log, users) mobilde yığılmış satır
yerine hâlâ yatay kaydırma kullanıyor; kapalı satırlarda hem `Closed`
priority pill hem `Closed` status badge görünüyor — bilinçli ama hafif
tekrarlı.

### Department ve General Manager workspaces - 2026-07-10

Durum: frontend-only demo için **lokal olarak doğrulandı**; üretime hazır olma
iddiası yoktur.

Department Manager tam sekiz rotaya sahiptir: Dashboard, Audits, Reports
Approval, Risk Dashboard, Inspection Team, Findings Review, CAP Monitoring ve
Checklist Management. General Manager tam beş rotaya sahiptir: Dashboard,
Report Approvals, Departments, Risk Dashboard ve Settings.

Doğrulanan Department Manager davranışları; Fly Namibia Findings Review,
manager-scope team/member/schedule/message aksiyonları, ayrı Preliminary ve
Final Report kararları, tarayıcıda üretilen Final Report, Executive Summary ve
Team Assignment PDF'leri, beş sekmeli ellipsis CAP drawer'ı, tarayıcı-local
checklist package/version/section/question yönetimi ve risk filtreleri/CSV
export içerir. CAP kabulü Finding'i kapatmaz. Department Manager Final Report
onayı raporu yalnızca ileri gönderir; issue veya lock etmez.

Doğrulanan General Manager davranışları; kısıtlı Dashboard, Departments ve
cross-department Risk görünümleri, yorum zorunlu return ve Executive Director'a
intermediate advance içerir. Aşağıdaki remediation, önceki GM-final-authority
davranışını supersede eder: GM Final Report'u issue, sign veya lock edemez.

Taze doğrulama kanıtı:

- Responsive ve PDF testleri dahil 11 odaklı manager smoke testi geçti.
- `node --test tests/*.test.js`: 31 test geçti, 0 hata.
- Tüm üst seviye `js/*.js` dosyaları için `node --check` geçti.
- `node tests/demo-boundary-smoke.test.js` ve `git diff --check` geçti.
- In-app Browser etkileşimleri `1536x864` ve `390x844` boyutlarında geçti;
  değişen yollarda console warning/error yoktu ve ölçülen page-level mobil
  yatay taşma yoktu.
- Referans/current görsel karşılaştırmaları açık P0/P1/P2 bulgusu olmadan
  geçti; kanıt defteri `design-qa.md` içinde `final result: passed` durumunda.
- Üç taze indirme PDF 1.4, tek A4 sayfa, şifresiz ve `/usr/bin/file`, bundled
  `pdfinfo`, sequential render ve görsel inceleme altında temizdi.

Bunlar mock ve tarayıcı-local kontrol/artifact'lardır. Backend, veritabanı,
API, gerçek authentication/authorization enforcement, gerçek file storage,
gerçek notification delivery, production reporting engine, e-signature,
framework migration veya deployment eklenmedi.

### Inspector, report, Service Provider ve governance remediation - 2026-07-10

Kanıt durumu: **demo-only** ve **verified locally**. External production,
release, real-identity, legal-signature, enforcement-execution ve deployment
kanıtı: **not run**. **production-readiness not claimed**.

Uygulanan ve lokal doğrulanan kapsam:

- Lead Inspector active internal Inspector ekleyebilir, duplicate engeller,
  ayrı Cabin question batch'lerini farklı team member'lara atar ve mapping'leri
  Audit ID/Question ID ile korur; release edilen demo notification assignee'ye
  gider.
- Inspector execution selected Fly Namibia Cabin Inspection ve altı
  source-derived section'ı çözer. İlk submit tek timestamp kaydeder, Inspector
  rolünde kalır, success/status modal açar, read-only submitted checklist'i
  korur ve Lead Inspector redirect olmadan My Assignments'a döner.
- Preliminary Reports mevcut Report ID'leri aynı `Inspection & Findings`
  workflow'unda açar; Findings Review görünür ve selected identity list/detail/
  preview navigation boyunca sabit kalır.
- Service Provider navigation Corrective Actions (CAP), Preliminary Reports,
  Final Reports, Messages, Documents ve Settings ile sınırlıdır. List/detail/
  preview/download selector'ları Fly Namibia scope'ta kalır; Internal CAA Note,
  enforcement deliberation, internal risk, workload, başka kuruluş ve
  unreleased report render edilmez.
- Finance tek Finance Review workspace'e açılır ve yalnız Approve Budget ile
  Return for Revision kararlarını gösterir. Güncel düzeltilmiş contract altında
  approval GM Review'a ilerler; return Department Manager'a gider ve Finance
  planı sign/release edemez.
- Executive Director Dashboard, Planning, Final Reports, Notifications ve
  Settings kullanır. Plan approval `Approve & Sign (Demo)` ile çalışır ve next
  action `GM / Release to Department` kalır. Uygun Final Report'a mock approval
  mark ekleyip issue/lock edebilen tek rol ED'dir.
- Final Report review, template, preview, print ve browser-generated demo PDF,
  selected report/audit/team/Finding state'ini kullanır. Enforcement seçenekleri
  yalnız recommendation/referral'dır; sanction veya closure side effect yoktur.
- CAP acceptance Finding closure değildir; report approval gerekli CAP,
  Evidence veya verification işini bypass etmez.

Doğrulama kanıtı (**verified locally**):

- Her `js/*.js` dosyası için `node --check` geçti.
- `node --test tests/*.test.js`: 34 test geçti, 0 hata.
- Focused Service Provider, Finance, Executive Director, assignment, Inspector
  submission, report identity/authority, PDF, responsive ve demo-boundary
  testleri geçti.
- `git diff --check` geçti.
- In-app Browser QA `1536x864`, `1366x768`, `1024x768` ve `390x844`
  boyutlarında geçti: console warning/error yok, ölçülen page-level horizontal
  overflow yok, primary control clipping yok, mobile task order doğru, selected
  ID'ler stabil ve state/navigation/modal/preview/download aksiyonları çalışıyor.
- Cleanup kontrolünde leftover temporary HTTP server veya ayrıca başlatılmış
  test Chrome process bulunmadı.

Açıkça **not run** olan kanıtlar: backend/database integration; gerçek
authentication/authorization; gerçek signature identity veya legal validity;
immutable production audit log; gerçek file storage; notification delivery;
production report service; gerçek enforcement execution; release, deployment,
penetration, accessibility-certification veya stakeholder-acceptance testi.
Open production signing/enforcement authority contract
`docs/exec-plans/tech-debt-tracker.md` içinde izlenir.

### Stakeholder readiness final remediation checkpoint — 2026-07-10

Bu checkpoint durumu: **demo-only**. Canonical report identity, GM/ED authority, Service Provider organization privacy, state-backed Lead Final yolları, exact Preliminary decision, exact assignment/execution ID'leri, responsive static containment, modal focus containment ve changed visible-control behavior focused Node/static kontrollerle **verified locally**. Exact assignment package altı Cabin execution Question ID'sini kullanır; başka Inspector'a atanmış question read-only render edilir. `PR-2026-018` ve `FR-2026-018` distinct canonical artifact'lardır; report decision yalnız selected artifact'ı mutate eder.

Fresh final gate'ler **verified locally**: tüm top-level `js/*.js` dosyaları `node --check` kontrolünü geçti; Tasks 1-8 altında adı geçen 18 focused komut ayrı ayrı geçti; `node --test tests/*.test.js` 44/44 geçti ve failed/cancelled/skipped/todo sayıları sıfırdı; `git diff --check` geçti.

Bu remediation checkpoint'i için fresh isolated rendered QA `1536x864`, `1366x768`, `1024x768` ve `390x844` boyutlarında **verified locally**. Page width her viewport ile eşleşti; remediated report container'larında ölçülen nested horizontal overflow ve primary-action clipping yoktu; console warning/error sayısı sıfırdı. Rendered akış Department Manager -> GM -> Executive Director handoff, GM return validation ve forward-only authority, ED preview/referral/reject/return validation ve issue, open-Finding preservation, exact altı-question multi-Inspector assignment/release, Inspector scoped execution/submission ve altı Service Provider route'unun tamamını kapsadı. `FR-2026-018`, Lead list/readiness/preview boyunca selected kaldı ve browser PDF action `Fly_Namibia_Final_Report_FR-2026-018.pdf` sonucunu bildirdi. Generated PDF lines ve canonical selected content ayrıca focused Node testleriyle doğrulandı. Attachment modal focus'u içeride kaldı, Escape modalı kapattı ve focus `Manage Attachments` kontrolüne döndü. İzole browser tab'ları ve local QA server doğrulama sonrasında kapatıldı; cleanup process araması ayrıca başlatılmış QA process kalıntısı bulmadı.

External production, release, identity, legal-signature, enforcement, deployment, real-device ve external stakeholder-acceptance kanıtı **not run** kalır. Kapsam **demo-only**; **production-readiness not claimed**.

### Stakeholder feedback remediation checkpoint — 2026-07-15

Kanıt durumu: **demo-only** ve **verified locally**. Bu checkpoint production
readiness iddiasında bulunmaz.

Dokuz stakeholder maddesinin tamamı frontend-only demo içinde uygulandı:

1. Inspector My Assignments artık operational KPI, filtre ve assignment table
   ile başlıyor; tekrar eden Next Inspection dossier kaldırıldı.
2. Lead Preliminary Inspection & Findings; desktop, tablet ve mobile
   genişliklerde workflow frame içinde kalıyor.
3. Preliminary Finding içeriğinde CAP/lifecycle status kaldırıldı; report-level
   Draft/Review status görünür kalıyor.
4. Preliminary attachment filename ve description metinleri overlap olmadan
   satır kırıyor.
5. Final Report organization/CAP ve key-Finding metric'leri compact overview
   kullanıyor.
6. Reset state, `AUD-2026-002` / SkyCargo Air için decision-ready GM report
   `FR-2026-021` kaydını seçiyor; open, return validation ve forward çalışıyor.
7. Reset state, `AUD-2026-003` / BlueWing Aviation için decision-ready ED report
   `FR-2026-022` kaydını seçiyor; Approve, Return, Reject ve recommendation-only
   Enforcement Review referral seçenekleri görünür.
8. Planning zinciri `Department Manager -> Finance Review -> GM Review ->
   Executive Director` olarak çalışıyor. Finance ve GM revision return kararları
   Department Manager'a gidiyor; düzeltilen plan Finance'tan yeniden geçiyor.
9. Reset state Finance Review içinde reconciled USD 12,500 sample budget ile
   `PLAN-2026-Q3-CABIN` gösteriyor. Finance approval GM'e, GM forward ED'ye
   ilerliyor; ED approval sonrasında next action `GM Release to Department`
   kalıyor.

Identity ve authority sınırları korundu. GM forward bir Final Report'u issue,
mock-sign veya lock etmez. ED approval yalnız exact selected `FR-2026-022`
artifact'ını demo mock approval mark ile issue/lock etti; tek open Finding açık
kaldı ve owner `BlueWing Aviation Service Provider Portal` oldu. CAP acceptance
Finding closure değildir; report approval CAP, Evidence, verification veya
authorized closure yolunu bypass etmez. Enforcement referral
recommendation-only kalır. Pre-v9 browser-local state migration, ilgisiz saved
record'ları overwrite etmeden Finance aşamasını ekler ve unreviewed budget'ı
Finance ötesine atlatmaz.

Fresh automated kanıt (**verified locally**):

- 11 `js/*.js` dosyasının tamamı `node --check` kontrolünden geçti.
- Task 7 kapsamındaki 15 focused komut ayrı ayrı geçti. Direct stakeholder
  regression komutu 21/21 geçti.
- `node --test tests/*.test.js` 55/55 geçti; failed, cancelled, skipped ve todo
  sayıları sıfırdı.
- `git diff --check` geçti.

Fresh isolated in-app Browser QA `1536x864`, `1366x768`, `1024x768` ve
`390x844` boyutlarında **verified locally**. Inspector, Lead Preliminary/Final,
GM, ED, Finance ve Service Provider akışları meaningful content render etti;
decision ve state change boyunca exact ID'ler stabil kaldı. Page width viewport
ile eşleşti; ilgili nested table/card horizontal overflow üretmedi; primary
control, status, filename, description ve decision panel clipping/overlap
göstermedi; framework overlay yoktu; ilgili console warning/error sayısı
sıfırdı. Finance return planı Department Manager'a taşıdı; Finance approval,
GM forward, ED approval ve post-ED GM Release uygulandı. Service Provider DOM
Fly Namibia scope'ta kaldı; SkyCargo Air, BlueWing Aviation, `FR-2026-021`,
`FR-2026-022`, Internal CAA Note, Inspector workload veya internal risk
göstermedi. Browser tab'ları ve isolated server kapatıldı; cleanup kontrolünde
task-owned test process kalıntısı bulunmadı.

External production, release, deployment, real-device, real identity/signature,
real authorization, backend/database, real upload/storage, real notification,
production reporting/audit-log, enforcement-execution, legal/regulatory ve
stakeholder sign-off kanıtı **not run**. Kapsam **demo-only**;
**production-readiness not claimed**.

### Department planning command-center checkpoint — 2026-07-17

Kanıt durumu: **demo-only** ve **verified locally**. Department Manager artık
hem sidebar hem dashboard task workspace içinde Planning erişimine sahip;
manager navigation dokuz task-based route içeriyor. General Manager ve
Department Manager tarafından paylaşılan Planning ekranı, sığ command card ve
ikinci büyük plan hero tekrarının yerine yoğun bir Planning Command Center
kullanıyor. Plan dayanağı, organization/department, risk driver, budget ve
proposed inspector'lar, target/readiness, current owner, next action, blocking
reason ve yapılandırılmış Department Manager -> Finance Review -> GM Review ->
Executive Director decision path tek hiyerarşide görünür.

Generic sekiz kolonlu Planning Workbench tablosu; white status row'ları,
semantic sol rail'leri, inline queue toplamları, açık decision context'i, ay
target'ları ve her talep için tek role-aware action içeren compact Planning
Queue ile değiştirildi. Reset state artık üç ayrı department talebi seed eder:
Finance bekleyen Cabin Safety, GM bekleyen Flight Operations ve revizyon için
Department Manager'a dönmüş Airworthiness. Her row seçimi Command Center'ı,
selected state'i, target planı ve ilgili Overview veya Approval tab'ını
günceller; eski single-row browser state bu üç-department queue'ya migrate olur.

Overview; approval rail'i tekrar etmeden seeded budget allocation, available
plan budget, remaining annual budget, resource line'ları, proposed team ve
preparation detail katmanını göstermeye devam eder. Role-aware approval,
release, preparation, history, mock-only sınırlar ve client-side persistence
davranışı korunur.

Fresh automated kanıt (**verified locally**):

- 11 `js/*.js` dosyasının tamamı `node --check` kontrolünden geçti.
- `node --test tests/*.test.js` 60/60 geçti; failed, cancelled, skipped ve todo
  sayıları sıfırdı.
- Focused manager navigation, Planning workspace, rendering, responsive, table
  ve General Manager smoke kontrolleri geçti.
- `git diff --check` geçti.

General Manager ve Department Manager Planning için fresh in-app Browser QA,
kabul edilen konseptin native `1495x1052` boyutunda ve `390x844` boyutunda
**verified locally**. Page width viewport ile eşleşti; üç queue row'u da ölçülen
horizontal overflow üretmedi; responsive row'lar tek kolona indi ve queue
action'ları en az 44 px yüksekliği korudu. Department Manager Planning hem
sidebar hem dashboard task navigation içinde görünürdü. Flight Operations
seçimi Command Center'ı güncelledi; GM `Review now` action'ı ve Department
Manager Airworthiness `Review & submit` action'ı seçili planın Approval tab'ını
açtı. Browser console warning/error sayısı sıfırdı.

Backend/database integration, gerçek authorization, production audit log,
gerçek document storage, notification delivery, deployment, real-device,
accessibility certification ve stakeholder sign-off kanıtları **not run**
kalır. Kapsam **demo-only**; **production-readiness not claimed**.

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
