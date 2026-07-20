# AviaSurveil360 — Sayfa Bazlı UI Ekran Görüntüsü Denetimi

> İngilizce kanonik sürüm: [`UI_SCREEN_AUDIT_2026-07-19.md`](UI_SCREEN_AUDIT_2026-07-19.md).
> Bu rapor paydaş aktarımı içindir; çakışma olursa İngilizce sürüm esastır.

**Denetim tarihi:** 19 Temmuz 2026
**Kapsam:** 86 ekran × masaüstü (1440 px), tablet (1024 px), mobil (390 px) = 258 görünüm.
**Güncel sonuç:** 19 Temmuz remediation sonrasında 86 **Geçti**, 0 **Sorun**.
**Korunan başlangıç sonucu:** Remediation öncesinde 76 **Geçti**, 10 **Sorun**.
**Sınır:** Bu çalışma frontend-only demo için yerel ekran görüntüsü, render ve değişen kontrol etkileşim kanıtıdır. Ekran okuyucu, otomatik kontrast oranı ve gerçek cihaz testleri ayrı kontrollerdir ve **not run** durumundadır.

## Kanıt seti

- Değişmeyen 83 ekran için 18 Temmuz tam Playwright seti: `/private/tmp/aviasurveil360-ui-audit-2026-07-18/` (249 kullanılan görünüm).
- Değişen/yeni `Inspector Assignments`, `Executive Planning` ve `Executive Preliminary Reports` için 19 Temmuz delta seti: `/private/tmp/aviasurveil360-ui-qa-2026-07-19-after/` (9 kullanılan `*-viewport.png` görünümü).
- 18 Temmuz koşusunda 0 capture hatası, 0 console sorunu ve 0 route eşleşme hatası kaydedildi.
- 19 Temmuz delta setindeki bozuk full-page çıktılar değerlendirmeye alınmadı; yalnızca doğrulanmış viewport görüntüleri kullanıldı.

## Remediation sonucu — 19 Temmuz 2026

Durum: **demo-only** ve **verified locally**.

86 route'luk envanter remediation sonrasında desktop `1440x1000`, tablet
`1024x900` ve mobile `390x844` boyutlarında yeniden çekildi. 258 screenshot'ın
tamamı kabul edildi ve incelendi. Korunan başlangıç denetiminde Sorun olarak
kaydedilen 10 route artık üç viewport'un tamamında geçiyor:

1. Inspector AI Inspector Assistant
2. Lead Inspector Assigned Audits
3. Lead Inspector Preliminary Reports
4. Lead Inspector Assign Checklist Questions
5. Department Manager Inspection Team
6. Department Manager Findings Review
7. Department Manager Checklist Management
8. Executive Director Dashboard
9. Admin Question Bank
10. Admin Checklist Builder

Taze yerel kanıt
`/private/tmp/aviasurveil360-ui-audit-remediation-2026-07-19/` altındadır:

- `screenshots/`: 258 kabul edilen viewport screenshot'ı.
- `contact-sheets/`: 27 rol ailesi/viewport sayfası; tamamı incelendi.
- `capture-results.json`: route, viewport, heading, rol, overflow, console,
  screenshot, interaction ve erişilebilirlik sınırı sonuçları.
- `SUMMARY.md`: kısa kanıt özeti.

Değiştirilmeden kaydedilen matris sonucu:

- 86 route × 3 viewport = 258/258 kabul edilen screenshot.
- 0 capture error ve 0 console warning/error.
- 0 route mismatch, 0 role mismatch ve 0 eksik heading.
- 0 document horizontal overflow failure ve 0 istenmeyen nested overflow
  failure. Dekoratif rapor logosu maskeleri ve bilinçli horizontal scroller'lar
  defect sayılmak yerine ayrıca incelendi.
- Card/detail navigation, manager seçim/menu davranışları, multiline edit/save,
  checklist Add/Up/Down, Executive report açma ve AI Finding return context
  dahil 14/14 değişen kontrol interaction senaryosu geçti.
- Browser Tab/focus kanıtı değişen 56 action target'ın tamamında geçti; visible
  focus korundu.
