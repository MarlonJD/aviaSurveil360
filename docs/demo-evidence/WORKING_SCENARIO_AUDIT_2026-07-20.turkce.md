# AviaSurveil360 Çalışma Senaryosu Denetimi — 20 Temmuz 2026

## Kanıt durumu

- Denetim durumu: `verified locally`
- Yayın durumu: `release pending`
- Önceki browser kanıtları ve mevcut iddialar: bu çalışmada yeniden üretilene kadar `candidate-only`
- Üretim durumu: `production-ready` iddiası yoktur
- Uygulama değişikliği: yapılmadı
- Remediation planı: oluşturulmadı

Bu rapor, frontend-only AviaSurveil360 demosunun iş akışı ve veri bütünlüğü denetimidir. Production-readiness, mevzuat uygunluğu, penetrasyon veya hukuki değerlendirme değildir.

## Yönetici özeti

`http://127.0.0.1:4173/index.html` üzerinde gerçek browser tıklamalarıyla toplam 70 ayrı rol, geçiş, lifecycle, privacy, kontrol, responsive ve console kontrolü yürütüldü. 60 kontrol `PASS`, 9 kontrol defect-bearing/`FAIL`, rutin koordinasyonun 1 kontrolü `blocked` olarak kaydedildi.

Kök neden bazında 13 bulgu açıldı:

| Önem | Adet |
|---|---:|
| Blocking | 1 |
| High | 6 |
| Medium | 6 |
| Low | 0 |
| FYI | 0 |

En kritik sonuç, Lead Inspector tarafındaki ayrık veri yüzeyidir. Canonical ve yeni materyalize edilen Audit kayıtları Inspector atamalarına gelirken Lead Inspector `Assigned Audits` listesine gelmiyor. Lead bu nedenle assignment workspace'i açıp rutin/announced denetim için koordinasyon paketini gönderemiyor; materyalizasyon ekranı koordinasyonun hazır olduğunu söylese de Auditee hiçbir koordinasyon isteği görmüyor.

Diğer yüksek riskli tutarsızlıklar; aktör atfı, checklist mutasyon yetkisi, owner/next-action yönlendirmesi, plan approval anlamı ve evidence-verified closure ile authorized closure ayrımını etkiliyor.

## Yöntem ve kanıt kontrolleri

- Repo talimatları ve zorunlu source-of-truth belgeleri; gerekli İngilizce/Türkçe companion dosyalarıyla birlikte testten önce okundu.
- Statik demo localhost üzerinden servis edildi; `file://` kullanılmadı.
- In-app browser içinde gerçek tıklama, seçim, yazma, navigation, reload ve rol geçişleri kullanıldı.
- Kanıt üretmek için browser state veya `localStorage` doğrudan değiştirilmedi.
- Bağımsız senaryolar arasında `Reset demo data` kullanıldı. State yalnızca aynı çok-rollerli lifecycle zincirinde korundu.
- Rutin koordinasyon sonucu netleştirilmek için planlama/materialization zinciri temiz başlangıçtan tekrarlandı.
- Tüm senaryolardan sonra final browser console kontrol edildi: sıfır kayıt.
- Responsive viewport sıfırlandı, browser tab'leri kapatıldı, localhost server durduruldu ve kalan browser/test/server process kontrolü yapıldı.

Kanıt klasörü:

`/private/tmp/aviasurveil360-working-scenario-audit-20260720`

Final teşhis kayıtları:

- Console: `/private/tmp/aviasurveil360-working-scenario-audit-20260720/final-console.json`
- Cleanup: `/private/tmp/aviasurveil360-working-scenario-audit-20260720/cleanup.txt`

## Beklenen davranış kaynakları

Başlıca karar sözleşmeleri:

