# Ekran Envanteri ve Form Planı

## Demo ekranları

1. Role Switch / Login Demo
2. Manager Dashboard
3. Inspector Dashboard
4. Audit Plan Calendar
5. New Inspection Planning Intake
6. Audit Detail
7. Checklist Runner
8. Lead Inspector Potential Finding Review
9. Finding Detail
10. Auditee Portal Dashboard
11. CAP Submission Form
12. Evidence Upload
13. Evidence Review
14. Closed Finding / Report Preview
15. Admin Template Preview

## Inspector dashboard

Ana amaç: assigned work göstermek.

Kartlar:

- Today's Inspections
- Checklists In Progress
- CAPs Waiting Review
- Evidence Waiting Review
- Due Soon
- Overdue

Primary buttons:

- Start Inspection
- Continue Checklist
- Review CAP
- Review Evidence

## Manager dashboard

Ana amaç: risk ve delay göstermek.

Kartlar:

- Oversight Health Index
- Open Findings
- Overdue Findings
- Critical Findings
- Plan Completion
- Average Closure Time

Needs Attention list:

- Critical findings open
- Overdue major findings
- Organizations with repeat findings
- Audits not started

## Auditee dashboard

Ana amaç: CAA'in ne istediğini göstermek.

Kartlar:

- My Open Findings
- CAP Required
- Evidence Required
- Due Soon
- Overdue
- Closed

Primary buttons:

- Submit CAP
- Upload Evidence
- Respond to CAA

## New Inspection Planning Intake

Ana amaç: executable Audit oluşmadan önce governed bir Planning item
oluşturmaktır.

Alanlar:

- Organization
- Application Type
- Domain
- Inspection Category: `Routine / Announced` veya `Ad Hoc / Unannounced`
- Advance-notice Policy
- Purpose / Trigger
- Planned Date
- Mode
- Location
- Checklist Template
- Scope
- Requested Budget
- Approval Path

`Ad Hoc / Unannounced` için `Advance notification withheld` uygulanır; Service
Provider önceden bilgilendirilmez ve coordination branch atlanır. Submit işlemi,
Current Owner `Finance Review` olacak şekilde seçili Planning Command Center
item'ına döner. Lead Inspector ve team seçimi yalnızca approval ile
`GM Release to Department` sonrasında yapılır. Executable Audit ancak Department
Manager preparation confirmation sonrasında oluşturulur.

## Checklist Runner form

Her checklist item için:

- Question
- Regulation reference
- Expected evidence
- Answer: Compliant / Non-Compliant / Observation / Not Applicable / Not Checked
- Non-Compliant veya Observation sonucu için zorunlu comment
- Mock Evidence filename
- Exact Audit'e scoped Create Potential Finding button

Submitted checklist read-only'dir. Yalnız Inspector veya Lead Inspector valid
stage'de reason-required confirmation ile reopen edebilir. Configured execution
package bulunmayan template açıkça disabled action gösterir.

## Lead Inspector Potential Finding review ve Finding conversion form

Minimum alanlar:

- Title
- Description
- Regulation reference
- Severity
- Due date
- CAP required
- Evidence required
- Reason ile Return
- Reason ile Dismiss
- Convert to Finding button

Observation; CAP unchecked, Evidence unchecked ve Due Date olmadan initialize
edilir. Lead Inspector conversion öncesinde bu alanları açıkça configure
edebilir. Conversion kanonik Finding'e yazar; sessiz rol değişimi yapmaz.

Advanced fields:

- Risk category
- Repeat finding
- Related previous finding
- Internal CAA note

## Auditee CAP form

Helper text kullan:

- Why did this happen? Root cause.
- What will you do to fix it? Corrective action.
- What will you change so it does not happen again? Preventive action.
- Who is responsible?
- When will it be completed?
- Upload evidence.

## Evidence review form

Alanlar:

- Mock Evidence filename ve version
- Related finding
- Related CAP
- Previous versions
- Decision: Close / Partially Close / Not Close
- Comment to auditee
- Internal CAA note

`Close`, `Evidence accepted and verified` kaydeder. `Partially Close` ve `Not
Close` Finding'i açık tutar. Department Manager reason-required authorized
closure, Evidence review'dan ayrıdır. Finding, Auditee ve Manager yüzeyleri;
stage, recipient, date, `demo_recorded` status ve `Demo in-app event; no real
delivery` içeren organization-scoped reminder history gösterir.
