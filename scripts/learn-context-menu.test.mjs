import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';

const dom = new JSDOM('<!doctype html><html lang="en"><body><div id="root"></div></body></html>', { url: 'http://localhost/learn/digestive', pretendToBeVisual: true });
const { window } = dom;
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','HTMLAnchorElement','HTMLTextAreaElement','Element','Node','DocumentFragment','MutationObserver','Event','MouseEvent','KeyboardEvent']) Object.defineProperty(globalThis, name, { configurable: true, value: name === 'window' ? window : window[name] });
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = callback => window.requestAnimationFrame(() => callback(performance.now()));
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
window.indexedDB = new IDBFactory();
let reducedMotion = true;
window.matchMedia = query => ({ get matches() { return reducedMotion && query.includes('reduced-motion'); }, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.ResizeObserver = globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLElement.prototype.getAnimations = () => [];
window.HTMLElement.prototype.scrollIntoView = function (options) { this.__scrolled = options; };
window.HTMLElement.prototype.scrollTo = function (options) { this.__scrolledTo = options; this.scrollTop = Math.max(0, options.top); this.dispatchEvent(new window.Event('scroll')); };
window.HTMLCanvasElement.prototype.getContext = () => null;
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => new Response(fs.readFileSync(path.join('public', String(url))));
const output = path.resolve('work/learn-context-menu/test.mjs');
await build({ stdin: { contents: `export { default as LearnPage } from './app/learn/page';export * from './app/learn/context-menu/context-target';export { learnSubjects } from './app/learn/subjects';export { annotationStore } from './app/notes/annotation-store';`, resolveDir: process.cwd(), sourcefile: 'context-test.tsx' }, outfile: output, tsconfig: 'tsconfig.json', bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': process.cwd() }, plugins: [{ name: 'cpu-scene-boundary', setup(build) { build.onLoad({ filter: /[\\/]app[\\/]scene\.tsx$/ }, () => ({ contents: `import {useEffect} from 'react';export default function Scene(props){globalThis.__contextScene=props;useEffect(()=>{props.onReady();props.onSettled()},[props.atlas]);return <div className="scene"><canvas/></div>}`, loader: 'tsx' })); } }] });
const api = await import(pathToFileURL(output).href);
const { createElement } = await import('react');
const { flushSync } = await import('react-dom');
const { createRoot } = await import('react-dom/client');
const root = createRoot(document.querySelector('#root'));
const menu = label => document.querySelector(`[role="menu"][aria-label="${label}"]`);
const item = (label, scope = document) => [...scope.querySelectorAll('[role="menuitem"],[role="menuitemradio"]')].find(node => node.querySelector('span')?.textContent === label);
const click = async node => { assert.ok(node, 'click target'); flushSync(() => node.click()); await delay(70); };
const key = async (node, key, options = {}) => { flushSync(() => node.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }))); await delay(30); };
const context = async (target = document.querySelector('h1'), options = {}) => {
  const event = new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 990, clientY: 710, ...options });
  flushSync(() => target.dispatchEvent(event)); await delay(40); return event;
};
const renderLearn = async () => {
  window.history.replaceState(null, '', '/learn/digestive');
  flushSync(() => root.render(createElement(api.LearnPage, { pathname: '/learn/digestive' })));
  await delay(120);
};
after(async () => { flushSync(() => root.unmount()); await api.annotationStore.dispose(); globalThis.fetch = originalFetch; window.close(); });

test('first command, actual tabs, in-place navigation and live reading sections share existing controllers', async () => {
  await renderLearn();
  assert.equal((await context()).defaultPrevented, true);
  let panel = menu('Page context menu'); assert.ok(panel);
  assert.equal(item('Digestive Model', panel).getAttribute('href'), '/learn/digestive#digestive-system-visualize');
  assert.equal(panel.querySelector('[role="menuitem"]').textContent, 'Digestive Model');
  assert.equal(panel.querySelector('.site-context-caption').textContent, 'HUMAN ATLAS');
  assert.equal(document.activeElement, panel, 'pointer open focuses container without highlighting a command');
  await click(item('Navigate', panel));
  const nav = menu('Navigate');
  assert.deepEqual([...nav.querySelectorAll('.site-context-item > span:first-child')].map(node => node.textContent), api.learnSubjects[0].tabs.map(tab => tab.title));
  assert.equal(item('General Overview', nav).getAttribute('aria-current'), 'page');
  await click(item('Deep Dive', nav));
  assert.equal(menu('Page context menu'), null);
  assert.equal(window.location.hash, '#digestive-system-deep-dive');
  assert.equal(document.querySelector('.learn-tab-trigger[aria-selected="true"]').textContent, 'Deep Dive');
  await context(); await click(item('On This Page'));
  const sections = menu('On This Page');
  const headings = [...document.querySelectorAll('.learn-article-section > h3')];
  assert.equal(sections.querySelectorAll('.site-context-item').length, headings.length);
  const heading = headings[2]; await click(item(heading.textContent, sections));
  assert.equal(document.activeElement, heading);
  assert.equal(window.location.hash, '#' + heading.id);
  assert.equal(document.querySelector('.learn-shell').__scrolledTo.behavior, 'instant');
  await context(); await click(item('Back to top'));
  assert.deepEqual(document.querySelector('.learn-shell').__scrolledTo, { top: 0, behavior: 'instant' });
  await context(); await click(item('My Notes'));
  assert.ok(document.querySelector('.notes-workspace-dialog'));
  assert.equal(window.location.pathname, '/learn/digestive');
  await click(document.querySelector('[aria-label="Close Notes"]'));
});

