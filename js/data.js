/* ==========================================================================
   AviaSurveil360 — Mock data + client-side state  (DEMO ONLY)
   No backend or API. Persistence is demo-only and isolated below.
   ========================================================================== */

/* Fixed "today" so Due Soon / Overdue math is deterministic in the demo. */
var DEMO_TODAY = '2026-06-15';

/* Demo persistence boundary. Views must not call localStorage directly. */
var DEMO_STORAGE_KEY = 'aviasurveil360:v2-demo-state';
var DEMO_STATE_VERSION = 3;
var DEMO_PERSISTENCE_CONFIG = {
  storageKey: DEMO_STORAGE_KEY,
  label: 'Frontend-only demo - saved in this browser',
  resetLabel: 'Reset demo data',
  persists: [
    'created findings',
    'CAP submissions',
    'mock evidence filenames',
    'inspection workspace draft answers',
    'mock planning approvals',
    'mock checklist approvals',
    'mock potential findings',
    'lead inspector review decisions and report workflow state',
    'AI accept/edit/reject decisions',
    'selected filters',
    'simulated offline outbox items'
  ],
  disclaimer: 'Stored in this browser for demo only. No backend, real file storage, legal decision, production sync, or production audit trail.'
};

/* ----------------------------- Roles -----------------------------
   Seven distinct switchable roles for the governance workflow expansion
   (see docs/plans/2026-06-28-caa-governance-workflow-and-roles-plan.md),
   plus Admin Preview retained as a configuration role. The `manager` key is
   kept (display = Department Manager) so existing role-conditional code keeps
   working; a later phase may rename the key to `departmentManager`. */
