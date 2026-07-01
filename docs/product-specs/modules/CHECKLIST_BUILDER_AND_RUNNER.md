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
- Create finding
- Complete checklist

## Business rules

- Templates are versioned
- Old audits keep old template version
- Non-compliant answer can create finding
- Observation CAP optional by configuration

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
