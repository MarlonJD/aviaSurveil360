# Auditee Portal — Türkçe

## Amaç

External Service Provider'a CAA Finding'lerine yanıt verebileceği ve CAA'nın
açıkça kendi kuruluşuna release ettiği raporları görebileceği, kuruluş kapsamlı
odaklı bir çalışma alanı sağlamak.

## Operasyonel navigation

Service Provider ana sayfası `Corrective Actions (CAP)` ekranıdır. Operasyonel
navigation şunlardan oluşur:

- Corrective Actions (CAP)
- Preliminary Reports
- Final Reports
- Messages
- Documents
- Settings

Duplicate `Received Reports`, `My CAPs` ve `CAP Management` girişleri
gösterilmez. Service Provider'a internal CAA dashboard verilmez.

## Corrective Actions (CAP)

CAP queue, mevcut kuruluşun kanonik Finding kayıtlarından üretilir. Finding ID,
Audit / Inspection, Finding Title, Level, Status, Due Date, progress ve
kullanılabilir aksiyonu gösterir. Seçili dossier current owner, next action,
lifecycle timeline, configured Due Date, CAP içeriği ve evidence durumunu
gösterir.

`Respond`, Finding'in mevcut lifecycle adımına uygun CAP veya evidence response
akışını açar. CAP kabulü Finding closure değildir. Finding yalnız gerekli
evidence kabul edildikten, verification tamamlandıktan veya yetkili bir closure
yolu açıkça kaydedildikten sonra kapanır. Evidence version history korunur.

## Preliminary Reports

Yalnız mevcut kuruluşla açıkça paylaşılan Preliminary Report kayıtları
görünür. Queue; Report ID, Audit / Inspection, Date Shared, Findings,
configured response Due Date ve Action alanlarını gösterir. Dossier yalnız
auditee-safe summary, paylaşım metadata'sı, izin verilen attachments, report
preview ve in-UI message aksiyonu içerir.

## Final Reports

Yalnız Executive Director tarafından issue ve lock edilmiş, mevcut kuruluşa ait
Final Report kayıtları görünür. Liste bilinçli olarak yalnız Report ID, Audit /
Inspection, Date Released, Findings ve Action kolonlarını kullanır. CAP işi
report tablosunda tekrarlanmaz; Corrective Actions çalışma alanında kalır.

`View Report`, paylaşılan state-backed viewer'ı auditee-safe projection ile
açar. Browser-generated dosyalar demo artifact'larıdır; production record veya
imzalı yasal belge değildir.

## Privacy ve permission kuralları

- Service Provider yalnız kendi kuruluşunun audit'lerini, Finding'lerini, CAP
  ve evidence taleplerini, CAA-visible comment'lerini, release edilmiş
  Preliminary Report'larını, issue edilmiş Final Report'larını ve closure
  status'unu görür.
- Kapsam dışı Finding veya Report ID ile direct navigation not-found/forbidden
  durumuna gider.
- Internal CAA Note, enforcement deliberation, internal risk score, inspector
  workload, başka kuruluş ve unreleased draft hiçbir zaman render edilmez.
- `Comment to Auditee`, `Internal CAA Note` alanından ayrı kalır.
- Due Date configured record'dan gelir; severity yasal deadline üretmez.
- Mock upload yalnız filename tutar. Dosya byte'ları okunmaz veya saklanmaz.
- Rol seçimi demo-only'dir; gerçek authentication veya authorization
  enforcement değildir.

## Ana aksiyonlar

- Finding ve CAP durumunu görüntüleme
- CAP submit veya update etme
- Mock evidence filename sağlama
- More information talebine yanıt verme
- Release edilmiş Preliminary ve Final Report görüntüleme
- Browser-local demo download üretme
- In-UI composer üzerinden CAA'ya mesaj gönderme

## UX yönü

Secondary detail öncesinde status, owner, Due Date, next action ve record
identity gösterilmelidir. Queue-first layout, açık selected dossier, çalışan
filtreler ve responsive task order kullanılmalıdır. Advanced configuration
internal admin permission arkasında kalır.

## Demo kabul kriterleri

- Fly Namibia Cabin Inspection senaryosunu destekler.
- Organization isolation list, detail, preview, message ve download
  aksiyonlarında uygulanır.
- Auditee-visible ve internal bilgi ayrı kalır.
- CAP kabulü Evidence veya Finding closure gereksinimini bypass edemez.
- Her visible control ekranda state, navigation, modal, preview, message veya
  browser-local file sonucu üretir.
- Uygulama frontend-only, browser-local ve demo-only kalır; production
  auditability veya authorization iddia edilmez.

## Stakeholder Readiness Privacy Kanıtı — 2026-07-10

Organization scope Messages, Settings, unread counts, documents, Preliminary/Final Reports, CAP, Evidence ve notifications yüzeylerinde tutarlı uygulanır. Direct legacy `reports` navigation organization-scoped Documents projection'a gider. Cross-organization fixture'lar unavailable kabul edilir ve identifying copy veya count üretmez.

Durum: **demo-only**; focused regressions ile Messages, Documents, Final Reports ve Settings için dört required viewport'taki fresh isolated-browser kontrolleri **verified locally**. Production authentication, authorization enforcement, storage, notification delivery ve privacy certification **not run**; **production-readiness not claimed**.
