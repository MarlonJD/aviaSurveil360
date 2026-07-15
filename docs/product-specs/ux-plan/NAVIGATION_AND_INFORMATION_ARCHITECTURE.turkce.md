# Navigation ve Bilgi Mimarisi

## Inspector IA

Ana ekran genel dashboard değil workbench'tir. Bugünkü assigned Cabin
Inspection'ları, devam eden checklist'leri, CAP ve Evidence review'larını, Due
Soon ve Overdue işleri öne alır. Inspector, Lead Inspector assignment
rotalarına giremez.

## Lead Inspector IA

Lead Inspector işi audit ve report package temellidir. Assignment Questions,
birden çok gerçek team member ve question-level owner destekler. Preliminary
Reports mevcut Report ID'yi doğrudan `Inspection & Findings` adımında açar;
orphan report shell oluşturulmaz.

## Service Provider IA

Service Provider yalnız kendi kuruluşunu ve kendisine release edilen aksiyon
ve raporları görür. Exact operational navigation:

- Corrective Actions (CAP)
- Preliminary Reports
- Final Reports
- Messages
- Documents
- Settings

Home route Corrective Actions (CAP)'tir. List, detail, preview, message ve
download selector'ları organization scope uygular. Internal CAA Note,
enforcement deliberation, internal risk, inspector workload, başka kuruluş ve
unreleased draft dışarıda tutulur.

## Finance IA

Finance tek operational workspace'e sahiptir ve doğrudan buraya açılır:

- Finance Review

Bir budget queue, bir selected budget dossier, approval history ve iki karar
içerir: `Approve Budget` ile `Return for Revision`. Finance audit scope edit
edemez, plan sign/release edemez, report issue edemez veya Executive Director
approval'ını bypass edemez. Finance approval GM Review'a ilerler; `Return for
Revision` Department Manager'a döner.

Planlama onay sırası: Department Manager -> Finance Review -> GM Review ->
Executive Director. Finance onayı planı GM Review'a ilerletir. Finance Return
for Revision kararı planı Department Manager'a döndürür.
GM, Finance review'u
tamamlanmış planı Executive Director'a ilerletebilir veya Department Manager'a
döndürebilir; düzeltilen submission tekrar Finance aşamasından geçmelidir.
Executive Director onayı planı doğrudan release etmez; GM Release to Department
ayrı bir sonraki adım olarak kalır.

## Executive Director IA

Executive Director üç decision module ve iki utility kullanır:

- Dashboard
- Planning
- Final Reports
- Notifications
- Settings

Dashboard pending plan ve Final Report kararlarını ilk viewport'a koyar;
ardından derived department, risk ve overdue bağlamı gösterir. Planning tek
selected plan dossier, preview, `Approve & Sign (Demo)` ve Reject sunar. ED plan
approval mock approval mark kaydeder; yine de Department'a geçiş için ayrı
General Manager release gerekir.

Final Reports yalnız Final Report queue'su, selected review dossier,
state-backed preview ve Approve, Return, Reject veya Refer for Enforcement
Review kararlarını içerir. Yalnız Executive Director approval, uygun Final
Report'u issue, mock-sign ve lock edebilir. Enforcement configured
recommendation/referral olarak kalır ve otomatik sanction uygulamaz.

## Department Manager IA

Department Manager exposure, team work, Findings, CAP delay, checklist
governance ve department kararı bekleyen raporları görür. Department Manager
approval Final Report'u ileri gönderir; issue, sign veya lock etmez.

## General Manager IA

General Manager Dashboard, Planning, Report Approvals, Departments, Risk
Dashboard ve Settings kullanır. Planning, Finance-approved planları GM Review
için erişilebilir kılar: GM planı Department Manager'a return edebilir veya
Executive Director'a ilerletebilir. GM ayrıca intermediate Final Report
reviewer'dır: report'u return edebilir veya Executive Director'a ilerletebilir
fakat issue, sign veya lock edemez. ED plan approval sonrasında ayrı Release to
Department adımını GM uygular.

## Admin IA

Admin günlük operational decision yerine configuration yönetir. Primary
alanlar Checklist Templates, Audit Types, Organization Types, Severity Rules,
Due-Date Rules, Notification Templates, Roles & Permissions ve Audit Log'dur.
Demo configuration production authorization service değildir.

## Stakeholder Readiness IA Kanıtı — 2026-07-10

Selected Fly Namibia Cabin Inspection assignment, altı-section Inspector execution, canonical Preliminary/Final Reports ve Service Provider portal boyunca tek identity kullanır. Assignment key'leri exact execution Question ID'leridir; başka Inspector'a atanmış question audit context için görünür fakat read-only kalır. Lead Final action'ları exact Report ID taşır. GM navigation yalnız intermediate review destekler; final issue/mock-sign/lock ED yetkisidir.

Durum: **demo-only**; focused/static kontroller ile fresh isolated-browser selected-ID, visible-control, responsive ve keyboard/modal kontrolleri **verified locally**. External stakeholder acceptance ve production authorization **not run**; **production-readiness not claimed**.
