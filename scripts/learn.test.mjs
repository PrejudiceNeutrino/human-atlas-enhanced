import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

const source = fs.readFileSync('data/learn/digestive-system-why-is-this-cool.json');
const data = JSON.parse(source);
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>Human Atlas</title></head><body><div id="root"></div></body></html>', {
  url: 'http://localhost/learn/digestive', pretendToBeVisual: true,
});
const { window } = dom;
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'DocumentFragment', 'MutationObserver', 'Event', 'MouseEvent', 'KeyboardEvent']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? window : window[key] });
}
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
window.matchMedia = query => ({
  matches: query.includes('prefers-reduced-motion'), media: query,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
});
window.ResizeObserver = globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLElement.prototype.getAnimations = () => [];
// Canvas metrics are unavailable in this DOM-only environment.
window.HTMLCanvasElement.prototype.getContext = () => null;

const { createElement } = await import('react');
const { flushSync } = await import('react-dom');
const { createRoot } = await import('react-dom/client');
const { renderToStaticMarkup } = await import('react-dom/server');
const { default: Markdown } = await import('react-markdown');
const { default: remarkGfm } = await import('remark-gfm');
const { default: axe } = await import('axe-core');
// Bundle only the page's local modules. Keep React and UI libraries external so
// tests share one React instance and never touch a running Vite server's cache.
const output = path.resolve('work/learn-tests/page.mjs');
await build({ absWorkingDir: process.cwd(), entryPoints: [path.resolve('app/learn/page.tsx')], outfile: output, tsconfig: path.resolve('tsconfig.json'), bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': process.cwd() } });
const { default: LearnPage } = await import(pathToFileURL(output).href);
const learnSubjects = [{ slug: 'digestive', href: '/learn/digestive', title: 'Digestive System' }];
const root = createRoot(document.querySelector('#root'));
const render = async pathname => {
  flushSync(() => root.render(createElement(LearnPage, { pathname, key: pathname })));
  await delay(60);
};
const triggers = () => [...document.querySelectorAll('.learn-more-trigger')];
const panels = () => [...document.querySelectorAll('.learn-more-panel')];
const normalize = text => text.replace(/\s+/g, ' ').trim();
const standardText = markdown => {
  const html = renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [remarkGfm], children: markdown }));
  return normalize(JSDOM.fragment(html).textContent);
};
const click = async button => {
  flushSync(() => button.click());
  await delay(60);
};
after(async () => {
  flushSync(() => root.unmount());
  window.close();
});

test('the supplied UTF-8 JSON is unchanged and retains entry order', () => {
  assert.equal(createHash('sha256').update(source).digest('hex'), '03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578');
  assert.deepEqual(data.sections.map(entry => entry.id), ['enteric-nervous-system', 'stomach-acidity', 'fat-lymphatic-transport']);
});

test('Learn navigation, subject registry, landing page and unknown subject', { timeout: 10000 }, async () => {
  await render('/learn');
  assert.equal(document.querySelector('h1').textContent, 'Learn');
  assert.equal(document.querySelector('[aria-label="Main navigation"] [aria-current]').textContent, 'Learn');
  for (const subject of learnSubjects) {
    assert.ok(document.querySelector(`.learn-subjects a[href="${subject.href}"]`));
    assert.equal(document.querySelector(`.learn-subject-card[href="${subject.href}"]`).textContent, subject.title);
  }
  await render('/learn/missing');
  assert.equal(document.querySelector('h1').textContent, 'Page not found');
  assert.equal(document.querySelectorAll('.learn-entry').length, 0);
  await render('/learn/digestive');
  assert.equal(document.title, 'Digestive System · Human Atlas');
  assert.equal(document.querySelector('h1').textContent, 'Digestive System');
  assert.equal(document.querySelector('.learn-section > h2').textContent, data.title);
  assert.equal(document.querySelector('.learn-subjects [aria-current]').textContent, 'Digestive');
});

