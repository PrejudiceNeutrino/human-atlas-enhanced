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
    if (document.querySelector('canvas') && button('Zoom in') && !button('Zoom in').disabled) return;
  }
  throw new Error('Workspace did not become ready: ' + document.body.textContent);
};
const click = async element => { assert.ok(element); flushSync(() => element.click()); await delay(40); };
const key = async (target, key) => { flushSync(() => target.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }))); await delay(20); };
const choose = async conceptId => { const select = document.querySelector('.learn-anatomy-controls label:last-child select'); flushSync(() => { select.value = conceptId; select.dispatchEvent(new window.Event('change', { bubbles: true })); }); await delay(30); };

test('Visualize uses scoped Explore dissection, inspector, camera and reset actions', async () => {
  await render('visualize');
  assert.equal(scene().atlas.parts.length, 142);
  assert.ok(document.querySelector('.learn-viewer-visibility'));
  assert.equal(document.querySelector('.learn-viewer-inspector'), null);
  assert.equal(scene().state.explode, 0);
  await choose(lesson.structures[0].conceptId);
  const stomach = [...scene().state.selected];
  assert.equal(stomach.length, 1);
  assert.equal(scene().state.isolate, true);
  assert.equal(scene().state.isolatedPartIds.size, 1);
  const stage = document.querySelector('.learn-anatomy-stage');
  await key(stage, 'h');
  assert.equal(scene().state.selected.length, 0);
  assert.equal(scene().state.hiddenRepresentationIds.length, 1);
  assert.ok(scene().state.hiddenPartIds.has(stomach[0]));
  await key(stage, 'j');
  assert.equal(scene().state.hiddenPartIds.size, 0);
  await choose(lesson.structures[1].conceptId);
  assert.equal(scene().state.selected.length, 60);
  await key(document.querySelector('select'), 'h');
  assert.equal(scene().state.selected.length, 60, 'typing and selectors do not dispatch viewer shortcuts');
  await key(document.querySelector('#outside'), 'h');
  assert.equal(scene().state.selected.length, 60, 'reading controls outside the viewer are untouched');
  await click(textButton('Hide selectedH'));
  assert.equal(scene().state.hiddenRepresentationIds.length, 60);
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

test('the companion starts at the requested real assembly and supports the same controls and model changes', async () => {
  const esophagus = lesson.structures[7], request = { conceptId: esophagus.conceptId, revision: 1 };
  await render('companion', { compact: true, requested: request });
  assert.equal(document.querySelector('.learn-viewer-visibility'), null);
  assert.ok(document.querySelector('.learn-viewer-inspector'));
  assert.equal(scene().state.selected.length, 1);
  assert.equal(scene().state.isolate, true);
  const selected = scene().atlas.parts.find(part => part.id === scene().state.selected[0]);
  assert.equal(selected.conceptId, 'FMA7131');
  assert.deepEqual(scene().state.regionFocus, selected.bounds);
  await click(textButton('Visibility0 hidden'));
  assert.ok(document.querySelector('.learn-viewer-visibility'));
  await key(document.querySelector('.learn-anatomy-stage'), 'h');
  assert.equal(scene().state.hiddenPartIds.size, 1);
  await key(document.querySelector('.learn-anatomy-stage'), 'j');
  assert.equal(scene().state.hiddenPartIds.size, 0);
  const context = document.querySelector('.learn-anatomy-context input');
  await click(context);
  assert.equal(scene().atlas.parts.length, 266);
  assert.equal(scene().state.isolate, false);
  assert.equal(scene().state.contextReveal.targetRepresentationIds.length, 142);
  await render('companion', { compact: true, requested: { conceptId: esophagus.conceptId, revision: 2 } });
  assert.equal(scene().state.isolate, false);
  assert.equal(scene().state.selected.length, 1);
  assert.equal(scene().state.contextReveal.targetRepresentationIds.length, 1);
  const model = document.querySelector('.learn-anatomy-controls label:first-child select');
  flushSync(() => { model.value = 'female-study-v3'; model.dispatchEvent(new window.Event('change', { bubbles: true })); });
  await delay(150);
  assert.equal(scene().modelId, 'female-study-v3');
  assert.equal(scene().state.isolate, true);
  assert.ok(scene().state.isolatedRepresentationIds.every(id => id.includes('female-study-v3')));
  assert.equal(scene().state.hiddenPartIds.size, 0);
  assert.ok(document.querySelector('.learn-anatomy-disclosure').textContent.includes('estimated proportions'));
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