- Son mobile denetim, görünür değişen 41 action target'ı kapsadı; ölçülen en
  küçük boyut 44 × 44 CSS pixel oldu.
- Ekran okuyucu testi: **not run**.
- Otomatik kontrast denetimi: **not run**.
- Gerçek cihaz testi ve tam erişilebilirlik uygunluk sertifikasyonu: **not run**.

İzole in-app Browser oturumu ve yerel server kapatıldı. Cleanup process araması
task-owned server, Playwright, Puppeteer, webdriver, headless Chrome veya
remote-debugging Chrome kalıntısı bulmadı. Geçici QA-only deep-route wrapper'ı
çekim sonrasında kaldırıldı. Bu kanıt production readiness veya tam
erişilebilirlik uygunluğu iddia etmez.

## Değerlendirme ölçütü

- **Geçti:** Ana amaç, hiyerarşi ve responsive yerleşim okunabilir; bloke eden bir görsel kusur yok.
- **Sorun:** Bilgi veya aksiyon kesiliyor, ekran erişilebilir değil ya da responsive davranış görevi belirgin biçimde zayıflatıyor.
- **Öneri:** Bir sonraki iyileştirme adımı; `Geçti` ekranlarda da kalite artışı için verilebilir.

## Korunan remediation öncesi ekran bulguları

Aşağıdaki tablo, remediation girdisi olan özgün 76 Geçti / 10 Sorun denetimini
tarihsel kayıt olarak korur. Güncel sonuç yukarıdaki 86 Geçti / 0 Sorun
kaydıdır.

