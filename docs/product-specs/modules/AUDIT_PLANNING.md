# Audit Planning

## Purpose

Create annual and ad hoc audit/inspection plans.

## Key fields

- Audit ID
- Organization
- Audit type
- Domain
- Planned date
- Location
- Remote/on-site
- Lead inspector
- Team
- Checklist template
- Scope
- Status

## Primary actions

- Create audit
- Schedule
- Reschedule
- Assign inspector
- Select checklist
- Publish plan

## Business rules

- Manual scheduling is MVP
- Audit type determines default templates
- Reschedule requires reason
- Completed audits cannot be deleted

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
