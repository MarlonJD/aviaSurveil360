# Local Telemetry Contract

All local candidate telemetry uses W3C trace context, stable correlation IDs,
bounded resource attributes, allowlisted signal attributes, and the ownership
catalog. Telemetry must never carry passwords, provider tokens, session
cookies, Evidence bytes, message bodies, Internal CAA Note text, or unnecessary
PII.

## Resource attributes

The bounded resource set is `service.name`, `service.version`,
`deployment.environment.name`, `service.instance.id`, and `build.profile` where
applicable. Entity, user, Finding, Audit, record, or organization IDs are not
metric labels.

## Signal catalog

| Name | Kind | Unit | Owner | Redaction class | Allowed attributes |
|---|---|---|---|---|---|
| http.server.request | span | request | Backend | operational | http.request.method,http.route,http.response.status_code,operation.class,module,correlation.id |
| http.server.duration | metric | ms | Backend | operational | http.request.method,http.route,http.response.status_code,operation.class,module |
| db.client.operation | span | operation | Backend | restricted | db.system.name,db.operation.name,module,outcome.class,correlation.id |
| db.client.operation.duration | metric | ms | Backend | operational | db.system.name,db.operation.name,module,outcome.class |
| outbox.ready.age | metric | s | Backend | operational | job.kind,queue,outcome.class |
| worker.job.process | span | job | Backend | restricted | job.kind,adapter,outcome.class,correlation.id |
| worker.job.attempts | metric | attempt | Backend | operational | job.kind,adapter,outcome.class |
| dependency.health | metric | state | Platform/Operations | operational | dependency.name,required,outcome.class |
| browser.route.navigation | span | navigation | Frontend | operational | route.id,build.profile,navigation.type,outcome.class,correlation.id |
| browser.web_vital | metric | {web_vital} | Frontend | operational | route.id,build.profile,web_vital.name,rating |
| browser.api.outcome | metric | request | Frontend | operational | route.id,build.profile,operation.class,outcome.class |
| browser.error.handled | log | event | Frontend | restricted | route.id,build.profile,error.class,outcome.class,correlation.id |
| backup.recovery_point.age | metric | s | Platform/Operations | operational | backup.stanza,backup.type,outcome.class |
| recovery.rpo.duration | metric | s | Platform/Operations | operational | recovery.component,scenario,outcome.class |
| recovery.rto.duration | metric | s | Platform/Operations | operational | scenario,outcome.class |

## Redaction classes

- `public`: operational constants safe for the local dashboard.
- `operational`: bounded technical state without user content or credentials.
- `restricted`: correlation-safe technical context available only to the local
  operations profile.

Collector processing must drop non-allowlisted attributes, redact known
credential keys, truncate diagnostic strings, and reject unbounded metric
labels. Sanitized error telemetry records only a stable error class and outcome
class; raw error text is not exported.
