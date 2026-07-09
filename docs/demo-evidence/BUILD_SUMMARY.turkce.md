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
| `index.html` | Demo şeridi artık tarayıcıya kayıtlı frontend-only demo olduğunu belirtir; Cabin Inspection senaryosu için asset query token güncellendi. |
| `css/styles.css` | Rol bazlı çalışma alanları, sadeleştirilmiş Inspector My Inspections ana ekranı, sade Inspector chrome, SMS checklist çalışma alanı, Regulatory Trace, offline outbox, AI taslak kontrolleri ve 390px mobil düzeni. |
| `js/data.js` | Backend'e yakın sahte kayıtlar, workbook-derived Cabin Inspection seed checklist, açık status değerleri ve izole `localStorage` demo saklama yardımcıları. |
| `js/helpers.js` | Seçiciler, status yardımcıları, Cabin/PBE regulatory trace lookup, outbox yardımcıları ve demo badge yardımcıları. |
| `js/work-items.js` | Audit, finding, CAP/evidence alt satırları, approval, planning ve admin kuyrukları için ortak table-first iş öğesi hazırlama katmanı. |
| `js/views.js` | Mevcut ekranlar, Cabin Inspection checklist runner metinleri, Lead Inspector potential finding kararları, Service Provider Portal çerçevesi, yeniden kullanılabilir Regulatory Trace görünümü ve table-first iş kuyrukları. |
| `js/app.js` | Rol bazlı deneyim navigasyonu, merkezi kalıcılık çağrıları, Cabin Inspection finding/CAP/evidence geçişleri, simüle offline geçişleri, AI karar geçişleri, stabil ID üretimi ve checklist satır seçimi. |
| `docs/demo-evidence/BUILD_SUMMARY.md` | İngilizce kanonik özet. |
| `docs/demo-evidence/BUILD_SUMMARY.turkce.md` | Bu Türkçe paydaş özeti. |
| `tests/*.test.js` | Cabin Inspection hero path, checklist management, lifecycle geçişleri, demo sınırları ve mevcut workbench/governance yüzeyleri için güncellenmiş smoke kapsamı. |

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
3. **Auditee (FlyNamibia)** — Service Provider Portal; kendi bulguları, CAP
   gönderimi, kanıt dosya adı gönderimi, CAA’ye görünür yorumlar ve closure
   status.
4. **Admin Preview** — şablonlar, kullanıcılar, ayarlar, audit log ve
   regulatory preview.

Inspector ana ekranı artık sadeleştirilmiş **My Inspections** çalışma alanıdır.
Bu ana yüzeyde guardrail pill satırı, attention strip ve hızlı aksiyon buton
satırı saklanır. İlk görünüm dört KPI kartına ve üç sade tabloya odaklanır:
Assigned Inspections, CAP Reviews ve Draft Reports.

**My Inspections** içindeki **Open** aksiyonu artık Inspector'a özel sade
**SMS Oversight Audit** çalışma alanına gider. Bu ekran audit başlığını,
SkyCargo tarzı SMS checklist özetini, checklist bölümlerini, compliance
kontrollerini, yorum kutularını, sahte attached-file adlarını ve checklist
indirme, draft kaydetme, Lead Inspector'a gönderme demo aksiyonlarını gösterir.
Bu aksiyonlar frontend-only kalır; yalnızca demo state / ekran içi mesaj üretir.

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

1. CAA Manager, `2026 Cabin Inspection - FlyNamibia` planını görür.
2. CAA Inspector, FlyNamibia Cabin Inspection denetimini açar ve
   `Cabin Inspection` checklist'ini yürütür.
3. Inspector, `EM EQ / PBE` sorusunu `Non-Compliant` işaretler.
4. Lead Inspector, `PF-2026-001` potential finding'ini
   `Finding CAB-2026-001` olarak dönüştürür.
5. FlyNamibia root cause, corrective action, preventive action, target
   completion date ve mock evidence dosya adlarını gönderir.
6. Lead Inspector CAP'i kabul eder; bulgu
   `CAP Accepted - Evidence Required` durumunda kalır.
7. FlyNamibia `FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf` dosya adını mock
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
- audit calendar, FlyNamibia için `Cabin Safety` altında
  `2026 Cabin Inspection - FlyNamibia` gösteriyor
- checklist runner varsayılan olarak `EM EQ / PBE` sorusunu açıyor ve workbook
  bölüm profilini gösteriyor
- PBE satırını `Non-Compliant` işaretlemek `PF-2026-001` oluşturuyor
- Lead Inspector pending potential finding'i görüyor ve `Level 1 Critical`,
  `Emergency Preparedness`, `Equipment` alanlarıyla `CAB-2026-001` bulgusuna
  dönüştürüyor
- FlyNamibia yalnızca kendi auditee portal verisini görüyor ve CAP detaylarını
  gönderiyor
- CAP kabulü bulguyu kapatmıyor; durum
  `CAP Accepted - Evidence Required` oluyor
- FlyNamibia mock evidence dosya adı olarak
  `FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf` gönderiyor
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
mockEvidenceFilename: FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf
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
- Lead Inspector -> Department Manager -> Executive Director / GM rapor onay
  zinciri, `Final Report Issued` ve `Final Report Locked` durumuna kadar.
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
- Auditee kullanıcıları yalnızca FlyNamibia portal verisini görür; Internal
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
