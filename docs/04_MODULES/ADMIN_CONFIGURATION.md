# Admin Configuration

## Purpose

Configure templates and rules without code changes.

## Key fields

- Audit types
- Checklist templates
- Severity levels
- Due-date rules
- Notification templates
- Roles
- Permissions
- Report templates

## Primary actions

- Create template
- Version template
- Activate/deactivate
- Configure rule
- Preview impact

## Business rules

- Published template changes create new version
- Admin changes audited
- Normal users cannot edit config during audits

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