| # | Rol | Ekran | Durum | Sorun | Öneri |
|---:|---|---|---|---|---|
| 1 | Global | Role selection / login | Geçti | Mobil ilk görünümde rol seçeneklerinin bir bölümü aşağıda kalıyor. | Önerilen rolü ilk görünümde tut; diğer rollerin devam ettiğini görsel ipucuyla belirt. |
| 2 | CAA Inspector | My Assignments | Geçti | Önceki mobil tablo taşması güncel kart düzeninde giderilmiş. | Mobil kartlarda Due Date ve next action bilgisini aynı öncelik sırasıyla koru. |
| 3 | CAA Inspector | Findings | Geçti | Dossier yapısı mobilde uzun, ancak içerik kesilmiyor. | Mobilde seçili finding için yapışkan next action özeti ekle. |
| 4 | CAA Inspector | Messages | Geçti | Belirgin görsel sorun yok. | Okunmamış mesaj ve yanıt bekleyen konuşma ayrımını güçlendir. |
| 5 | CAA Inspector | Calendar / Audit Queue | Geçti | Mobilde takvim ve kuyruk ardışık olarak uzunlaşıyor. | Bugünkü denetimleri üstte sabit kısa bir listeyle öne çıkar. |
| 6 | CAA Inspector | Reports | Geçti | Belirgin görsel sorun yok. | Draft / submitted / returned durumlarını renk dışında metin ve ikonla da ayır. |
| 7 | CAA Inspector | Audit Detail | Geçti | Detay ekranı mobilde uzun. | Owner, next action ve Due Date özetini mobilde üstte tut. |
| 8 | CAA Inspector | Checklist Runner | Geçti | Soru tablosu küçük ekranda yoğun, ancak ana akış kullanılabilir. | Soru seçimini mobilde kart veya kontrollü yatay kaydırma göstergesiyle netleştir. |
| 9 | CAA Inspector | Finding Detail | Geçti | Çok bölümlü dossier mobilde uzun. | Status, owner, next action ve Due Date bloğunu yapışkan özet olarak koru. |
| 10 | CAA Inspector | Closure Report Preview | Geçti | Belirgin kesilme yok; rapor doğal olarak uzun. | Mobilde bölüm atlama bağlantıları ekle. |
| 11 | CAA Inspector | AI Inspector Assistant | Sorun | Render edilen ekran mevcut, fakat görünür Inspector navigasyonundan erişim noktası yok. | İlgili finding/checklist bağlamından açık bir giriş ekle veya ekranı görünür akıştan kaldır. |
| 12 | CAA Inspector | Profile | Geçti | Yüzey gereğinden boş ve ikincil bilgiler zayıf gruplanmış. | Rol, department ve notification tercihlerini daha kompakt bir hesap özeti içinde topla. |
| 13 | Lead Inspector | Assigned Audits | Sorun | Mobilde denetim tablosunun sağ kolonları görünüm dışında kalıyor; satır görevi tam okunmuyor. | Mobil satırları audit kartına dönüştür; organization, status, Due Date ve action alanlarını açıkça göster. |
| 14 | Lead Inspector | Preliminary Reports | Sorun | Mobilde 1080 px genişliğindeki tablo içeriği kırpılıyor; organization ve sonraki kolonlar görünmüyor. | Mobil kart görünümü kullan veya yatay kaydırma alanını görünür kaydırma ipucu ve sabit ilk kolonla sun. |
| 15 | Lead Inspector | Preliminary Report Workflow | Geçti | Akış mobilde çok uzun. | Aşama, owner ve sıradaki kararı gösteren yapışkan progress özeti ekle. |
| 16 | Lead Inspector | Final Reports | Geçti | Yoğun liste mobilde taramayı yavaşlatıyor. | Öncelikli onay kuyruğunu Due Date ve status'a göre üstte özetle. |
| 17 | Lead Inspector | Final Report Readiness | Geçti | Kontrol listesi uzun ama içerik korunuyor. | Eksik maddeleri tek bir “blocking items” özetinde topla. |
| 18 | Lead Inspector | Prepare Final Report | Geçti | Form mobilde uzun ve karar bağlamı aşağıda kalabiliyor. | Report identity ve readiness durumunu üstte sabit özetle. |
| 19 | Lead Inspector | Final Report Document | Geçti | Rapor önizleme doğal olarak uzun. | Mobil bölüm içi navigasyon ve print-preview ayrımı ekle. |
| 20 | Lead Inspector | Audit Assignment | Geçti | Çok sayıda atama alanı mobilde uzun bir akış oluşturuyor. | Inspector workload kararını atama CTA'sına daha yakın göster. |
| 21 | Lead Inspector | Assign Checklist Questions | Sorun | Mobil soru satırının metni ve sağ kolonları kesiliyor; tablet KPI kartları da sıkışıyor. | Soruları mobil kartlara dönüştür; assignment/status bilgisini metnin altına taşı ve tablet KPI metnini kısalt. |
| 22 | Lead Inspector | CAP Review Detail | Geçti | Uzun kanıt/CAP dossier'i mobilde yüksek kaydırma yükü yaratıyor. | Accept / request more info kararlarını yapışkan alt aksiyon çubuğunda tut. |
| 23 | Lead Inspector | Calendar | Geçti | Belirgin görsel sorun yok. | Due Soon ve Overdue incelemeleri takvimden ayrı kısa bir attention listesinde göster. |
| 24 | Lead Inspector | Messages | Geçti | Belirgin görsel sorun yok. | CAA internal ve auditee-visible konuşma ayrımını başlık seviyesinde daha görünür yap. |
| 25 | Lead Inspector | Analytics & Reports | Geçti | Mobilde bilgi yoğunluğu yüksek. | İlk görünümü üç yönetim sorusuna indir; ayrıntılı metrikleri drill-down'a taşı. |
| 26 | Lead Inspector | Settings | Geçti | Standart ayar formu; belirgin kesilme yok. | Demo-only ayarlarla gerçek ürün tercihlerinin sınırını bölüm bazında açıkla. |
| 27 | Department Manager | Dashboard | Geçti | Mobilde dashboard uzuyor, fakat karar kartları korunuyor. | Overdue ve review-needed öğelerini tek üst attention listesinde önceliklendir. |
| 28 | Department Manager | Planning | Geçti | Mobilde plan tablosu uzun. | Planning kararları için selected item özetini sticky tut. |
| 29 | Department Manager | Audits | Geçti | Yoğun liste küçük ekranda taramayı zorlaştırıyor. | Mobil satırlarda audit ID, organization, phase ve next action dışında kalan alanları detay içine taşı. |
| 30 | Department Manager | Reports Approval | Geçti | Çok kolonlu onay bağlamı mobilde uzun. | Decision CTA'sını rapor readiness özetiyle aynı kartta tut. |
| 31 | Department Manager | Risk Dashboard | Geçti | Mobilde risk bağlamı uzun ve küçük metinli. | Yönetim göstergesi ile operasyonel aksiyonları daha belirgin ayır. |
| 32 | Department Manager | Inspection Team | Sorun | Masaüstünde filtre satırı sağdan kesiliyor; mobilde liste, tab ve ekip tablosu kolonları kırpılıyor. | Sol listeyi kontrollü genişlet; mobilde ekip/audit satırlarını kart yap ve tab bar için kaydırma göstergesi ekle. |
| 33 | Department Manager | Findings Review | Sorun | Masaüstünde filtre alanı dar panelde kesiliyor; mobil register tablosunun sağ kolonları görünmüyor. | Mobil findings register'ı kart listesine çevir; filtreleri iki satırlı responsive grid yap. |
| 34 | Department Manager | CAP Monitoring | Geçti | Mobilde çok uzun bir iş listesi oluşuyor. | Overdue, Due Soon ve waiting-evidence gruplarını açılır öncelik bölümlerine ayır. |
| 35 | Department Manager | Checklist Management | Sorun | Configured Requirement / Reference alanı tüm boyutlarda tek satıra sıkışıp metni gizliyor. | Referansı çok satırlı textarea/read-only block yap; tam değeri görünür tut. |
| 36 | Department Manager | Safety Intelligence | Geçti | Dashboard mobilde uzun ve metrik yoğun. | İlk görünümde yalnızca exposure, trend ve next action üçlüsünü tut. |
| 37 | Department Manager | Organization Risk Profile | Geçti | Mobil sayfa çok uzun ve küçük metinli, fakat kartlar kesilmiyor. | Finding ve audit bölümlerine filtre/accordion; üstte sticky risk özeti ekle. |
| 38 | Department Manager | SSP / NASP | Geçti | Belirgin taşma yok; yönetim metni yoğun. | Indicator ile authorized decision sınırını daha güçlü görsel ayır. |
| 39 | Department Manager | USOAP Readiness | Geçti | Mobilde tablo ve açıklamalar uzun. | Açık kanıt boşluklarını bir “next evidence” kuyruğunda öne çıkar. |
| 40 | Department Manager | CAP Effectiveness | Geçti | Küçük ekranda değerlendirme bağlamı uzun. | Effectiveness sonucu ile finding closure kararını ayrı kartlarda göster. |
| 41 | Department Manager | Organizations | Geçti | Mobil liste yoğun ancak okunabilir. | En yüksek riskli kuruluşları risk nedeni ve next action ile üste al. |
| 42 | Department Manager | Organization Detail | Geçti | Mobilde çok uzun bir finding/audit geçmişi oluşuyor. | Finding ve audit geçmişini varsayılan kapalı bölümlere ayır; açık işleri üstte tut. |
| 43 | Department Manager | Inspection Package Builder | Geçti | Builder mobilde uzun. | Step özeti ve selected scope bilgisini yapışkan tut. |
| 44 | Department Manager | Inspection Evidence | Geçti | Kanıt satırları mobilde yoğun. | Version, uploader, review result ve next action bilgisini tek kanıt kartında grupla. |
| 45 | Department Manager | Preliminary Report Review | Geçti | Karar ekranı uzun ama ana CTA görünür. | Blocking review items özetini karar butonunun hemen üstüne getir. |
| 46 | Department Manager | Department CAP Closure Review | Geçti | Masaüstünde küçük step metni sıkışması var, karar akışını engellemiyor. | Step label'larını kısalt veya wrap edecek min-width tanımla. |
| 47 | Department Manager | New Audit Wizard 1 | Geçti | Geniş CTA alanı mobilde gereğinden fazla yer kaplıyor. | Next aksiyonunu standart buton yüksekliğine indir; step bağlamını güçlendir. |
| 48 | Department Manager | New Audit Wizard 2 | Geçti | Belirgin kesilme yok. | Seçilen organization/risk bağlamını kalıcı kısa özette göster. |
| 49 | Department Manager | New Audit Wizard 3 | Geçti | Belirgin kesilme yok. | Seçilen inspection type'ın scope etkisini inline açıkla. |
| 50 | Department Manager | New Audit Wizard 4 | Geçti | Belirgin kesilme yok. | Team capacity uyarısını son adımdan önce görünür yap. |
| 51 | Department Manager | New Audit Wizard 5 | Geçti | Son özet uzun ama okunabilir. | Oluşturma öncesi owner, dates, scope ve notification özetini tek review kartında topla. |
| 52 | General Manager | Dashboard | Geçti | Mobilde uzun yönetim görünümü. | Department exposure, overdue ve approval queue'yu ilk görünümde topla. |
| 53 | General Manager | Planning | Geçti | Mobilde plan listesi uzun. | Yönetici karar bekleyen planları ayrı üst kuyruğa al. |
| 54 | General Manager | Report Approvals | Geçti | Yoğun rapor bilgisi mobil taramayı yavaşlatıyor. | Readiness, owner ve decision CTA'sını tek kartta grupla. |
| 55 | General Manager | Departments | Geçti | Belirgin kesilme yok. | Department karşılaştırmasını ortak risk/overdue ölçüsüyle sadeleştir. |
| 56 | General Manager | Risk Dashboard | Geçti | Küçük ekranda metrik yoğunluğu yüksek. | Risk bağlamını trend, reason ve authorized next action olarak üçe indir. |
| 57 | General Manager | Settings | Geçti | Belirgin görsel sorun yok. | Yöneticiye özgü notification ve approval tercihlerini ayrı bölümde topla. |
| 58 | Finance | Finance Review | Geçti | Mobilde uzun ve yoğun bir inceleme paketi. | Toplam mali etki, açık soru ve karar CTA'sını sticky review özeti yap. |
| 59 | Executive Director | Executive Dashboard | Sorun | Tablet görünümünde Final Report approval kartı dar iki kolon içinde sıkışıyor; ID, status ve CTA birbirine giriyor. | 1024 px'de decision queue'ları tek kolona düşür veya kart içeriğini dikey sırala. |
| 60 | Executive Director | Executive Planning | Geçti | Önceki mobil yatay taşma güncel kart düzeninde giderilmiş. | Mobilde selected plan karar özetini listenin hemen altında görünür tut. |
| 61 | Executive Director | Preliminary Reports | Geçti | Güncel görünüm tamamen empty state; karar satırı ve CTA'lar görsel olarak test edilemedi. | En az bir eligible Preliminary Report seed et veya empty state'e kaynağı/sonraki adımı açıklayan CTA ekle. |
| 62 | Executive Director | Executive Final Reports | Geçti | Belirgin kesilme yok. | Pending approval raporlarını readiness ve risk nedeni ile öne çıkar. |
| 63 | Executive Director | Executive Report Preview | Geçti | Uzun rapor önizleme; belirgin taşma yok. | Mobil bölüm navigasyonu ve karar özetini üstte tut. |
| 64 | Executive Director | Executive Notifications | Geçti | Yüzey fazla seyrek ve öncelik ayrımı zayıf. | Notification'ları decision required, due soon ve informational olarak grupla. |
| 65 | Executive Director | Settings | Geçti | Standart ayar formu; belirgin sorun yok. | Delegation/approval tercihlerini demo sınırıyla açıkça ayır. |
| 66 | Auditee | Corrective Actions | Geçti | Mobil CAP akışı uzun. | Current owner, CAA request, Due Date ve submit CTA'sını sticky özetle. |
| 67 | Auditee | Inspection Coordination | Geçti | Belirgin kesilme yok. | CAA'nın beklediği sıradaki öğeyi sayfanın üstünde tek cümleyle göster. |
| 68 | Auditee | Preliminary Reports | Geçti | Mobil rapor listesi uzun. | Response due ve CAA comment durumunu kart başlığında göster. |
| 69 | Auditee | Final Reports | Geçti | Belirgin kesilme yok. | Authorized result ile yapılacak sonraki işlemi görsel olarak ayır. |
| 70 | Auditee | Report Preview | Geçti | Uzun rapor önizleme. | Mobil bölüm atlama bağlantıları ekle. |
| 71 | Auditee | Messages | Geçti | Belirgin görsel sorun yok. | Yalnızca auditee-visible mesajların gösterildiğini kalıcı etiketle belirt. |
| 72 | Auditee | Documents | Geçti | Belirgin görsel sorun yok. | Evidence version ve review result bilgisini dosya satırında görünür yap. |
| 73 | Auditee | Settings | Geçti | Belirgin görsel sorun yok. | Organization scope ve notification tercihlerini ayrı grupla. |
| 74 | Admin Preview | Regulatory Library | Geçti | Mobilde referans kartları uzun. | Search/filter'ı sticky tut; demo reference sınırını kart içinde koru. |
| 75 | Admin Preview | Templates | Geçti | Liste mobilde yoğun ama kesilmiyor. | Status, version ve owner dışındaki alanları detay ekranına taşı. |
| 76 | Admin Preview | Template Preview | Geçti | Önizleme mobilde uzun. | Section jump navigasyonu ekle. |
| 77 | Admin Preview | Question Bank | Sorun | New Question içindeki question text tek satır input'ta kesiliyor; tam metin görünmüyor. | Alanı çok satırlı textarea yap ve karakter sayacı/validasyon ekle. |
| 78 | Admin Preview | Checklist Builder | Sorun | Mobilde question ve reference kolonları sabit tablo içinde kesiliyor; metinlerin önemli kısmı görünmüyor. | Question satırlarını mobil kartlara dönüştür veya görünür yatay kaydırma alanı ve sabit başlık kullan. |
| 79 | Admin Preview | Version History | Geçti | Belirgin kesilme yok. | Sürümler arası değişiklik özetini diff biçiminde göster. |
| 80 | Admin Preview | Inspection Package Builder | Geçti | Builder mobilde uzun. | Seçili template/scope/version özetini sticky tut. |
| 81 | Admin Preview | Reports | Geçti | Yoğun tablo mobilde taramayı yavaşlatıyor. | Rapor satırını status, owner, generated date ve action odaklı karta dönüştür. |
| 82 | Admin Preview | Users / Roles | Geçti | Mobil liste yoğun, belirgin kesilme yok. | Role ve organization scope'u aynı satır/kart içinde göster. |
| 83 | Admin Preview | Configurations | Geçti | Standart uzun ayar formu. | Demo-only ve production-required ayarları ayrı bölümlerde göster. |
| 84 | Admin Preview | Organisation Master Data | Geçti | Mobil liste uzun. | Organization type, status ve scope filtrelerini üste sabitle. |
| 85 | Admin Preview | Organization Detail | Geçti | Çok uzun detay formu mobilde yüksek kaydırma yükü yaratıyor. | Bölümleri accordion'a ayır; identity ve status özetini sabit tut. |
| 86 | Admin Preview | Audit Log | Geçti | Kayıt tablosu küçük ekranda yoğun. | Mobilde actor, action, object ve timestamp alanlarını kart düzeninde göster. |