var ROLES = {
  inspector:        { key: 'inspector',        name: 'Inspector',          user: 'John Inspector', initials: 'JI', color: '#2f6fd6',
                      assignmentAliases: ['Aylin Sezer'],
                      question: 'What do I need to inspect or review today?' },
  leadInspector:    { key: 'leadInspector',    name: 'Lead Inspector',     user: 'John Lead Inspector', initials: 'JL', color: '#1d4f99',
                      question: 'What needs review, conversion to finding, or report sign-off?' },
  manager:          { key: 'manager',          name: 'Department Manager', user: 'Selin Demir',  initials: 'SD', color: '#6b4fb0',
                      question: 'Where are we exposed, delayed or overloaded?' },
  gm:               { key: 'gm',               name: 'General Manager',    user: 'Okan Demir',   initials: 'OD', color: '#0f766e',
                      question: 'Which audits and budgets should I approve or release?' },
  finance:          { key: 'finance',          name: 'Finance Review',     user: 'Derya Acar',   initials: 'DA', color: '#b45309',
                      question: 'Is the requested budget and resource justified?' },
  executiveDirector:{ key: 'executiveDirector',name: 'Executive Director', user: 'Ufuk Aslan',   initials: 'UA', color: '#9f1239',
                      question: 'What needs my final approval to proceed?' },
  auditee:          { key: 'auditee',          name: 'Auditee',            user: 'James Carter', initials: 'JC', color: '#1f9d62',
                      org: 'ORG-XYZ', orgName: 'Airline XYZ',
                      question: 'What does the CAA need from my organization?' },
  admin:            { key: 'admin',            name: 'Admin Preview',      user: 'System Admin', initials: 'AP', color: '#c77700',
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

var V2_STATUS = {
  published: 'published',
  draft: 'draft',
  underReview: 'under_review',
  superseded: 'superseded',
  waitingForConnection: 'waiting_for_connection',
  syncedToDemoState: 'synced_to_demo_state',
  accepted: 'accepted',
  edited: 'edited',
  rejected: 'rejected',
  pendingReview: 'pending_review'
};

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

var SEED_QUESTION_BANK = [
  { id: 'QB-001', title: 'Operations manual currency', text: 'Is the Operations Manual current and approved?',
    regulationRef: 'Configured rule FOPS-OM-01 (regulatory reference)', department: 'Flight Operations',
    category: 'Documentation', commentRequired: false, evidenceRequired: true, allowPotentialFinding: true,
    inspectorGuidance: 'Check the current revision record and approval page.',
    exampleEvidence: 'Approved Operations Manual revision record', notes: 'Demo question bank item.', status: 'Active' },
  { id: 'QB-002', title: 'Crew training records', text: 'Are crew training records complete and up to date?',
    regulationRef: 'Configured rule FOPS-CRT-04 (regulatory reference)', department: 'Flight Operations',
    category: 'Training', commentRequired: true, evidenceRequired: true, allowPotentialFinding: true,
    inspectorGuidance: 'Sample crew records against the training matrix.',
    exampleEvidence: 'Crew training matrix and completion certificates', notes: 'Hero scenario question.', status: 'Active' },
  { id: 'QB-003', title: 'Flight time limitation records', text: 'Are Flight Time Limitation (FTL) records maintained?',
    regulationRef: 'Configured rule FOPS-FTL-02 (regulatory reference)', department: 'Flight Operations',
    category: 'Records', commentRequired: false, evidenceRequired: true, allowPotentialFinding: true,
    inspectorGuidance: 'Review a sample FTL monitoring report.',
    exampleEvidence: 'FTL monitoring report for the audited period', notes: 'Demo question bank item.', status: 'Active' },
  { id: 'QB-004', title: 'MEL availability', text: 'Is the Minimum Equipment List (MEL) approved and available to crews?',
    regulationRef: 'Configured rule FOPS-MEL-03 (regulatory reference)', department: 'Flight Operations',
    category: 'Operational control', commentRequired: false, evidenceRequired: true, allowPotentialFinding: true,
    inspectorGuidance: 'Confirm approved MEL distribution to operating crew.',
    exampleEvidence: 'Approved MEL and crew distribution evidence', notes: 'Demo question bank item.', status: 'Active' },
  { id: 'QB-005', title: 'Dangerous goods training', text: 'Are dangerous goods training certificates valid?',
    regulationRef: 'Configured rule FOPS-DG-05 (regulatory reference)', department: 'Flight Operations',
    category: 'Training', commentRequired: false, evidenceRequired: true, allowPotentialFinding: true,
    inspectorGuidance: 'Sample certificate validity dates.',
    exampleEvidence: 'Valid dangerous goods training certificates', notes: 'Demo question bank item.', status: 'Active' },
  { id: 'QB-006', title: 'Training evidence cross-check', text: 'Does the training matrix reconcile to sampled crew certificate evidence?',
    regulationRef: 'Configured rule FOPS-CRT-04 (regulatory reference)', department: 'Flight Operations',
    category: 'Evidence quality', commentRequired: true, evidenceRequired: true, allowPotentialFinding: true,
    inspectorGuidance: 'Cross-check the matrix row against at least one certificate sample.',
    exampleEvidence: 'Training matrix row plus matching certificate sample', notes: 'Added for checklist management demo.', status: 'Active' }
];

/* Other templates only shown in Admin preview list (not runnable in demo). */
var SEED_TEMPLATE_LIBRARY = [
  { id: 'TPL-FOPS-2026', name: 'Flight Operations Audit', domain: 'Flight Operations', version: 'v3.2 (2026)', items: 5, status: 'Published' },
  { id: 'TPL-AWO-2026',  name: 'Continuing Airworthiness Audit', domain: 'Airworthiness', version: 'v2.0 (2026)', items: 8, status: 'Published' },
  { id: 'TPL-RAMP-2026', name: 'Ramp Inspection (SAFA-style)', domain: 'Ramp', version: 'v1.4 (2026)', items: 12, status: 'Published' },
  { id: 'TPL-SEC-2026',  name: 'Aviation Security Audit', domain: 'Security', version: 'v1.1 (2026)', items: 10, status: 'Draft' },
  { id: 'TPL-CAB-2026',  name: 'Cabin Safety Audit', domain: 'Cabin Safety', version: 'v2.3 (2026)', items: 6, status: 'Published' }
];

var SEED_MANAGED_CHECKLISTS = [
  {
    id: 'CL-FOPS',
    name: 'Flight Operations Surveillance',
    department: 'Flight Operations',
    inspectionType: 'Routine / Risk Based',
    publishedVersion: '2.3',
    versions: [
      {
        id: 'CL-FOPS-v2.3',
        version: '2.3',
        status: 'published_active',
        approvalType: 'checklist',
        createdBy: 'Selin Demir',
        createdDate: '2026-05-10',
        changeReason: 'Current active checklist used by the runnable demo.',
        questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
        approval: {
          chain: [
            { role: 'manager', label: 'Department Manager', returnToRole: null },
            { role: 'gm', label: 'GM Approval', returnToRole: 'manager' }
          ],
          currentIndex: 1,
          outcome: 'approved',
          returnPolicy: 'configured_role',
          history: [
            { actor: 'Selin Demir', role: 'manager', action: 'submitted', date: '2026-05-10 09:20', comment: 'Submitted active Flight Operations checklist version.' },
            { actor: 'Okan Demir', role: 'gm', action: 'approved', date: '2026-05-11 11:05', comment: 'Approved for demo active use.' }
          ]
        }
      },
      {
        id: 'CL-FOPS-v2.4',
        version: '2.4',
        status: 'under_review',
        approvalType: 'checklist',
        createdBy: 'Selin Demir',
        createdDate: '2026-06-15',
        changeReason: 'Clarify expected evidence for crew training record checks before Q3 surveillance.',
        impact: 'Inspector checklist wording only; no production rule or legal obligation is changed.',
        questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
        approval: {
          chain: [
            { role: 'manager', label: 'Department Manager', returnToRole: null },
            { role: 'gm', label: 'GM Approval', returnToRole: 'manager' }
          ],
          currentIndex: 1,
          outcome: null,
          returnPolicy: 'configured_role',
          history: [
            { actor: 'Selin Demir', role: 'manager', action: 'submitted', date: '2026-06-15 11:10', comment: 'Submitted checklist version 2.4 for GM approval.' }
          ]
        }
      }
    ]
  }
];

/* ----------------------------- Audits (2026 surveillance plan) ----------------------------- */
var SEED_AUDITS = [
  { id: 'AUD-2026-001', ref: '2026 Operator Audit', orgId: 'ORG-XYZ', type: 'Continued Surveillance', domain: 'Flight Operations',
    templateId: 'TPL-FOPS-2026', date: DEMO_TODAY, mode: 'On-site', location: 'Airline XYZ HQ',
    lead: 'Caner Yildiz', team: ['Caner Yildiz', 'Aylin Sezer'], status: 'Scheduled', checklistStarted: false },
  { id: 'AUD-2026-002', ref: 'Q1 Ramp Inspection', orgId: 'ORG-SKY', type: 'Ramp Inspection', domain: 'Ramp',
    templateId: 'TPL-RAMP-2026', date: '2026-02-12', mode: 'On-site', location: 'Apron 4',
    lead: 'Caner Yildiz', team: ['Caner Yildiz'], status: 'Report Issued', checklistStarted: true },
  { id: 'AUD-2026-003', ref: 'Airworthiness Audit', orgId: 'ORG-BLU', type: 'Periodic Surveillance', domain: 'Airworthiness',
    templateId: 'TPL-AWO-2026', date: '2026-03-20', mode: 'On-site', location: 'BlueWing Hangar 2',
    lead: 'Aylin Sezer', team: ['Aylin Sezer'], status: 'Report Issued', checklistStarted: true },
  { id: 'AUD-2026-004', ref: 'Cabin Safety Audit', orgId: 'ORG-XYZ', type: 'Follow-up Inspection', domain: 'Cabin Safety',
    templateId: 'TPL-CAB-2026', date: '2026-04-15', mode: 'On-site', location: 'Airline XYZ Training Centre',
    lead: 'Caner Yildiz', team: ['Caner Yildiz'], status: 'Closed', checklistStarted: true },
  { id: 'AUD-2026-005', ref: 'Security Audit', orgId: 'ORG-SKY', type: 'Special Inspection', domain: 'Security',
    templateId: 'TPL-SEC-2026', date: '2026-05-22', mode: 'On-site', location: 'SkyCargo Terminal',
    lead: 'Caner Yildiz', team: ['Caner Yildiz', 'Aylin Sezer', 'Mehmet Aydin'], status: 'In Progress', checklistStarted: true },
  { id: 'AUD-2026-006', ref: 'Certificate Renewal Review', orgId: 'ORG-BLU', type: 'Certificate Renewal', domain: 'Licensing',
    templateId: 'TPL-FOPS-2026', date: '2026-09-10', mode: 'On-site', location: 'BlueWing HQ',
    lead: 'Caner Yildiz', team: ['Caner Yildiz', 'Aylin Sezer'], status: 'Planned', checklistStarted: false },
  { id: 'AUD-2026-007', ref: 'Initial Application Review', orgId: 'ORG-XYZ', type: 'Initial Application', domain: 'Certification',
    templateId: 'TPL-FOPS-2026', date: '2026-10-05', mode: 'Remote', location: 'Document review',
    lead: 'Aylin Sezer', team: ['Aylin Sezer'], status: 'Planned', checklistStarted: false },
  { id: 'AUD-2026-008', ref: 'Variation / Amendment Review', orgId: 'ORG-XYZ', type: 'Variation / Amendment', domain: 'Licensing',
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

var SEED_POTENTIAL_FINDINGS = [];

var SEED_AUDIT_REPORTS = [
  {
    id: 'RPT-AUD-2026-001',
    auditId: 'AUD-2026-001',
    title: 'Airline XYZ Operator Audit Report',
    reportType: 'Preliminary / Final',
    status: 'draft',
    approvalType: 'report',
    finalLocked: false,
    reportNumber: null,
    approvalDate: null,
    approvedBy: null,
    mockDigitalSignature: null,
    enforcementRecommendation: null,
    executiveSummaryDraft: 'AI-generated draft - requires authorized review. The operator audit identified a repeated crew training record control weakness requiring CAP and evidence follow-up.',
    observations: ['Crew training evidence needs clearer reconciliation to sampled matrix rows.'],
    recommendations: ['Require CAP/evidence follow-up before closure. Enforcement recommendation, if any, remains human-authorized only.'],
    attachments: ['Training_Record_Sample.pdf (mock filename only)', 'Checklist_Response_Summary.pdf (mock)'],
    approval: {
      chain: [
        { role: 'leadInspector', label: 'Lead Inspector', returnToRole: null },
        { role: 'manager', label: 'Department Manager', returnToRole: 'leadInspector' },
        { role: 'gm', label: 'GM Review', returnToRole: 'manager' },
        { role: 'executiveDirector', label: 'Executive Director Approval', returnToRole: 'gm' }
      ],
      currentIndex: 0,
      outcome: null,
      returnPolicy: 'configured_role',
      history: [
        { actor: 'Caner Yildiz', role: 'leadInspector', action: 'draft_created', date: '2026-06-15 13:00', comment: 'Preliminary report draft created for approval workflow.' }
      ]
    }
  },
  {
    id: 'RPT-AUD-2026-005',
    auditId: 'AUD-2026-005',
    title: 'SkyCargo Air Security Audit Preliminary Report',
    reportType: 'Preliminary Inspection Report',
    status: 'draft',
    approvalType: 'report',
    finalLocked: false,
    reportNumber: null,
    approvalDate: null,
    approvedBy: null,
    mockDigitalSignature: null,
    enforcementRecommendation: null,
    executiveSummaryDraft: 'Draft preliminary inspection report based on submitted inspector checklist responses. The report summarizes access control log gaps, checklist completion status, inspector comments, and required CAP follow-up after Department Manager approval.',
    observations: [
      'Cargo gate access control logs have gaps around shift-change periods.',
      'Badge sample review is still waiting for one inspector response.'
    ],
    recommendations: [
      'Submit the preliminary report to the Department Manager for approval and signature.',
      'After approval, share the report with the Service Provider and request corrective action for accepted findings.'
    ],
    attachments: ['Security_Checklist_Response_Summary.pdf (mock)', 'Cargo_Gate_Log_Sample.pdf (mock filename only)'],
    approval: {
      chain: [
        { role: 'leadInspector', label: 'Lead Inspector', returnToRole: null },
        { role: 'manager', label: 'Department Manager', returnToRole: 'leadInspector' },
        { role: 'gm', label: 'GM Review', returnToRole: 'manager' },
        { role: 'executiveDirector', label: 'Executive Director Approval', returnToRole: 'gm' }
      ],
      currentIndex: 0,
      outcome: null,
      returnPolicy: 'configured_role',
      history: [
        { actor: 'Caner Yildiz', role: 'leadInspector', action: 'draft_created', date: '2026-06-15 14:10', comment: 'Preliminary inspection report draft assembled from inspector checklist reports.' }
      ]
    }
  }
];

var SEED_LEAD_AUDIT_REVIEWS = [
  {
    auditId: 'AUD-2026-005',
    reportId: 'RPT-AUD-2026-005',
    title: 'SkyCargo Air Security Audit',
    stage: 'Preliminary Inspection Report draft',
    reportStatus: 'Lead draft',
    serviceProviderStep: 'After Department Manager approval/signature, share with Service Provider and request corrective actions.',
    assignments: [
      {
        inspector: 'Aylin Sezer',
        role: 'CAA Inspector',
        checklist: 'Cargo gate access control logs',
        questions: 'SEC 2.1-2.4',
        status: 'Completed',
        resultSummary: '1 Non-Compliant, 3 Compliant',
        comment: 'Gaps found in access logs during shift change; supporting log sample attached.'
      },
      {
        inspector: 'Mehmet Aydin',
        role: 'CAA Inspector',
        checklist: 'Security training and badge sample',
        questions: 'SEC 3.1-3.3',
        status: 'In Progress',
        resultSummary: '2 answered, 1 waiting',
        comment: 'Badge sample review is still in progress; training file sample reviewed.'
      },
      {
        inspector: 'Caner Yildiz',
        role: 'Lead Inspector',
        checklist: 'Security manager interview and closing review',
        questions: 'SEC 1.1-1.2',
        status: 'Waiting',
        resultSummary: 'Awaiting inspector inputs',
        comment: 'Lead review will finalize the preliminary report after checklist consolidation.'
      }
    ],
    submittedFindings: [
      {
        findingId: 'SEC-2026-002',
        inspector: 'Aylin Sezer',
        question: 'Cargo gate access control logs complete?',
        title: 'Access control log gaps at cargo gate',
        severity: 'Level 1 Critical',
        comment: 'Inspector noted missing access log entries at cargo gate for restricted-area access.',
        leadAssessment: 'Include in Preliminary Inspection Report and request corrective action after approval.'
      }
    ]
  }
];

/* ----------------------------- Frontend V2 mock data ----------------------------- */
var SEED_REGULATORY_DOCUMENTS = [
  {
    id: 'REG-NAMCARS-OPS-2026',
    family: 'NAMCARS',
    title: 'Flight Operations Requirements',
    version: '2026 mock edition',
    status: V2_STATUS.published,
    effectiveDate: '2026-01-01',
    supersedes: 'REG-NAMCARS-OPS-2024',
    supersededBy: null,
    changeHistory: [
      { id: 'CHG-OPS-001', date: '2025-11-20', summary: 'Mock update added clearer crew training record evidence expectations.' },
      { id: 'CHG-OPS-002', date: '2026-01-01', summary: 'Mock edition marked effective for demo package building.' }
    ],
    clauses: [
      {
        id: 'OPS-TRG-4.2',
        reference: 'OPS 4.2',
        title: 'Crew training records',
        status: V2_STATUS.published,
        applicability: 'Air operator with scheduled passenger operations',
        expectedEvidence: ['Training record sample', 'Training matrix', 'Responsible manager attestation']
      },
      {
        id: 'OPS-MAN-2.1',
        reference: 'OPS 2.1',
        title: 'Operations manual currency',
        status: V2_STATUS.published,
        applicability: 'Air operator with active operations manual approval',
        expectedEvidence: ['Approved operations manual revision record']
      }
    ]
  },
  {
    id: 'REG-NAMCATS-AIR-2026',
    family: 'NAMCATS',
    title: 'Airworthiness Technical Standards',
    version: '2026 mock edition',
    status: V2_STATUS.underReview,
    effectiveDate: '2026-03-01',
    supersedes: 'REG-NAMCATS-AIR-2025',
    supersededBy: null,
    changeHistory: [
      { id: 'CHG-AIR-001', date: '2026-02-10', summary: 'Mock draft change history for maintenance sign-off evidence mapping.' }
    ],
    clauses: [
      {
        id: 'AIR-SGN-3.4',
        reference: 'AIR 3.4',
        title: 'Maintenance task sign-off',
        status: V2_STATUS.underReview,
        applicability: 'Approved maintenance or continuing airworthiness oversight',
        expectedEvidence: ['Maintenance task sample', 'Independent sign-off record', 'Quality manager attestation']
      }
    ]
  },
  {
    id: 'REG-USOAP-PQ-OPS-MOCK',
    family: 'USOAP PQ',
    title: 'USOAP OPS Protocol Questions',
    version: 'Mock PQ edition for demo',
    status: V2_STATUS.draft,
    effectiveDate: '2026-01-15',
    supersedes: null,
    supersededBy: null,
    changeHistory: [
      { id: 'CHG-PQ-001', date: '2026-01-15', summary: 'Mock PQ readiness reference. Not an official ICAO assessment.' }
    ],
    clauses: [
      {
        id: 'PQ-OPS-MOCK-001',
        reference: 'PQ OPS mock 001',
        title: 'Evidence of training record oversight',
        status: V2_STATUS.draft,
        applicability: 'Applicable in mock demo only',
        expectedEvidence: ['Published checklist mapping', 'Finding/CAP/evidence trail', 'Verification history']
      }
    ]
  }
];

var SEED_REGULATORY_TRACES = [
  {
    id: 'TRACE-OPS-TRG-4.2',
    sourceDocumentId: 'REG-NAMCARS-OPS-2026',
    sourceDocument: 'NAMCARS Flight Operations Requirements',
    version: '2026 mock edition',
    clauseRef: 'OPS 4.2',
    effectiveDate: '2026-01-01',
    applicabilityReason: 'Airline XYZ is an air operator with scheduled passenger operations.',
    linkedChecklist: 'Flight Operations Audit / Crew training records complete?',
    linkedEvidence: 'Training record sample; training matrix; responsible manager attestation',
    approvalState: V2_STATUS.published,
    demoLabel: 'Mock regulatory library',
    legalGuardrail: 'Not a legal decision'
  },
  {
    id: 'TRACE-USOAP-PQ-OPS-001',
    sourceDocumentId: 'REG-USOAP-PQ-OPS-MOCK',
    sourceDocument: 'USOAP OPS Protocol Questions',
    version: 'Mock PQ edition for demo',
    clauseRef: 'PQ OPS mock 001',
    effectiveDate: '2026-01-15',
    applicabilityReason: 'Used to demonstrate readiness evidence mapping only.',
    linkedChecklist: 'Flight Operations checklist and related CAP/evidence trail',
    linkedEvidence: 'Published checklist mapping; accepted evidence; verification history',
    approvalState: V2_STATUS.draft,
    demoLabel: 'Demo data',
    legalGuardrail: 'Not an official ICAO result'
  },
  {
    id: 'TRACE-AI-OPS-DRAFT',
    sourceDocumentId: 'REG-NAMCARS-OPS-2026',
    sourceDocument: 'NAMCARS Flight Operations Requirements',
    version: '2026 mock edition',
    clauseRef: 'OPS 4.2',
    effectiveDate: '2026-01-01',
    applicabilityReason: 'AI draft references the same configured training-record clause as the checklist item.',
    linkedChecklist: 'AI Inspector Assistant draft finding language',
    linkedEvidence: 'Training matrix and sampled crew records',
    approvalState: V2_STATUS.underReview,
    demoLabel: 'AI-generated draft - requires authorized review',
    legalGuardrail: 'Not a legal decision'
  }
];

var SEED_QUESTION_TRACES = {
  q1: 'TRACE-OPS-TRG-4.2',
  q2: 'TRACE-OPS-TRG-4.2',
  q3: 'TRACE-OPS-TRG-4.2',
  q4: 'TRACE-OPS-TRG-4.2',
  q5: 'TRACE-OPS-TRG-4.2'
};

var SEED_RISK_PROFILES = [
  {
    id: 'RISK-ORG-XYZ-2026',
    orgId: 'ORG-XYZ',
    score: 74,
    band: 'Needs Attention',
    status: V2_STATUS.published,
    drivers: ['Repeat training records finding', 'CAP due soon', 'Flight Operations audit scheduled'],
    previousFindings: ['OPS-2025-014', 'CAB-2026-004'],
    capPerformance: 'One recent CAP closed after evidence acceptance; training-record recurrence remains a mock risk indicator.',
    fleetChange: 'Two additional leased aircraft planned in Q3 (demo data).',
    occurrenceTrend: 'Placeholder trend: slightly elevated documentation-related occurrences (demo data).',
    recommendedAction: 'Prioritize Flight Operations checklist focus on training records and CAP effectiveness.',
    traceId: 'TRACE-OPS-TRG-4.2'
  },
  {
    id: 'RISK-ORG-SKY-2026',
    orgId: 'ORG-SKY',
    score: 81,
    band: 'High Attention',
    status: V2_STATUS.published,
    drivers: ['Critical security finding open', 'Repeat ramp findings', 'Evidence review pending'],
    previousFindings: ['SEC-2026-002', 'RAMP-2026-005'],
    capPerformance: 'CAP submitted for security finding; evidence pending for ramp finding.',
    fleetChange: 'Cargo route expansion noted for demo planning.',
    occurrenceTrend: 'Placeholder trend: cargo access-control events under review.',
    recommendedAction: 'Prioritize evidence review and security follow-up.',
    traceId: 'TRACE-OPS-TRG-4.2'
  }
];

var SEED_INSPECTION_PACKAGE = {
  id: 'PKG-AUD-2026-001-FOPS',
  auditId: 'AUD-2026-001',
  organizationId: 'ORG-XYZ',
  auditType: 'Operator Audit',
  domain: 'Flight Operations',
  status: V2_STATUS.draft,
  riskFocus: ['Crew training records', 'CAP effectiveness follow-up', 'Operations manual currency'],
  questions: [
    {
      id: 'PKG-Q-OPS-TRG-4.2',
      checklistItemId: 'q2',
      text: 'Are crew training records complete and up to date?',
      whyIncluded: 'Repeat finding history and mock risk profile indicate training-record oversight needs focused sampling.',
      expectedEvidence: ['Training record sample', 'Training matrix', 'Responsible manager attestation'],
      traceId: 'TRACE-OPS-TRG-4.2'
    },
    {
      id: 'PKG-Q-OPS-MAN-2.1',
      checklistItemId: 'q1',
      text: 'Is the Operations Manual current and approved?',
      whyIncluded: 'Manual currency is a configured baseline check for this operator audit.',
      expectedEvidence: ['Approved Operations Manual revision record'],
      traceId: 'TRACE-OPS-TRG-4.2'
    }
  ]
};

var SEED_FIELD_PACKAGE = {
  id: 'FIELD-AUD-2026-001',
  auditId: 'AUD-2026-001',
  checkedOutBy: 'Caner Yildiz',
  checkedOutAt: '2026-06-15T08:30:00',
  status: 'checked_out_demo',
  packageName: 'Airline XYZ Flight Operations field package',
  localItems: ['Checklist questions', 'Expected evidence list', 'Draft field note', 'Mock attachment queue']
};

var SEED_OFFLINE_OUTBOX = [];

var SEED_USOAP_READINESS = [
  {
    id: 'USOAP-OPS-001',
    pqId: 'PQ-OPS-MOCK-001',
    criticalElement: 'CE-7',
    auditArea: 'OPS',
    applicability: 'Applicable in mock demo',
    readinessStatus: 'missing_evidence',
    linkedCapIds: ['OPS-2026-001'],
    linkedEvidenceIds: [],
    verificationHistory: [
      { id: 'VER-PQ-001', date: '2026-05-20', result: 'Gap logged from mock readiness review.' }
    ],
    trend: 'Evidence package incomplete - demo only, no EI claim.',
    note: 'Mock PQ readiness record for demo only; not an official ICAO assessment.',
    traceId: 'TRACE-USOAP-PQ-OPS-001'
  }
];

var SEED_CAP_EFFECTIVENESS = [
  {
    id: 'CAP-EFF-OPS-2025-014',
    findingId: 'OPS-2025-014',
    orgId: 'ORG-XYZ',
    rootCauseQuality: 'Adequate',
    revisionHistory: [
      { id: 'CAPREV-OPS-2025-014-1', status: V2_STATUS.accepted, submittedDate: '2025-11-20', note: 'Accepted after CAA review.' }
    ],
    verificationStatus: 'effective_with_monitoring',
    recurrenceIndicator: 'Related training-record weakness reappeared in 2026 mock scenario.',
    postClosureReview: 'Monitor next Flight Operations audit before treating CAP as durable.',
    reopenPath: 'Inspector may create a new finding if recurrence is verified.'
  },
  {
    id: 'CAP-EFF-AWO-2026-003',
    findingId: 'AWO-2026-003',
    orgId: 'ORG-BLU',
    rootCauseQuality: 'Needs follow-up',
    revisionHistory: [
      { id: 'CAPREV-AWO-2026-003-1', status: V2_STATUS.accepted, submittedDate: '2026-04-18', note: 'Evidence still required.' }
    ],
    verificationStatus: 'pending_evidence',
    recurrenceIndicator: 'No recurrence conclusion yet.',
    postClosureReview: 'Effectiveness review cannot complete before accepted evidence.',
    reopenPath: 'Not available until closure/effectiveness review.'
  }
];

var SEED_AI_SUGGESTIONS = [
  {
    id: 'AI-SUG-OPS-001',
    type: 'draft_finding_language',
    status: V2_STATUS.pendingReview,
    title: 'Draft finding language for crew training records',
    sourceRefs: ['REG-NAMCARS-OPS-2026 / OPS 4.2', 'Checklist item q2'],
    draft: 'Sampled crew training records were incomplete and did not demonstrate current completion status for selected crew members.',
    limitation: 'AI-generated draft - requires authorized review. The inspector must verify facts and wording before use.',
    traceId: 'TRACE-AI-OPS-DRAFT',
    decision: null
  },
  {
    id: 'AI-SUG-OPS-002',
    type: 'checklist_question_suggestion',
    status: V2_STATUS.pendingReview,
    title: 'Suggested checklist focus',
    sourceRefs: ['Risk profile RISK-ORG-XYZ-2026', 'NAMCARS OPS 4.2'],
    draft: 'Add targeted sampling of recurrent crew training record gaps and compare CAP effectiveness against previous closure evidence.',
    limitation: 'AI-generated draft - requires authorized review. It cannot publish an official checklist.',
    traceId: 'TRACE-AI-OPS-DRAFT',
    decision: null
  }
];

var SEED_SSP_NASP = {
  objectives: [
    {
      id: 'SSP-OBJ-001',
      title: 'Strengthen operational oversight follow-up',
      status: 'monitoring',
      notLegalDecision: true,
      spis: [
        { id: 'SPI-OPS-CAP-01', label: 'Overdue CAP ratio', current: '18%', target: '< 10%', trend: 'Needs attention' },
        { id: 'SPI-OPS-REC-01', label: 'Repeat finding recurrence', current: '2 repeat areas', target: 'Downward trend', trend: 'Monitor' }
      ],
      naspActions: [
        { id: 'NASP-ACT-001', owner: 'Flight Operations Section', targetDate: '2026-09-30', status: 'in_progress', linkedFindingIds: ['OPS-2025-014', 'OPS-2026-001'] }
      ]
    },
    {
      id: 'SSP-OBJ-002',
      title: 'Improve evidence-based closure discipline',
      status: 'monitoring',
      notLegalDecision: true,
      spis: [
        { id: 'SPI-EV-ACC-01', label: 'Evidence accepted before closure', current: 'Demo workflow enforced', target: '100%', trend: 'Stable' }
      ],
      naspActions: [
        { id: 'NASP-ACT-002', owner: 'Oversight Quality Team', targetDate: '2026-12-15', status: 'planned', linkedFindingIds: ['AWO-2026-003'] }
      ]
    }
  ]
};

/* ----------------------------- Planning approvals (Phase 0B thin slice) ----------------------------- */
var SEED_PLANNING_ITEMS = [
  {
    id: 'PLAN-2026-Q3-OPS',
    title: 'Q3 Flight Operations Surveillance Plan',
    department: 'Flight Operations',
    organization: 'Airline XYZ',
    organizationId: 'ORG-XYZ',
    purpose: 'Focused Q3 operator audit plan for repeated crew training record oversight.',
    riskCategory: 'Repeat training-record finding',
    triggerType: 'Risk based / repeat finding',
    budgetRequired: true,
    requestedBudget: 'USD 12,500',
    targetMonth: '2026-09',
    proposedInspectors: ['Caner Yildiz', 'Aylin Sezer'],
    status: 'submitted_to_gm',
    financeReview: null,
    preparation: {
      status: 'not_released',
      releasedBy: null,
      releasedDate: null,
      acceptedBy: null,
      acceptedDate: null,
      leadInspector: null,
      proposedTeam: [],
      proposedStartDate: null,
      proposedEndDate: null,
      resources: null,
      assignmentPackage: null,
      history: []
    },
    approval: {
      chain: [
        { role: 'manager', label: 'Department Manager', returnToRole: null },
        { role: 'gm', label: 'GM Review', returnToRole: 'manager' },
        { role: 'finance', label: 'Finance Review', returnToRole: 'gm', notApprovedReturnToRole: 'gm' },
        { role: 'executiveDirector', label: 'Executive Director Approval', returnToRole: 'gm' }
      ],
      currentIndex: 1,
      outcome: null,
      returnPolicy: 'configured_role',
      history: [
        {
          actor: 'Selin Demir',
          role: 'manager',
          action: 'submitted',
          date: '2026-06-15 10:30',
          comment: 'Submitted budget-required Q3 Flight Operations surveillance item for GM review.'
        }
      ]
    }
  }
];

/* ----------------------------- Notifications (in-UI only) ----------------------------- */
var SEED_NOTIFICATIONS = [
  { id: 'N1', role: 'inspector', icon: '📋', text: 'Operator Audit for Airline XYZ is scheduled for today.', time: 'Today 08:10', unread: true },
  { id: 'N2', role: 'inspector', icon: '📎', text: 'Evidence submitted on RAMP-2026-005 is waiting for your review.', time: 'Yesterday', unread: true },
  { id: 'N3', role: 'manager',   icon: '⚠️', text: 'AWO-2026-003 (Level 2 Major) is now Overdue.', time: 'Today 07:55', unread: true },
  { id: 'N5', role: 'gm', icon: '🧾', text: 'Planning item PLAN-2026-Q3-OPS is waiting for GM review.', time: 'Today 10:30', unread: true },
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
  { name: 'Selin Demir',  role: 'Department Manager', org: '—',            mfa: 'On',  status: 'Active' },
  { name: 'Okan Demir',   role: 'General Manager',    org: '—',            mfa: 'On',  status: 'Active' },
  { name: 'Derya Acar',   role: 'Finance Review',     org: '—',            mfa: 'On',  status: 'Active' },
  { name: 'Ufuk Aslan',   role: 'Executive Director', org: '—',            mfa: 'On',  status: 'Active' },
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

function freshState() {
  return {
    demoStateVersion: DEMO_STATE_VERSION,
    role: null,                 // null = login screen
    view: 'login',
    params: {},                 // { auditId, findingId, ... }
    orgs: deepClone(SEED_ORGS),
    audits: deepClone(SEED_AUDITS),
    checklist: deepClone(SEED_CHECKLIST),
    questionBank: deepClone(SEED_QUESTION_BANK),
    templateLibrary: deepClone(SEED_TEMPLATE_LIBRARY),
    managedChecklists: deepClone(SEED_MANAGED_CHECKLISTS),
    findings: deepClone(SEED_FINDINGS),
    potentialFindings: deepClone(SEED_POTENTIAL_FINDINGS),
    auditReports: deepClone(SEED_AUDIT_REPORTS),
    leadAuditReviews: deepClone(SEED_LEAD_AUDIT_REVIEWS),
    regulatoryDocuments: deepClone(SEED_REGULATORY_DOCUMENTS),
    regulatoryTraces: deepClone(SEED_REGULATORY_TRACES),
    questionTraces: deepClone(SEED_QUESTION_TRACES),
    riskProfiles: deepClone(SEED_RISK_PROFILES),
    inspectionPackage: deepClone(SEED_INSPECTION_PACKAGE),
    fieldPackage: deepClone(SEED_FIELD_PACKAGE),
    usoapReadiness: deepClone(SEED_USOAP_READINESS),
    capEffectiveness: deepClone(SEED_CAP_EFFECTIVENESS),
    aiSuggestions: deepClone(SEED_AI_SUGGESTIONS),
    sspNasp: deepClone(SEED_SSP_NASP),
    offlineOutbox: deepClone(SEED_OFFLINE_OUTBOX),
    planningItems: deepClone(SEED_PLANNING_ITEMS),
    offline: { simulated: false, lastMessage: null },
    selectedFilters: {
      findings: 'all',
      safety: 'all',
      regulatory: 'all',
      usoap: 'all',
      ssp: 'all'
    },
    notifications: deepClone(SEED_NOTIFICATIONS),
    auditLog: deepClone(SEED_AUDIT_LOG),
    checklistAnswers: {},       // { itemId: { answer, comment, findingId } } for the live audit
    inspectionWorkspaceAnswers: {}, // { rowId: { status, comment } } for the simplified inspector workspace
    inspectionWorkspaceSection: '1.',
    inspectionWorkspaceDownloadedAt: '',
    inspectionWorkspaceDraftSavedAt: '',
    inspectionWorkspaceSubmittedAt: '',
    capReviewUi: {
      expandedId: 'SEC-2026-002',
      tab: 'details',
      status: 'all',
      due: 'all',
      query: '',
      decision: '',
      comment: ''
    },
    capTrackingUi: {
      tab: 'overview',
      reminderSentAt: '',
      exportedAt: '',
      selectedFindingId: '',
      detailTab: 'details',
      reviewStatus: 'not_effective',
      reviewComments: 'The submitted CAP does not address all required actions. Training records are still incomplete for some staff. Additional corrective actions are required.',
      reviewOutcome: 'needs_action',
      enforcementLevel: 'administrative_penalty',
      enforcementJustification: '',
      internalComment: '',
      inspectorReviewSentAt: '',
      leadInspectorRecommendationAt: '',
      unitEffectiveness: 'partially_effective',
      unitRecommendationType: 'administrative_penalty',
      unitRecommendationLevel: 'administrative_penalty',
      unitComplianceDueDate: '2026-09-20',
      unitJustification: 'The CAP has initiated corrective actions; however, updated training records are still incomplete for multiple staff members. Therefore, an administrative penalty is recommended to ensure timely compliance.',
      unitAttachmentName: '',
      unitManagerRecommendationAt: '',
      secondReportPreparedAt: '',
      submittedToUnitManagerAt: '',
      submittedToGeneralManagerAt: ''
    },
    leadReviewUi: {
      tab: 'report',
      section: '1.',
      downloadedAt: '',
      finalizedAt: '',
      reportGeneratedAt: '',
      reportDraftSavedAt: '',
      reportSection: 'executive',
      reportRating: 'Acceptable with CAP',
      reportRisk: 'Medium',
      sentToUnitManagerAt: '',
      workflowComment: '',
      actionsOpen: false,
      workflowVersion: 7,
      overallComment: '',
      rowReviews: {}
    },
    findingSeq: 1,              // OPS-2026-00X live counter
    potentialSeq: 1,            // PF-2026-00X live counter
    auditSeq: 9,                // AUD-2026-00X counter for the New Audit Wizard
    notifSeq: 100,
    logSeq: 100,
    outboxSeq: 1,
    aiDecisionSeq: 1,
    questionSeq: 7,
    wizard: null,               // New Audit Wizard working data
    ui: { notifOpen: false, menuOpen: false }
  };
}

function seedState() {
  state = freshState();
}

function mergeDemoState(saved) {
  var base = freshState();
  if (!saved || typeof saved !== 'object') return base;
  Object.keys(saved).forEach(function (key) {
    if (key === 'ui') return;
    base[key] = saved[key];
  });
  base.ui = Object.assign({ notifOpen: false, menuOpen: false }, saved.ui || {});
  base.params = saved.params || {};
  base.selectedFilters = Object.assign(freshState().selectedFilters, saved.selectedFilters || {});
  base.offline = Object.assign({ simulated: false, lastMessage: null }, saved.offline || {});
  if (!Array.isArray(base.offlineOutbox)) base.offlineOutbox = [];
  if (!Array.isArray(base.potentialFindings)) base.potentialFindings = deepClone(SEED_POTENTIAL_FINDINGS);
  if (!Array.isArray(base.auditReports)) base.auditReports = deepClone(SEED_AUDIT_REPORTS);
  if (!Array.isArray(base.leadAuditReviews) || base.leadAuditReviews.length === 0) base.leadAuditReviews = deepClone(SEED_LEAD_AUDIT_REVIEWS);
  if (!Array.isArray(base.aiSuggestions)) base.aiSuggestions = deepClone(SEED_AI_SUGGESTIONS);
  if (!Array.isArray(base.regulatoryDocuments)) base.regulatoryDocuments = deepClone(SEED_REGULATORY_DOCUMENTS);
  if (!Array.isArray(base.regulatoryTraces)) base.regulatoryTraces = deepClone(SEED_REGULATORY_TRACES);
  if (!Array.isArray(base.planningItems)) base.planningItems = deepClone(SEED_PLANNING_ITEMS);
  base.planningItems.forEach(function (item) {
    if (!item.preparation) {
      var seed = SEED_PLANNING_ITEMS.filter(function (s) { return s.id === item.id; })[0] || SEED_PLANNING_ITEMS[0];
      item.preparation = deepClone(seed.preparation);
    }
    if (!Array.isArray(item.preparation.history)) item.preparation.history = [];
  });
  if (!Array.isArray(base.managedChecklists)) base.managedChecklists = deepClone(SEED_MANAGED_CHECKLISTS);
  if (!Array.isArray(base.questionBank)) base.questionBank = deepClone(SEED_QUESTION_BANK);
  if (!base.inspectionWorkspaceAnswers || typeof base.inspectionWorkspaceAnswers !== 'object') base.inspectionWorkspaceAnswers = {};
  if (!base.inspectionWorkspaceSection) base.inspectionWorkspaceSection = '1.';
  if (!base.inspectionWorkspaceDownloadedAt) base.inspectionWorkspaceDownloadedAt = '';
  if (!base.inspectionWorkspaceDraftSavedAt) base.inspectionWorkspaceDraftSavedAt = '';
  if (!base.inspectionWorkspaceSubmittedAt) base.inspectionWorkspaceSubmittedAt = '';
  base.capReviewUi = Object.assign({
    expandedId: 'SEC-2026-002',
    tab: 'details',
    status: 'all',
    due: 'all',
    query: '',
    decision: '',
    comment: ''
  }, saved.capReviewUi || {});
  base.capTrackingUi = Object.assign({
    tab: 'overview',
    reminderSentAt: '',
    exportedAt: '',
    selectedFindingId: '',
    detailTab: 'details',
    reviewStatus: 'not_effective',
    reviewComments: 'The submitted CAP does not address all required actions. Training records are still incomplete for some staff. Additional corrective actions are required.',
    reviewOutcome: 'needs_action',
    enforcementLevel: 'administrative_penalty',
    enforcementJustification: '',
    internalComment: '',
    inspectorReviewSentAt: '',
    leadInspectorRecommendationAt: '',
    unitEffectiveness: 'partially_effective',
    unitRecommendationType: 'administrative_penalty',
    unitRecommendationLevel: 'administrative_penalty',
    unitComplianceDueDate: '2026-09-20',
    unitJustification: 'The CAP has initiated corrective actions; however, updated training records are still incomplete for multiple staff members. Therefore, an administrative penalty is recommended to ensure timely compliance.',
    unitAttachmentName: '',
    unitManagerRecommendationAt: '',
    secondReportPreparedAt: '',
    submittedToUnitManagerAt: '',
    submittedToGeneralManagerAt: ''
  }, saved.capTrackingUi || {});
  if (['overview', 'timeline', 'communications', 'documents'].indexOf(base.capTrackingUi.tab) === -1) base.capTrackingUi.tab = 'overview';
  if (['details', 'history', 'communications', 'documents', 'enforcement'].indexOf(base.capTrackingUi.detailTab) === -1) base.capTrackingUi.detailTab = 'details';
  base.leadReviewUi = Object.assign({
    tab: 'report',
    section: '1.',
    downloadedAt: '',
    finalizedAt: '',
    reportGeneratedAt: '',
    reportDraftSavedAt: '',
    reportSection: 'executive',
    reportRating: 'Acceptable with CAP',
    reportRisk: 'Medium',
    sentToUnitManagerAt: '',
    workflowComment: '',
    actionsOpen: false,
    workflowVersion: 7,
    overallComment: '',
    rowReviews: {}
  }, saved.leadReviewUi || {});
  if (!base.leadReviewUi.rowReviews || typeof base.leadReviewUi.rowReviews !== 'object') base.leadReviewUi.rowReviews = {};
  if (!base.leadReviewUi.workflowVersion || base.leadReviewUi.workflowVersion < 7) {
    base.leadReviewUi.tab = 'report';
    base.leadReviewUi.reportSection = 'executive';
    base.leadReviewUi.downloadedAt = '';
    base.leadReviewUi.finalizedAt = '';
    base.leadReviewUi.reportGeneratedAt = '';
    base.leadReviewUi.reportDraftSavedAt = '';
    base.leadReviewUi.sentToUnitManagerAt = '';
    var seedLeadReport = SEED_AUDIT_REPORTS.filter(function (report) { return report.auditId === 'AUD-2026-005'; })[0];
    if (seedLeadReport && Array.isArray(base.auditReports)) {
      for (var reportIndex = 0; reportIndex < base.auditReports.length; reportIndex++) {
        if (base.auditReports[reportIndex].auditId === 'AUD-2026-005') base.auditReports[reportIndex] = deepClone(seedLeadReport);
      }
    }
  }
  base.leadReviewUi.workflowVersion = 7;
  if (!base.leadReviewUi.tab || base.leadReviewUi.tab === 'workflow') base.leadReviewUi.tab = 'report';
  if (!base.leadReviewUi.section) base.leadReviewUi.section = '1.';
  if (!base.leadReviewUi.reportSection) base.leadReviewUi.reportSection = 'executive';
  if (!base.leadReviewUi.reportRating) base.leadReviewUi.reportRating = 'Acceptable with CAP';
  if (!base.leadReviewUi.reportRisk) base.leadReviewUi.reportRisk = 'Medium';
  if (!base.leadReviewUi.reportDraftSavedAt) base.leadReviewUi.reportDraftSavedAt = '';
  if (base.leadReviewUi.actionsOpen === undefined || base.leadReviewUi.actionsOpen === null) base.leadReviewUi.actionsOpen = false;
  if (!base.questionSeq) base.questionSeq = 7;
  if (!base.potentialSeq) base.potentialSeq = 1;
  if (!base.questionTraces) base.questionTraces = deepClone(SEED_QUESTION_TRACES);
  base.demoStateVersion = DEMO_STATE_VERSION;
  return base;
}

function loadDemoState() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    var raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function saveDemoState(nextState) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(nextState));
  } catch (err) {
    if (typeof console !== 'undefined') console.warn('Demo state could not be saved', err);
  }
}

function clearDemoState() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
}

function persistAfterAction() {
  saveDemoState(state);
}

function initializeState() {
  var saved = loadDemoState();
  state = saved ? mergeDemoState(saved) : freshState();
}

/* Option lists for the New Audit Wizard. */
var AUDIT_TYPES = [
  'Initial Application',
  'Initial Certification',
  'Certificate Renewal',
  'Variation / Amendment',
  'Extension of Scope',
  'Additional Base / Station Approval',
  'Additional Aircraft Type Approval',
  'Additional Operation Approval',
  'Continued Surveillance',
  'Periodic Surveillance',
  'Follow-up Inspection',
  'Special Inspection',
  'Complaint Investigation',
  'Occurrence Investigation Support',
  'Ramp Inspection',
  'Document Review',
  'Remote Inspection'
];
var AUDIT_DOMAINS = ['Flight Operations', 'Ramp', 'Airworthiness', 'Cabin Safety', 'Security', 'Dangerous Goods', 'Licensing', 'Certification', 'Surveillance', 'Investigation', 'Document Review'];
var INSPECTORS = ['Caner Yildiz', 'Aylin Sezer', 'Mehmet Aydin'];
