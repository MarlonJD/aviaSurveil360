const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, window: undefined, document: undefined, setTimeout, clearTimeout };
vm.createContext(context);

['js/data.js', 'js/helpers.js', 'js/approval.js', 'js/checklists.js', 'js/inspection.js', 'js/views.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

context.state = context.freshState();
context.state.role = 'inspector';
context.state.view = 'checklist';
context.state.params = { auditId: 'AUD-2026-001' };
context.state.checklistAnswers.q1 = { answer: 'compliant', comment: 'Operations Manual revision checked for report context.' };
context.state.checklistAnswers.q2 = { answer: 'noncompliant', comment: '' };

const html = context.viewChecklistRunner();

assert.match(html, /Checklist Runner/);
assert.match(html, /Compliant/);
assert.match(html, /data-field="checklist-comment" data-q="q1"/);
assert.match(html, /Operations Manual revision checked for report context\./);
assert.match(html, /Optional note for the audit report/);
assert.match(html, /Accepted evidence examples/);
assert.match(html, /report\/document \(PDF, DOCX\)/);
assert.match(html, /image\/photo \(JPG, PNG\)/);
assert.match(html, /audio recording \(MP3, M4A\)/);
assert.match(html, /spreadsheet\/data \(XLSX, CSV\)/);
assert.match(html, /Demo only: select a filename; no real upload occurs/);

console.log('checklist-comment-render-smoke: ok');
