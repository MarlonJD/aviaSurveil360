# Modül Mimarisi

## Core modüller

| Module | Amaç | MVP priority |
|---|---|---|
| Organization Registry | Denetlenen kuruluşların master listesi | Must |
| Surveillance Planning | Annual/ad hoc audit planning | Must |
| Audit Execution | Audit kaydı ve progress | Must |
| Checklist Builder/Runner | Template ve execution | Must |
| Findings Management | Merkezi finding lifecycle | Must |
| Auditee Portal | External organization aksiyonları | Must |
| CAP Management | Root cause ve corrective action | Must |
| Evidence Repository | Evidence upload/review/versioning | Must |
| Notifications | Due-date ve status messages | Must |
| Dashboard/Reports | Oversight visibility | Must |
| Admin Configuration | Templates, roles ve rules | Basic MVP |
| Mobile Inspection App | Field/offline support | Later |
| Risk-Based Planning | Smart frequency/risk suggestions | Later |
| Enforcement Integration | Escalation ve legal cases | Later |

## Ortak platform servisleri

AviaSurveil360 diğer AVIA ürünleriyle şunları paylaşabilir:

- Users and roles
- Organization registry
- Document storage
- Notification service
- Audit trail
- Reporting shell
- Risk flags

## Architecture UX rule

Backend modular ve configurable olabilir. Frontend role-based ve task-based kalmalı. Backend'de modül var diye onu menüye koyma.

## Onaylanan hedef uygulama mimarisi — 22 Temmuz 2026

Hedef; iki açık build profili kullanan tek bir browser uygulaması ve tek bir
modular backend'dir. Aynı 86 React route'u demo için deterministik
`MockBackend`, gerçek çalışma için Go/PostgreSQL destekli same-origin
`HttpBackend` ile çalışmalıdır. Demo modu ikinci bir UI değildir; HTTP modu
mock data, root-demo JavaScript veya test-only authentication import edemez.

Seçilen yaklaşım, external platform servisleri kullanan modular monolith'tir.
Microservice, Kafka, RabbitMQ, Kubernetes ve ikinci frontend framework mevcut
kapsam için kullanılmayacaktır. API ve background worker'lar tek Go module'den
üretilen ayrı process'ler olarak kalır.

Değerlendirilen alternatifler:

1. **Her product module için bağımsız microservice — şu an reddedildi.** Ölçek
   veya ekip sınırı kanıtı olmadan distributed transaction, duplicated
   authorization, service discovery ve operasyon yükü oluşturur.
2. **Identity, scan, email ve PDF dahil tamamen tek process monolith —
   reddedildi.** Security/platform lifecycle'larını domain code'a bağlar ve
   bağımsız failure/restart/resource sınırını engeller.
3. **Modular Go monolith + external platform servisleri — seçildi.** Domain
   transaction ve authorization bütünlüğünü korurken Keycloak, ClamAV, SMTP,
   Gotenberg, object storage ve telemetry'nin replaceable adapter ve ayrı
   process olarak çalışmasını sağlar.

### Uygulama bileşenleri

| Bileşen | Seçilen teknoloji | Sorumluluk |
|---|---|---|
| Browser client | React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod | 86 role/task route'un tamamı, demo/HTTP profilleri, accessibility, responsive UI ve doğru action state |
| Demo data boundary | `MockBackend` ve deterministik `MemoryMockStore` | Server olmadan tam 86-route demo ve tekrarlanabilir browser testleri |
| HTTP data boundary | Generated OpenAPI transport ve `HttpBackend` | Aynı frontend capability contract'ının gerçek same-origin HTTP isteklerine eşlenmesi |
| Offline field boundary | Dexie/IndexedDB, OPFS, Service Worker | Yalnız Inspector package, checklist, Potential Finding, Inspection Attachment ve causal foreground sync |
| API | Go 1.26 modular monolith, `chi`, generated OpenAPI types | Authentication boundary, authorization, validation, projection, command, idempotency ve audit events |
| Persistence | PostgreSQL 17, `pgx`, `sqlc`, forward-only migration | Authoritative transaction state, append-only audit records, idempotency, change feed ve outbox |
| Worker'lar | Aynı module içindeki Go command'ları | Outbox delivery, Evidence scan, notification, document ve scheduled reminder work |
| Identity | Application-managed provisioning ve TOTP MFA kullanan Keycloak | Local production-like OIDC, roller, user lifecycle, session revocation ve MFA |
| Object storage | Private MinIO bucket'ları | Immutable Evidence, Inspection Attachment delivery, generated report versions, quarantine ve backup artifact |
| Malware scanning | ClamAV `clamd` ve `freshclam` | Gerçek local signature scan; Evidence review/download öncesi fail closed |
| E-posta | SMTP adapter ve local Mailpit | External provider olmadan observable local notification/reminder delivery |
| Doküman üretimi | Gotenberg | Onaylı HTML template'lerden versioned PDF üretimi |
| Local gateway | Caddy | Local HTTPS, static HTTP artifact, same-origin `/api` ve `/auth`, security headers ve servis izolasyonu |
| Secrets | Localde Docker secrets; encrypted configuration için SOPS + age; ileride AWS Secrets Manager/SSM | Plaintext runtime credential commit edilmez |
| Telemetry | OpenTelemetry Collector, Prometheus, Grafana, Loki, Tempo, Alertmanager | Metrics, logs, traces, dashboard, alert routing ve local operasyon tatbikatları |
| PostgreSQL backup | pgBackRest | Ayrı application ve Keycloak database full/differential/incremental backup'ları, identity/application fingerprint'leri, retention, restore verification ve candidate RPO/RTO evidence |
| Object backup | MinIO versioning/object lock ve mantıksal olarak izole local backup store'a doğrulanan mirror | Versioning'i tek backup saymadan exact object/version recovery; aynı host üzerindeki local kanıt host-loss recovery değildir |
| Local orchestration | Docker Compose profiles | `demo`, `full`, `test`, `observability` ve `recovery` çalışma şeritleri |
| Gelecekte AWS denemesi | Terragrunt ile birleştirilen Terraform resource modülleri | Local kabulden sonra VPC, load balancer, EC2 runtime, RDS PostgreSQL, S3, ECR, KMS, Secrets Manager, telemetry ve backup kaynakları; resource'ların sahibi Terraform, environment composition ve generated backend wiring'in sahibi Terragrunt'tır |

