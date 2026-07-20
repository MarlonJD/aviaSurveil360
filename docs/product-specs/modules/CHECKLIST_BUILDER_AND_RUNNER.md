# Checklist Builder and Runner

## Purpose

Create reusable checklists and let inspectors execute them.

## Key fields

- Template name
- Version
- Section
- Question
- Reference
- Expected evidence
- Default severity
- Answer
- Comment
- Attachment

## Primary actions

- Create template
- Version template
- Start checklist
- Answer item
- Attach file
- Create Potential Finding
- Complete checklist

## Business rules

- Templates are versioned
- Old audits keep old template version
- Non-Compliant or Observation plus a required comment can create an
  audit-scoped Potential Finding for Lead Inspector review
- Only Lead conversion creates the canonical Finding
- Observation CAP, Evidence, and Due Date are optional by configuration
- Submitted checklist reopen requires Inspector/Lead authority, a valid stage,
  and a reason

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
