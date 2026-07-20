# Audit Checklist Workflow

## Purpose

Help inspectors run an exact Audit checklist and submit reviewable Potential
Findings from Non-Compliant or Observation results.

## Steps

1. Open audit
2. Start checklist
3. Answer question
4. Add the required comment and optional mock Evidence filename
5. Create an audit-scoped Potential Finding when eligible
6. Lead Inspector returns, dismisses, or converts the Potential Finding
7. Complete section
8. Submit checklist
9. Generate draft report

## Rules

- Answers: Compliant, Non-Compliant, Observation, Not Applicable, Not Checked
- Non-Compliant and Observation offer `Create Potential Finding` only after a
  required comment is recorded for the exact Audit
- Lead conversion creates the canonical Finding; Inspector execution does not
  issue it directly or switch roles
- Each configured checklist control writes only to its exact Audit; a template
  without an execution package is explicitly disabled
- A submitted checklist stays read-only unless an Inspector or Lead Inspector
  reopens it at a valid stage and records a reason

## UX notes

- Show current owner, due date and next action at the top of the screen.
- Keep history in timeline/tab, not as primary content.
- Use primary buttons that match the next action.
