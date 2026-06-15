/* ==========================================================================
   AviaSurveil360 — Mock data + client-side state  (DEMO ONLY)
   No backend, no API, no storage. Everything lives in memory.
   ========================================================================== */

/* Fixed "today" so Due Soon / Overdue math is deterministic in the demo. */
var DEMO_TODAY = '2026-06-15';

/* ----------------------------- Roles ----------------------------- */
var ROLES = {
  manager:   { key: 'manager',   name: 'CAA Manager',    user: 'Selin Demir',  initials: 'SD', color: '#6b4fb0',
               question: 'Where are we exposed, delayed or overloaded?' },
  inspector: { key: 'inspector', name: 'CAA Inspector',  user: 'Caner Yildiz', initials: 'CY', color: '#2f6fd6',
               question: 'What do I need to inspect or review today?' },
  auditee:   { key: 'auditee',   name: 'Auditee',        user: 'James Carter', initials: 'JC', color: '#1f9d62',
               org: 'ORG-XYZ', orgName: 'Airline XYZ',
               question: 'What does the CAA need from my organization?' },
  admin:     { key: 'admin',     name: 'Admin Preview',  user: 'System Admin', initials: 'AP', color: '#c77700',
               question: 'Which template or rule must be configured?' }
};

/* ----------------------------- Severity ----------------------------- */
var SEVERITY = {
  1: { label: 'Level 1 Critical', cls: 'sev--1', badge: 'danger' },
  2: { label: 'Level 2 Major',    cls: 'sev--2', badge: 'warn' },
  3: { label: 'Level 3 Minor',    cls: 'sev--3', badge: 'info' },
  0: { label: 'Observation',      cls: 'sev--obs', badge: 'neutral' }
};

/* ----------------------------- Finding statuses -----------------------------
   step = index into the 6-step lifecycle stepper.
   ownerRole / nextAction drive "current owner + next action" everywhere. */
var FINDING_STATUS = {
  WAITING_CAP:        { label: 'Waiting for CAP',                    badge: 'warn',    step: 0, ownerRole: 'auditee',   next: 'Submit CAP' },
  CAP_SUBMITTED:      { label: 'CAP Submitted — Pending CAA Review', badge: 'info',    step: 1, ownerRole: 'inspector', next: 'Review CAP' },
  CAP_MORE_INFO:      { label: 'More Information Requested (CAP)',   badge: 'warn',    step: 0, ownerRole: 'auditee',   next: 'Revise and resubmit CAP' },
  EVIDENCE_REQUIRED:  { label: 'CAP Accepted — Evidence Required',   badge: 'info',    step: 2, ownerRole: 'auditee',   next: 'Upload evidence' },
  EVIDENCE_SUBMITTED: { label: 'Evidence Submitted — Pending Review',badge: 'info',    step: 3, ownerRole: 'inspector', next: 'Review evidence' },
  EVIDENCE_MORE_INFO: { label: 'More Information Requested (Evidence)',badge: 'warn',  step: 2, ownerRole: 'auditee',   next: 'Provide more evidence' },
  CLOSED:             { label: 'Closed',                             badge: 'ok',      step: 5, ownerRole: null,       next: 'No action — finding closed' }
};

var LIFECYCLE_STEPS = [
  'Finding issued',
  'CAP submitted',
  'CAP accepted',
  'Evidence submitted',
  'Evidence verified',
  'Closed'
];

/* ----------------------------- Organizations ----------------------------- */
var SEED_ORGS = [
  { id: 'ORG-XYZ', name: 'Airline XYZ',        type: 'Air Operator (AOC)',        contact: 'James Carter', repeatFindings: 1 },
  { id: 'ORG-SKY', name: 'SkyCargo Air',       type: 'Air Operator (AOC)',        contact: 'Mara Olsen',   repeatFindings: 2 },
  { id: 'ORG-BLU', name: 'BlueWing Aviation',  type: 'Approved Training Org',     contact: 'Dieter Kraus', repeatFindings: 0 }
];

