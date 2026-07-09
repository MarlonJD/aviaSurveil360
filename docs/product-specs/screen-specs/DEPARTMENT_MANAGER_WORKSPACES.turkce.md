# Department ve General Manager Çalışma Alanları Tasarımı

**Durum:** 10 Temmuz 2026 tarihinde planlama için onaylandı
**Build sınırı:** Frontend-only clickable demo
**Kanonik kuruluş adı:** `Fly Namibia`

## Amaç

Mevcut AviaSurveil360 statik demosunda, verilen referans ekranlarla uyumlu
Department Manager ve General Manager çalışma alanlarını tamamlamak:

1. `Findings Review`
2. `Inspection Team`
3. `Reports Approval`
4. `CAP Monitoring`
5. `Checklist Management`
6. `Risk Dashboard`
7. Department Manager Dashboard ve sınırlandırılmış navigation
8. General Manager Dashboard ve sınırlandırılmış navigation

Ekranlar ortak browser-local demo state kullanacak ve görünen ana kontroller
çalışacaktır. Backend, database, API, gerçek authentication, gerçek file
storage, gerçek notification delivery veya production reporting engine
eklenmeyecektir.

## İsim Sözleşmesi

- Service provider/operator adı UI, rapor içeriği, stakeholder dokümanları ve
  demo PDF dosya adlarında her yerde `Fly Namibia` olacaktır.
- Kuruluş türü gerektiğinde `Operator / Service Provider` gösterilecektir.
- `Air Namibia`, `FlyNamibia` ve `FlyNamibia (Pty) Ltd` alternatif isim olarak
  gösterilmeyecektir.
- `ORG-XYZ` gibi kullanıcıya görünmeyen mevcut internal ID'ler korunabilir.

## Mimari

Mevcut HTML, CSS ve Vanilla JavaScript yapısı genişletilecektir. Yeni manager
ekranları bağımsız hard-coded dataset oluşturmak yerine ortak mutable demo
state'ten üretilecektir.

- Audit/inspection kayıtları kuruluş, tarih, department, status, Lead
  Inspector ve team bilgisini sağlar.
- Finding kayıtları severity, lifecycle status, owner, next action, Due Date,
  CAP ve Evidence durumunu sağlar.
- Internal user kayıtları Department Manager reporting line, inspector
  department, email, rol ve active status bilgisiyle genişletilir.
- Preliminary ve Final Report ayrı artifact olarak saklanır; her birinin kendi
  version, status, submission time, comments, attachments ve approval history
  bilgisi bulunur.
- Manager UI state seçili satırları, tab'leri, filtreleri, açık action menu'leri
  ve draft comment'leri tutar.
- CAP Monitoring mevcut finding, CAP, Evidence, owner, Due Date, update,
  document ve history kayıtlarından üretilir.
- Checklist Management package, version, section, question ve browser-local
  manager değişikliklerini tutar.
- General Manager özetleri ortak department, Final Report, CAP ve risk
  kayıtlarından üretilir; çelişen ayrı bir dashboard dataset'i oluşturulmaz.

Eski browser-local state yeni default'larla güvenli biçimde birleştirilecektir.

## Department Manager Navigation

Department Manager menüsünde yalnız şu girişler bulunur:

- `Dashboard`
- `Audits`
- `Inspection Team`
- `Findings Review`
- `Reports Approval`
- `Risk Dashboard`
- `CAP Monitoring`
- `Checklist Management`

`Findings Review`, manager tarafındaki `Open Findings` label'ının yerini alır;
status filtreleri korunur. `Reports Approval`, mevcut `Audit Reports` ve
`Preliminary Reports` girişlerini tek approval queue altında birleştirir. Eski
Planning, Calendar, Documents, Corrective Actions, Settings ve duplicate
checklist/analytics girişleri sidebar'da gösterilmez.

General Manager menüsünde yalnız şu girişler bulunur:

- `Dashboard`
- `Report Approvals`
- `Departments`
- `Risk Dashboard`
- `Settings`

## Findings Review

Ekran, “Sorumluluğumdaki hangi inspection'larda finding var ve hangileri yönetim
dikkati gerektiriyor?” sorusunu cevaplar.

- Solda search, filter, KPI özeti ve inspection tablosu bulunur.
- Sağda seçili inspection'ın findings dossier'i bulunur.
- İlk seçim aktif Fly Namibia inspection'ıdır ve ilk açılışta görünür.
- Live hero finding `CAB-2026-001` önceden seed edilmez; bunun yerine review
  ekranının boş kalmaması için aynı inspection'a az sayıda ayrı, mevcut demo
  finding bağlanabilir.

Inspection satırları Audit ID, Organization, Audit Date, Team Leader, Status ve
severity breakdown gösterir. Dossier header'ında Audit Date, Team Leader,
Department, Audit Phase ve Status bulunur.

Tab'ler:

1. `Findings Overview`
2. `Findings List`
3. `By Department`
4. `By Level`

`View All Findings` detailed finding listesine, `View Full Report` ise ilgili
Reports Approval kaydına gider. Her finding current owner, next action, Due
Date, status, severity, related audit ve organization bilgisini gösterir. CAP
acceptance finding closure değildir; Evidence version history korunur.

## Inspection Team

Ekran yalnız Department Manager'a bağlı inspectorları ve bu inspectorların
inspection team'lerini gösterir.

- Total Teams, Active Teams, Upcoming Inspections ve Completed This Month
  özetleri bulunur.
- Search ile Department, Status ve Audit Date filtreleri çalışır.
- Solda team tablosu, sağda selected team detail bulunur.
- Row ellipsis gerçek bir action menu açar.

`View Team Details` seçili audit'in sağ detail panelini açar. Görünen diğer
aksiyonlar anlamlı sonuç üretir:

- Edit/Add/Remove/Change Lead işlemleri focused form açar ve onay sonrası demo
  state'i günceller.
- Update Schedule tarih aralığını ve History kaydını günceller.
- View Assignment Package document preview açar.
- View Audit Details mevcut audit detail'e gider.
- Send Message to Team compose form açar ve mock in-app message kaydı oluşturur.
- Download Team Assignment client-side demo PDF üretir.
- View Activity Log History tab'ını açar.

Desteklenemeyen bir işlem enabled control olarak gösterilmez. Team Notes
browser-local metindir. Attachment'larda yalnız seçilen filename gösterilir;
dosya içeriği upload veya store edilmez.

Detail tab'leri:

- `Overview`
- `Team Members`
- `Assignments`
- `Documents`
- `History`

## Reports Approval

Ekran, “Hangi Preliminary veya Final Report benim kararımı bekliyor?” sorusunu
cevaplar.

Preliminary ve Final Report birbirinden ayrı, korunan artifact'lardır. Bir
Preliminary Report sonradan Final Report'a mutate edilmez. Her kayıt Report ID,
Audit ID, Organization, report type/version, Lead Inspector, submitted time,
current owner/status, findings, attachments, comments ve history taşır.

İlk queue'da Department Manager approval bekleyen Fly Namibia Preliminary
Report ve filtreleri göstermek için temsilî Final Report durumları bulunur.

Filtreler:

- All Reports
- Preliminary Reports
- Final Reports
- Pending My Approval
- Revision Requested
- Approved

Seçili row sağdaki report dossier'i açar. Report Summary, Findings,
Attachments, Manager Comments, History, Full Report Preview ve PDF download
alanları bulunur.

### Approval Kuralları

Her iki report tipi de Department Manager kararından geçer.

Preliminary Report:

1. Lead Inspector submit eder.
2. Department Manager approve, request revision veya return kararı verir.
3. CAP-required findings varsa onaylanan rapor CAP response için Fly Namibia
   Service Provider Portal'a release edilir.