## Önceliklendirilmiş sorun listesi

1. **P1 — Karar/iş içeriği kesiliyor:** Lead Preliminary Reports, Manager Inspection Team, Manager Findings Review, Executive Dashboard tablet, Admin Checklist Builder.
2. **P1 — Kritik referans veya soru metni gizleniyor:** Manager Checklist Management, Lead Assign Checklist Questions, Admin Question Bank.
3. **P2 — Mobil iş listesi eksik okunuyor:** Lead Assigned Audits.
4. **P2 — Navigasyondan erişilemiyor:** AI Inspector Assistant.

## Önerilen düzeltme sırası

1. Responsive tablo/kart kontratını ortaklaştır: 390 px'de karar alanları kart, 1024 px'de iki kolon yalnızca içerik sığıyorsa kullanılmalı.
2. Uzun soru ve regulatory reference alanlarını tek satır input yerine çok satırlı görünür içerik alanına dönüştür.
3. Uzun dossier ekranlarına sticky owner / next action / Due Date / decision özeti ekle.
4. AI Inspector Assistant için görünür bağlamsal giriş ekle veya route'u kaldır.
5. Görsel düzeltme sonrasında 86 ekranı yeniden Playwright ile üç viewport'ta çek; ardından klavye, kontrast ve ekran okuyucu testlerini ayrı yürüt.