/* ----------------------------- Checklist template ----------------------------- */
var SEED_CHECKLIST = {
  id: 'TPL-FOPS-2026',
  name: 'Flight Operations Audit',
  domain: 'Flight Operations',
  version: 'v3.2 (2026)',
  owner: 'Standards & Training Section',
  items: [
    { id: 'q1', text: 'Is the Operations Manual current and approved?',
      ref: 'Configured rule FOPS-OM-01 (regulatory reference: Operations Manual currency)',
      evidence: 'Approved Operations Manual revision record' },
    { id: 'q2', text: 'Are crew training records complete and up to date?',
      ref: 'Configured rule FOPS-CRT-04 (regulatory reference: crew training & checking records)',
      evidence: 'Crew training matrix and completion certificates' },
    { id: 'q3', text: 'Are Flight Time Limitation (FTL) records maintained?',
      ref: 'Configured rule FOPS-FTL-02 (regulatory reference: flight & duty time records)',
      evidence: 'FTL monitoring report for the audited period' },
    { id: 'q4', text: 'Is the Minimum Equipment List (MEL) approved and available to crews?',
      ref: 'Configured rule FOPS-MEL-03 (regulatory reference: approved MEL)',
      evidence: 'Approved MEL and crew distribution evidence' },
    { id: 'q5', text: 'Are dangerous goods training certificates valid?',
      ref: 'Configured rule FOPS-DG-05 (regulatory reference: dangerous goods training)',
      evidence: 'Valid dangerous goods training certificates' }
  ]
};

/* Other templates only shown in Admin preview list (not runnable in demo). */
var SEED_TEMPLATE_LIBRARY = [
  { id: 'TPL-FOPS-2026', name: 'Flight Operations Audit', domain: 'Flight Operations', version: 'v3.2 (2026)', items: 5, status: 'Published' },
  { id: 'TPL-AWO-2026',  name: 'Continuing Airworthiness Audit', domain: 'Airworthiness', version: 'v2.0 (2026)', items: 8, status: 'Published' },
  { id: 'TPL-RAMP-2026', name: 'Ramp Inspection (SAFA-style)', domain: 'Ramp', version: 'v1.4 (2026)', items: 12, status: 'Published' },
  { id: 'TPL-SEC-2026',  name: 'Aviation Security Audit', domain: 'Security', version: 'v1.1 (2026)', items: 10, status: 'Draft' },
  { id: 'TPL-CAB-2026',  name: 'Cabin Safety Audit', domain: 'Cabin Safety', version: 'v2.3 (2026)', items: 6, status: 'Published' }
];

/* ----------------------------- Audits (2026 surveillance plan) ----------------------------- */
var SEED_AUDITS = [
  { id: 'AUD-2026-001', ref: '2026 Operator Audit', orgId: 'ORG-XYZ', type: 'Operator Audit', domain: 'Flight Operations',
    templateId: 'TPL-FOPS-2026', date: DEMO_TODAY, mode: 'On-site', location: 'Airline XYZ HQ',
    lead: 'Caner Yildiz', team: ['Caner Yildiz', 'Aylin Sezer'], status: 'Scheduled', checklistStarted: false },
  { id: 'AUD-2026-002', ref: 'Q1 Ramp Inspection', orgId: 'ORG-SKY', type: 'Ramp Inspection', domain: 'Ramp',
    templateId: 'TPL-RAMP-2026', date: '2026-02-12', mode: 'On-site', location: 'Apron 4',
    lead: 'Caner Yildiz', team: ['Caner Yildiz'], status: 'Report Issued', checklistStarted: true },
  { id: 'AUD-2026-003', ref: 'Airworthiness Audit', orgId: 'ORG-BLU', type: 'Continuing Airworthiness', domain: 'Airworthiness',
    templateId: 'TPL-AWO-2026', date: '2026-03-20', mode: 'On-site', location: 'BlueWing Hangar 2',
    lead: 'Aylin Sezer', team: ['Aylin Sezer'], status: 'Report Issued', checklistStarted: true },
  { id: 'AUD-2026-004', ref: 'Cabin Safety Audit', orgId: 'ORG-XYZ', type: 'Cabin Safety', domain: 'Cabin Safety',
    templateId: 'TPL-CAB-2026', date: '2026-04-15', mode: 'On-site', location: 'Airline XYZ Training Centre',
    lead: 'Caner Yildiz', team: ['Caner Yildiz'], status: 'Closed', checklistStarted: true },
  { id: 'AUD-2026-005', ref: 'Security Audit', orgId: 'ORG-SKY', type: 'Aviation Security', domain: 'Security',
    templateId: 'TPL-SEC-2026', date: '2026-05-22', mode: 'On-site', location: 'SkyCargo Terminal',
    lead: 'Aylin Sezer', team: ['Aylin Sezer'], status: 'In Progress', checklistStarted: true },
  { id: 'AUD-2026-006', ref: 'Operator Audit', orgId: 'ORG-BLU', type: 'Operator Audit', domain: 'Flight Operations',
    templateId: 'TPL-FOPS-2026', date: '2026-09-10', mode: 'On-site', location: 'BlueWing HQ',
    lead: 'Caner Yildiz', team: ['Caner Yildiz'], status: 'Planned', checklistStarted: false },
  { id: 'AUD-2026-007', ref: 'Dangerous Goods Audit', orgId: 'ORG-XYZ', type: 'Dangerous Goods', domain: 'Dangerous Goods',
    templateId: 'TPL-FOPS-2026', date: '2026-10-05', mode: 'Remote', location: 'Document review',
    lead: 'Aylin Sezer', team: ['Aylin Sezer'], status: 'Planned', checklistStarted: false },
  { id: 'AUD-2026-008', ref: 'Q4 Ramp Inspection', orgId: 'ORG-XYZ', type: 'Ramp Inspection', domain: 'Ramp',
    templateId: 'TPL-RAMP-2026', date: '2026-11-18', mode: 'On-site', location: 'Apron 1',
    lead: 'Caner Yildiz', team: ['Caner Yildiz'], status: 'Planned', checklistStarted: false }
];