### Domain ownership

Go module; identity, organizations, planning, inspections, teams/assignments,
checklists/templates/questions, Potential Findings, Findings, CAP, Evidence,
reports, documents, communications, notifications/reminders, risk/analytics
projection'ları, administration, configuration, audit log, sync ve sınırlandırılmış
Inspector-assistant draft provider için bounded package'lar kullanır. Bir package
başka modülü yalnız application service veya authorized projection üzerinden
okuyabilir ve başka modülün tablolarını doğrudan güncelleyemez.

Inspector assistant yalnız advisory kalır. Local provider deterministik ve
server-hosted olur; Finding oluşturamaz, severity değiştiremez, work kapatamaz
ve enforcement kararı veremez. Gelecekteki external model aynı audit edilmiş
draft interface'ini uygulamalı ve ayrı governance kararı gerektirmelidir.

### Request ve event akışı

1. Caddy local HTTPS'i sonlandırır ve HTTP React artifact'ını sunar.
2. Keycloak OIDC tamamlar; Go BFF provider token'larını server-side saklar ve
   Secure, HttpOnly, SameSite application session üretir.
3. React yalnız `HttpBackend` üzerinden same-origin `/api` ve `/auth` çağırır.
4. API domain state yüklemeden veya değiştirmeden object/field scope'u authorize eder.
5. Command transaction; domain mutation, audit event, idempotency response,
   authorized change record ve outbox item'ı birlikte yazar.
6. Worker'lar outbox işlerini claim eder ve typed adapter ile ClamAV,
   SMTP/Mailpit, Gotenberg veya MinIO çağırır. Retry'lar idempotent ve observable olur.
7. React typed query'leri invalidate eder veya authorized sync change işler;
   hiçbir UI action tek durable effect olarak toast kullanmaz.
8. Deterministik reset/seed davranışı yalnız scoped test-profile one-shot
   lane'inde bulunur. Normal OIDC/full API hiçbir `/__test/*` route'u kaydetmez.

### Local kabul sınırı

Local sistem ancak 86 ekranın tamamı demo ve HTTP profillerinde çalıştığında,
her visible action gerçek mock ve HTTP sonucuna sahip olduğunda, tüm multi-role
senaryolar PostgreSQL'e karşı replay edildiğinde, tam Compose stack temiz
makinede başladığında, normal OIDC + MFA çalıştığında, scan/email/PDF worker'ları
observable olduğunda, application ve Keycloak database ile object backup/restore
ve RPO/RTO drill'leri geçtiğinde, normal full mode test reset route'u
sunmadığında ve task'e ait process/container kalıntısı olmadığında kabul edilir.

Local kabul production deployment değildir. AWS planning ancak Plans 1–3 kabul
edildikten ve Plan 4 Tasks 1–9 ile Task 11 local `ready-for-verification`
milestone'una ulaştıktan sonra başlayabilir. AWS Task 10 bu local completion
gate'inin dışındaki optional branch'tir ve bootstrap, foundation/ECR,
artifact-publication ve data/runtime phase'lerinin her biri için yeni explicit
authorization gerektirir. Traffic cutover, production legal/records policy,
external penetration test, production identity federation, provider contract
ve on-call staffing ayrı approval gate'leridir.

### Bağlayıcı execution planları

1. `docs/exec-plans/active/2026-07-22-full-react-86-screen-migration-plan.md`
2. `docs/exec-plans/active/2026-07-22-full-backend-scenario-parity-plan.md`
3. `docs/exec-plans/active/2026-07-22-local-production-like-services-plan.md`
4. `docs/exec-plans/active/2026-07-22-reliability-dr-and-aws-terraform-terragrunt-plan.md`
