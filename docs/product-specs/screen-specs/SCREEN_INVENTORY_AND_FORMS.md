# Screen Inventory and Form Plan

## Demo screens

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

Main goal: show assigned work.

Cards:

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

Main goal: show risk and delay.

Cards:

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

Main goal: show what the CAA needs.

Cards:

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

Main goal: create a governed Planning item before any executable Audit exists.

Fields:

- Organization
- Application Type
- Domain
- Inspection Category: `Routine / Announced` or `Ad Hoc / Unannounced`
- Advance-notice Policy
- Purpose / Trigger
- Planned Date
- Mode
- Location
- Checklist Template
- Scope
- Requested Budget
- Approval Path

`Ad Hoc / Unannounced` uses `Advance notification withheld`; the Service
Provider is not informed in advance and the coordination branch is skipped.
Submission returns to the selected Planning Command Center item with
`Finance Review` as the Current Owner. Lead Inspector and team selection occur
only after approval and `GM Release to Department`. The executable Audit is
created only after Department Manager preparation confirmation.

## Checklist Runner form

For each checklist item:

- Question
- Regulation reference
- Expected evidence
- Answer: Compliant / Non-Compliant / Observation / Not Applicable / Not Checked
- Comment
- Attachment
- Create Finding button

## Finding form

Minimum fields:

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

## CAP form for auditee

Use helper text:

- Why did this happen? Root cause.
- What will you do to fix it? Corrective action.
- What will you change so it does not happen again? Preventive action.
- Who is responsible?
- When will it be completed?
- Upload evidence.

## Evidence review form

Fields:

- Evidence preview
- Related finding
- Related CAP
- Previous versions
- Decision: Accept / Reject / Request More Information
- Comment to auditee
- Internal CAA note
