# AviaSurveil360 — Demo Yapı Özeti (Türkçe)

> İngilizce kanonik sürüm: [`DEMO_BUILD_SUMMARY.md`](DEMO_BUILD_SUMMARY.md).
> Bu dosya paydaş aktarımı içindir; çakışma olursa İngilizce sürüm esastır.

**Yapı türü:** Paydaş geri bildirimi için yalnızca ön yüz (frontend) tıklanabilir demo.
**Teknoloji:** HTML + CSS + Saf (Vanilla) JavaScript. Yalnızca sahte veri ve istemci tarafı durum.
**Üretime hazır değildir.** Backend, veritabanı, API, gerçek kimlik doğrulama, gerçek dosya
yükleme, gerçek e-posta/SMS/bildirim servisi, gerçek belge depolama, BI aracı, çevrimdışı
uygulama, ödeme veya e-imza yoktur. Her "kaydet", "yükle", "gönder" ve "rapor" tarayıcıda
simüle edilir.

**Tarih bağlamı:** Uygulama "bugün" olarak **15 Haziran 2026** tarihini kullanır; böylece
"Yakında Dolacak" / "Gecikmiş" hesapları deterministiktir.

---

## Nasıl çalıştırılır

Proje kök dizininden herhangi bir statik sunucu ile açın:

```
python3 -m http.server 4360
# ardından http://localhost:4360/ adresini açın
```

Ya da `index.html` dosyasını doğrudan tarayıcıda açın (`file://` üzerinden çalışır; modül
yok, derleme adımı yok). İstediğiniz an sağ üstteki **Reset demo** ile başlangıç durumuna
dönebilirsiniz.

---

## Roller

1. **CAA Manager (Yönetici)** — gözetim, risk, 2026 denetim planı, Oversight Health Index.
2. **CAA Inspector (Denetçi)** — denetim ve checklist yürütür, bulgu açar, CAP ve kanıt inceler, bulgu kapatır.
3. **Auditee (Denetlenen — Airline XYZ)** — yalnızca kendi kuruluşunu görür; CAP gönderir, kanıt yükler.
4. **Admin Preview** — checklist şablonlarını ve denetim kaydını (audit log) önizler.

Rol değiştirmek için üst bardaki **View as** seçicisini veya kenar çubuğundaki **Role select**
bağlantısını kullanın.

---

## Uygulanan ekranlar

1. Rol Seçme / Giriş Demosu
2. Yönetici Panosu (KPI + Oversight Health Index)
3. Denetçi Panosu
4. Denetim Plan Takvimi (2026 planı, 12 ay)
5. Yeni Denetim Sihirbazı (5 adımda yeni denetim oluşturup planlama)
6. Denetim Detayı
7. Checklist Yürütücü (Checklist Runner)
8. Bulgu Detayı — 6 adımlı yaşam döngüsü göstergesi
9. Denetlenen "Bulgularım" (My Findings)
10. CAP Gönderme Formu (sade dilde yardım metinleri)
11. Kanıt Yükleme + Kanıt İnceleme (ayrı denetlenen/denetçi diyalogları)
12. Kapatılmış Bulgu / Rapor Önizleme
13. Admin Checklist Şablon Önizleme
14. Kuruluş kaydı (liste + kuruluş detayı) — Yönetici / Denetçi
15. Admin Users (salt-okunur) ve Admin Settings (salt-okunur yapılandırma önizlemesi)
16. Bulgu listesi (filtreli), Rapor listesi, Denetlenen Mesajları, Admin Denetim Kaydı

Rol navigasyonu UX planına uygun: Yönetici (Pano, Denetim Planı, Bulgular,
Kuruluşlar, Raporlar), Denetçi (Pano, Denetim Planı, Bulgular, Kuruluşlar,
Raporlar), Denetlenen (Bulgularım, Mesajlar, Raporlar), Admin (Şablonlar,
Kullanıcılar, Ayarlar, Denetim Kaydı).

---

## Doğrulanan demo senaryosu (uçtan uca, konsol hatası yok)

1. Yönetici 2026 planını ve panoyu görür — başlangıç: 3 açık bulgu, OHI **61 (Dikkat Gerekiyor)**.
2. Denetçi Airline XYZ Operatör Denetimini (`AUD-2026-001`) açar ve Flight Operations checklist'ini başlatır.
3. Denetçi **"Mürettebat eğitim kayıtları tam ve güncel mi?"** sorusunu **Non-Compliant** işaretler.
4. Denetçi **OPS-2026-001** bulgusunu açar (Level 2 Major, son tarih 15 Tem 2026) — durum *CAP Bekliyor*.
5. Denetlenen (Airline XYZ) yalnızca kendi bulgularını görür; CAP gönderir (kök neden, düzeltici/önleyici faaliyet, sorumlu, hedef tarih).
6. Denetçi **CAP'i kabul eder** → durum *CAP Kabul Edildi — Kanıt Gerekli* olur. **Bulgu kapanmaz.**
7. Denetlenen `Training_Record_Updated.pdf` sahte kanıtını yükler.
8. Denetçi kanıtı inceler ve **kabul eder** → bulgu **Kapatıldı** (kapatma dayanağı: kanıt kabul edildi).
9. Yönetici panosu güncellenir: kapanan bulgular 2 → 3, ortalama kapatma süresi 24 → 16 gün, OHI **61 → 64**.