test('nested keyboard navigation, dismissal, positioning and shared appearance updates', async () => {
  const opener = document.querySelector('h1'); opener.tabIndex = -1; opener.focus();
  await key(opener, 'F10', { shiftKey: true });
  const panel = menu('Page context menu'); assert.ok(panel);
  await key(panel, 'Home'); assert.equal(document.activeElement.textContent, 'Digestive Model');
  await key(document.activeElement, 'End'); assert.equal(document.activeElement.getAttribute('aria-label'), 'Next page: How It Connects');
  await key(document.activeElement, 'Home'); await key(document.activeElement, 'ArrowDown');
  assert.equal(document.activeElement.querySelector('span').textContent, 'Navigate');
  await key(document.activeElement, 'ArrowRight'); assert.ok(menu('Navigate'));
  await key(document.activeElement, 'ArrowLeft'); assert.equal(menu('Navigate'), null);
  assert.equal(document.activeElement.querySelector('span').textContent, 'Navigate');
  await click(item('Appearance')); await click(item('Color Palette', menu('Appearance')));
  await click(item('Ultraviolet', menu('Color Palette')));
  assert.equal(window.localStorage.getItem('human-atlas-palette'), 'ultraviolet');
  assert.equal(document.documentElement.dataset.palette, 'ultraviolet');
  assert.equal(item('Ultraviolet', menu('Color Palette')).getAttribute('aria-checked'), 'true');
  await key(document.activeElement, 'Escape'); assert.equal(menu('Page context menu'), null); assert.equal(document.activeElement, opener);
  await context(); await click(item('Appearance')); await click(item('Light / Dark', menu('Appearance'))); await click(item('Dark', menu('Light / Dark')));
  assert.equal(window.localStorage.getItem('human-atlas-theme'), 'dark');
  assert.equal(document.documentElement.dataset.theme, 'dark');
  await key(document.activeElement, 'Escape');
  await context(); document.querySelector('.learn-shell').dispatchEvent(new window.Event('scroll')); await delay(40); assert.equal(menu('Page context menu'), null);
  await context(); window.dispatchEvent(new window.Event('resize')); await delay(40); assert.equal(menu('Page context menu'), null);
  await context(); document.body.dispatchEvent(new window.Event('pointerdown', { bubbles: true })); await delay(40); assert.equal(menu('Page context menu'), null);
  assert.deepEqual(api.positionMenu({x:990,y:710},{width:264,height:340},{width:1024,height:768}),{x:752,y:420});
  assert.deepEqual(api.positionMenu({x:900,y:710},{width:264,height:340},{width:1024,height:768},{left:760,right:1000}),{x:493,y:420});
});

test('selection, native links, editors, dialogs, study controls, images, canvases and touch remain native', async () => {
  const shell = document.querySelector('.learn-shell');
  for (const html of ['<a href="/notes">link</a>','<input>','<textarea></textarea>','<div contenteditable="true">editor</div>','<button>flashcard</button>','<canvas></canvas>','<img src="/image.webp">','<div data-context-menu="native">native</div>','<div class="learn-anatomy"><p>3D controls</p></div>']) {
    const fixture = document.createElement('div'); fixture.innerHTML = html; shell.append(fixture);
    assert.equal((await context(fixture.firstElementChild)).defaultPrevented, false, html); assert.equal(menu('Page context menu'), null); fixture.remove();
  }
  assert.equal((await context(undefined, { shiftKey: true })).defaultPrevented, false);
  const paragraph = [...document.querySelectorAll('.learn-article-section p')].find(node => node.textContent.trim()), range = document.createRange(); range.selectNodeContents(paragraph);
  window.getSelection().removeAllRanges(); window.getSelection().addRange(range); assert.ok(window.getSelection().toString().trim(), 'actual selected text'); assert.equal((await context()).defaultPrevented, false); window.getSelection().removeAllRanges();
  const dialog = document.createElement('dialog'); dialog.open = true; shell.append(dialog); assert.equal((await context()).defaultPrevented, false); dialog.remove();
  const pointer = new window.Event('pointerdown', { bubbles: true }); Object.defineProperty(pointer, 'pointerType', { value: 'touch' }); shell.dispatchEvent(pointer);
  assert.equal((await context()).defaultPrevented, false);
  const mouse = new window.Event('pointerdown', { bubbles: true }); Object.defineProperty(mouse, 'pointerType', { value: 'mouse' }); shell.dispatchEvent(mouse);
  const prevented = new window.MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }); prevented.preventDefault(); document.querySelector('h1').dispatchEvent(prevented); assert.equal(menu('Page context menu'), null);
});