4. CAP gerekmiyorsa configured next governance stage'e ilerler.

Final Report:

1. Lead Inspector configured CAP/Evidence preparation stage sonrasında submit
   eder.
2. Department Manager approve, request revision veya return kararı verir.
3. Department Manager onayı Final Report'u Executive Director / GM stage'ine
   yollar.
4. Report ancak final authorized approval sonrasında issued ve locked olur.

Request Revision ve Return Report için manager comment zorunludur. Kararlar
visible status, current owner, approval history ve mock in-app notification
bilgisini günceller. Gerçek email gönderilmez.

## PDF Download

Download PDF menüsü şunları destekler:

- Preliminary Report PDF
- Final Report seçiliyse Final Report PDF
- Executive Summary PDF
- Inspection Team ekranında Team Assignment PDF

Mevcut browser-side PDF generator report content ve filename parametreleri
alacak şekilde genelleştirilir. Dosya `application/pdf` MIME type, geçerli PDF
header ve Fly Namibia filename taşır. Bu yalnız demo document generation'dır;
production reporting, document storage, signature veya records-management
service değildir.

## Department Manager Dashboard

İlk manager ekranı Total Audits, Reports Awaiting Approval, Open Findings, CAPs
In Progress, Overdue CAPs ve Inspection Team sayaçlarını gösteren kısa bir
operasyon özetidir. Audits, Reports Approval, Risk Dashboard, Inspection Team,
Findings Review, CAP Monitoring ve Checklist Management kartları ilgili ekrana
gider. Recent high-risk findings ve upcoming audits ortak state'ten üretilir.

## CAP Monitoring

Inspection, status, department, Due Date ve date-range filtreleri; CAP sayaçları;
CAP ID, related finding, inspection, department, finding level, status, action
owner, Due Date, days left/overdue, progress ve last update kolonları bulunur.
Alt bölümde küçük status, overdue ve upcoming özetleri yer alır.

Row ellipsis seçili kayıt için sağ tarafta CAP Details drawer açar. Drawer
`Overview`, `Action Plan`, `Updates`, `Documents` ve `History` tab'lerini içerir.
Overview status, owner, assignee, Due Date, priority, target closure date,
finding description, impact/risk, root cause, configured regulatory reference,
linked finding, progress, latest update, attachment filename ve mock notification
history gösterir. `Add Update` browser-local update ve history kaydı ekler. CAP
acceptance finding closure değildir.

## Checklist Management

Department Manager referanstaki package-section-question düzeninde department
checklist package'larını yönetebilir. Sol rail create, select, duplicate,
archive ve publish new version aksiyonlarını sağlar. Seçili package bilgi,
section/question, attachment, history, owner, department, effective date, status
ve version alanlarını gösterir.

Manager section ekleyip çıkarabilir/sıralayabilir; question ekleyebilir,
düzenleyebilir, duplicate edebilir, aktif/pasif yapabilir veya çıkarabilir.
Question formunda text, configured requirement/reference, guidance, evidence
methods, likelihood, impact, demo risk level, finding types, mandatory/critical
toggle ve status bulunur. Published version sessizce overwrite edilmez; değişim
draft version üzerinden yapılır. Her şey yalnız browser-local demo state'tir.

## Risk Dashboard

Date, department, inspection ve risk level filtreleri ile browser-side demo
export bulunur. Ekran findings by risk, trend, risk exposure matrix, top risky
areas, department distribution, overdue CAPs by risk level ve recent high-risk
findings gösterir. Risk score yalnız management indicator'dır; automatic legal,
enforcement, certificate veya closure kararı üretmez.

## General Manager Deneyimi

General Manager Dashboard Pending Final Reports, High Risk Findings, Reports
Awaiting Your Approval ve Overdue CAP sayaçlarını; department overview; compact
risk heat map/distribution ve Final Report approval queue gösterir. General
Manager report'u açabilir, configured final authorized stage'de approve edebilir
veya zorunlu comment ile return edebilir. Final Report yalnız başarılı final
authorized approval sonrasında issued ve locked olur.