/* ----------------------------- Findings -----------------------------
   The demo's hero finding (OPS-2026-001) is NOT seeded — the inspector
   creates it live from the checklist. These seed records give the
   dashboards realistic numbers. */
var SEED_FINDINGS = [
  {
    id: 'OPS-2025-014', title: 'Pre-flight documentation filing incomplete',
    orgId: 'ORG-XYZ', auditId: null, severity: 3,
    reference: 'Configured rule FOPS-OM-01 (regulatory reference)',
    basis: 'Checklist item answered Non-Compliant',
    description: 'Sample of pre-flight documents not filed within the required period.',
    status: 'CLOSED', capRequired: true, evidenceRequired: true,
    issuedDate: '2025-11-10', dueDate: '2025-12-10', closedDate: '2025-12-04',
    closureType: 'evidence-accepted', responsiblePerson: 'Ops Records Lead',
    cap: { rootCause: 'Manual filing backlog.', correctiveAction: 'Cleared backlog and assigned owner.',
           preventiveAction: 'Weekly filing check added to ops routine.', responsible: 'Ops Records Lead',
           targetDate: '2025-12-01', submittedDate: '2025-11-20', status: 'Accepted' },
    evidence: [ { id: 'EV-1', fileName: 'Filing_Audit_Closeout.pdf', size: '1.1 MB', uploadedDate: '2025-11-28', version: 1, status: 'Accepted' } ],
    commentsToAuditee: [ { author: 'Caner Yildiz', date: '2025-12-04', text: 'Evidence accepted. Finding closed. Thank you.' } ],
    internalNotes: [ { author: 'Caner Yildiz', date: '2025-12-04', text: 'Closure verified against sampled records.' } ]
  },
  {
    id: 'SEC-2026-002', title: 'Access control log gaps at cargo gate',
    orgId: 'ORG-SKY', auditId: 'AUD-2026-005', severity: 1,
    reference: 'Configured rule SEC-ACC-02 (regulatory reference)',
    basis: 'Checklist item answered Non-Compliant',
    description: 'Gaps found in access control logs for restricted cargo area.',
    status: 'CAP_SUBMITTED', capRequired: true, evidenceRequired: true,
    issuedDate: '2026-05-25', dueDate: '2026-06-24', closedDate: null,
    closureType: null, responsiblePerson: 'Security Manager',
    cap: { rootCause: 'Logging device offline during shift change.', correctiveAction: 'Replaced device, restored logging.',
           preventiveAction: 'Daily device health check.', responsible: 'Security Manager',
           targetDate: '2026-06-20', submittedDate: '2026-06-08', status: 'Submitted' },
    evidence: [],
    commentsToAuditee: [], internalNotes: [ { author: 'Aylin Sezer', date: '2026-05-25', text: 'Critical — prioritise review.' } ]
  },
  {
    id: 'AWO-2026-003', title: 'Maintenance task sign-off overdue',
    orgId: 'ORG-BLU', auditId: 'AUD-2026-003', severity: 2,
    reference: 'Configured rule AWO-SGN-01 (regulatory reference)',
    basis: 'Checklist item answered Non-Compliant',
    description: 'Several maintenance tasks closed without timely independent sign-off.',
    status: 'EVIDENCE_REQUIRED', capRequired: true, evidenceRequired: true,
    issuedDate: '2026-04-02', dueDate: '2026-05-20', closedDate: null,
    closureType: null, responsiblePerson: 'Quality Manager',
    cap: { rootCause: 'Staff shortage in QA.', correctiveAction: 'Added relief inspector.',
           preventiveAction: 'Sign-off tracking dashboard.', responsible: 'Quality Manager',
           targetDate: '2026-05-15', submittedDate: '2026-04-18', status: 'Accepted' },
    evidence: [],
    commentsToAuditee: [ { author: 'Aylin Sezer', date: '2026-04-20', text: 'CAP accepted. Please upload completion evidence.' } ],
    internalNotes: [ { author: 'Aylin Sezer', date: '2026-05-21', text: 'Evidence overdue — follow up.' } ]
  },
  {
    id: 'RAMP-2026-005', title: 'Ground equipment inspection tags missing',
    orgId: 'ORG-SKY', auditId: 'AUD-2026-002', severity: 3,
    reference: 'Configured rule RAMP-GSE-04 (regulatory reference)',
    basis: 'Checklist item answered Non-Compliant',
    description: 'Inspection tags missing on two ground service units.',
    status: 'EVIDENCE_SUBMITTED', capRequired: true, evidenceRequired: true,
    issuedDate: '2026-02-14', dueDate: '2026-06-30', closedDate: null,
    closureType: null, responsiblePerson: 'Ramp Supervisor',
    cap: { rootCause: 'Tagging step skipped during intake.', correctiveAction: 'Re-tagged all units.',
           preventiveAction: 'Intake checklist updated.', responsible: 'Ramp Supervisor',
           targetDate: '2026-06-15', submittedDate: '2026-03-01', status: 'Accepted' },
    evidence: [ { id: 'EV-2', fileName: 'GSE_Tagging_Photos.pdf', size: '2.4 MB', uploadedDate: '2026-06-10', version: 1, status: 'Uploaded' } ],
    commentsToAuditee: [], internalNotes: []
  },
  {
    id: 'CAB-2026-004', title: 'Cabin crew manual revision not distributed',
    orgId: 'ORG-XYZ', auditId: 'AUD-2026-004', severity: 0,
    reference: 'Configured rule CAB-MAN-02 (regulatory reference)',
    basis: 'Checklist item answered Observation',
    description: 'Latest cabin crew manual revision not yet acknowledged by all crew.',
    status: 'CLOSED', capRequired: true, evidenceRequired: true,
    issuedDate: '2026-04-16', dueDate: '2026-05-16', closedDate: '2026-05-10',
    closureType: 'evidence-accepted', responsiblePerson: 'Cabin Safety Lead',
    cap: { rootCause: 'Distribution list outdated.', correctiveAction: 'Re-issued with updated list.',
           preventiveAction: 'Quarterly distribution-list review.', responsible: 'Cabin Safety Lead',
           targetDate: '2026-05-08', submittedDate: '2026-04-25', status: 'Accepted' },
    evidence: [ { id: 'EV-3', fileName: 'Manual_Ack_Register.pdf', size: '0.8 MB', uploadedDate: '2026-05-05', version: 1, status: 'Accepted' } ],
    commentsToAuditee: [ { author: 'Caner Yildiz', date: '2026-05-10', text: 'Acknowledgement register accepted. Closed.' } ],
    internalNotes: []
  }
];