test('Gallery and Study Tools expose Learn commands on passive content without stale article sections', async () => {
  for (const title of ['Gallery','Study Tools']) {
    await context(); await click(item('Navigate')); await click(item(title, menu('Navigate'))); await delay(180);
    await context(); assert.ok(menu('Page context menu')); assert.equal(item('On This Page'), undefined);
    await key(menu('Page context menu'), 'Escape');
  }
  const input = document.querySelector('.study-tools input'); if (input) assert.equal((await context(input)).defaultPrevented, false);
});

test('Digestive Model opens the existing Visualize tab in Learn and focuses its heading', async () => {
  await context();
  assert.equal(item('Digestive Model').getAttribute('href'), '/learn/digestive#digestive-system-visualize');
  await click(item('Digestive Model'));
  await delay(150);
  assert.equal(window.location.pathname, '/learn/digestive');
  assert.equal(window.location.hash, '#digestive-system-visualize');
  assert.equal(document.querySelector('.learn-tab-trigger[aria-selected="true"]').textContent, 'VisualizeNew');
  assert.equal(document.activeElement.id, 'digestive-system-visualize-heading');
  assert.ok(document.querySelector('.learn-visualize .learn-anatomy'));
  assert.equal(menu('Page context menu'), null);
  await context();
  assert.equal(item('Digestive Model').getAttribute('aria-current'), 'page');
  await key(menu('Page context menu'), 'Escape');
});

test('floating Back to top follows the Learn scroll container and shares the menu action', async () => {
  const shell = document.querySelector('.learn-shell');
  Object.defineProperty(shell, 'clientHeight', { configurable: true, value: 800 });
  Object.defineProperty(shell, 'scrollHeight', { configurable: true, value: 4000 });
  shell.scrollTop = 1600; shell.dispatchEvent(new window.Event('scroll')); await delay(80);
  const floating = document.querySelector('.learn-back-to-top'); assert.ok(floating);
  assert.equal(floating.getAttribute('aria-label'), 'Back to top');
  assert.equal(floating.querySelector('.learn-back-to-top-progress').getAttribute('stroke-dashoffset'), '50');
  await click(floating);
  assert.deepEqual(shell.__scrolledTo, { top: 0, behavior: 'instant' });
  assert.equal(document.activeElement.id, 'learn-content');
  shell.scrollTop = 0; shell.dispatchEvent(new window.Event('scroll')); await delay(80);
  assert.equal(document.querySelector('.learn-back-to-top'), null);
});

test('return-to-top animation glides, completes and yields immediately to manual scrolling', async () => {
  reducedMotion = false;
  const shell = document.querySelector('.learn-shell');
  shell.scrollTop = 1600; shell.dispatchEvent(new window.Event('scroll')); await delay(70);
  await click(document.querySelector('.learn-back-to-top'));
  assert.equal(document.querySelector('.learn-back-to-top').dataset.traveling, 'true');
  await delay(160);
  assert.ok(shell.__scrolledTo.top > 0 && shell.__scrolledTo.top < 1600);
  await delay(900);
  assert.equal(shell.__scrolledTo.top, 0);
  assert.equal(document.querySelector('.learn-back-to-top'), null);
  shell.scrollTop = 1600; shell.dispatchEvent(new window.Event('scroll')); await delay(70);
  await context(); await click(item('Back to top'));
  assert.equal(document.querySelector('.learn-back-to-top').dataset.traveling, 'true', 'RMB uses the same animation');
  shell.dispatchEvent(new window.Event('wheel')); await delay(40);
  const interrupted = shell.scrollTop; await delay(100);
  assert.equal(shell.scrollTop, interrupted);
  assert.equal(document.querySelector('.learn-back-to-top').dataset.traveling, undefined);
  reducedMotion = true;
});

test('quick navigation appears in both the reading indexes and menu footer with shared endpoint state', async () => {
  const tab = title => [...document.querySelectorAll('.learn-tab-trigger')].find(node => node.querySelector('span')?.textContent === title);
  await click(tab('General Overview'));
  assert.equal(document.querySelectorAll('.learn-tab-panel:not([hidden]) .learn-index-desktop .learn-page-arrows button').length, 2);
  await context();
  let arrows = document.querySelectorAll('.site-context-quick-nav button');
  assert.equal(arrows.length, 2); assert.equal(arrows[0].disabled, true);
  assert.equal(arrows[1].getAttribute('aria-label'), 'Next page: Deep Dive');
  await click(arrows[1]);
  assert.equal(tab('Deep Dive').getAttribute('aria-selected'), 'true');
  assert.equal(document.activeElement.id, 'digestive-system-deep-dive-heading');
  assert.equal(document.querySelector('.learn-index-desktop .learn-page-arrows button').getAttribute('aria-label'), 'Previous page: General Overview');
  await click(tab('Study Tools'));
  await context(); arrows = document.querySelectorAll('.site-context-quick-nav button');
  assert.equal(arrows[1].disabled, true);
  await key(menu('Page context menu'), 'End');
  assert.equal(document.activeElement.getAttribute('aria-label'), 'Previous page: Exam Cram');
  await key(document.activeElement, 'Escape');
});
