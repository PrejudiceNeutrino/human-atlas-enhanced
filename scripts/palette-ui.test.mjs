import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';
import { build } from 'esbuild';
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>Palette checks</title></head><body><div id="root"></div></body></html>', { url: 'http://localhost/learn/digestive', pretendToBeVisual: true });
const { window } = dom;
for (const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','HTMLAnchorElement','HTMLTextAreaElement','Element','Node','DocumentFragment','MutationObserver','Event','MouseEvent','KeyboardEvent']) Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?window:window[key]});
globalThis.indexedDB = window.indexedDB = new IDBFactory();
globalThis.getComputedStyle = window.getComputedStyle.bind(window);globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);globalThis.BASE_UI_ANIMATIONS_DISABLED=true;
window.matchMedia = query => ({ matches: query.includes('prefers-reduced-motion'), media: query, addEventListener(){}, removeEventListener(){} });
window.ResizeObserver = globalThis.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
window.HTMLElement.prototype.getAnimations = () => [];window.HTMLElement.prototype.scrollIntoView = () => {};window.HTMLCanvasElement.prototype.getContext = () => null;
let network=0;globalThis.fetch=()=>{network++;throw Error('Palette switching must not fetch anatomy or private images.');};
const { createElement, useEffect } = await import('react'), { createRoot } = await import('react-dom/client'), { flushSync } = await import('react-dom'), { default: axe } = await import('axe-core');
const output = path.resolve('work/palette-tests/ui.mjs');
await build({ absWorkingDir:process.cwd(), stdin:{contents:"export {default as LearnPage} from './app/learn/page';export {default as NotesPage} from './app/notes/page';export {DisplayControls} from './app/display-controls';export * from './app/palette-store';export * from './app/theme-store';export * from './app/theme';export * from './app/display-store';export * from './app/notes/annotation-store';",resolveDir:process.cwd()},outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},tsconfig:path.resolve('tsconfig.json'),alias:{'@':process.cwd()} });
const { LearnPage, NotesPage, DisplayControls, browserPalette, browserTheme, browserDisplay, useTheme, SCENE_THEMES, annotationStore } = await import(pathToFileURL(output).href);
const root = createRoot(document.getElementById('root'));
const click = async node => { assert.ok(node,'click target');flushSync(()=>node.click());await delay(60); };
const named = (container,label) => [...container.querySelectorAll('button')].find(node=>node.getAttribute('aria-label')===label||node.textContent.trim()===label);
const selectPalette = async (container,id) => click(container.querySelector(`input[type=radio][value="${id}"]`));
await annotationStore.initialize();
after(async()=>{flushSync(()=>root.unmount());await annotationStore.dispose();window.close();});

test('Learn and Notes expose all palettes, preserve independent Light/Dark controls and update across storage events',async()=>{
  for(const Component of [LearnPage,NotesPage]){
    flushSync(()=>{browserPalette.setPalette('classic');browserTheme.setMode('light');root.render(createElement(Component,{pathname:'/learn/digestive'}));});await delay(90);
    await click(named(document,'Appearance settings'));
    const popup=document.querySelector('.appearance-popover');assert.ok(popup);assert.equal(popup.querySelectorAll('input[type=radio]').length,4);
    assert.deepEqual([...popup.querySelectorAll('.palette-option strong')].map(node=>node.textContent),['Classic','Ignition','Ultraviolet','Iris & Ember']);
    await selectPalette(popup,'ultraviolet');assert.equal(document.documentElement.dataset.palette,'ultraviolet');assert.equal(window.localStorage.getItem('human-atlas-palette'),'ultraviolet');assert.equal(browserTheme.getSnapshot().mode,'light');
    await click(named(popup,'Dark'));assert.equal(document.documentElement.dataset.theme,'dark');assert.equal(browserPalette.getSnapshot(),'ultraviolet');
    assert.equal(popup.querySelector('input[value=ultraviolet]').checked,true);
    const result=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(issue=>issue.id),[]);
    flushSync(()=>{window.localStorage.setItem('human-atlas-palette','iris-ember');window.dispatchEvent(new window.StorageEvent('storage',{key:'human-atlas-palette',newValue:'iris-ember',storageArea:window.localStorage}));});await delay(40);
    assert.equal(browserPalette.getSnapshot(),'iris-ember');assert.equal(popup.querySelector('input[value=iris-ember]').checked,true);
    // Light/Dark lives inside Appearance; the duplicate header toggle is removed.
    assert.equal(document.querySelector('.learn-theme-trigger'),null);
    await click(named(popup,'Light'));assert.equal(browserTheme.getSnapshot().mode,'light');assert.equal(browserPalette.getSnapshot(),'iris-ember');
  }
  assert.equal(network,0);
});

test('Explore Display palette controls leave scene mode inputs, display settings and a mounted scene subscriber unchanged',async()=>{
  let mounts=0,unmounts=0,renders=0;
  function SceneProbe(){const {resolved}=useTheme();renders++;useEffect(()=>{mounts++;return()=>{unmounts++;};},[]);return createElement('div',{'data-scene-probe':JSON.stringify(SCENE_THEMES[resolved])});}
  flushSync(()=>{browserTheme.setMode('light');root.render(createElement('main',null,createElement(SceneProbe),createElement(DisplayControls)));});await delay(90);
  await click(named(document,'Display settings'));
  const popup=document.querySelector('.display-popover');assert.ok(popup);
  const scene=document.querySelector('[data-scene-probe]'),theme=browserTheme.getSnapshot(),display=browserDisplay.getSnapshot(),beforeRenders=renders;
  for(const palette of ['classic','ignition','ultraviolet','iris-ember']){
    await selectPalette(popup,palette);assert.equal(browserPalette.getSnapshot(),palette);assert.equal(document.documentElement.dataset.palette,palette);
    assert.equal(browserTheme.getSnapshot(),theme);assert.equal(browserDisplay.getSnapshot(),display);assert.equal(document.querySelector('[data-scene-probe]'),scene);assert.equal(renders,beforeRenders);assert.equal(mounts,1);assert.equal(unmounts,0);
    assert.equal(scene.dataset.sceneProbe,JSON.stringify(SCENE_THEMES.light));
  }
  assert.equal(network,0);
});