/* ----------------------------- Notifications (in-UI only) ----------------------------- */
var SEED_NOTIFICATIONS = [
  { id: 'N1', role: 'inspector', icon: '📋', text: 'Operator Audit for Airline XYZ is scheduled for today.', time: 'Today 08:10', unread: true },
  { id: 'N2', role: 'inspector', icon: '📎', text: 'Evidence submitted on RAMP-2026-005 is waiting for your review.', time: 'Yesterday', unread: true },
  { id: 'N3', role: 'manager',   icon: '⚠️', text: 'AWO-2026-003 (Level 2 Major) is now Overdue.', time: 'Today 07:55', unread: true },
  { id: 'N4', role: 'auditee',   icon: '📨', text: 'Welcome to the Auditee Portal. Open My Findings to see required actions.', time: 'Today', unread: true }
];

/* ----------------------------- Audit log (critical actions) ----------------------------- */
var SEED_AUDIT_LOG = [
  { id: 'L1', time: '2026-06-08 14:22', actor: 'Mara Olsen (Auditee)', action: 'CAP submitted', target: 'SEC-2026-002', system: false },
  { id: 'L2', time: '2026-05-25 09:40', actor: 'Aylin Sezer (CAA Inspector)', action: 'Finding issued', target: 'SEC-2026-002', system: false },
  { id: 'L3', time: '2026-05-10 11:05', actor: 'Caner Yildiz (CAA Inspector)', action: 'Finding closed (evidence accepted)', target: 'CAB-2026-004', system: false }
];

