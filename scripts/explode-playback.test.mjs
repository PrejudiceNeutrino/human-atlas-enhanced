import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { nextExplosionStop, explosionPlaybackDuration, explosionPlaybackAmount } from '../app/explode-playback.ts';

test('Playback chooses the real 30% and 100% stops, with a single-family fallback', () => {
  for (const amount of [0, .17, .29]) assert.equal(nextExplosionStop(amount, 6), .3);
  for (const amount of [.3, .6, 1]) assert.equal(nextExplosionStop(amount, 6), 1);
  for (const count of [0, 1]) assert.equal(nextExplosionStop(0, count), 1);
  assert.equal(explosionPlaybackDuration(0, .3, 2600, 6), 2600);
  assert.equal(explosionPlaybackDuration(.3, 1, 4200, 6), 4200);
  assert.equal(explosionPlaybackDuration(0, 1, 4200, 1), 4200);
  assert.equal(explosionPlaybackDuration(.17, .3, 0, 6), 0);
});

test('Playback interpolation is monotonic, smooth at either end, and lands exactly without overshoot', () => {
  for (const [from, to, duration] of [[0, .3, 2600], [.17, .3, 1200], [.3, 1, 4200]]) {
    let previous = from;
    for (let time = 0; time <= duration; time += 16) {
      const value = explosionPlaybackAmount(from, to, time, duration);
      assert.ok(value >= previous && value <= to); previous = value;
    }
    assert.equal(explosionPlaybackAmount(from, to, duration, duration), to);
    assert.equal(explosionPlaybackAmount(from, to, duration * 10, duration), to);
    assert.equal(explosionPlaybackAmount(from, to, 0, 0), to);
    assert.ok(explosionPlaybackAmount(from, to, 1, duration) - from < (to - from) / duration);
  }
});

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/male', pretendToBeVisual: true });
const { window } = dom;
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Event']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? window : window[key] });
}
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
let animationFrames = 0, reduced = false, hidden = false;
globalThis.requestAnimationFrame = window.requestAnimationFrame = () => ++animationFrames;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame = () => {};
Object.defineProperty(window.document, 'hidden', { configurable: true, get: () => hidden });
const mediaListeners = new Set();
const media = { get matches() { return reduced; }, addEventListener: (_event, listener) => mediaListeners.add(listener), removeEventListener: (_event, listener) => mediaListeners.delete(listener) };
window.matchMedia = () => media;
const css = fs.readFileSync('app/globals.css', 'utf8');
for (const token of ['--motion-explode-systems', '--motion-explode-pieces']) {
  window.document.documentElement.style.setProperty(token, css.match(new RegExp(token + ':([^;]+);'))[1]);
}