**Ayrıca doğrulandı:** Yeni Denetim Sihirbazı (5 adımda denetim planlama); Yetkili Kapatma
(gerekçe zorunlu, denetim kaydına işlenir, denetlenene gösterilmez); Kuruluş kaydı listesi/detayı;
Admin Users/Settings önizlemeleri; ve **izlenebilir hatırlatma** (CAA, açık bulgu için
denetlenene ekran içi hatırlatma gönderir + denetim kaydına işlenir — gerçek e-posta yok).

---

## Korunan ürün kuralları

- **CAP kabulü kapatma değildir.** Kapatma, kabul edilmiş kanıta (ya da gerekçeli ve audit-log'lu yetkili kapatmaya) bağlıdır.
- **Her bulgu**; sahip, son tarih, durum ve sonraki aksiyonu gösterir.
- **Denetlenen izolasyonu.** Denetlenen yalnızca Airline XYZ bulgularını görür; **Internal CAA Note**, denetçi iş yükü, diğer kuruluşlar ve dahili risk skoru denetlenene asla gösterilmez.
- **Comment to Auditee** ile **Internal CAA Note** ayrı tutulur.
- **Due Date / Target / Due Soon / Overdue** dili kullanılır; ağır SLA modülü yoktur.
- **Oversight Health Index yalnızca bir göstergedir** — otomatik yaptırım, askıya alma veya kapatma tetiklemez.
- Düzenleyici ifadeler dikkatli kullanılır ("regulatory reference", "configured rule", "finding basis", "expected evidence"); raporlar yasal belge değil, demo önizlemesidir.

---

## Sahte (gerçek olmayan) öğeler

- **Kimlik doğrulama:** yalnızca rol seçimi; parola/oturum/MFA yok.
- **Dosya yükleme:** yalnızca dosya adı ve boyutu gösterilir; hiçbir şey okunmaz/yüklenmez/saklanmaz. Kanıt sürümleri bellekte tutulur ve eski sürümlerin üzerine yazılmaz.
- **Bildirimler:** ekran içi toast + role özel bildirim paneli. E-posta/SMS yok.
- **Raporlar:** ekranda önizleme; "Export PDF (mock)" yalnızca bir toast gösterir.
- **Panolar / KPI / OHI:** bellekteki verilerden canlı hesaplanır; kapatmadan sonra değişir.
- **Denetim kaydı:** bellekte tutulan bir liste; kalıcı veya değiştirilemez değildir.
- **Kalıcılık yok:** sayfa yenileme veya **Reset demo** başlangıç verisine döner.

---

## Bilinen kısıtlar

- Durum yalnızca bellektedir; sayfa yenilenince sıfırlanır (demo için bilinçli tercih).
- Yalnızca **Flight Operations Audit** şablonu yürütülebilir; diğerleri Admin listesinde önizlemedir.
- Sihirbazla oluşturulan denetimler yalnızca bellekteki plana eklenir (yenileme/sıfırlamada kaybolur).
- Diğer kuruluşların verileri Yönetici panosunu gerçekçi göstermek içindir; gerçek veri değildir.
- Erişilebilirlik makul düzeydedir ancak resmi olarak denetlenmemiştir.
- Düzen masaüstü/dizüstü genişlikleri için ayarlanmıştır; mobil uygulama değildir.

---

## Paydaşlara sorulacak sorular

1. `Denetim → Checklist → Bulgu → CAP → Kanıt → İnceleme → Kapatma` döngüsü süreçlerinize uyuyor mu?
2. Bulguyu kim **açabilmeli**, kim **kapatabilmeli**?
3. Kapatma için **her zaman kanıt** mı gerekli, yoksa açık bir "yetkili kapatma" yolu mu lazım (ve kim kullanabilir)?
4. Denetlenen **son tarih uzatması** isteyebilmeli mi, bu nasıl görünmeli?
5. **Comment to Auditee** ile **Internal CAA Note** ayrımı yeterince net mi?
6. Yöneticiler için en önemli **pano metriği** hangisi; **Oversight Health Index**'in "yalnızca gösterge" çerçevesi kabul edilebilir mi?
7. Sırada hangi **denetim alanı** demolansın (Airworthiness, Ramp, Security, Cabin, Dangerous Goods)?
8. Doğru **önem (severity) sözlüğü** ne olmalı (Level 1 Critical / Level 2 Major / Level 3 Minor / Observation)?
9. Hangi yetenekler demoda kalsın, hangileri **Faz 2 (MVP)** olsun — örn. denetim oluşturma sihirbazı, hatırlatmalar, kuruluş kaydı, gerçek kanıt depolama?