/* ----------------------------- Users (Admin preview, read-only) ----------------------------- */
var SEED_USERS = [
  { name: 'Selin Demir',  role: 'CAA Manager',   org: '—',                 mfa: 'On',  status: 'Active' },
  { name: 'Caner Yildiz', role: 'Lead Inspector', org: '—',                mfa: 'On',  status: 'Active' },
  { name: 'Aylin Sezer',  role: 'CAA Inspector',  org: '—',                mfa: 'On',  status: 'Active' },
  { name: 'Mehmet Aydin', role: 'CAA Inspector',  org: '—',                mfa: 'On',  status: 'Active' },
  { name: 'James Carter', role: 'Auditee',        org: 'Airline XYZ',       mfa: 'n/a', status: 'Active' },
  { name: 'Mara Olsen',   role: 'Auditee',        org: 'SkyCargo Air',      mfa: 'n/a', status: 'Active' },
  { name: 'Dieter Kraus', role: 'Auditee',        org: 'BlueWing Aviation', mfa: 'n/a', status: 'Invited' },
  { name: 'System Admin', role: 'Admin',          org: '—',                 mfa: 'On',  status: 'Active' }
];

/* ----------------------------- Working state ----------------------------- */
/* `state` is the live, mutable demo state. seedState() (re)builds it. */
var state = null;

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function seedState() {
  state = {
    role: null,                 // null = login screen
    view: 'login',
    params: {},                 // { auditId, findingId, ... }
    orgs: deepClone(SEED_ORGS),
    audits: deepClone(SEED_AUDITS),
    checklist: deepClone(SEED_CHECKLIST),
    templateLibrary: deepClone(SEED_TEMPLATE_LIBRARY),
    findings: deepClone(SEED_FINDINGS),
    notifications: deepClone(SEED_NOTIFICATIONS),
    auditLog: deepClone(SEED_AUDIT_LOG),
    checklistAnswers: {},       // { itemId: { answer, comment, findingId } } for the live audit
    findingSeq: 1,              // OPS-2026-00X live counter
    auditSeq: 9,                // AUD-2026-00X counter for the New Audit Wizard
    notifSeq: 100,
    logSeq: 100,
    wizard: null,               // New Audit Wizard working data
    ui: { notifOpen: false, menuOpen: false }
  };
}

/* Option lists for the New Audit Wizard. */
var AUDIT_TYPES = ['Operator Audit', 'Ramp Inspection', 'Continuing Airworthiness', 'Cabin Safety', 'Aviation Security', 'Dangerous Goods'];
var AUDIT_DOMAINS = ['Flight Operations', 'Ramp', 'Airworthiness', 'Cabin Safety', 'Security', 'Dangerous Goods'];
var INSPECTORS = ['Caner Yildiz', 'Aylin Sezer', 'Mehmet Aydin'];
