const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const styles = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mobileReportRules = styles.slice(styles.indexOf('@media screen and (max-width: 980px)'));

assert.doesNotMatch(mobileReportRules, /\.state-final-report-doc\s*\{[^}]*width:\s*700px/s);
assert.match(mobileReportRules, /\.executive-report-canvas\s*\{[^}]*min-width:\s*0[^}]*overflow-x:\s*hidden/s);
assert.match(mobileReportRules, /\.executive-report-zoom-stage\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0/s);

assert.match(
  styles,
  /\.manager-team-table th:last-child,\s*\.manager-team-table td:last-child\s*\{[^}]*position:\s*sticky;[^}]*right:\s*0;/s,
  'Inspection Team keeps its row-ellipsis action column visible inside the split pane'
);

assert.match(
  styles,
  /\.manager-report-queue th:last-child,\s*\.manager-report-queue td:last-child\s*\{[^}]*position:\s*sticky;[^}]*right:\s*0;/s,
  'Reports Approval keeps its row action visible inside the split pane'
);

assert.match(
  styles,
  /\.manager-report-counters\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
  'Reports Approval counters wrap into the available queue-pane width'
);

assert.match(
  styles,
  /\.lead-preliminary-table-panel \.prelim-report-table th:nth-child\(5\)\s*\{[^}]*width:\s*190px[^}]*\}[\s\S]*?\.lead-preliminary-table-panel \.prelim-status\s*\{[^}]*white-space:\s*normal/s,
  'Preliminary Report status labels stay inside their table column instead of overlapping Findings'
);

assert.match(
  styles,
  /\.manager-team-menu\s*\{[^}]*max-height:\s*min\(300px,\s*calc\(100vh\s*-\s*32px\)\);[^}]*overflow-y:\s*auto;/s,
  'Inspection Team constrains and scrolls its desktop row menu inside the viewport'
);

assert.match(
  styles,
  /@media \(max-width:\s*640px\)[\s\S]*?\.manager-team-menu\s*\{[^}]*position:\s*fixed;[^}]*left:\s*16px;[^}]*right:\s*16px;[^}]*bottom:\s*16px;/s,
  'Inspection Team uses a viewport-contained mobile action sheet'
);

assert.equal(
  (indexHtml.match(/\?v=20260720-wsa-remediation-v5/g) || []).length,
  12,
  'The current UI update cache-busts the stylesheet and eleven frontend scripts together'
);

assert.match(
  styles,
  /\.planning-command-center__facts\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/s,
  'Planning command center presents four decision-context facts at wide widths'
);

assert.match(
  styles,
  /@media \(max-width:\s*640px\)[\s\S]*?\.planning-command-center__facts[\s\S]*?grid-template-columns:\s*1fr/s,
  'Planning command center collapses to a single readable mobile column'
);

assert.match(
  styles,
  /\.planning-queue-row\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s+minmax\(220px,\s*1fr\)\s+minmax\(86px,\s*\.35fr\)\s+auto/s,
  'Planning queue uses a compact four-part decision row instead of the legacy eight-column table'
);

assert.match(
  styles,
  /@media \(max-width:\s*640px\)[\s\S]*?\.planning-queue-row\s*\{[^}]*grid-template-columns:\s*1fr/s,
  'Planning queue becomes one readable column on mobile'
);

assert.match(styles, /\.manager-team-filters\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
assert.match(styles, /\.manager-team-search\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
assert.match(styles, /\.manager-findings-filters\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
assert.match(styles, /@media \(max-width:\s*1100px\)[\s\S]*?\.manager-team-mobile-list[\s\S]*?display:\s*grid/s);
assert.match(styles, /@media \(max-width:\s*1100px\)[\s\S]*?\.manager-findings-mobile-list[\s\S]*?display:\s*grid/s);
assert.match(styles, /@media \(max-width:\s*1180px\)[\s\S]*?\.executive-dashboard-grid\s*\{[^}]*grid-template-columns:\s*1fr/s);
assert.match(styles, /@media \(max-width:\s*1180px\)[\s\S]*?\.executive-decision-list article\s*\{[^}]*grid-template-columns:\s*1fr/s);
assert.match(styles, /\.executive-decision-list article[^}]*min-width:\s*0/s);

console.log('manager-workspace-responsive-smoke: ok');
