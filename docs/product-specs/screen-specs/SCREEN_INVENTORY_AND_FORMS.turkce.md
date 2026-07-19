# Ekran Envanteri ve Form Planı

## Demo ekranları

1. Role Switch / Login Demo
2. Manager Dashboard
3. Inspector Dashboard
4. Audit Plan Calendar
5. New Inspection Planning Intake
6. Audit Detail
7. Checklist Runner
8. Finding Detail
9. Auditee Portal Dashboard
10. CAP Submission Form
11. Evidence Upload
12. Evidence Review
13. Closed Finding / Report Preview
14. Admin Template Preview

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
- Comment
- Attachment
- Create Finding button

## Finding form

Minimum alanlar:

- Title
- Description
- Regulation reference
- Severity
- Due date
- Auditee responsible person
- CAP required
- Evidence required
- Issue Finding button

Advanced fields:

- Risk category
- Repeat finding
- Related previous finding
- Enforcement escalation
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

- Evidence preview
- Related finding
- Related CAP
- Previous versions
- Decision: Accept / Reject / Request More Information
- Comment to auditee
- Internal CAA note