- `AGENTS.md` — Product Rules, Demo-First Rule, Prototype Guidance, Checks
- `docs/product-specs/workflows/MASTER_WORKFLOW.md` — inspection/Finding lifecycle, owner ve next-action modeli
- `docs/product-specs/workflows/SURVEILLANCE_PLANNING_WORKFLOW.md` — approval, release, hazırlık, materialization, announced/unannounced kuralları
- `docs/product-specs/workflows/AUDIT_CHECKLIST_WORKFLOW.md` — draft, submit, reopen ve Potential Finding
- `docs/product-specs/workflows/FINDING_CAP_EVIDENCE_WORKFLOW.md` — CAP, Evidence, verification ve closure
- `docs/product-specs/data-and-rules/STATUS_PERMISSION_SECURITY.md` — rol yetkileri ve privacy sınırları
- `docs/product-specs/data-and-rules/CONCEPTUAL_DATA_MODEL.md` — canonical kimlik, ilişki, owner, status ve evidence history
- `docs/product-specs/modules/AUDITEE_PORTAL.md` — koordinasyon, CAP, report görünürlüğü ve organization isolation
- `docs/product-specs/screen-specs/SCREEN_INVENTORY_AND_FORMS.md` — beklenen ekran, form ve etiketler
- `docs/product-specs/screen-specs/DEPARTMENT_MANAGER_WORKSPACES.md` — yönetim queue'ları ve report approval
- `docs/product-specs/ux-plan/NAVIGATION_AND_INFORMATION_ARCHITECTURE.md` — sekiz rol workspace'i
- `docs/demo-evidence/BUILD_SUMMARY.md` ve `docs/demo-evidence/BROWSER_SCENARIO_INTEGRITY_2026-07-20.md` — önceki `candidate-only` iddialar

## Bulgu özeti

| ID | Önem | Kısa başlık | Ana yüzey |
|---|---|---|---|
| WSA-001 | High | Administration girişi sessiz no-op | Login / Administration |
| WSA-002 | High | Approval tamamlanmadan planning hazırlığı approved gösteriliyor | Planning / Finance / GM / Department Manager |
| WSA-003 | Medium | Mobile karar özetleri desktop'ta görünür kalıyor | Finance, Auditee, checklist/report aksiyonları |
| WSA-004 | High | Giriş yapan Lead ile atanan/kaydedilen aktör eşleşmiyor | Lead Inspector / planning |
| WSA-005 | Blocking | Lead veri seti canonical/materialized Auditleri atlıyor ve rutin koordinasyonu bloke ediyor | Lead Assigned Audits / AUD-2026-001 / AUD-2026-009 |
| WSA-006 | High | Inspector başka Inspector'a ait Audit'i değiştirebiliyor | Inspector / AUD-2026-001 / AUD-2026-005 |
| WSA-007 | Medium | Potential Finding oluşturma sonucu işaretleme olarak etiketlenmiş | Inspector checklist |
| WSA-008 | Medium | Observation başlangıçta CAP/Evidence/Due Date varsayımları taşıyor | Lead Potential Finding review |
| WSA-009 | High | Aynı accepted CAP roller arasında farklı owner/status gösteriyor | Inspector ve Auditee / CAB-2026-012 |
| WSA-010 | High | Authorized closure, evidence-verified closure gibi gösteriliyor | Manager Finding detail / CAB-2026-013/014 |
| WSA-011 | Medium | İç status anahtarları paydaş UI'ına sızıyor | Preliminary Reports ve planning history |
| WSA-013 | Medium | Inspector search, ilgisiz rerender olmadan sonuçları güncellemiyor | Inspector My Assignments |
| WSA-014 | Medium | Checklist submit demo tarihi yerine gerçek sistem tarihini kullanıyor | Inspector checklist / AUD-2026-009 |

İlk üretildiğinde `WSA-012-materialized-audit-missing-coordination.png` adı verilen ekran görüntüsü ayrı bir bulgu değildir; WSA-005'in destek kanıtıdır. Auditee isteğinin görünmemesi ile Lead Audit kaydının kayıp olması aynı kök neden zinciridir.

## Ayrıntılı bulgular

