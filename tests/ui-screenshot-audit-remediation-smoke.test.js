const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

[
  'js/data.js', 'js/helpers.js', 'js/approval.js', 'js/planning.js',
  'js/checklists.js', 'js/inspection.js', 'js/reports.js',
  'js/manager-workspaces.js', 'js/work-items.js', 'js/views.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

function reset(role, view, params = {}) {
  context.state = context.freshState();
  context.state.role = role;
  context.state.view = view;
  context.state.params = params;
}

reset('leadInspector', 'lead-review');
assert.match(context.viewLeadAssignedAudits(), /lead-assigned-mobile-list/);
assert.match(context.viewLeadPreliminaryReports(), /lead-preliminary-mobile-list/);

reset('leadInspector', 'lead-assignment-questions', { auditId: 'AUD-2026-001' });
assert.match(context.viewLeadAssignmentQuestions(), /lead-assignment-question-mobile-list/);

reset('manager', 'inspection-team');
assert.match(context.viewInspectionTeam(), /manager-team-mobile-list/);

reset('manager', 'findings-review');
assert.match(context.viewManagerFindingsReview(), /manager-findings-mobile-list/);

reset('manager', 'manager-checklists');
assert.match(context.viewManagerChecklistManagement(), /manager-checklist-reference-textarea/);
assert.match(css, /@media \(max-width:\s*1180px\)[\s\S]*?\.manager-checklist-layout[\s\S]*?grid-template-columns:\s*1fr/);

reset('executiveDirector', 'executive-dashboard');
assert.match(context.viewExecutiveDirectorDashboard(), /executive-decision-queue/);

reset('admin', 'question-bank');
assert.match(context.viewQuestionBank(), /<textarea id="qb-text"/);

reset('admin', 'checklist-builder');
assert.match(context.viewChecklistBuilder(), /admin-checklist-mobile-list/);
assert.match(app, /\{ view: 'checklist-builder', label: 'Checklist Builder'/);

reset('inspector', 'finding', { findingId: 'SEC-2026-002' });
assert.match(context.viewFinding(), /data-view="ai-assistant"/);
assert.match(app, /state\.view === 'ai-assistant'/);

reset('inspector', 'ai-assistant', { sourceView: 'checklist', auditId: 'AUD-2026-005', questionId: 'cab-em-eq-pbe' });
assert.match(context.viewAiAssistant(), /ai-review-table/);
assert.match(css, /@media \(max-width:\s*1180px\)[\s\S]*?\.ai-review-table/);
assert.match(css, /\.ai-review-table \.ops-table\s*\{[\s\S]*?min-width:\s*0/);
assert.match(css, /@media \(max-width:\s*1120px\)[\s\S]*?\.lead-assignment-metrics[\s\S]*?grid-template-columns:\s*repeat\(2/);

assert.match(css, /\.responsive-record-list/);
assert.match(css, /\.mobile-decision-summary/);
assert.match(css, /@media \(max-width:\s*640px\)[\s\S]*?min-height:\s*44px/);
assert.match(css, /\[data-act="preliminary-report-open"\]/);
assert.match(css, /\[data-act="lead-assignment-assign"\]/);
assert.match(css, /\[data-act="manager-checklist-question-save"\]/);
assert.match(css, /\[data-act="qb-create"\]/);
assert.match(css, /\[data-act="executive-open-report"\]/);
assert.match(css, /\[data-view="finding"\]\[data-id\]/);
assert.match(css, /\[data-act="checklist-move-question"\][\s\S]*?min-width:\s*44px/);
assert.match(css, /@media \(max-width:\s*1180px\)[\s\S]*?\.executive-dashboard-grid[\s\S]*?grid-template-columns:\s*1fr/);

console.log('ui-screenshot-audit-remediation-smoke: ok');
