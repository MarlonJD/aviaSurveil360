### Task 3: Inspection Team Workspace And Actions

**Files:**

- Create: `tests/inspection-team-smoke.test.js`
- Modify: `js/manager-workspaces.js`
- Modify: `js/views.js`
- Modify: `js/app.js`
- Modify: `css/styles.css`

**Interfaces:**

- Consumes: `state.users`, `state.inspectionTeams`, audit records, PDF helpers
  introduced in this task, persistence/log/notification helpers.
- Produces: `managerTeamRows(targetState, filters) -> ManagerTeamRow[]`.
- Produces: `managerTeamByAuditId(targetState, auditId) -> InspectionTeam|null`.
- Produces: `addManagerTeamMember`, `removeManagerTeamMember`,
  `changeManagerTeamLead`, `updateManagerTeamSchedule`, and
  `recordManagerTeamMessage`, each returning `{ ok, message, team }`.
- Produces: `viewInspectionTeam() -> string`.
- Produces actions prefixed `manager-team-`.

- [ ] **Step 1: Write the failing Inspection Team smoke test**

Assert manager scoping, the menu, detail, and mutations:

```js
context.state = context.freshState();
context.state.role = 'manager';
context.state.view = 'inspection-team';
context.render();
let html = elements.get('app-root').innerHTML;
assert.match(html, /Inspection Team/);
assert.match(html, /Fly Namibia/);
assert.match(html, /View Team Details/);
assert.doesNotMatch(html, /Other Manager Private Inspector/);

context.handleAction('manager-team-menu', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.inspectionTeamUi.openMenuAuditId, 'AUD-2026-001');
context.handleAction('manager-team-select', dataEl({ 'data-id': 'AUD-2026-001' }));
assert.equal(context.state.inspectionTeamUi.selectedAuditId, 'AUD-2026-001');

const duplicate = context.addManagerTeamMember(context.state, 'AUD-2026-001', 'USR-AYLIN');
assert.equal(duplicate.ok, false);
const removeLead = context.removeManagerTeamMember(context.state, 'AUD-2026-001', 'USR-CANER');
assert.equal(removeLead.ok, false);
const changed = context.changeManagerTeamLead(context.state, 'AUD-2026-001', 'USR-AYLIN');
assert.equal(changed.ok, true);
```

Also assert schedule changes append history and messages append a team message.

- [ ] **Step 2: Run the test and verify RED**

Run `node tests/inspection-team-smoke.test.js`.

Expected: FAIL because the route and team functions do not exist.

- [ ] **Step 3: Implement scoped selectors and mutation validation**

Only include users with `reportsToRole === 'manager'` in selectable members.
Use one result shape everywhere:

```js
function teamMutationResult(ok, message, team) {
  return { ok: ok, message: message, team: team || null };
}
```

Reject duplicate members. Reject removal of `leadUserId`. Reject a lead change
to a user who is not already a team member. Successful mutations append a
history entry with `logTimestamp()` when available and do not change other
teams.

- [ ] **Step 4: Add route, navigation, and master-detail renderer**

Add `Inspection Team` to manager nav, `VIEW_TITLES`, and render dispatch. Render
summary metrics, filters, team rows, and the selected detail tabs:

- Overview
- Team Members
- Assignments
- Documents
- History

The overview shows member role, name, department, email, and status. Notes use
a real textarea. Attachments display selected filenames only.

- [ ] **Step 5: Implement the ellipsis menu and focused forms**

Use `aria-expanded` and an anchored menu for the selected row. Implement these
outcomes:

- View Team Details — select the row and show Overview.
- Edit Team / Add Inspector / Remove Inspector / Change Lead Inspector — open
  focused modals and call the validated mutation functions.
- Update Schedule — modal with `startDate` and `endDate`; reject an end before
  the start.
- View Assignment Package — modal preview.
- View Audit Details — existing `audit-detail` route.
- Send Message to Team — required message body; append to `team.messages` and
  history.
