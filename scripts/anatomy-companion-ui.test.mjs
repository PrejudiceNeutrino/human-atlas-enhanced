import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { build } from 'esbuild';
import postcss from 'postcss';
import { JSDOM } from 'jsdom';

// Exercise the real catalogue, workspace, controls and renderer props. GPU
// rendering is deliberately replaced, so these checks do not certify WebGL.
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div><input id="outside"/></body></html>', { url: 'http://localhost/learn/digestive', pretendToBeVisual: true });
const { window } = dom;
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'Element', 'Node', 'DocumentFragment', 'MutationObserver', 'Event', 'MouseEvent', 'KeyboardEvent']) Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? window : window[key] });
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
window.matchMedia = query => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.ResizeObserver = globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLElement.prototype.getAnimations = () => [];
window.HTMLElement.prototype.scrollIntoView = () => {};
document.documentElement.style.setProperty('--motion-explode-systems', '1s');
document.documentElement.style.setProperty('--motion-explode-pieces', '1s');
const style = document.createElement('style');
// JSDOM does not compile Tailwind's custom at-rules. Load the ordinary shared
// CSS rules here; the production build separately checks the complete stylesheet.
const sharedRules = postcss.parse(fs.readFileSync('app/globals.css', 'utf8')).nodes.filter(node => node.type === 'rule').map(node => node.toString()).join('\n');
style.textContent = sharedRules + '\n' + fs.readFileSync('app/explode-playback.css', 'utf8') + '\n' + fs.readFileSync('app/learn/anatomy-companion/companion.css', 'utf8');
document.head.appendChild(style);
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => new Response(fs.readFileSync(path.join('public', String(url))));
const output = path.resolve('work/anatomy-companion-ui/viewer.mjs');
await build({ entryPoints: ['app/learn/anatomy-companion/viewer.tsx'], outfile: output, tsconfig: 'tsconfig.json', bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': process.cwd() }, plugins: [{ name: 'cpu-scene-boundary', setup(build) { build.onLoad({ filter: /[\\/]app[\\/]scene\.tsx$/ }, () => ({ contents: `import {useEffect} from 'react'; export default function Scene(props){globalThis.__learningScene=props;useEffect(()=>{const timer=setTimeout(()=>{props.onReady();props.onSettled()},0);return()=>{clearTimeout(timer);globalThis.__sceneDisposals=(globalThis.__sceneDisposals??0)+1}},[props.atlas,props.modelId]);return <div className="scene"><canvas/></div>}`, loader: 'tsx' })); } }] });
const { createElement } = await import('react');
const { flushSync } = await import('react-dom');
const { createRoot } = await import('react-dom/client');
const { default: Viewer } = await import(pathToFileURL(output).href);
const lesson = JSON.parse(fs.readFileSync('data/learn/digestive-anatomy-references.json', 'utf8'));
const root = createRoot(document.querySelector('#root'));
const scene = () => globalThis.__learningScene;
const button = label => document.querySelector(`[aria-label="${label}"]`);
const textButton = text => [...document.querySelectorAll('button')].find(element => element.textContent === text);
const render = async (key, options = {}) => {
  flushSync(() => root.render(createElement('div', { className: `learn-anatomy ${options.compact ? 'learn-anatomy--compact' : ''}` }, createElement(Viewer, { lesson, active: true, ...options, key }))));
  for (let attempt = 0; attempt < 100; attempt++) {
    await delay(20);
    if (document.querySelector('canvas') && scene()?.revealed) return;
  }
  throw new Error('Workspace did not become ready: ' + document.body.textContent);
};
const click = async element => { assert.ok(element); flushSync(() => element.click()); await delay(40); };
const key = async (target, key) => { flushSync(() => target.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }))); await delay(20); };
const selectOption = async (trigger, value) => {
  await click(trigger);
  const menu = document.querySelector('.learn-anatomy-menu[data-open]');
  assert.ok(menu);
  assert.equal(document.documentElement.hasAttribute('data-base-ui-scroll-locked'), false);
  const option = [...menu.querySelectorAll('[role="option"]')].find(option => option.getAttribute('data-value') === value);
  await click(option);
  assert.ok(!menu.isConnected || !menu.hasAttribute('data-open'));
};
const choose = conceptId => selectOption(button('Focus anatomy'), conceptId);

