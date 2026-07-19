# Auditee Portal — Türkçe

## Amaç

External Service Provider'a announced-inspection coordination request'lerine ve
CAA Finding'lerine yanıt verebileceği, ayrıca CAA'nın açıkça kendi kuruluşuna
release ettiği raporları görebileceği kuruluş kapsamlı odaklı bir çalışma alanı
sağlamak.

## Operasyonel navigation

Service Provider ana sayfası `Corrective Actions (CAP)` ekranıdır. Operasyonel
navigation şunlardan oluşur:

- Inspection Coordination
- Corrective Actions (CAP)
- Preliminary Reports
- Final Reports
- Messages
- Documents
- Settings

Duplicate `Received Reports`, `My CAPs` ve `CAP Management` girişleri
gösterilmez. Service Provider'a internal CAA dashboard verilmez.

## Inspection Coordination

Yalnız configured policy'si advance notice gerektiren Routine / Announced
inspection kayıtları bu workspace'te görünür. Lead Inspector belirlendikten
sonra CAA proposed date, checklist filename, inspection scope, location ve
diğer auditee-safe relevant information'ı paylaşır. Service Provider proposed
date'i confirm edebilir veya alternative önerebilir. Alternative, CAA kabul
edene kadar pending kalır.

Ad Hoc / Unannounced inspection advance olarak hiçbir zaman görünmez; Service
Provider notification veya shared checklist package üretmez. Bu frontend-only
demoda gönderim ve yanıt yalnız browser-local state ve in-app notification
kaydeder; gerçek email veya calendar invite göndermez.

## Corrective Actions (CAP)

CAP queue, mevcut kuruluşun kanonik Finding kayıtlarından üretilir. Finding ID,
Audit / Inspection, Finding Title, Level, Status, Due Date, progress ve
kullanılabilir aksiyonu gösterir. Seçili dossier current owner, next action,
lifecycle timeline, configured Due Date, CAP içeriği ve evidence durumunu
gösterir.

`Respond`, Finding'in mevcut lifecycle adımına uygun CAP veya evidence response
akışını açar. CAP kabulü Finding closure değildir. Finding yalnız gerekli
Evidence için Inspector veya Lead Inspector `Close` kaydettikten ya da ayrı
authorized closure yolu kaydedildikten sonra kapanır. `Partially Close` ve `Not
Close` Finding'i açık tutar ve kalan aksiyon veya Evidence gerektirir. Dossier
latest result, actor, date, Evidence version ve next action'ı gösterir; ilgili
`Internal CAA Note` hiçbir zaman gösterilmez. Evidence version history korunur.

## Preliminary Reports

Yalnız Executive Director tarafından approve ve mevcut kuruluşa release edilen
Preliminary Report kayıtları görünür. Lead Inspector, Department Manager ve
General Manager aşamaları Service Provider'a görünmez. CAP-required ve no-CAP
raporlar aynı approval zincirini izler. Release sonrasında `capRequired` yalnız
next action'ı değiştirir: CAP/Evidence taleplerine yanıt verme veya raporu
görüntüleme. Queue; Report ID, Audit / Inspection, Date Shared, Findings,
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
  ve evidence taleplerini, announced-inspection coordination request'lerini,
  CAA-visible comment'lerini, release edilmiş Preliminary Report'larını, issue
  edilmiş Final Report'larını ve closure status'unu görür.
- Advance-notice-withheld inspection kayıtları ve paketleri Service Provider
  portalında hiçbir zaman render edilmez.
- Kapsam dışı Finding veya Report ID ile direct navigation not-found/forbidden
  durumuna gider.
- Internal CAA Note, enforcement deliberation, internal risk score, inspector
  workload, başka kuruluş ve unreleased draft hiçbir zaman render edilmez.
- `Comment to Auditee`, `Internal CAA Note` alanından ayrı kalır.
- CAP verification result metadata gösterilebilir; ilgili `Internal CAA Note`
  hiçbir zaman render edilmez.
- Due Date configured record'dan gelir; severity yasal deadline üretmez.
- Mock upload yalnız filename tutar. Dosya byte'ları okunmaz veya saklanmaz.
- Rol seçimi demo-only'dir; gerçek authentication veya authorization
  enforcement değildir.

## Ana aksiyonlar

- Finding ve CAP durumunu görüntüleme
- Proposed Routine / Announced inspection date'i confirm etme
- CAA confirmation için alternative inspection date önerme
- Announced inspection için paylaşılan checklist filename ve relevant
  information'ı görüntüleme
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
- Preliminary Report, Executive Director release öncesinde görünmez.
- `Partially Close` ve `Not Close`, Finding'in açık kaldığını görünür biçimde gösterir.
- Her visible control ekranda state, navigation, modal, preview, message veya
  browser-local file sonucu üretir.
- Uygulama frontend-only, browser-local ve demo-only kalır; production
  auditability veya authorization iddia edilmez.
- Approval ve timestamp kayıtları browser-local mock record'dur; traceability
  demo audit history'dir, production audit trail değildir; attachment'lar local
  browser state içindeki mock filename'lardır, secure document storage değildir.

## Stakeholder Readiness Privacy Kanıtı — 2026-07-10

Organization scope Messages, Settings, unread counts, documents, Preliminary/Final Reports, CAP, Evidence ve notifications yüzeylerinde tutarlı uygulanır. Direct legacy `reports` navigation organization-scoped Documents projection'a gider. Cross-organization fixture'lar unavailable kabul edilir ve identifying copy veya count üretmez.

Durum: **demo-only**; focused regressions ile Messages, Documents, Final Reports ve Settings için dört required viewport'taki fresh isolated-browser kontrolleri **verified locally**. Production authentication, authorization enforcement, storage, notification delivery ve privacy certification **not run**; **production-readiness not claimed**.