test('all three entries conserve the complete Markdown text, emphasis, table and transport sequence', { timeout: 10000 }, async () => {
  await render('/learn/digestive');
  const entries = [...document.querySelectorAll('.learn-entry')];
  assert.equal(entries.length, 3);
  entries.forEach((entry, index) => {
    const sourceEntry = data.sections[index];
    assert.equal(entry.querySelector('h3').textContent, sourceEntry.title);
    assert.equal(normalize(entry.querySelector('.learn-entry-copy > .learn-markdown').textContent), standardText(sourceEntry.summary));
    assert.equal(entry.querySelector('h4').textContent, sourceEntry.moreInfoTitle);
    assert.equal(normalize(entry.querySelector('.learn-explanation .learn-markdown').textContent), standardText(sourceEntry.moreInfoMarkdown));
    assert.equal(entry.querySelector('.learn-more-trigger').textContent, 'More Info');
  });
  assert.equal(document.querySelector('em').textContent, 'enteric nervous system');
  assert.equal(entries[0].querySelector('strong').textContent, 'no remaining nerve connections to the brain or spinal cord');
  assert.deepEqual([...document.querySelectorAll('table tr')].map(row => [...row.children].map(cell => cell.textContent)), [
    ['Approximate pH comparison', 'pH'], ['Stomach acid (very acidic)', '1'], ['Lemon juice', '2.2'], ['Black coffee', '5'], ['Pure water', '7'],
  ]);
  assert.equal(document.querySelectorAll('th[scope="col"]').length, 2);
  assert.equal(document.querySelectorAll('.learn-transport-step').length, 4);
  assert.deepEqual([...document.querySelectorAll('.learn-transport-arrow')].map(node => node.textContent), ['↓', '↓', '↓']);
  assert.match(entries[1].textContent, /pH 1–2/);
  assert.match(entries[2].textContent, /Lacteals → Lymphatic vessels/);
  assert.equal(entries[2].querySelector('h5').textContent, 'Why Did This Evolve?');
});

test('explanations start collapsed and toggle independently with accessible relationships', { timeout: 10000 }, async () => {
  await render('/learn');
  await render('/learn/digestive');
  const buttons = triggers();
  assert.equal(buttons.length, 3);
  buttons.forEach((button, index) => {
    assert.equal(button.tagName, 'BUTTON');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.equal(document.getElementById(button.getAttribute('aria-controls')), panels()[index]);
    assert.ok(panels()[index].hidden);
    assert.ok(document.getElementById(button.getAttribute('aria-describedby')));
    assert.ok(document.getElementById(panels()[index].getAttribute('aria-labelledby')));
  });
  const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(new Set(ids).size, ids.length);
  buttons[0].focus();
  await click(buttons[0]);
  assert.equal(buttons[0].getAttribute('aria-expanded'), 'true');
  assert.equal(panels()[0].hidden, false);
  await click(buttons[1]);
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-expanded')), ['true', 'true', 'false']);
  await click(buttons[0]);
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-expanded')), ['false', 'true', 'false']);
  assert.equal(document.activeElement, buttons[0]);
  await click(buttons[2]);
  assert.equal(panels()[2].hidden, false);
  await click(buttons[0]);
});

test('DOM accessibility audit passes with all explanations open and with them collapsed', { timeout: 10000 }, async () => {
  // jsdom has no layout engine; contrast and real keyboard/touch behavior require a browser.
  const options = { rules: { 'color-contrast': { enabled: false } } };
  let results = await axe.run(document, options);
  assert.deepEqual(results.violations.map(({ id, description }) => ({ id, description })), []);
  for (const button of triggers()) await click(button);
  results = await axe.run(document, options);
  assert.deepEqual(results.violations.map(({ id, description }) => ({ id, description })), []);
});

test('theme switching uses the shared persisted preference', { timeout: 10000 }, async () => {
  const themeButton = document.querySelector('.learn-theme-trigger');
  const previous = document.documentElement.dataset.theme;
  await click(themeButton);
  assert.notEqual(document.documentElement.dataset.theme, previous);
  assert.equal(window.localStorage.getItem('human-atlas-theme'), document.documentElement.dataset.theme);
  await click(themeButton);
  assert.equal(document.documentElement.dataset.theme, previous);
});
