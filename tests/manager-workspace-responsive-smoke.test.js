const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const styles = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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
  /\.manager-team-menu\s*\{[^}]*max-height:\s*min\(300px,\s*calc\(100vh\s*-\s*32px\)\);[^}]*overflow-y:\s*auto;/s,
  'Inspection Team constrains and scrolls its desktop row menu inside the viewport'
);

assert.match(
  styles,
  /@media \(max-width:\s*640px\)[\s\S]*?\.manager-team-menu\s*\{[^}]*position:\s*fixed;[^}]*left:\s*16px;[^}]*right:\s*16px;[^}]*bottom:\s*16px;/s,
  'Inspection Team uses a viewport-contained mobile action sheet'
);

assert.equal(
  (indexHtml.match(/\?v=20260710-manager-workspace-qa/g) || []).length,
  12,
  'Task 10 cache-busts the stylesheet and eleven frontend scripts together'
);

console.log('manager-workspace-responsive-smoke: ok');