### WSA-001 — High — Administration girişi sessiz no-op

**Ekran / rol / Audit:** rol seçimi / Administration / uygulanamaz

**Önkoşul:** rol seçimi ekranında temiz demo reset.

**Birebir tekrar:**

1. `Reset demo data` tıklanır.
2. `Administration` rol kartı (`Open Administration`) tıklanır.
3. Sayfa ve console gözlenir.

**Beklenen:** Administration preview açılır veya kart açıklamalı şekilde disabled olur.

**Gerçekleşen:** sayfa `Choose your workspace` üzerinde kalır; error, warning, toast veya console kaydı yoktur.

**Risk:** ilan edilen sekiz rolden biri erişilemez ve hata sessizdir.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-001-admin-access-noop.png`

**Kaynak:** `AGENTS.md` Prototype Guidance; `NAVIGATION_AND_INFORMATION_ARCHITECTURE.md` Admin IA; `STATUS_PERMISSION_SECURITY.md` Permissions; `BUILD_SUMMARY.md` rol deneyimleri.

### WSA-002 — High — Approval tamamlanmadan planning hazırlığı approved gösteriliyor

**Ekran / rol / Audit:** Planning command center / Department Manager, Finance, General Manager / `PLAN-2026-Q3-CABIN`

**Önkoşul:** plan Finance Review bekliyor.

**Birebir tekrar:**

1. Department Manager → `Planning` açılır ve Q3 Cabin Inspection planı seçilir.
2. Owner'ın Finance Review ve approval'ın eksik olduğu doğrulanır.
3. `Preparation Detail`, `Preparation Status` ve current preparation step okunur.
4. Aynı kontrol Finance/GM review ve Finance return sonrası tekrarlanır.

**Beklenen:** Finance, GM, ED approval ve GM release öncesi hazırlık approved/released görünmez.

**Gerçekleşen:** dossier aynı anda `Awaiting Finance Review`, `Under GM Review` veya `Returned to Department Manager` derken `Approved - Not Released` gösterir.

**Risk:** onaylanmamış veya geri dönmüş bir surveillance item hazır/onaylı sanılabilir.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-002-003-planning-finance-contradiction-duplicate.png`

**Kaynak:** `SURVEILLANCE_PLANNING_WORKFLOW.md`; `MASTER_WORKFLOW.md`; `STATUS_PERMISSION_SECURITY.md`.

### WSA-003 — Medium — Mobile karar özetleri desktop'ta görünür kalıyor

**Ekran / rol:** Finance Review ve Auditee CAP dossier.

**Önkoşul:** desktop viewport.

**Birebir tekrar:**

1. Finance Review'da Q3 plan açılır ve görünen `Approve Budget` aksiyonları sayılır.
2. Auditee CAP'de yanıt bekleyen Finding seçilir ve `Respond` aksiyonları sayılır.

**Beklenen:** karar yüzeyinde tek primary action; mobile-only özet desktop'ta gizli.

**Gerçekleşen:** Finance'ta iki `Approve Budget`, aynı Auditee Finding için üç `Respond` görünür. `mobile-decision-summary` desktop'ta non-zero rect alır.

**Risk:** belirsizlik, tekrarlı işlem ve accessibility sırası sorunları.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-002-003-planning-finance-contradiction-duplicate.png`

**Kaynak:** `AGENTS.md` Prototype Guidance; `UX_PRINCIPLES.md`; `DEPARTMENT_MANAGER_WORKSPACES.md` responsive behavior.

### WSA-004 — High — Giriş yapan Lead ile atanan/kaydedilen aktör eşleşmiyor

**Ekran / Audit:** Lead planning preparation / `PLAN-2026-Q3-CABIN`

**Önkoşul:** plan release sonrası Lead assignment aşamasında.

**Birebir tekrar:**

1. Lead olarak `Caner Yildiz` atanır.
2. Lead workspace'e girilir; kullanıcı `John Lead Inspector` görünür.
3. `Continue plan preparation` ile teklif gönderilir.
4. Preparation history okunur.

**Beklenen:** yalnızca atanan Lead işlem yapar; görünen ve loglanan aktör authenticated kullanıcıdır.

**Gerçekleşen:** John, Caner'a atanmış işi çalıştırır; history aksiyonu Caner adına kaydeder.

**Risk:** audit trail gerçekte işlem yapmayan kişiye aksiyon atfeder.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-004-lead-assignment-actor-mismatch.png`

