const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function buildContext() {
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
        closest() { return null; },
        focus() {}
      });
    }
    return elements.get(id);
  }

  const context = {
    console,
    Blob: class BlobStub {
      constructor(parts, options) { this.parts = parts; this.type = options && options.type; }
    },
    URL: { createObjectURL() { return 'blob:login-smoke'; }, revokeObjectURL() {} },
    window: { scrollTo() {}, print() {} },
    document: {
      activeElement: null,
      body: {
        classList: { toggle() {} },
        appendChild(child) { child.parentNode = this; },
        removeChild(child) { child.parentNode = null; }
      },
      addEventListener() {},
      createElement() {
        return {
          href: '', download: '', className: '', innerHTML: '', style: {}, parentNode: null,
          click() {}, focus() {}
        };
      },
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

  return context;
}

test('login renders eight semantic role choices in three scannable groups', () => {
  const context = buildContext();
  context.state = context.freshState();
  context.state.role = null;
  const html = context.renderLogin();

  assert.equal((html.match(/data-act="role"/g) || []).length, 8);
  assert.match(html, /id="login-group-operational"/);
  assert.match(html, /id="login-group-leadership"/);
  assert.match(html, /id="login-group-external"/);

  context.ROLE_ORDER.forEach((roleKey) => {
    assert.equal((html.match(new RegExp(`data-role="${roleKey}"`, 'g')) || []).length, 1);
  });

  assert.match(html, /<main class="login-selector" id="login-workspaces">/);
  assert.match(html, /href="#login-workspaces"/);
  assert.match(html, /data-act="login-reset"/);
  assert.match(html, /Frontend-only prototype · mock data · no real authentication or backend\./);
  assert.match(html, /Recommended start/);
  assert.match(html, /Service Provider Portal — Fly Namibia/);
  assert.doesNotMatch(html, /✈️|🧭|📊|🏛️|💷|🎖️|🏢|⚙️/);
});

test('login references only present local visual assets', () => {
  const context = buildContext();
  const html = context.renderLogin();
  const assetPaths = [...html.matchAll(/src="(assets\/[^"]+)"/g)].map((match) => match[1]);

  assert.ok(assetPaths.length >= 10);
  assetPaths.forEach((assetPath) => {
    assert.equal(fs.existsSync(path.join(root, assetPath)), true, `${assetPath} should exist`);
  });
});

test('login styles include keyboard, touch, responsive and reduced-motion safeguards', () => {
  const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

  assert.match(css, /@font-face\s*{[\s\S]*DMSans-Variable\.ttf/);
  assert.match(css, /\.role-card\s*{[\s\S]*?min-height:\s*72px/);
  assert.match(css, /\.role-card:focus-visible/);
  assert.match(css, /\.login-hero__explore:focus-visible/);
  assert.match(css, /@media \(max-width: 960px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /overflow-x:\s*hidden/);
});