test('Visualize uses scoped Explore dissection, inspector, camera and reset actions', async () => {
  await render('visualize');
  assert.equal(scene().atlas.parts.length, 142);
  assert.ok(document.querySelector('.learn-viewer-visibility'));
  assert.equal(document.querySelector('.learn-viewer-inspector'), null);
  assert.equal(scene().state.explode, 0);
  await choose(lesson.structures[0].conceptId);
  assert.equal(scene().state.selected.length, 0);
  const stomach = [...scene().state.isolatedPartIds];
  assert.equal(stomach.length, 1);
  assert.equal(scene().state.isolate, true);
  assert.equal(scene().state.isolatedPartIds.size, 1);
  const stage = document.querySelector('.learn-anatomy-stage');
  flushSync(() => scene().onSelect(stomach[0]));
  await key(stage, 'h');
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.hiddenRepresentationIds.length, 1);
  assert.ok(scene().state.hiddenPartIds.has(stomach[0]));
  await key(stage, 'j');
  assert.equal(scene().state.hiddenPartIds.size, 0);
  await choose(lesson.structures[1].conceptId);
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.isolatedPartIds.size, 60);
  flushSync(() => scene().onSelect([...scene().state.isolatedPartIds][0]));
  await key(button('Focus anatomy'), 'h');
  assert.equal(scene().state.selected.length, 1, 'typing and selectors do not dispatch viewer shortcuts');
  await key(document.querySelector('#outside'), 'h');
  assert.equal(scene().state.selected.length, 1, 'reading controls outside the viewer are untouched');
  await click(textButton('Hide selectedH'));
  assert.equal(scene().state.hiddenRepresentationIds.length, 1);
  await click(textButton('Restore all hidden'));
  assert.equal(scene().state.hiddenPartIds.size, 0);
  await key(stage, 'r');
  assert.equal(scene().state.explode, 0);
  assert.equal(scene().state.isolate, false);
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.hiddenPartIds.size, 0);
  await key(stage, 'f');
  assert.equal(scene().state.view, 'front');
  await click(button('Lock view'));
  assert.equal(scene().viewLocked, true);
  await key(stage, 's');
  assert.equal(scene().state.view, 'side');
  await click(button('Unlock view'));
  assert.equal(scene().viewLocked, false);
  await click(button('Hide all systems'));
  assert.equal(scene().state.visible.length, 0);
  await click(button('Show all systems'));
  assert.ok(scene().state.visible.includes('digestive'));
});

test('opening an organ keeps natural colors and member selection independent of its visible assembly', async () => {
  await render('natural-colors');
  await choose(lesson.structures[5].conceptId);
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.isolatedPartIds.size, 56);
  assert.equal(document.querySelectorAll('.learn-viewer-members [aria-pressed="true"]').length, 0);
  assert.ok(document.querySelector('.learn-viewer-inspector-copy').textContent.includes('56 included pieces'));
  const assembly = [...scene().state.isolatedPartIds];
  await click(document.querySelector('.learn-viewer-members button'));
  assert.equal(scene().state.selected.length, 1);
  assert.deepEqual([...scene().state.isolatedPartIds], assembly);
  assert.equal(document.querySelectorAll('.learn-viewer-members [aria-pressed="true"]').length, 1);
  await click(textButton('Clear selection'));
  assert.equal(scene().state.selected.length, 0);
  assert.deepEqual([...scene().state.isolatedPartIds], assembly);

  await choose(lesson.structures[5].conceptId);
  await click(document.querySelector('.learn-anatomy-context input'));
  assert.equal(scene().state.isolate, false);
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.contextReveal.targetRepresentationIds.length, 56);
  await click(document.querySelector('.learn-anatomy-context input'));
  assert.equal(scene().state.isolate, true);
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.isolatedPartIds.size, 56);
  await click(document.querySelector('.learn-anatomy-context input'));
  await choose(lesson.structures[1].conceptId);
  assert.equal(scene().state.selected.length, 0, 'context focus also leaves the assembly unselected');
  assert.equal(scene().state.contextReveal.targetRepresentationIds.length, 60);
});