const { createElement, useState } = await import('react');
const { flushSync } = await import('react-dom');
const { createRoot } = await import('react-dom/client');
const output = path.resolve('work/explode-playback-tests/hook.mjs');
await build({ absWorkingDir: process.cwd(), entryPoints: [path.resolve('app/use-explode-playback.ts')], outfile: output, tsconfig: path.resolve('tsconfig.json'), bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const { useExplodePlayback } = await import(pathToFileURL(output).href);
const root = createRoot(document.querySelector('#root'));
let controls, updates = [], mount = 0, scope = {};
function Harness({ familyCount = 6, enabled = true, scope }) {
  const [amount, setAmount] = useState(0);
  const playback = useExplodePlayback({ amount, familyCount, enabled, scope, onChange: value => { updates.push(value); setAmount(value); } });
  controls = { amount, setAmount, playback };
  return createElement('button', { onClick: playback.toggle, 'aria-pressed': playback.playing }, playback.playing ? 'Pause' : 'Play');
}
function setup(options = {}) {
  flushSync(() => root.render(null));
  reduced = false; hidden = false; animationFrames = 0; updates = []; scope = {}; mount++;
  flushSync(() => root.render(createElement(Harness, { key: mount, scope, ...options })));
}
const invoke = fn => flushSync(fn);
after(() => { flushSync(() => root.unmount()); dom.window.close(); });

test('Play emits a renderer command, stops at 30%, then emits the 100% stage without another frame loop', () => {
  setup(); invoke(() => controls.playback.toggle());
  const first = controls.playback.run;
  assert.equal(first.to, .3); assert.equal(first.duration, 2600); assert.equal(controls.playback.playing, true);
  assert.equal(animationFrames, 0, 'the scene must be the sole animation clock');
  invoke(() => controls.playback.update(first, .15, false)); assert.equal(controls.amount, .15);
  invoke(() => controls.playback.update(first, .3, true)); assert.equal(controls.amount, .3); assert.equal(controls.playback.playing, false);
  invoke(() => controls.playback.toggle()); const second = controls.playback.run;
  assert.equal(second.from, .3); assert.equal(second.to, 1); assert.equal(second.duration, 4200);
  invoke(() => controls.playback.update(second, 1, true)); assert.equal(controls.amount, 1); assert.equal(controls.playback.playing, false);
  const count = updates.length; invoke(() => controls.playback.toggle()); assert.equal(updates.length, count);
});

test('Pause uses the renderer pose, and cancelled updates cannot rewind Reset or manual slider input', () => {
  setup(); invoke(() => controls.playback.toggle()); const run = controls.playback.run;
  run.current = .17; // Rendered amount can be newer than the percentage/React state.
  invoke(() => controls.playback.toggle()); assert.equal(controls.amount, .17); assert.equal(run.cancelled, true);
  invoke(() => controls.playback.update(run, .29, false)); assert.equal(controls.amount, .17);
  invoke(() => controls.playback.toggle()); const resumed = controls.playback.run; assert.equal(resumed.to, .3); assert.equal(resumed.from, .17);
  invoke(() => { controls.playback.stop(false); controls.setAmount(0); });
  invoke(() => controls.playback.update(resumed, .3, true)); assert.equal(controls.amount, 0);
});

test('Scope and readiness changes invalidate playback before stale progress can affect the next view', () => {
  setup(); invoke(() => controls.playback.toggle()); const old = controls.playback.run;
  scope = {}; invoke(() => root.render(createElement(Harness, { key: mount, scope })));
  assert.equal(controls.playback.run, null); assert.equal(old.cancelled, true);
  invoke(() => controls.playback.update(old, .3, true)); assert.equal(controls.amount, 0);
  invoke(() => controls.playback.toggle()); const next = controls.playback.run;
  invoke(() => root.render(createElement(Harness, { key: mount, scope, enabled: false })));
  assert.equal(controls.playback.run, null); assert.equal(next.cancelled, true);
});

test('Reduced motion advances directly to each stop and can finish an active stage', () => {
  setup(); reduced = true;
  invoke(() => controls.playback.toggle()); assert.equal(controls.amount, .3); assert.equal(controls.playback.run, null);
  invoke(() => controls.playback.toggle()); assert.equal(controls.amount, 1);
  setup(); invoke(() => controls.playback.toggle()); reduced = true;
  invoke(() => { for (const listener of mediaListeners) listener(); });
  assert.equal(controls.amount, .3); assert.equal(controls.playback.run, null);
});

test('Single-family playback skips the systems stop; blur, hidden tabs and unmount pause safely', () => {
  setup({ familyCount: 1 }); invoke(() => controls.playback.toggle()); let run = controls.playback.run;
  assert.equal(run.to, 1); run.current = .42;
  invoke(() => window.dispatchEvent(new window.Event('blur'))); assert.equal(controls.amount, .42); assert.equal(controls.playback.playing, false);
  invoke(() => controls.playback.toggle()); run = controls.playback.run; run.current = .5; hidden = true;
  invoke(() => document.dispatchEvent(new window.Event('visibilitychange'))); assert.equal(controls.amount, .5); assert.equal(controls.playback.playing, false);
  hidden = false; invoke(() => controls.playback.toggle()); run = controls.playback.run;
  invoke(() => root.render(null)); assert.equal(run.cancelled, true); assert.equal(mediaListeners.size, 0);
});
