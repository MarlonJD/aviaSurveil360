const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
const downloads = [];
const objectUrls = new Map();
let objectUrlSeq = 0;

function stubElement(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      value: '',
      innerHTML: '',
      hidden: false,
      style: {},
      parentNode: null,
      classList: { toggle() {} },
      addEventListener() {},
      appendChild(child) { child.parentNode = this; },
      removeChild(child) { child.parentNode = null; },
      closest() { return null; }
    });
  }
  return elements.get(id);
}

function stubCreatedElement(tagName) {
  return {
    tagName,
    className: '',
    innerHTML: '',
    style: {},
    href: '',
    download: '',
    parentNode: null,
    click() {
      downloads.push({
        fileName: this.download,
        blob: objectUrls.get(this.href) || null
      });
    }
  };
}

function dataEl(attrs) {
  return {
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : '';
    }
  };
}

class BlobStub {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options && options.type;
  }
}

const documentBody = {
  classList: { toggle() {} },
  appendChild(child) { child.parentNode = this; },
  removeChild(child) { child.parentNode = null; }
};

const context = {
  console,
  Blob: BlobStub,
  URL: {
    createObjectURL(blob) {
      const url = `blob:inspection-team-${++objectUrlSeq}`;
      objectUrls.set(url, blob);
      return url;
    },
    revokeObjectURL(url) { objectUrls.delete(url); }
  },
  window: { scrollTo() {} },
  document: {
    body: documentBody,
    addEventListener() {},
    createElement: stubCreatedElement,
    getElementById: stubElement,
    querySelectorAll() { return []; }
  },
  setTimeout,
  clearTimeout
};
vm.createContext(context);