**Kaynak:** `STATUS_PERMISSION_SECURITY.md`; `CONCEPTUAL_DATA_MODEL.md`; `SURVEILLANCE_PLANNING_WORKFLOW.md`.

### WSA-005 — Blocking — Lead veri seti canonical/materialized Auditleri atlıyor ve rutin koordinasyonu bloke ediyor

**Ekran / Audit:** Lead Assigned Audits ve Auditee Inspection Coordination / `AUD-2026-001`, `AUD-2026-009`

**Önkoşul:** temiz demo; materialized varyant için tam approval/release/preparation zinciri tamamlanmış.

**Birebir tekrar:**

1. Temiz Lead workspace'te `AUD-2026-001` aranır; bulunamaz ve listede alakasız `AUD-2025-*` kayıtları görülür.
2. Ayrı temiz başlangıçta Finance → GM → ED → GM release → Department accept → Lead assignment → Lead proposal → Department confirmation tamamlanır.
3. `AUD-2026-009 created; Service Provider coordination is ready.` mesajı görülür.
4. Inspector My Assignments'ta `AUD-2026-009` ve `Start` doğrulanır.
5. Lead'e geçilir; liste, notification ve `+ New Audit Assignment` kontrol edilir.
6. `AUD-2026-009` veya `Send Coordination Package` bulunmaz.
7. Auditee → `Inspection Coordination` açılır.

**Beklenen:** Lead canonical/materialized Audit assignment workspace'ini açar, atamaları release eder, koordinasyon paketini gönderir; Auditee tarihi confirm eder veya alternatif önerir.

**Gerçekleşen:** Lead hem canonical hem yeni Audit'i göremez. Inspector AUD-2026-009'u görür, ancak Lead bildirim gönderemediğinden Auditee Coordination boş kalır.

**Risk:** Manager Planning → Lead preparation → Inspector assignment → rutin Auditee coordination ana zinciri tamamlanamaz; aynı operational object için paralel veri seti vardır.

**Kanıt:**

- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-005-lead-canonical-audit-missing.png`
- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-012-materialized-audit-missing-coordination.png`

**Kaynak:** `SURVEILLANCE_PLANNING_WORKFLOW.md`; `AUDITEE_PORTAL.md` Inspection Coordination; `NAVIGATION_AND_INFORMATION_ARCHITECTURE.md` Lead IA; `CONCEPTUAL_DATA_MODEL.md`.

### WSA-006 — High — Inspector başka Inspector'a ait Audit'i değiştirebiliyor

**Ekran / Audit:** Inspector Checklist Runner / `AUD-2026-001`, `AUD-2026-005`, `AUD-2026-009`

**Önkoşul:** temiz Inspector workspace.

**Birebir tekrar:**

1. `Ahmed Ali` olarak girilir.
2. AUD-2026-001 açılır; scope/owner `Aylin Sezer`, soru `Unassigned` görülür.
3. Sonuç değiştirilir ve `Save Draft` tıklanır.
4. AUD-2026-005'te aynı kontrol tekrarlanır.

**Beklenen:** Ahmed yalnızca kendisine veya yetkili shared scope'a atanmış soruları değiştirebilir.

**Gerçekleşen:** Ahmed, Aylin'e ait görünen paketlerde sonuç değiştirebilir, draft kaydedebilir, submit ve reopen yapabilir.