`Report Approvals` GM queue'yu, `Departments` department özetini, `Risk
Dashboard` cross-department risk görünümünü açar. General Manager team-editing
ve checklist-editing kontrollerini görmez.

## Interaction, Accessibility ve Responsive Kuralları

- Filter sonucu yoksa açık empty state gösterilir.
- Eksik selected record render error üretmez; ilk visible row veya empty detail
  kullanılır.
- Manager stage terminal decision sonrasında approval action'ları disabled olur.
- Revision/return comment boşsa inline validation gösterilir.
- Duplicate member eklenemez; yeni lead seçilmeden current Lead Inspector
  kaldırılamaz.
- Browser Blob URL üretemezse download failure görünür biçimde gösterilir.
- Semantic button, visible focus, `aria-expanded` ve selected tab state
  kullanılır.
- Severity/status yalnız renkle anlatılmaz.
- Desktop `1536x864` ve mobile `390x844` boyutlarında page-level horizontal
  overflow, clipped primary action veya overlap olmamalıdır.

## Verification

Implementation test-first yürütülür. Focused smoke testler şunları kanıtlar:

- tek `Fly Namibia` user-facing adı;
- manager nav ve Fly Namibia initial selection;
- Findings Review filter/tab/aggregate/detail davranışı;
- Inspection Team manager scope, ellipsis menu, detail, mutation, message,
  history ve PDF davranışı;
- ayrı Preliminary ve Final Report artifact'ları;
- iki report tipi için approve/revision/return yolları;
- revision/return için required comment;
- PDF header, MIME type, filename ve browser download trigger;
- Department Manager ve General Manager sidebar allowlist'leri;
- CAP Monitoring filter, ellipsis drawer, update ve history davranışı;
- Checklist package, version, section ve question değişiklikleri;
- Department Manager dashboard/risk aggregate ve card navigation davranışı;
- General Manager department/risk projection ve final authorized approval;
- old saved-state için migration defaults;
- CAP/Evidence lifecycle ve auditee privacy regresyonlarının korunması.

Sonrasında full Node smoke suite, syntax checks, `git diff --check`,
desktop/mobile browser click-through, console review ve PDF file inspection
çalıştırılır. Browser automation isolated profile kullanır ve işlem sonunda
temizlenir.

## Kapsam Dışı

- Backend, database veya API
- Gerçek authentication/authorization enforcement
- Gerçek file upload, evidence storage veya document repository
- Gerçek email/SMS/external notification
- Production PDF/reporting engine veya e-signature
- Automatic legal, enforcement, certificate veya closure decision
- Framework migration, package-manager setup, predictive analytics veya
  unrestricted chart builder

## Kabul Kriterleri

Department Manager ve General Manager rol demoları:

1. Findings Review açıp Fly Namibia inspection'ını hemen seçebilir;
2. finding overview ve detail kayıtlarını inceleyebilir;
3. Inspection Team'de ellipsis üzerinden selected team ekranını açıp izinli demo
   işlemlerini yapabilir;
4. Reports Approval'da Preliminary ve Final Report inceleyebilir;
5. approve, request revision veya return kararıyla visible state/history
   değişikliğini görebilir;
6. geçerli client-side Preliminary, Final, Executive Summary ve Team Assignment
   demo PDF'lerini indirebilir;
7. CAP'leri izleyip ellipsis üzerinden seçili CAP detail drawer'ını açabilir;
8. browser-local checklist package, section, question ve preserved version
   yönetebilir;
9. yalnız onaylı sidebar girişleriyle Department Manager Dashboard ve Risk
   Dashboard'u kullanabilir;
10. General Manager deneyiminde department/risk özetini inceleyip Final Report
    için final authorized karar verebilir;
11. bu akışları desktop ve mobile boyutta console error veya layout overflow
    olmadan tamamlayabilir.
