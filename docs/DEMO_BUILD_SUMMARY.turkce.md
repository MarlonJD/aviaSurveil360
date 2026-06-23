# AviaSurveil360 — Demo Yapı Özeti (Türkçe)

> İngilizce kanonik sürüm: [`DEMO_BUILD_SUMMARY.md`](DEMO_BUILD_SUMMARY.md).
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
| `css/styles.css` | V2 ekranları, Regulatory Trace, offline outbox, AI taslak kontrolleri ve 390px mobil düzeni. |
| `js/data.js` | Backend'e yakın sahte kayıtlar, V2 seed verileri, açık status değerleri ve izole `localStorage` demo saklama yardımcıları. |
| `js/helpers.js` | Seçiciler, status yardımcıları, regulatory trace lookup, outbox yardımcıları ve demo badge yardımcıları. |
| `js/views.js` | Mevcut ekranlar, dokuz V2 ekranı ve yeniden kullanılabilir Regulatory Trace görünümü. |
| `js/app.js` | V2 navigasyonu, merkezi kalıcılık çağrıları, simüle offline geçişleri, AI karar geçişleri ve yeni kayıtlar için stabil ID üretimi. |
| `docs/DEMO_BUILD_SUMMARY.md` | İngilizce kanonik özet. |
| `docs/DEMO_BUILD_SUMMARY.turkce.md` | Bu Türkçe paydaş özeti. |

Backend, veritabanı, API, framework geçişi, gerçek dosya saklama, gerçek AI
servisi, gerçek regülasyon içe aktarma veya gerçek bildirim servisi eklenmedi.

---

## Roller ve ekranlar

Mevcut roller korunmuştur:

1. **CAA Manager** — yönetim gözetimi, denetim planı, bulgular, kuruluşlar, raporlar.
2. **CAA Inspector** — denetim/checklist yürütme, bulgu açma, CAP/kanıt inceleme.
3. **Auditee (Airline XYZ)** — kendi bulguları, CAP gönderimi, kanıt dosya adı gönderimi.
4. **Admin Preview** — şablonlar, kullanıcılar, ayarlar, audit log, regulatory preview.

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
node --check js/views.js
node --check js/app.js
```

Playwright ile `index.html` üzerinde tarayıcı smoke testi yapıldı; konsol hatası yok.
Doğrulananlar:

- dokuz V2 ekranının role uygun navigasyonla erişilebilir olması
- mevcut Operator Audit senaryosunun uçtan uca çalışması
- CAP kabulünden sonra `OPS-2026-001` durumunun `EVIDENCE_REQUIRED` kalması
- kanıt kabulünden sonra `OPS-2026-001` durumunun `CLOSED` olması
- auditee görünümünde `Internal CAA Notes` sayısının `0` olması
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
```

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
- `README.md` ve `MANIFEST.md` halen eski Markdown-only paket anlatımını içerir;
  runnable prototype harici paydaşlara devredilecekse ayrı bir package-truth
  cleanup ile güncellenmelidir.