**Risk:** checklist kanıtı yanlış Inspector tarafından sessizce değiştirilebilir.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-006-inspector-assignment-owner-mismatch.png`

**Kaynak:** `STATUS_PERMISSION_SECURITY.md`; `AUDIT_CHECKLIST_WORKFLOW.md`; `CHECKLIST_BUILDER_AND_RUNNER.md`.

### WSA-007 — Medium — Potential Finding oluşturma sonucu işaretleme olarak etiketlenmiş

**Ekran / Audit:** Inspector Checklist Runner / `AUD-2026-001`

**Önkoşul:** PBE sorusu Non-Compliant ve comment dolu.

**Birebir tekrar:**

1. PBE row action menu açılır.
2. `Mark Non-Compliant` tıklanır.
3. Lead'e geçilir ve `PF-2026-001` görülür.

**Beklenen:** komut `Create Potential Finding` olarak açıkça adlandırılır.

**Gerçekleşen:** `Mark Non-Compliant` gizli yan etkiyle Potential Finding oluşturur.

**Risk:** kullanıcı ayrı review object'i oluşturduğunu öngöremez.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-007-potential-finding-mislabeled-action.png`

**Kaynak:** `AUDIT_CHECKLIST_WORKFLOW.md`; `SCREEN_INVENTORY_AND_FORMS.md`.

### WSA-008 — Medium — Observation başlangıçta CAP/Evidence/Due Date varsayımları taşıyor

**Ekran / Audit:** Lead Potential Finding review / `PF-2026-001`, `AUD-2026-001`

**Önkoşul:** Observation sonucundan Potential Finding oluşturulmuş.

**Birebir tekrar:**

1. Lead review açılır.
2. Severity değiştirilmeden conversion kontrolleri okunur.

**Beklenen:** Observation için CAP ve Evidence kapalı, Due Date boş olmalıdır.

**Gerçekleşen:** severity boşken CAP Required ve Evidence Required checked, Due Date `2026-07-15`; değerler ancak Observation tekrar seçilince temizlenir.

**Risk:** Observation yanlış yükümlülükleri devralabilir.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-008-observation-defaults-contradiction.png`

**Kaynak:** `FINDING_CAP_EVIDENCE_WORKFLOW.md`; `SCREEN_INVENTORY_AND_FORMS.md`; `AGENTS.md` Product Rules.

### WSA-009 — High — Aynı accepted CAP roller arasında farklı owner/status gösteriyor

**Ekran / Finding:** Inspector Findings ve Auditee CAP / `CAB-2026-012`, `AUD-2026-001`

**Önkoşul:** CAP accepted, Evidence gerekli.

**Birebir tekrar:**

1. Inspector Findings'ta CAB-2026-012 seçilir; status, owner ve next action kaydedilir.
2. Reset yapmadan Auditee CAP'e geçilir ve aynı Finding seçilir.

**Beklenen:** CAP acceptance sonrası Finding açık, owner Auditee ve next action Evidence upload olan tek canonical tuple.

**Gerçekleşen:** Inspector `Accepted / CAA Inspector / Review CAP and evidence`; Auditee `CAP Accepted — Evidence Required / Auditee / Upload evidence` gösterir.

**Risk:** aynı Finding farklı work queue'lara yönlenir; iş kaçabilir veya tekrarlanabilir.

**Kanıt:**

- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-009-inspector-accepted-cap-owner.png`
- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-009-auditee-accepted-cap-owner.png`

**Kaynak:** `MASTER_WORKFLOW.md` Owner/Next action; `CONCEPTUAL_DATA_MODEL.md`; `CAP_MANAGEMENT.md`.

### WSA-010 — High — Authorized closure, evidence-verified closure gibi gösteriliyor

**Ekran / Finding:** Department Manager Finding detail / `CAB-2026-013`, `CAB-2026-014`

**Önkoşul:** temiz Manager state.

**Birebir tekrar:**

1. Closed Observation CAB-2026-014 açılır; audit trail'in authorized/no-CAP closure dediği ve Evidence olmadığını doğrulanır.
2. Banner ve stepper okunur.
3. Ayrı olarak CAB-2026-013'te `Authorized closure…` açılır; boş reason'ın engellendiği doğrulanır, reason girilip closure yapılır.
4. Banner, stepper, Evidence ve audit trail yeniden okunur.

**Beklenen:** authorized yol evidence verification'dan açıkça farklıdır; yaşanmayan CAP/Evidence adımları tamamlanmış görünmez.

**Gerçekleşen:** reason gate ve audit log doğrudur; ancak banner `after evidence acceptance` der ve stepper CAP/Evidence aşamalarını complete gösterir. Aynı sayfa Evidence olmadığını ve CAP'in Not Required/Not Submitted olduğunu söyler.

**Risk:** closure'ın gerçek dayanağı yanlış temsil edilir.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-010-authorized-closure-shown-as-evidence-verified.png`

