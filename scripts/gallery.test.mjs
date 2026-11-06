import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const assetBase = '/images/learn/digestive/gallery';
const directory = `public${assetBase}`;
const manifest = JSON.parse(fs.readFileSync(`${directory}/gallery.json`, 'utf8'));

test('a fresh checkout includes every original figure and thumbnail in public assets', () => {
  const ids = ['a', 'p'].flatMap(prefix => Array.from({ length: 15 }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`));
  assert.equal(manifest.count, 30);
  assert.deepEqual(manifest.items.map(item => item.id), ids);
  for (const item of manifest.items) {
    assert.equal(createHash('sha256').update(fs.readFileSync(`${directory}/${item.image}`)).digest('hex'), item.sha256, item.id);
    for (const field of ['image', 'thumbnail']) {
      const bytes = fs.readFileSync(`${directory}/${item[field]}`);
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    }
  }
  assert.deepEqual(fs.readdirSync(directory).sort(), ['gallery.json', 'images', 'thumbnails']);
});

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/learn/digestive', pretendToBeVisual: true });
const { window } = dom;
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'Element', 'Node', 'DocumentFragment', 'MutationObserver', 'Event', 'MouseEvent', 'KeyboardEvent']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? window : window[key] });
}
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
window.matchMedia = query => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
window.ResizeObserver = globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLElement.prototype.getAnimations = () => [];
const originalFetch = globalThis.fetch;
let failRequest = false;
const requests = [];
globalThis.fetch = async url => {
  requests.push(url);
  assert.equal(url, `${assetBase}/gallery.json`);
  return new Response(JSON.stringify(manifest), { status: failRequest ? 503 : 200 });
};

const output = path.resolve('work/gallery-tests/page.mjs');
await build({ entryPoints: ['app/learn/gallery/page.tsx'], outfile: output, tsconfig: 'tsconfig.json', bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': process.cwd() } });
const { createElement } = await import('react');
const { flushSync } = await import('react-dom');
const { createRoot } = await import('react-dom/client');
const { default: Gallery } = await import(pathToFileURL(output).href);
const root = createRoot(document.querySelector('#root'));
const render = async key => {
  flushSync(() => root.render(createElement(Gallery, { tabId: 'digestive-system-gallery', subjectSlug: 'digestive', key })));
  await delay(60);
};
const click = async element => { flushSync(() => element.click()); await delay(60); };

test('Gallery loads without a local feature flag and filters public thumbnails', async () => {
  await render('public');
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 30);
  assert.ok(requests.length > 0);
  assert.ok(!document.body.textContent.includes('Available in local study mode'));
  for (const image of document.querySelectorAll('.learn-gallery-thumbnail img')) assert.ok(image.getAttribute('src').startsWith(`${assetBase}/thumbnails/`));
  const histology = [...document.querySelectorAll('.learn-gallery-filters button')].find(button => button.textContent.startsWith('Histology'));
  await click(histology);
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 7);
  assert.equal(histology.getAttribute('aria-pressed'), 'true');
  await click(document.querySelector('.learn-gallery-filters button'));
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 30);
});

test('public gallery failures show a retry action that restores the complete collection', async () => {
  failRequest = true;
  await render('failure');
  assert.ok(document.querySelector('[role="alert"]').textContent.includes('Gallery unavailable'));
  assert.ok(!document.body.textContent.includes('Import the supplied ZIP'));
  failRequest = false;
  await click(document.querySelector('[role="alert"] button'));
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 30);
  assert.equal(document.querySelector('[role="alert"]'), null);
});

test('the compact viewer keeps controls together and preserves details, zoom and figure navigation', async () => {
  await render('viewer');
  const opener = document.querySelector('.learn-gallery-card');
  await click(opener);
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog);
  const toolbar = dialog.querySelector('.learn-gallery-viewer-toolbar');
  assert.equal(toolbar.querySelectorAll('button').length, 9);
  assert.equal(dialog.querySelectorAll('button').length, 9);
  assert.equal(dialog.querySelector('[data-slot="dialog-title"]').textContent, manifest.items[0].title);
  const toggle = toolbar.querySelector('.learn-gallery-details-toggle');
  const details = document.getElementById(toggle.getAttribute('aria-controls'));
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(details.className, 'sr-only');
  assert.ok(details.textContent.includes(manifest.items[0].description));
  await click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(details.className, 'learn-gallery-details');
  assert.ok(details.textContent.includes('Source: Digestive.pptx'));
  await click(toolbar.querySelector('[aria-label="Zoom in"]'));
  assert.equal(toolbar.querySelector('output').textContent, '125%');
  await click(toolbar.querySelector('[title="Fit image (0)"]'));
  assert.equal(toolbar.querySelector('output').textContent, '100%');
  await click(toolbar.querySelector('[aria-label="Next figure"]'));
  assert.equal(dialog.querySelector('[data-slot="dialog-title"]').textContent, manifest.items[1].title);
  assert.equal(dialog.querySelector('.learn-gallery-details-toggle').getAttribute('aria-expanded'), 'true');
  assert.equal(dialog.querySelector('output').textContent, '100%');
  await click(dialog.querySelector('[aria-label="Close image viewer"]'));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(document.activeElement, opener);
});

const preferencesKey = 'human-atlas-gallery:v1:digestive';
const cardStar = id => [...document.querySelectorAll('.learn-gallery-card-star')].find(button => button.getAttribute('aria-label') === `Star figure: ${manifest.items.find(item => item.id === id).title}`);

test('stars do not open the viewer and the saved starred-only selection survives remounting', async () => {
  window.localStorage.clear();
  await render('star-cards');
  await click(cardStar('a01'));
  await click(cardStar('a02'));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(cardStar('a01').getAttribute('aria-pressed'), 'true');
  await click(document.querySelector('.learn-gallery-starred-filter'));
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 2);
  assert.deepEqual(JSON.parse(window.localStorage.getItem(preferencesKey)).starredIds, ['a01', 'a02']);
  await render('star-remount');
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 2);
  assert.equal(document.querySelector('.learn-gallery-starred-filter').getAttribute('aria-pressed'), 'true');
  const diagrams = [...document.querySelectorAll('.learn-gallery-filters button')].find(button => button.textContent.startsWith('Anatomical Diagrams'));
  await click(diagrams);
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 1);
  assert.ok(document.querySelector('.learn-gallery-card').textContent.includes(manifest.items[1].title));
  await click(document.querySelector('.learn-gallery-filters button'));
  const input = document.querySelector('.learn-gallery-search input');
  flushSync(() => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, 'oral');
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 1);
  assert.ok(document.querySelector('.learn-gallery-card').textContent.includes(manifest.items[1].title));
});

test('unstarring in the filtered viewer advances through starred figures and handles the last one', async () => {
  window.localStorage.setItem(preferencesKey, JSON.stringify({ version: 1, starredIds: ['a01', 'a02'], starredOnly: true }));
  await render('star-viewer');
  await click(document.querySelector('.learn-gallery-card'));
  await click(document.querySelector('.learn-gallery-viewer-actions .learn-gallery-star'));
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog);
  assert.equal(dialog.querySelector('[data-slot="dialog-title"]').textContent, manifest.items[1].title);
  assert.equal(dialog.querySelector('[aria-label="Next figure"]').disabled, true);
  await click(dialog.querySelector('.learn-gallery-star'));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 0);
  assert.ok(document.querySelector('.learn-gallery-empty').textContent.includes('No starred figures yet'));
  assert.equal(document.activeElement, document.querySelector('.learn-gallery-starred-filter'));
  await click(document.querySelector('.learn-gallery-empty button'));
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 30);
});

test('the viewer star updates the card and storage, and cross-tab preferences refresh the selection', async () => {
  window.localStorage.clear();
  await render('viewer-star-sync');
  await click(document.querySelector('.learn-gallery-card'));
  await click(document.querySelector('.learn-gallery-viewer-actions .learn-gallery-star'));
  assert.equal(document.querySelector('.learn-gallery-viewer-actions .learn-gallery-star').getAttribute('aria-pressed'), 'true');
  await click(document.querySelector('[aria-label="Close image viewer"]'));
  assert.equal(cardStar('a01').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(JSON.parse(window.localStorage.getItem(preferencesKey)).starredIds, ['a01']);
  window.localStorage.setItem(preferencesKey, JSON.stringify({ version: 1, starredIds: ['a02'], starredOnly: true }));
  flushSync(() => window.dispatchEvent(new window.StorageEvent('storage', { key: preferencesKey, storageArea: window.localStorage })));
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 1);
  assert.equal(cardStar('a02').getAttribute('aria-pressed'), 'true');
  await click(document.querySelector('.learn-gallery-card'));
  window.localStorage.setItem(preferencesKey, JSON.stringify({ version: 1, starredIds: [], starredOnly: true }));
  flushSync(() => window.dispatchEvent(new window.StorageEvent('storage', { key: preferencesKey, storageArea: window.localStorage })));
  await delay(60);
  assert.equal(document.querySelector('[role="dialog"]'), null);
  window.localStorage.setItem(preferencesKey, JSON.stringify({ version: 1, starredIds: ['a02'], starredOnly: true }));
  flushSync(() => window.dispatchEvent(new window.StorageEvent('storage', { key: preferencesKey, storageArea: window.localStorage })));
  assert.equal(document.querySelector('[role="dialog"]'), null, 'a later storage update must not reopen a dismissed figure');
});

test('unreadable and unavailable storage preserve a working session with a visible saving limit', async () => {
  window.localStorage.setItem(preferencesKey, '{broken');
  await render('corrupt-stars');
  assert.equal(document.querySelectorAll('.learn-gallery-card').length, 30);
  assert.ok(document.querySelector('.learn-gallery-preferences-error'));
  const storage = window.localStorage;
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Blocked'); } });
  try {
    await render('blocked-stars');
    await click(cardStar('a01'));
    await click(document.querySelector('.learn-gallery-starred-filter'));
    assert.equal(document.querySelectorAll('.learn-gallery-card').length, 1);
    assert.ok(document.querySelector('.learn-gallery-preferences-error').textContent.includes('could not be saved'));
  } finally {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
    storage.clear();
  }
});

after(() => { flushSync(() => root.unmount()); window.close(); globalThis.fetch = originalFetch; });
