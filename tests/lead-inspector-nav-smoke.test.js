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
      addEventListener() {},
      closest() { return null; }
    });
  }
  return elements.get(id);
}

const context = {
  console,
  window: { scrollTo() {} },
  document: {
    addEventListener() {},
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
  'js/checklists.js',
  'js/inspection.js',
  'js/planning.js',
  'js/reports.js',
  'js/views.js',
  'js/app.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

Object.assign(context.state, context.freshState());
context.state.role = 'leadInspector';
context.state.view = 'lead-review';
context.state.params = {};
context.render();

const html = elements.get('app-root').innerHTML;
const leadNavLabels = context.NAV.leadInspector
  .filter((item) => item.label)
  .map((item) => item.label)
  .join(' ');
const leadNavItems = context.NAV.leadInspector.filter((item) => item.label);

assert.match(html, /Inspection Reports/);
assert.match(html, /Audit Reports/);
assert.match(html, /Lead Inspector Workspace/);
assert.doesNotMatch(html, /Planning/);
assert.doesNotMatch(html, /Audit Work Queue/);
assert.doesNotMatch(html, />Audits</);
assert.doesNotMatch(html, />Reports</);
assert.doesNotMatch(html, /data-view="planning"/);
assert.doesNotMatch(html, /data-view="calendar"/);
assert.doesNotMatch(html, /data-view="reports"/);
assert.doesNotMatch(leadNavLabels, /Planning/);
assert.doesNotMatch(leadNavLabels, /Audits/);
assert.equal(leadNavItems.some((item) => item.label === 'Reports'), false);
assert.equal(context.NAV.leadInspector.some((item) => item.view === 'planning'), false);
assert.equal(context.NAV.leadInspector.some((item) => item.view === 'calendar'), false);
assert.equal(context.NAV.leadInspector.some((item) => item.view === 'reports'), false);

['planning', 'calendar', 'reports'].forEach((restrictedView) => {
  context.state.view = restrictedView;
  context.state.params = {};
  context.render();
  const restrictedHtml = elements.get('app-root').innerHTML;
  assert.match(restrictedHtml, /Inspection Reports/);
  assert.match(restrictedHtml, /Lead Inspector Workspace/);
  assert.doesNotMatch(restrictedHtml, /Audit Work Queue/);
  assert.doesNotMatch(restrictedHtml, /Planning/);
});

console.log('lead-inspector-nav-smoke: ok');