**Kaynak:** `MASTER_WORKFLOW.md`; `FINDING_CAP_EVIDENCE_WORKFLOW.md`; `CONCEPTUAL_DATA_MODEL.md`; `AGENTS.md` Product Rules.

### WSA-011 — Medium — İç status anahtarları paydaş UI'ına sızıyor

**Ekran / kayıt:** Lead Preliminary Reports ve planning history / `PR-2026-018`, `PLAN-2026-Q3-CABIN`

**Önkoşul:** Preliminary Report Lead'e return edilmiş; planning zinciri ilerletilmiş.

**Birebir tekrar:**

1. Department Manager olarak PR-2026-018 comment ile return edilir.
2. Lead → Preliminary Reports açılır.
3. Status cell ve sayaçlar okunur.
4. Planning history'de release/accept/assign/propose/materialize kayıtları incelenir.

**Beklenen:** `Returned to Lead Inspector`, `Released to Department`, `Lead Inspector Assigned` gibi insan-okur label'lar.

**Gerçekleşen:** report `returned_to_lead` gösterir ve kategorik sayaçlara girmez; planning history `released_to_department`, `accepted_by_department`, `lead_inspector_assigned`, `team_schedule_proposed`, `ready_for_execution` anahtarlarını gösterir.

**Risk:** status anlaşılmaz ve sayaçlar görünür kayıtla uzlaşmaz.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-011-preliminary-raw-return-status.png`

**Kaynak:** `MASTER_WORKFLOW.md`; `SURVEILLANCE_PLANNING_WORKFLOW.md`; `DEPARTMENT_MANAGER_WORKSPACES.md`.

### WSA-013 — Medium — Inspector search, ilgisiz rerender olmadan sonuçları güncellemiyor

**Ekran:** Inspector My Assignments.

**Önkoşul:** assignment listesi görünür.

**Birebir tekrar:**

1. `Search audits...` alanına `ZZZ-NO-MATCH` yazılır ve Enter'a basılır.
2. Listenin görünür kalabildiği gözlenir.
3. Başka sayfaya gidilip geri dönülür; şimdi no-match görünür.
4. Input temizlenir ve blur edilir; boş input'a rağmen no-match kalabilir.
5. Başka sayfaya gidilip geri dönülür; liste geri gelir.

**Beklenen:** sonuçlar visible query ile anında senkronize olur.

**Gerçekleşen:** input query'yi persist eder fakat input anında render etmez; unrelated navigation daha sonra uygular.

**Risk:** Inspector yanlışlıkla assignment yok sanabilir veya listenin aramayı yansıttığını düşünebilir.

**Kanıt:**

- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-013-inspector-search-does-not-filter.png`
- `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-013-inspector-search-stale-results.png`

**Kaynak:** `AGENTS.md` Prototype Guidance; `NAVIGATION_AND_INFORMATION_ARCHITECTURE.md`; `UX_PRINCIPLES.md`.

### WSA-014 — Medium — Checklist submit demo tarihi yerine gerçek sistem tarihini kullanıyor

**Ekran / Audit:** Inspector Checklist Runner / `AUD-2026-009`