[
  'js/data.js',
  'js/helpers.js',
  'js/approval.js',
  'js/planning.js',
  'js/checklists.js',
  'js/inspection.js',
  'js/reports.js',
  'js/manager-workspaces.js',
  'js/work-items.js',
  'js/views.js',
  'js/app.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'inspection-team';
context.state.params = {};
context.state.users.push({
  id: 'USR-PRIVATE',
  name: 'Other Manager Private Inspector',
  role: 'CAA Inspector',
  roleKey: 'inspector',
  department: 'Flight Operations',
  email: 'private.inspector@caa.demo',
  reportsToRole: 'otherManager',
  org: '—',
  mfa: 'On',
  status: 'Active'
});
context.state.inspectionTeams.push({
  id: 'TEAM-AUD-PRIVATE-001',
  auditId: 'AUD-PRIVATE-001',
  department: 'Flight Operations',
  status: 'Scheduled',
  startDate: '2026-07-01',
  endDate: '2026-07-02',
  leadUserId: 'USR-PRIVATE',
  memberIds: ['USR-PRIVATE'],
  notes: 'Private workload belonging to another manager.',
  attachments: [],
  messages: [],
  history: []
});
context.render();

let html = elements.get('app-root').innerHTML;
assert.match(html, /Inspection Team/);
assert.match(html, /Fly Namibia/);
assert.match(html, /View Team Details/);
assert.doesNotMatch(html, /Other Manager Private Inspector/);
assert.match(html, /Overview/);
assert.match(html, /Team Members/);
assert.match(html, /Assignments/);
assert.match(html, /Documents/);
assert.match(html, /History/);
assert.match(html, /Caner Yildiz/);
assert.match(html, /caner\.yildiz@caa\.demo/);
assert.match(html, /aria-expanded="false"/);

const managerNavLabels = context.NAV.manager
  .filter((item) => item.label)
  .map((item) => item.label);
assert.ok(managerNavLabels.includes('Inspection Team'));
assert.equal(context.VIEW_TITLES['inspection-team'], 'Inspection Team');

const allRows = context.managerTeamRows(context.state, {
  query: '', department: 'all', status: 'all', dateRange: 'all'
});
assert.deepEqual(
  JSON.parse(JSON.stringify(allRows.map((row) => row.auditId))),
  ['AUD-2026-001'],
  'teams belonging only to another manager stay outside the workspace'
);
assert.ok(allRows[0].members.every((member) => member.reportsToRole === 'manager'));
assert.equal(context.managerTeamByAuditId(context.state, 'AUD-2026-001').id, 'TEAM-AUD-2026-001');
assert.equal(context.managerTeamByAuditId(context.state, 'AUD-NOT-FOUND'), null);
const privateTeamBeforeMutations = JSON.stringify(
  context.managerTeamByAuditId(context.state, 'AUD-PRIVATE-001')
);

context.handleAction('manager-team-menu', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.inspectionTeamUi.openMenuAuditId, 'AUD-2026-001');
html = elements.get('app-root').innerHTML;
assert.match(html, /aria-expanded="true"/);
[
  'View Team Details',
  'Edit Team',
  'Add Inspector',
  'Remove Inspector',
  'Change Lead Inspector',
  'Update Schedule',
  'View Assignment Package',
  'View Audit Details',
  'Send Message to Team',
  'Download Team Assignment',
  'View Activity Log'
].forEach((label) => assert.match(html, new RegExp(label)));

[
  ['manager-team-edit', /Edit Inspection Team/],
  ['manager-team-add', /Add Inspector/],
  ['manager-team-remove', /Remove Inspector/],
  ['manager-team-lead', /Change Lead Inspector/],
  ['manager-team-schedule', /Update Schedule/],
  ['manager-team-package', /View Assignment Package/],
  ['manager-team-message', /Send Message to Team/]
].forEach(([action, expected]) => {
  context.handleAction(action, dataEl({ 'data-id': 'AUD-2026-001' }));
  assert.equal(elements.get('modal-host').hidden, false, `${action} opens focused content`);
  assert.match(elements.get('modal-host').innerHTML, expected);
  context.closeModal();
});

context.handleAction('manager-team-schedule', dataEl({ 'data-id': 'AUD-2026-001' }));
stubElement('manager-team-start-date').value = '2026-06-22';
stubElement('manager-team-end-date').value = '2026-06-21';
context.handleAction('manager-team-confirm-schedule', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.match(elements.get('manager-team-schedule-error').innerHTML, /cannot be before/i);
context.closeModal();

context.handleAction('manager-team-message', dataEl({ 'data-id': 'AUD-2026-001' }));
stubElement('manager-team-message-body').value = '';
context.handleAction('manager-team-confirm-message', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.match(elements.get('manager-team-message-error').innerHTML, /required/i);
context.closeModal();

context.handleAction('manager-team-select', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.inspectionTeamUi.selectedAuditId, 'AUD-2026-001');
assert.equal(context.state.inspectionTeamUi.tab, 'overview');
assert.equal(context.state.inspectionTeamUi.openMenuAuditId, '');

const beforeDuplicate = JSON.stringify(context.state.inspectionTeams);
const duplicate = context.addManagerTeamMember(context.state, 'AUD-2026-001', 'USR-AYLIN');
assert.equal(duplicate.ok, false);
assert.equal(JSON.stringify(context.state.inspectionTeams), beforeDuplicate);

const unscoped = context.addManagerTeamMember(context.state, 'AUD-2026-001', 'USR-PRIVATE');
assert.equal(unscoped.ok, false);

const removeLead = context.removeManagerTeamMember(context.state, 'AUD-2026-001', 'USR-CANER');
assert.equal(removeLead.ok, false);

const changeNonMember = context.changeManagerTeamLead(context.state, 'AUD-2026-001', 'USR-PRIVATE');
assert.equal(changeNonMember.ok, false);

const teamBeforeLeadChange = context.managerTeamByAuditId(context.state, 'AUD-2026-001');
const historyBeforeLeadChange = teamBeforeLeadChange.history.length;
const changed = context.changeManagerTeamLead(context.state, 'AUD-2026-001', 'USR-AYLIN');
assert.equal(changed.ok, true);
assert.equal(changed.team.leadUserId, 'USR-AYLIN');
assert.equal(changed.team.history.length, historyBeforeLeadChange + 1);
assert.match(changed.team.history.at(-1).at, /^2026-06-15 \d{2}:\d{2}$/);

const removed = context.removeManagerTeamMember(context.state, 'AUD-2026-001', 'USR-CANER');
assert.equal(removed.ok, true);
assert.equal(removed.team.memberIds.includes('USR-CANER'), false);

const readded = context.addManagerTeamMember(context.state, 'AUD-2026-001', 'USR-CANER');
assert.equal(readded.ok, true);
assert.ok(readded.team.memberIds.includes('USR-CANER'));

const beforeInvalidSchedule = JSON.stringify(context.managerTeamByAuditId(context.state, 'AUD-2026-001'));
const invalidSchedule = context.updateManagerTeamSchedule(
  context.state, 'AUD-2026-001', '2026-06-22', '2026-06-21'
);
assert.equal(invalidSchedule.ok, false);
assert.equal(JSON.stringify(context.managerTeamByAuditId(context.state, 'AUD-2026-001')), beforeInvalidSchedule);

const scheduleHistoryBefore = context.managerTeamByAuditId(context.state, 'AUD-2026-001').history.length;
const scheduled = context.updateManagerTeamSchedule(
  context.state, 'AUD-2026-001', '2026-06-16', '2026-06-22'
);
assert.equal(scheduled.ok, true);
assert.equal(scheduled.team.startDate, '2026-06-16');
assert.equal(scheduled.team.endDate, '2026-06-22');
assert.equal(scheduled.team.history.length, scheduleHistoryBefore + 1);

const blankMessage = context.recordManagerTeamMessage(context.state, 'AUD-2026-001', '   ');
assert.equal(blankMessage.ok, false);
const teamBeforeMessage = context.managerTeamByAuditId(context.state, 'AUD-2026-001');
const messagesBefore = teamBeforeMessage.messages.length;
const historyBeforeMessage = teamBeforeMessage.history.length;
const messaged = context.recordManagerTeamMessage(
  context.state,
  'AUD-2026-001',
  'Please confirm the evidence review assignments before close of business.'
);
assert.equal(messaged.ok, true);
assert.equal(messaged.team.messages.length, messagesBefore + 1);
assert.equal(messaged.team.history.length, historyBeforeMessage + 1);
assert.match(messaged.team.messages.at(-1).body, /confirm the evidence review assignments/);
assert.equal(
  JSON.stringify(context.managerTeamByAuditId(context.state, 'AUD-PRIVATE-001')),
  privateTeamBeforeMutations,
  'successful mutations do not change another inspection team'
);

assert.equal(context.pdfSafeText('“Fly–Namibia” ✓'), '"Fly-Namibia"');
assert.equal(context.pdfEscape('A \\ (team)'), 'A \\\\ \\(team\\)');
assert.ok(context.pdfWrap('This is a deliberately long assignment line for wrapping', 18).length > 1);
const pdf = context.buildAviaPdfDocument([
  'AviaSurveil360 Team Assignment',
  'Fly Namibia (AUD-2026-001)',
  'Path \\ assignment'
]);
assert.match(pdf, /^%PDF-1\.4\n/);
assert.match(pdf, /xref\n0 \d+\n/);
assert.match(pdf, /trailer\n<< \/Size \d+ \/Root 1 0 R >>/);
assert.ok(pdf.includes('Fly Namibia \\(AUD-2026-001\\)'));
assert.ok(pdf.includes('Path \\\\ assignment'));

const injectedDownloads = [];
const injectedUrls = [];
const injectedDocument = {
  body: {
    appendChild(link) { link.parentNode = this; },
    removeChild(link) { link.parentNode = null; }
  },
  createElement() {
    return {
      href: '', download: '', parentNode: null,
      click() { injectedDownloads.push({ href: this.href, filename: this.download }); }
    };
  }
};
const downloaded = context.downloadAviaPdf('Injected.pdf', ['Injected PDF'], {
  Blob: BlobStub,
  URL: {
    createObjectURL(blob) { injectedUrls.push(blob); return 'blob:injected'; },
    revokeObjectURL(url) { injectedUrls.push(url); }
  },
  document: injectedDocument
});
assert.deepEqual(JSON.parse(JSON.stringify(downloaded)), {
  ok: true, filename: 'Injected.pdf', mime: 'application/pdf'
});
assert.equal(injectedDownloads[0].filename, 'Injected.pdf');
assert.equal(injectedUrls[0].type, 'application/pdf');
assert.equal(injectedUrls.at(-1), 'blob:injected');

context.handleAction('manager-team-download', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(downloads.at(-1).fileName, 'Fly_Namibia_AUD-2026-001_Team_Assignment.pdf');
assert.equal(downloads.at(-1).blob.type, 'application/pdf');
assert.match(downloads.at(-1).blob.parts.join(''), /^%PDF-1\.4/);

context.handleAction('manager-team-activity', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.inspectionTeamUi.tab, 'history');
assert.match(elements.get('app-root').innerHTML, /Please confirm the evidence review assignments/);

context.state.view = 'inspection-team';
context.render();
context.handleAction('manager-team-audit', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.view, 'audit-detail');
assert.equal(context.state.params.auditId, 'AUD-2026-001');

console.log('inspection-team-smoke: ok');