- Download Team Assignment — valid PDF download.
- View Activity Log — select the History tab.

Member-row ellipses may expose only supported Add/Remove/Make Lead actions.

- [ ] **Step 6: Add generic PDF builder and assignment download**

Generalize the existing dependency-free PDF logic behind these exact public
functions in `js/manager-workspaces.js`:

```js
function pdfSafeText(text) {
  return String(text || '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pdfEscape(text) {
  return pdfSafeText(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function pdfWrap(text, maxChars) {
  var clean = pdfSafeText(text);
  if (!clean) return [''];
  return clean.split(' ').reduce(function (lines, word) {
    var current = lines[lines.length - 1] || '';
    var candidate = current ? current + ' ' + word : word;
    if (candidate.length > maxChars && current) lines.push(word);
    else lines[lines.length - 1] = candidate;
    return lines;
  }, ['']);
}

function buildAviaPdfDocument(lines) {
  var printable = [];
  (lines && lines.length ? lines : ['AviaSurveil360 Demo Report']).forEach(function (line) {
    pdfWrap(line, 96).forEach(function (wrapped) { printable.push(wrapped); });
  });
  var pages = [];
  while (printable.length) pages.push(printable.splice(0, 43));
  var objects = ['<< /Type /Catalog /Pages 2 0 R >>', ''];
  var fontObject = objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  var pageReferences = [];
  pages.forEach(function (pageLines, pageIndex) {
    var y = 792;
    var content = pageLines.map(function (line, lineIndex) {
      if (!line) { y -= 8; return ''; }
      var size = pageIndex === 0 && lineIndex === 0 ? 18 : 10;
      var command = 'BT /F1 ' + size + ' Tf 54 ' + y + ' Td (' + pdfEscape(line) + ') Tj ET\n';
      y -= pageIndex === 0 && lineIndex === 0 ? 24 : 14;
      return command;
    }).join('');
    var contentObject = objects.push('<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream');
    var pageObject = objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ' + fontObject + ' 0 R >> >> /Contents ' + contentObject + ' 0 R >>');
    pageReferences.push(pageObject + ' 0 R');
  });
  objects[1] = '<< /Type /Pages /Kids [' + pageReferences.join(' ') + '] /Count ' + pageReferences.length + ' >>';
  var pdf = '%PDF-1.4\n';
  var offsets = [0];
  objects.forEach(function (body, index) {
    offsets[index + 1] = pdf.length;
    pdf += (index + 1) + ' 0 obj\n' + body + '\nendobj\n';
  });
  var xref = pdf.length;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (var i = 1; i <= objects.length; i += 1) pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  return pdf + 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
}

function downloadAviaPdf(filename, lines, env) {
  var runtime = env || { Blob: Blob, URL: URL, document: document };
  var pdf = buildAviaPdfDocument(lines);
  var blob = new runtime.Blob([pdf], { type: 'application/pdf' });
  var url = runtime.URL.createObjectURL(blob);
  var link = runtime.document.createElement('a');
  link.href = url;
  link.download = filename;
  runtime.document.body.appendChild(link);
  link.click();
  runtime.document.body.removeChild(link);
  runtime.URL.revokeObjectURL(url);
  return { ok: true, filename: filename, mime: 'application/pdf' };
}
```

The builder must escape parentheses/backslashes, wrap long lines, build valid
xref offsets, and return a `%PDF-1.4` document. The team assignment filename is
`Fly_Namibia_AUD-2026-001_Team_Assignment.pdf`.

- [ ] **Step 7: Verify GREEN and regressions**

Run:

```bash
node --check js/manager-workspaces.js
node --check js/views.js
node --check js/app.js
node tests/inspection-team-smoke.test.js
node tests/planning-workspace-smoke.test.js
node tests/planning-release-smoke.test.js
```

Expected: all exit 0.

- [ ] **Step 8: Review checkpoint without committing**

Run `git diff --check`; confirm every enabled menu item changes visible state,
opens content, navigates, or downloads. Do not commit.