**Önkoşul:** Audit materialize edilmiş, altı soru tamamlanmış.

**Birebir tekrar:**

1. Tüm checklist bölümleri UI üzerinden tamamlanır.
2. `Submit to Lead Inspector` tıklanır.
3. Confirmation'daki `Submitted On` okunur.
4. Reminder, approval ve history kayıtlarının demo tarihiyle karşılaştırılır.

**Beklenen:** deterministik demo timestamp `15 Jun 2026` kullanır veya gerçek wall-clock açıkça ve tutarlı biçimde etiketlenir.

**Gerçekleşen:** modal `2026-07-20T01:51:15.097Z` kaydeder; çevredeki lifecycle `15 Jun 2026` kullanmaya devam eder.

**Risk:** sıralama, ageing, due-date ve audit history tutarsızlaşır.

**Kanıt:** `/private/tmp/aviasurveil360-working-scenario-audit-20260720/WSA-014-checklist-real-date-vs-demo-date.png`

**Kaynak:** `BROWSER_SCENARIO_INTEGRITY_2026-07-20.md`; `REMINDERS_AND_ESCALATION_WORKFLOW.md`; `CONCEPTUAL_DATA_MODEL.md`.

## Coverage matrisi

Sayılar click adedi değil, ayrı senaryo/geçiş kontrolleridir.

| Alan | Kontrol | Sonuç | Kanıt özeti |
|---|---:|---|---|
| Sekiz rol girişi ve navigation sınırları | 8 | 7 PASS, 1 FAIL | Administration WSA-001 |
| Finance → GM → ED → GM release | 1 | PASS | ED approval tek başına release etmedi; GM release gerekti |
| Finance return → Department resubmit | 1 | PASS | reason required, owner dönüşü ve yeniden Finance queue doğrulandı |
| Department accept → Lead assign/proposal → materialization | 1 | PASS with findings | AUD-2026-009 yaratıldı; WSA-002/004 |
| Rutin announced coordination | 1 | `blocked` | WSA-005 |
| Ad Hoc / Unannounced visibility | 2 | PASS | Inspector erişti; Auditee advance notice görmedi |
| Checklist package identity | 3 | PASS | Cabin, Security, materialized Cabin |
| Save Draft, submit/read-only, reason-required reopen | 3 | PASS with finding | persistence doğru; WSA-014 timestamp |
| Aynı sorunun Audit izolasyonu | 1 | PASS | AUD-001 `na`, AUD-009 `compliant` korundu |
| Inspector owner/assignment enforcement | 2 | FAIL | WSA-006 |
| Açıkça disabled/template-only kontroller | 4 | PASS | unavailable/preview durumu dürüstçe etiketli |
| Inspector assignment search | 1 | FAIL | WSA-013 |
| Non-Compliant comment requirement | 1 | PASS | boş comment creation'ı engelledi |
| Potential Finding convert / return / dismiss | 3 | PASS with finding | reason/severity doğru; label WSA-007 |
| Severity ve Observation defaults | 2 | 1 PASS, 1 FAIL | Observation WSA-008 |
| Potential Finding action label | 1 | FAIL | WSA-007 |
| Auditee CAP submit ve revision | 2 | PASS | required alanlar ve return comment enforce edildi |
| CAP accept, Finding açık kalır | 1 | PASS | Evidence-required state Auditee'ye geçti |
| Cross-role owner/status | 1 | FAIL | WSA-009 |
| Evidence v1/v2 append-only | 2 | PASS | v1 korundu, v2 eklendi |
| Not Close / Partially Close / Close | 3 | PASS | comment + internal note required, closure yalnız Close ile |
| Authorized closure reason gate | 1 | PASS | boş reason engellendi, audit log oluştu |
| Authorized/evidence display ayrımı | 1 | FAIL | WSA-010 |
| Internal CAA Note privacy | 1 | PASS | Auditee internal note görmedi |
| Reminder/escalation history | 1 | PASS | `demo_recorded`, `in_app`, no real delivery |
| Preliminary DM → GM → ED → Auditee | 4 | PASS | visibility ED issue sonrası başladı |
| Preliminary return ve Lead resubmit | 2 | 1 PASS, 1 FAIL | resubmit çalıştı; WSA-011 |
| Final DM → GM → ED → Auditee | 4 | PASS | terminal action disabled; açık Findings kapanmadı |
| Report organization privacy | 2 | PASS | Fly Namibia portal diğer organization kayıtlarını göstermedi |
| Auditee route privacy sweep | 7 | PASS | Coordination, CAP, Preliminary, Final, Messages, Documents, Settings |
| 390×844 responsive checklist/navigation | 2 | PASS with finding | horizontal overflow yok; duplicate action WSA-003 |
| Final console | 1 | PASS | sıfır kayıt |
| **Toplam** | **70** | **60 PASS, 9 FAIL, 1 blocked** | `verified locally` |