test('explosion playback and slider use the existing scene run, pause on scope change and reset', async () => {
  await render('explosion');
  const play = [...document.querySelectorAll('button')].find(element => element.getAttribute('aria-label')?.startsWith('Play expansion'));
  await click(play);
  const run = scene().explodePlayback;
  assert.ok(run);
  flushSync(() => scene().onExplodePlaybackUpdate(run, .5, false));
  assert.equal(scene().state.explode, .5);
  await click([...document.querySelectorAll('button')].find(element => element.getAttribute('aria-label') === 'Pause expansion'));
  assert.equal(scene().explodePlayback, null);
  const slider = document.querySelector('[role="slider"], input[type="range"]');
  assert.ok(slider, document.querySelector('.explode-slider').outerHTML);
  await key(slider, 'End');
  assert.equal(scene().state.explode, 1);
  await click(button('Assemble and reset'));
  assert.equal(scene().state.explode, 0);
  assert.ok(document.querySelector('.dock-reset .reset-confirmation'));
  assert.equal(document.querySelector('.explode-play svg').getAttribute('fill'), 'currentColor');
  assert.equal(document.querySelector('.slider-stage-label')?.style.left, '30%');
  await choose(lesson.structures[1].conceptId);
  await click([...document.querySelectorAll('button')].find(element => element.getAttribute('aria-label')?.startsWith('Play expansion')));
  assert.ok(scene().explodePlayback);
  await choose(lesson.structures[0].conceptId);
  assert.equal(scene().explodePlayback, null);
});

test('the compact companion shows only the requested object and explosion controls', async () => {
  const esophagus = lesson.structures[7], request = { conceptId: esophagus.conceptId, revision: 1 };
  await render('companion', { compact: true, requested: request });
  for (const selector of ['.learn-viewer-topbar', '.learn-viewer-visibility', '.learn-viewer-inspector', '.learn-viewer-camera', '.learn-anatomy-disclosure']) assert.equal(document.querySelector(selector), null);
  assert.equal(document.querySelector('.learn-viewer-workspace').dataset.visibility, 'false');
  assert.equal(document.querySelector('.learn-viewer-workspace').dataset.inspector, 'false');
  assert.equal(document.querySelector('.learn-anatomy-stage').dataset.interactive, 'true');
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.isolatedPartIds.size, 1);
  assert.equal(scene().state.isolate, true);
  const selected = scene().atlas.parts.find(part => scene().state.isolatedPartIds.has(part.id));
  assert.equal(selected.conceptId, 'FMA7131');
  assert.deepEqual(scene().state.regionFocus, selected.bounds);
  await key(document.querySelector('.learn-anatomy-stage'), 'h');
  assert.equal(scene().state.hiddenPartIds.size, 0, 'hidden controls cannot hide the requested object');
  flushSync(() => scene().onSelect(selected.id));
  assert.equal(document.querySelector('.learn-viewer-inspector'), null);
  assert.equal(scene().state.isolate, true);

  await render('companion', { compact: true, requested: { conceptId: lesson.structures[1].conceptId, revision: 2 } });
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.isolatedPartIds.size, 60);
  assert.equal(scene().state.isolate, true);
  const play = [...document.querySelectorAll('button')].find(element => element.getAttribute('aria-label')?.startsWith('Play expansion'));
  await click(play);
  const run = scene().explodePlayback;
  assert.ok(run);
  flushSync(() => scene().onExplodePlaybackUpdate(run, .5, false));
  assert.equal(scene().state.explode, .5);
  await click(button('Assemble and reset'));
  assert.equal(scene().state.explode, 0);
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.isolatedPartIds.size, 60);
  assert.equal(scene().state.isolate, true, 'reset reassembles the requested organ without showing the whole system');
  assert.equal(scene().state.isolatedPartIds.size, 60);
  assert.equal(document.querySelector('.learn-viewer-inspector'), null);
  assert.ok([...document.querySelectorAll('button')].every(element => element.closest('.learn-viewer-explode')));
  await render('companion', { compact: true, requested: { conceptId: esophagus.conceptId, revision: 3 } });
  assert.equal(scene().explodePlayback, null);
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.isolatedPartIds.size, 1);
  assert.equal(scene().state.isolate, true);
});


