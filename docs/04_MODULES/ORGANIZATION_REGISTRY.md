# Organization Registry

## Purpose

Maintain audited organizations and their oversight profile.

## Key fields

- Organization ID
- Legal name
- Organization type
- Approval/certificate number
- Status
- Responsible CAA department
- Accountable manager
- Primary contact
- Locations
- Risk profile
- Open findings
- Last audit
- Next audit

## Primary actions

- Create organization
- Edit organization
- View profile
- Assign department
- Add contact
- View audits
- View findings

## Business rules

- Every audit links to organization
- Auditee users see only their organization
- Suspended/expired status creates warning
- Organization profile shows risk/open findings first

## UX direction

The screen must show status, owner, due date and next action before secondary details. Advanced configuration must stay behind admin permissions.

## MVP acceptance criteria

- Supports the operator audit demo scenario.
- Critical actions are audit logged.
- Auditee-visible and internal information stay separated.
- The user can complete the primary task without leaving the screen.