## Önemli çalışan lifecycle kanıtları

- CAP acceptance Finding'i kapatmadı; Auditee Evidence yüklemeye yönlendirildi.
- Evidence v1 `Not Close` ile return edildi; v2 yüklenince v1 korunmaya devam etti.
- `Partially Close` Finding'i açık tuttu; `Close` Evidence verification sonrası kapattı.
- Authorized closure reason istedi ve Department Manager aktör/reason audit history'ye yazıldı.
- Auditee Evidence review sırasında kullanılan Internal CAA Note'u görmedi.
- Preliminary ve Final Reports Department Manager → General Manager → Executive Director zincirini izledi; yalnız ED issue sonrası Auditee gördü.
- Final Report issue açık Findings'i kapatmadı.
- Manual reminder `demo_recorded` / `in_app` kullandı ve real delivery olmadığını belirtti.
- 390×844 test edilen checklist ve Findings rotalarında horizontal overflow yoktu; drawer navigation çalıştı.

## `not run` ve `blocked`

### `blocked`

- Administration: role card sessiz kaldığı için bloke (WSA-001).
- Canonical/materialized Audit Lead assignment/coordination: Lead `AUD-2026-001` ve `AUD-2026-009` kayıtlarını açamadığı için bloke (WSA-005).
- Rutin Auditee `Confirm Proposed Date` ve `Propose Alternative Date`: WSA-005 downstream etkisiyle istek hiç görünmedi.

### `not run`

- `Template preview only` veya `Report preview unavailable` etiketli satırların deep execution'ı; bunun yerine truthful disabled state doğrulandı.
- `Ready for Preparation` durumundan sıfırdan yeni Final Report yaratımı; temiz seed Final Reports'u approval state'lerinde veriyor. DM → GM → ED → Auditee zinciri tam çalıştırıldı.
- Her ekranın her breakpoint'teki kombinasyonu; desktop ve 390×844 ana checklist/Findings rotaları kontrol edildi.
- Görünür report download aksiyonu sonrası indirilen archive/PDF byte doğrulaması.
- Real auth, backend, database, gerçek upload/storage, email/SMS/WhatsApp, external notification, secure repository ve production audit log; demo sınırı gereği `not run`.
- Gerçek mevzuat kaynağı doğrulama veya hukuki yorum.

## Console ve cleanup

- Final console: `verified locally`; `final-console.json` içinde sıfır kayıt.
- Localhost server: exit code 0 ile durdu.
- Browser: viewport reset edildi, tüm in-app tab'ler finalize edildi.
- Process hygiene: görev server'ı, Playwright, Puppeteer, webdriver, HeadlessChrome veya remote-debugging Chrome process'i kalmadı; kontrol komutu yalnız kendisini eşledi.

## Denetim sınırı

Bu rapor yalnız gözlenen davranışı kaydeder. Fix uygulamaz, remediation sırası önermez, mevcut planları güncellemez ve `production-ready` iddiasında bulunmaz. Daha sonra hazırlanacak remediation planı için girdidir.
