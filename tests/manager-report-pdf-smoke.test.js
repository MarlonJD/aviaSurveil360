const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const context = { console, setTimeout, clearTimeout };
vm.createContext(context);

[
  'js/data.js',
  'js/helpers.js',
  'js/manager-workspaces.js'
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
});

const state = context.freshState();
assert.equal(context.closureBasisLabel({ closureType: 'evidence-verified' }), 'Evidence accepted and verified');
assert.equal(context.closureBasisLabel({ closureType: 'authorized' }), 'Authorized closure (audit-logged)');
const preliminary = context.managerReportById(state, 'PR-2026-018');
const finalReport = context.managerReportById(state, 'FR-2026-018');

const preliminaryLines = context.managerReportPdfLines(preliminary, 'report', state);
const preliminaryPdf = context.buildAviaPdfDocument(preliminaryLines);
assert.match(preliminaryPdf, /^%PDF-1\.4\n/);
assert.match(preliminaryPdf, /Fly Namibia/);
assert.match(preliminaryPdf, /Preliminary Report/);
assert.match(preliminaryPdf, /PR-2026-018/);
assert.match(preliminaryPdf, /Demo-only/);
assert.doesNotMatch(preliminaryPdf, /Internal CAA Note/);
assert.equal(
  context.managerReportPdfFilename(preliminary, 'report'),
  'Fly_Namibia_Preliminary_Report_PR-2026-018.pdf'
);

const finalLines = context.managerReportPdfLines(finalReport, 'report', state);
const finalPdf = context.buildAviaPdfDocument(finalLines);
assert.match(finalPdf, /Final Report/);
assert.match(finalPdf, /FR-2026-018/);
assert.match(finalPdf, /final authorized approval/i);
assert.equal(
  context.managerReportPdfFilename(finalReport, 'report'),
  'Fly_Namibia_Final_Report_FR-2026-018.pdf'
);

const executiveLines = context.managerReportPdfLines(finalReport, 'executive', state);
const executivePdf = context.buildAviaPdfDocument(executiveLines);
assert.match(executivePdf, /Executive Summary/);
assert.match(executivePdf, /Fly Namibia/);
assert.equal(
  context.managerReportPdfFilename(finalReport, 'executive'),
  'Fly_Namibia_Executive_Summary_FR-2026-018.pdf'
);

let createdBlob = null;
let clickedDownload = '';
let revokedUrl = '';
class BlobStub {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options && options.type;
    createdBlob = this;
  }
}

const fakeEnv = {
  Blob: BlobStub,
  URL: {
    createObjectURL() { return 'blob:manager-report-pdf'; },
    revokeObjectURL(url) { revokedUrl = url; }
  },
  document: {
    body: {
      appendChild(link) { link.parentNode = this; },
      removeChild(link) { link.parentNode = null; }
    },
    createElement() {
      return {
        href: '', download: '', parentNode: null,
        click() { clickedDownload = this.download; }
      };
    }
  }
};

const filename = context.managerReportPdfFilename(preliminary, 'report');
const download = context.downloadAviaPdf(filename, preliminaryLines, fakeEnv);
assert.deepEqual(JSON.parse(JSON.stringify(download)), {
  ok: true,
  filename: 'Fly_Namibia_Preliminary_Report_PR-2026-018.pdf',
  mime: 'application/pdf'
});
assert.equal(clickedDownload, 'Fly_Namibia_Preliminary_Report_PR-2026-018.pdf');
assert.equal(createdBlob.type, 'application/pdf');
assert.match(createdBlob.parts.join(''), /^%PDF-1\.4/);
assert.equal(revokedUrl, 'blob:manager-report-pdf');

console.log('manager-report-pdf-smoke: ok');