test('Visibility tabs remain horizontal above their content and the explosion track has explicit dimensions', async () => {
  await render('panel-layout');
  const tabs = document.querySelector('.learn-viewer-visibility-tabs');
  assert.equal(getComputedStyle(tabs).flexDirection, 'column');
  assert.equal(getComputedStyle(tabs.querySelector('[role="tablist"]')).flexDirection, 'row');
  assert.equal(getComputedStyle(tabs.querySelector('[role="tablist"]')).height, '44px');
  assert.equal(getComputedStyle(document.querySelector('[data-slot="slider-track"]')).height, '4px');
  assert.equal(button('three-quarter view').textContent, '\u00be');
  await click([...tabs.querySelectorAll('[role="tab"]')].find(element => element.textContent.startsWith('Hidden')));
  assert.equal(tabs.querySelector('[role="tab"][aria-selected="true"]').textContent, 'Hidden 0');
  for (const panel of tabs.querySelectorAll('[role="tabpanel"][hidden]')) assert.equal(getComputedStyle(panel).display, 'none');
});

test('themed anatomy menus preserve page scrolling, labels and keyboard shortcut boundaries', async () => {
  await render('selects');
  const focus = button('Focus anatomy'), shell = document.querySelector('#root');
  assert.equal(focus.querySelector('[data-slot="select-value"]').textContent, 'Complete digestive system');
  const bodyStyle = document.body.getAttribute('style'), htmlStyle = document.documentElement.getAttribute('style');
  await click(focus);
  const menu = document.querySelector('.learn-anatomy-menu[data-open]');
  assert.ok(menu);
  assert.deepEqual([...menu.querySelectorAll('[role="option"]')].map(option => option.getAttribute('data-value')), ['', ...lesson.structures.map(item => item.conceptId)]);
  assert.equal(document.body.getAttribute('style'), bodyStyle);
  assert.equal(document.documentElement.getAttribute('style'), htmlStyle);
  const wheel = new window.WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
  shell.dispatchEvent(wheel); assert.equal(wheel.defaultPrevented, false);
  await key(document.activeElement, 'Escape');
  assert.ok(!menu.hasAttribute('data-open'));
  assert.equal(document.activeElement, focus);
  const zoom = scene().zoomSteps;
  await key(focus, '+'); assert.equal(scene().zoomSteps, zoom, 'select editing never triggers scene zoom');
  await key(document.querySelector('.learn-anatomy-stage'), '/');
  assert.equal(document.activeElement, focus);
});

test('renderer failures preserve controls and Explore link and Retry remounts a single scene', async () => {
  await render('failure');
  const disposed = globalThis.__sceneDisposals ?? 0;
  flushSync(() => scene().onError('Test WebGL failure'));
  await delay(20);
  assert.ok(document.querySelector('[role="alert"]').textContent.includes('Test WebGL failure'));
  assert.ok(document.querySelector('a').href.includes('/male'));
  await click(textButton('Retry 3D'));
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.ok(globalThis.__sceneDisposals > disposed);
  assert.equal(document.querySelectorAll('canvas').length, 1);
});

after(() => { flushSync(() => root.unmount()); window.close(); globalThis.fetch = originalFetch; delete globalThis.__learningScene; delete globalThis.__sceneDisposals; });
