const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();

function stubElement(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      value: '',
      innerHTML: '',
      hidden: false,
      children: [],
      addEventListener() {},
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
      },
      removeChild(child) {
        this.children = this.children.filter((item) => item !== child);
        child.parentNode = null;
      }
    });
  }
  return elements.get(id);
}

const documentStub = {
  addEventListener() {},
  createElement(tagName) {
    return {
      tagName,
      className: '',
      innerHTML: '',
      style: {},
      parentNode: null
    };
  },
  getElementById: stubElement,
  querySelectorAll() { return []; }
};

const context = {
  console,
  window: { scrollTo() {} },
  document: documentStub,
  setTimeout,
  clearTimeout
};

vm.createContext(context);

[
  'js/data.js',
  'js/helpers.js',
  'js/approval.js',
  'js/checklists.js',
  'js/inspection.js',
  'js/planning.js',
  'js/reports.js',
  'js/work-items.js',
  'js/views.js',
  'js/app.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();

context.state.role = 'auditee';
context.state.view = 'my-findings';
context.state.params = {};

const auditeePortalHtml = context.viewAuditeeMyFindings();
assert.doesNotMatch(
  auditeePortalHtml,
  /Internal CAA Note|Inspector Workload|SkyCargo Air|BlueWing Aviation/i,
  'Product rule violated: Auditee portal must not expose internal CAA notes, inspector workload, or other organizations. Check visibleFindings(), NAV.auditee, and viewAuditeeMyFindings().'
);

context.state.params = { findingId: 'OPS-2025-014' };
const auditeeFindingHtml = context.viewFinding();
assert.doesNotMatch(
  auditeeFindingHtml,
  /Internal CAA Note|Closure verified against sampled records/i,
  'Product rule violated: Auditee Finding detail must not render Internal CAA Notes. Check viewFinding() internalHtml gating.'
);
assert.match(
  auditeeFindingHtml,
  /Comment to Auditee/i,
  'Product rule violated: Auditee Finding detail should still show auditee-visible comments.'
);

const auditeeNavLabels = context.NAV.auditee
  .filter((item) => item.label)
  .map((item) => item.label)
  .join(' ');
assert.doesNotMatch(
  auditeeNavLabels,
  /Inspector Workload|Planning Approval|Question Bank|Audit Log/i,
  'Product rule violated: Auditee navigation must not expose internal CAA surfaces. Check NAV.auditee.'
);

context.state.role = 'inspector';
stubElement('cap-comment').value = 'CAP accepted. Please upload completion evidence.';
stubElement('cap-internal').value = 'Internal review note for CAA only.';
context.capDecision('SEC-2026-002', 'accept');
const capFinding = context.findingById('SEC-2026-002');
assert.equal(
  capFinding.status,
  'EVIDENCE_REQUIRED',
  'Product rule violated: CAP acceptance must not close a Finding. Expected EVIDENCE_REQUIRED before evidence review. Check capDecision().'
);
assert.notEqual(
  capFinding.status,
  'CLOSED',
  'Product rule violated: CAP acceptance closed a Finding. Closure requires accepted evidence or authorized closure.'
);

context.pickedFiles['ev-file'] = {
  name: 'FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf',
  size: '1.6 MB',
  contents: 'This fake field must not be persisted.'
};
stubElement('ev-note').value = 'Completion evidence submitted for CAA review.';
context.submitEvidence('AWO-2026-003');
const evidenceFinding = context.findingById('AWO-2026-003');
const latestEvidence = evidenceFinding.evidence[evidenceFinding.evidence.length - 1];
assert.equal(
  latestEvidence.fileName,
  'FlyNamibia_PBE_Serviceability_Record_CAB-2026-001.pdf',
  'Product rule violated: Mock evidence should display the selected filename.'
);
assert.equal(
  latestEvidence.type,
  'mock-file-name-only',
  'Product rule violated: Mock evidence must remain filename-only. Check submitEvidence().'
);
assert.equal(
  Object.prototype.hasOwnProperty.call(latestEvidence, 'contents'),
  false,
  'Product rule violated: Mock evidence stored file contents. The demo must not implement real upload/storage.'
);
assert.equal(evidenceFinding.status, 'EVIDENCE_SUBMITTED');

console.log('demo-boundary-smoke: ok');
