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
      checked: false,
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

function dataEl(attrs) {
  return {
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : '';
    }
  };
}

const context = {
  console,
  window: { scrollTo() {} },
  document: {
    body: { classList: { toggle() {} }, appendChild() {}, removeChild() {} },
    addEventListener() {},
    createElement() { return { className: '', innerHTML: '', style: {}, parentNode: null, click() {} }; },
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

const state = context.freshState();
const packages = context.managerChecklistPackages(state);
assert.ok(packages.length >= 1);
const original = packages[0];
const originalPublishedVersion = original.publishedVersion;
const originalVersions = JSON.stringify(original.versions);

let result = context.createManagerChecklistPackage(state, '   ', 'Cabin Safety', 'Department Manager');
assert.equal(result.ok, false);
assert.match(result.message, /name/i);

const duplicate = context.duplicateManagerChecklistPackage(state, original.id, 'Department Manager');
assert.equal(duplicate.ok, true);
assert.equal(duplicate.package.status, 'Draft');
assert.notEqual(duplicate.package.id, original.id);
assert.equal(duplicate.package.sections.length, original.sections.length);

const section = context.addManagerChecklistSection(state, duplicate.package.id, 'Dispatch');
assert.equal(section.ok, true);
assert.equal(section.section.name, 'Dispatch');
const duplicateSection = context.addManagerChecklistSection(state, duplicate.package.id, 'Dispatch');
assert.equal(duplicateSection.ok, false);
assert.match(duplicateSection.message, /already exists/i);

const blankQuestion = context.saveManagerChecklistQuestion(
  state,
  duplicate.package.id,
  section.section.id,
  { text: ' ', reference: 'Configured procedure OPS-1' }
);
assert.equal(blankQuestion.ok, false);

const question = context.saveManagerChecklistQuestion(state, duplicate.package.id, section.section.id, {
  text: 'Are dispatch records complete?',
  reference: 'Configured procedure OPS-1',
  guidance: 'Sample the dispatch record and record any gap.',
  evidenceMethods: ['Document Review'],
  likelihood: 'Possible',
  impact: 'Major',
  findingTypes: ['Compliance'],
  mandatory: true,
  critical: false,
  status: 'Active'
});
assert.equal(question.ok, true);
assert.equal(question.question.text, 'Are dispatch records complete?');
assert.equal(question.question.riskScore, 12);
assert.equal(question.question.riskLevel, 'High');

const duplicatedQuestion = context.duplicateManagerChecklistQuestion(
  state,
  duplicate.package.id,
  section.section.id,
  question.question.id,
  'Department Manager'
);
assert.equal(duplicatedQuestion.ok, true);
assert.match(duplicatedQuestion.question.text, /Copy/);

const deactivated = context.saveManagerChecklistQuestion(state, duplicate.package.id, section.section.id, {
  id: question.question.id,
  text: question.question.text,
  reference: question.question.reference,
  guidance: question.question.guidance,
  evidenceMethods: question.question.evidenceMethods,
  likelihood: question.question.likelihood,
  impact: question.question.impact,
  findingTypes: question.question.findingTypes,
  mandatory: question.question.mandatory,
  critical: question.question.critical,
  status: 'Inactive'
});
assert.equal(deactivated.ok, true);
assert.equal(deactivated.question.status, 'Inactive');

const removedQuestion = context.removeManagerChecklistQuestion(
  state,
  duplicate.package.id,
  section.section.id,
  duplicatedQuestion.question.id,
  'Department Manager'
);
assert.equal(removedQuestion.ok, true);

const moved = context.moveManagerChecklistSection(
  state,
  duplicate.package.id,
  section.section.id,
  'up',
  'Department Manager'
);
assert.equal(moved.ok, true);

const singleSectionPackage = context.createManagerChecklistPackage(
  state,
  'Single Section Package',
  'Cabin Safety',
  'Department Manager'
);
assert.equal(singleSectionPackage.ok, true);
const removeLast = context.removeManagerChecklistSection(
  state,
  singleSectionPackage.package.id,
  singleSectionPackage.package.sections[0].id,
  'Department Manager'
);
assert.equal(removeLast.ok, false);
assert.match(removeLast.message, /last section/i);

const versionsBeforePublish = JSON.stringify(duplicate.package.versions);
const published = context.publishManagerChecklistVersion(state, duplicate.package.id, 'Department Manager');
assert.equal(published.ok, true);
assert.equal(published.package.status, 'Published');
assert.ok(published.package.versions.length > JSON.parse(versionsBeforePublish).length);
assert.equal(published.package.publishedVersion, published.version.version);
assert.equal(JSON.stringify(original.versions), originalVersions, 'publishing a duplicate does not overwrite the source package versions');
assert.equal(original.publishedVersion, originalPublishedVersion);

const archived = context.archiveManagerChecklistPackage(state, duplicate.package.id, 'Department Manager');
assert.equal(archived.ok, true);
assert.equal(archived.package.status, 'Archived');
assert.equal(
  context.managerChecklistPackages(state, { status: 'Active' }).some((item) => item.id === duplicate.package.id),
  false
);

context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'manager-checklists';
context.state.params = {};
context.render();

let html = elements.get('app-root').innerHTML;
assert.match(html, /Checklist Management/);
assert.match(html, /Create Package/);
assert.match(html, /Duplicate/);
assert.match(html, /Archive/);
assert.match(html, /Publish New Version/);
assert.match(html, /Package Information/);
assert.match(html, /Sections & Questions/);
assert.match(html, /Add Section/);
assert.match(html, /Add Question/);
assert.match(html, /Configured Requirement \/ Reference/);
assert.match(html, /Evidence Methods/);
assert.match(html, /Likelihood/);
assert.match(html, /Impact/);
assert.match(html, /Finding Types/);
assert.match(html, /Mandatory/);
assert.match(html, /Critical/);
assert.match(html, /Version History/);

const beforeUiDuplicate = context.state.managedChecklists.length;
context.handleAction('manager-checklist-duplicate', dataEl({ 'data-id': 'CL-CABIN' }));
assert.equal(context.state.managedChecklists.length, beforeUiDuplicate + 1);
assert.equal(context.state.managerChecklistUi.selectedPackageId, context.state.managedChecklists.at(-1).id);
assert.match(elements.get('app-root').innerHTML, /Draft/);

console.log('manager-checklist-management-smoke: ok');
