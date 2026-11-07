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
  assert.deepEqual(fs.readdirSync(directory).sort(), ['gallery.json', 'images', 'label-practice.json', 'thumbnails']);
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
let annotationResponse = 'valid';
const requests = [];
globalThis.fetch = async url => {
  requests.push(url);
  if (url === `${assetBase}/label-practice.json`) {
    const data = JSON.parse(fs.readFileSync(`${directory}/label-practice.json`, 'utf8'));
    if (annotationResponse === 'stale') data.figures.find(figure => figure.figureId === 'a02').sourceImageSha256 = '0'.repeat(64);
    return new Response(JSON.stringify(data), { status: annotationResponse === 'missing' ? 404 : annotationResponse === 'failure' ? 503 : 200 });
  }
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
const click = async element => { flushSync(() => typeof element.click === 'function' ? element.click() : element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))); await delay(60); };

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

const buttonNamed = text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text);
const setValue = async (element, value) => {
  flushSync(() => {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set.call(element, value);
    element.dispatchEvent(new window.Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
  await delay(20);
};
const loadImage = () => flushSync(() => document.querySelector('.learn-gallery-image-space img').dispatchEvent(new window.Event('load')));

test('Label Practice reveals, hides and resets grouped covers without changing stars or study progress', async () => {
  window.localStorage.clear();
  window.localStorage.setItem(preferencesKey, JSON.stringify({ version: 1, starredIds: ['a02', 'a03'], starredOnly: true }));
  window.localStorage.setItem('human-atlas-study-progress:test', 'preserve');
  const storageBefore = JSON.stringify(Object.entries(window.localStorage));
  const fetchCount = requests.filter(url => url.endsWith('label-practice.json')).length;
  await render('practice');
  assert.equal(requests.filter(url => url.endsWith('label-practice.json')).length, fetchCount, 'sidecar is lazy');
  await click(document.querySelector('.learn-gallery-card'));
  loadImage();
  assert.equal(document.querySelector('.label-practice-overlay'), null);
  assert.equal(document.querySelector('[aria-label="Edit label masks"]'), null, 'production-style bundle has no curator');
  await click(document.querySelector('[aria-label="Label Practice"]'));
  assert.equal(document.querySelectorAll('[data-practice-label]').length, 11);
  assert.equal(document.querySelectorAll('[data-revealed=true]').length, 0);
  assert.ok(document.querySelector('.learn-gallery-image-space img').alt.includes('numbered covers'));
  for (const mask of document.querySelectorAll('[data-practice-label]')) assert.match(mask.getAttribute('aria-label'), /^Reveal label \d+$/);
  await click(document.querySelector('[data-practice-label]'));
  assert.match(document.querySelector('[data-practice-label]').getAttribute('aria-label'), /Uvula/);
  assert.equal(document.querySelectorAll('[data-revealed=true]').length, 1);
  await click(buttonNamed('Hide All'));
  assert.equal(document.querySelectorAll('[data-revealed=true]').length, 0);
  const grouped = document.querySelectorAll('[data-practice-label]')[2];
  await click(grouped);
  assert.equal(grouped.querySelectorAll('rect[fill=transparent]').length, 2, 'one answer reveals both repeated terms');
  await click(buttonNamed('Reveal All'));
  assert.equal(document.querySelectorAll('[data-revealed=true]').length, 11);
  await click(buttonNamed('Reset Practice'));
  await click(buttonNamed('Label list'));
  assert.equal(document.querySelectorAll('.label-practice-list button').length, 11);
  const first = document.querySelector('[data-practice-label]');
  flushSync(() => first.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
  assert.equal(first.dataset.revealed, 'true');
  await click(document.querySelector('[aria-label="Figure details"]'));
  assert.ok(document.querySelector('.learn-gallery-details').textContent.includes('Source:'));
  await click(document.querySelector('[aria-label="Next figure"]'));
  loadImage();
  assert.equal(document.querySelectorAll('[data-practice-label]').length, 27);
  assert.equal(document.querySelectorAll('[data-revealed=true]').length, 0);
  await click(document.querySelector('[aria-label="Label Practice"]'));
  assert.equal(document.querySelector('.label-practice-overlay'), null);
  assert.equal(JSON.stringify(Object.entries(window.localStorage)), storageBefore);
  await click(document.querySelector('[aria-label="Close image viewer"]'));
});

test('optional Identify distinguishes correct and assisted answers and preserves typing shortcuts', async () => {
  window.localStorage.clear();
  await render('identify');
  await click(document.querySelectorAll('.learn-gallery-card')[1]); loadImage();
  await click(document.querySelector('[aria-label="Label Practice"]'));
  await click([...document.querySelectorAll('.label-practice-controls label')].find(label => label.textContent === 'Identify').querySelector('input'));
  await click(document.querySelector('[data-practice-label]'));
  const input = document.querySelector('[aria-label="Anatomical term"]');
  await setValue(input, 'uv');
  flushSync(() => input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  assert.ok(document.querySelector('.label-practice-identify').textContent.includes('Not a match'));
  assert.equal(document.querySelector('[data-practice-label]').dataset.revealed, 'false');
  await setValue(input, '  UVULA  ');
  flushSync(() => input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  assert.ok(document.querySelector('.label-practice-controls [role=status]').textContent.includes('1 identified'));
  await click(buttonNamed('Reset Practice'));
  await setValue(document.querySelector('[aria-label="Label to identify"]'), document.querySelector('[data-practice-label]').dataset.practiceLabel);
  await click(buttonNamed('Reveal Answer'));
  await setValue(input, 'uvula');
  flushSync(() => input.form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  assert.ok(document.querySelector('.label-practice-identify').textContent.includes('assisted'));
  assert.ok(document.querySelector('.label-practice-controls [role=status]').textContent.includes('0 identified'));
  flushSync(() => input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  assert.equal(document.querySelector('[data-slot="dialog-title"]').textContent, manifest.items[1].title);
  await click(document.querySelector('[aria-label="Close image viewer"]'));
});

test('missing, unavailable and stale sidecars leave ordinary inspection and stars working', async () => {
  for (const response of ['missing', 'failure', 'stale']) {
    annotationResponse = response;
    await render(response);
    await click(document.querySelectorAll('.learn-gallery-card')[1]); loadImage();
    if (response === 'missing') assert.equal(document.querySelector('[aria-label="Label Practice"]'), null);
    else {
      await click(document.querySelector('[aria-label="Label Practice"]'));
      assert.match(document.querySelector('.label-practice-note').textContent, response === 'stale' ? /image has changed/ : /unavailable/);
    }
    assert.equal(document.querySelector('.label-practice-overlay'), null);
    const star = document.querySelector('.learn-gallery-viewer-actions .learn-gallery-star');
    const before = star.getAttribute('aria-pressed');
    await click(star);
    assert.notEqual(star.getAttribute('aria-pressed'), before);
    await click(document.querySelector('[aria-label="Close image viewer"]'));
  }
  annotationResponse = 'valid';
});

after(() => { flushSync(() => root.unmount()); window.close(); globalThis.fetch = originalFetch; });
