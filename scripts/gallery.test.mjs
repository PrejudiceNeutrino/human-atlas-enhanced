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

after(() => { flushSync(() => root.unmount()); window.close(); globalThis.fetch = originalFetch; });
