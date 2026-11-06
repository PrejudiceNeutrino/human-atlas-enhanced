import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { JSDOM } from 'jsdom';
import { captureCameraPose, createCameraReturn } from '../app/camera-return.ts';
import { createCameraIntent } from '../app/camera-intent.ts';
import { motionProgress } from '../app/motion.ts';
import { resetViewer } from '../app/region-navigation.ts';
import { isolationCameraKey } from '../app/viewer-interaction.ts';
import { resolveVisibility } from '../app/visibility.ts';
import { explosionPlaybackAmount } from '../app/explode-playback.ts';
import { fitRegionCamera } from '../app/region-camera.ts';

const close = (actual, expected, label = 'pose') => assert.ok(actual.distanceTo(expected) < 1e-9, label);
const cameraFixture = () => {
  const camera = new T.PerspectiveCamera(34, 1.6, .005, 100), target = new T.Vector3(.3, 1.1, -.2);
  camera.position.set(-3, 2, -12); camera.setViewOffset(1440, 900, 130, -50, 1440, 900);
  const from = captureCameraPose(camera, target);
  target.set(0, .68, 0); camera.position.set(1.32, .91, 3.77); camera.clearViewOffset();
  const to = captureCameraPose(camera, target);
  return { camera, target, from, to };
};

test('Camera return starts at the current pose, travels through a safe orbit and settles exactly', () => {
  const { camera, target, from, to } = cameraFixture();
  const transition = createCameraReturn(camera, target, from, 1000, 650);
  assert.equal(transition.update(1000), false); close(camera.position, from.position); close(target, from.target);
  assert.equal(camera.view.offsetX, 130);
  let previousDistance = from.position.distanceTo(from.target);
  for (let now = 1016; now < 1650; now += 16) {
    assert.equal(transition.update(now), false);
    const distance = camera.position.distanceTo(target);
    assert.ok(distance > 0 && distance <= previousDistance + 1e-9); previousDistance = distance;
    assert.ok(camera.position.toArray().every(Number.isFinite));
  }
  assert.equal(transition.update(1650), true);
  assert.deepEqual(camera.position, to.position); assert.deepEqual(target, to.target);
  assert.equal(camera.view.enabled, false);
});

test('Rear views and yaw wrap take the short path without crossing the anatomy center', () => {
  for (const [startYaw, endYaw] of [[179, -179], [180, 0]]) {
    const camera = new T.PerspectiveCamera(), target = new T.Vector3();
    camera.position.setFromSphericalCoords(4, Math.PI / 2, T.MathUtils.degToRad(startYaw));
    const from = captureCameraPose(camera, target);
    camera.position.setFromSphericalCoords(4, Math.PI / 2, T.MathUtils.degToRad(endYaw));
    const transition = createCameraReturn(camera, target, from, 0, 650);
    transition.update(325);
    assert.ok(Math.abs(camera.position.length() - 4) < 1e-9);
    if (startYaw === 179) assert.ok(camera.position.z < -3.9);
  }
});

test('Reduced motion, late frames and an unchanged pose settle without extra motion', () => {
  for (const [time, reduced] of [[0, true], [10000, false]]) {
    const { camera, target, from, to } = cameraFixture();
    assert.equal(createCameraReturn(camera, target, from, 0, 650).update(time, reduced), true);
    assert.deepEqual(camera.position, to.position); assert.deepEqual(target, to.target);
  }
  const { camera, target } = cameraFixture();
  assert.equal(createCameraReturn(camera, target, captureCameraPose(camera, target), 0, 650).update(0), true);
});

test('Mobile projection offsets interpolate and retain the exact final framing', () => {
  const { camera, target, from } = cameraFixture();
  camera.setViewOffset(390, 844, 0, -70, 390, 844);
  const expected = camera.projectionMatrix.clone();
  const transition = createCameraReturn(camera, target, from, 0, 650);
  transition.update(325); assert.notEqual(camera.view.offsetY, -70);
  transition.update(650); assert.equal(camera.view.offsetY, -70);
  assert.deepEqual(camera.projectionMatrix, expected);
});

// Run the actual scene frame with a CPU-only camera and one picker. No WebGL,
// browser hooks or production instrumentation are required for lifecycle checks.
const source = fs.readFileSync(new URL('../app/scene.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  const animate=()=>{'), end = source.indexOf('  };animate();', start);
const interrupt = source.match(/  const interruptAssist=\(\)=>\{[^\n]+/)[0];
assert.ok(start > 0 && end > start);
const frameCode = ts.transpileModule(interrupt + '\n' + source.slice(start, end) + '\n};\nreturn {animate,interruptAssist};', {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
const makeFrame = new Function('env', `with(env){${frameCode}}`);

function sceneFixture({ isolated = false, locked = false, reduced = false, initial = false, exploded = false } = {}) {
  let clock = 1000, writes = 0, renders = 0;
  const camera = new T.PerspectiveCamera(34, 1.6, .005, 100), target = new T.Vector3(.4, 1.2, -.2);
  camera.position.set(-3, 2, -14); camera.setViewOffset(1440, 900, 120, -30, 1440, 900);
  const from = captureCameraPose(camera, target), normalTarget = new T.Vector3(0, .68, 0), normalPosition = new T.Vector3(1.32, .91, 3.77);
  const previous = { selected: [], visible: ['muscular'], isolate: isolated, isolatedPartIds: isolated ? new Set(['part']) : undefined, explode: exploded ? 1 : 0, view: 'back', rotate: false, reset: 2, breastView: 'tissue', cameraIntent: 'preset', cameraIntentRevision: 2 };
  const state = resetViewer(previous, ['muscular']);
  const picker = { position: new T.Vector3(), updateMatrix() { writes++; }, updateMatrixWorld() {} };
  const env = {
    embedded: false, latestActive: { current: true }, latestZoom: { current: 0 }, lastZoom: 0,
    T, captureCameraPose, createCameraReturn, motionProgress, resetMotion: null, assembledReturn: false, resetFade: null, frontAssist: null, assistedViewPending: null, el: { style: {} },
    explosionPlaybackAmount, latestExplodePlayback: { current: null }, latestPlaybackUpdate: { current() {} }, playbackReportRun: null, playbackReportTime: 0, playbackReportComplete: false,
    requestAnimationFrame: () => 1, performance: { now: () => clock }, document: { hidden: false },
    disposed: false, frame: 0, ready: !initial, readyReported: true, dirty: false,
    latest: { current: state }, latestLock: { current: locked }, motionMedia: { matches: reduced },
    camera, controls: { target, enableDamping: true, autoRotate: false, mouseButtons: {}, touches: {}, update() {}, },
    lastState: previous, lastReset: initial ? -1 : previous.reset, lastView: previous.view, lastIsolate: isolationCameraKey(previous, camera.aspect),
    intentRevision: previous.cameraIntentRevision, intent: createCameraIntent(), lastLocked: locked, lastOrgans: false,
    amount: previous.explode, lastExtent: previous.explode, sliderFrame: {}, explosionZoom: null,
    applyTheme() {}, applyDisplay() {}, fit() { camera.position.copy(normalPosition); target.copy(normalTarget); camera.clearViewOffset(); },
    fitExplosion() { throw Error('Reset must not animate explosion or refit its layout'); },
    atlas: { parts: [{ id: 'part', system: 'muscular' }] }, modelId: 'bp3d-male-4',
    explosionLayout: { targets: new Map(), lanes: [] }, layoutKey: 'same', explosionLayoutKey: () => 'same',
    createStableExplosionLayout() { throw Error('Unexpected packing rebuild'); }, evaluateExplosionOffset: () => [0, 0, 0],
    resolveVisibility, centers: [new T.Vector3()], data: new Float32Array([1, 2, 3, 1]), groundOffset: 0,
    selectedData: new Uint8Array(4), highlights: new Map(), selectionDuration: 120,
    markerPositions: new Float32Array(3), pickers: [picker], partTexture: {}, selectionTexture: {}, markerGeometry: { attributes: { position: {} } },
    visibilityRevision: 0, revealRenderer: { sync: () => false }, hover: {}, renderer: { domElement: { style: {} }, render() { renders++; } },
    latestRevealed: { current: true }, floorSettled: true, isOrgansPresentation: () => false, isolationCameraKey,
    motionDuration: token => token === '--motion-fast' ? 120 : token === '--motion-slow' ? 280 : 650, latestAssistedView: { current() {} }, markers: {}, latestRotation: { current: 1 }, orbitRotationSpeed: () => 0,
    rotationTime: clock, sceneFloorEligible: () => true, appliedFloorEligible: true, floor: { update: () => false }, scene: {}, targets: [],
  };
  const handlers = makeFrame(env);
  return { env, ...handlers, from, normalPosition, normalTarget, camera, target, writes: () => writes, renders: () => renders, tick(now) { clock = now; handlers.animate(); } };
}

test('Normal Reset retains its camera return, including isolation exit and locked view', () => {
  for (const options of [{}, { isolated: true }, { locked: true }]) {
    const ctx = sceneFixture(options); ctx.tick(1000);
    close(ctx.camera.position, ctx.from.position, 'first frame must not snap');
    assert.equal(ctx.env.amount, 0); assert.deepEqual([...ctx.env.data.slice(0, 3)], [0, 0, 0]);
    assert.equal(ctx.writes(), 1); assert.ok(ctx.env.resetMotion);
    ctx.tick(1250); assert.ok(ctx.camera.position.distanceTo(ctx.from.position) > .1);
    assert.equal(ctx.writes(), 1, 'camera-only frames must not rewrite part transforms');
    ctx.tick(1650); assert.equal(ctx.env.resetMotion, null);
    close(ctx.camera.position, ctx.normalPosition); close(ctx.target, ctx.normalTarget);
    assert.equal(ctx.writes(), 1); assert.equal(ctx.env.latestLock.current, !!options.locked);
  }
});

test('Exploded Reset fades the old canvas before committing one hidden reassembly and camera fit', () => {
  for (const options of [{ exploded: true }, { exploded: true, isolated: true }, { exploded: true, locked: true }]) {
    const ctx = sceneFixture(options); ctx.tick(1000);
    close(ctx.camera.position, ctx.from.position); assert.equal(ctx.writes(), 0); assert.equal(ctx.renders(), 0);
    assert.equal(ctx.env.el.style.opacity, '1'); assert.equal(ctx.env.renderer.domElement.style.pointerEvents, 'none');
    ctx.tick(1060); assert.ok(+ctx.env.el.style.opacity > 0 && +ctx.env.el.style.opacity < 1);
    assert.equal(ctx.env.amount, 1); assert.equal(ctx.writes(), 0); assert.equal(ctx.renders(), 0);
    ctx.tick(1120); assert.equal(ctx.env.el.style.opacity, '0'); assert.equal(ctx.env.amount, 0);
    assert.equal(ctx.writes(), 1); assert.equal(ctx.renders(), 1); assert.equal(ctx.env.resetMotion, null);
    close(ctx.camera.position, ctx.normalPosition); close(ctx.target, ctx.normalTarget);
    ctx.tick(1260); assert.ok(+ctx.env.el.style.opacity > 0 && +ctx.env.el.style.opacity < 1);
    assert.equal(ctx.writes(), 1); assert.equal(ctx.renders(), 1, 'opacity fade-in reuses the rendered canvas');
    ctx.tick(1400); assert.equal(ctx.env.el.style.opacity, ''); assert.equal(ctx.env.resetFade, null);
    assert.equal(ctx.env.renderer.domElement.style.pointerEvents, '');
  }
});

test('Exploded Reset handles repeated Reset, reduced motion, late frames and superseding navigation', () => {
  const repeat = sceneFixture({ exploded: true }); repeat.tick(1000); repeat.tick(1060);
  const opacity = repeat.env.el.style.opacity;
  repeat.env.latest.current = resetViewer(repeat.env.latest.current, ['muscular']); repeat.tick(1060);
  assert.equal(repeat.env.el.style.opacity, opacity); repeat.tick(1120); assert.equal(repeat.writes(), 1);
  const reduced = sceneFixture({ exploded: true, reduced: true }); reduced.tick(1000);
  assert.equal(reduced.env.resetFade, null); assert.equal(reduced.writes(), 1); close(reduced.camera.position, reduced.normalPosition);
  const changed = sceneFixture({ exploded: true }); changed.tick(1000); changed.env.motionMedia.matches = true; changed.tick(1060);
  assert.equal(changed.env.resetFade, null); assert.equal(changed.writes(), 1); assert.equal(changed.env.el.style.opacity, '');
  const late = sceneFixture({ exploded: true }); late.tick(1000); late.tick(2000);
  assert.equal(late.env.resetFade, null); assert.equal(late.writes(), 1);
  const navigation = sceneFixture({ exploded: true }); navigation.tick(1000);
  navigation.env.latest.current = { ...navigation.env.latest.current, reset: 4 }; navigation.tick(1060);
  assert.equal(navigation.env.resetFade, null); assert.equal(navigation.env.el.style.opacity, '');
  assert.equal(navigation.env.renderer.domElement.style.pointerEvents, ''); assert.equal(navigation.env.resetMotion, null);
});

test('Actual Reset skips animation on initial load/reduced motion, and finishes if reduced motion changes', () => {
  for (const options of [{ initial: true }, { reduced: true }]) {
    const ctx = sceneFixture(options); ctx.tick(1000); assert.equal(ctx.env.resetMotion, null); close(ctx.camera.position, ctx.normalPosition);
  }
  const ctx = sceneFixture(); ctx.tick(1000); ctx.tick(1200); ctx.env.motionMedia.matches = true; ctx.tick(1201);
  assert.equal(ctx.env.resetMotion, null); close(ctx.camera.position, ctx.normalPosition);
});

test('Real OrbitControls damping is drained without a reset jump or final-pose drift', () => {
 for (const exploded of [false, true]) {
  const dom = new JSDOM('<canvas></canvas>');
  const ctx = sceneFixture({ exploded }), controls = new OrbitControls(ctx.camera, dom.window.document.querySelector('canvas'));
  controls.target = ctx.target; controls.enableDamping = true; controls.dampingFactor = .085;
  // Reproduce the residual movement left by a recent orbit/pan.
  controls._sphericalDelta.theta = .4; controls._panOffset.set(.2, .1, 0); controls.update();
  const visible = captureCameraPose(ctx.camera, controls.target); ctx.env.controls = controls;
  try {
    ctx.tick(1000); close(ctx.camera.position, visible.position); close(ctx.target, visible.target);
    if (exploded) { ctx.tick(1120); close(ctx.camera.position, ctx.normalPosition, 'faded reset must fit exactly while hidden'); }
    ctx.tick(1200); ctx.tick(1650); close(ctx.camera.position, ctx.normalPosition); close(ctx.target, ctx.normalTarget);
    ctx.tick(1700); close(ctx.camera.position, ctx.normalPosition, 'residual damping must not move the finished reset');
    assert.equal(controls.enableDamping, true);
  } finally { controls.dispose(); dom.window.close(); }
 }
});

test('Repeated Reset restarts at the visible pose; user interruption keeps the current camera', () => {
  const ctx = sceneFixture(); ctx.tick(1000); ctx.tick(1200);
  const current = ctx.camera.position.clone();
  ctx.env.latest.current = resetViewer(ctx.env.latest.current, ['muscular']); ctx.tick(1200);
  close(ctx.camera.position, current, 'repeat Reset must not jump');
  ctx.tick(1300); const interrupted = ctx.camera.position.clone(); ctx.interruptAssist(); ctx.tick(1400);
  assert.equal(ctx.env.resetMotion, null); close(ctx.camera.position, interrupted, 'drag/zoom must cancel the return');
});

test('Region changes and camera presets keep their established immediate camera behavior', () => {
  for (const patch of [{ cameraIntent: 'preset' }, { cameraIntentRevision: 2 }]) {
    const ctx = sceneFixture(); Object.assign(ctx.env.latest.current, patch); ctx.tick(1000);
    assert.equal(ctx.env.resetMotion, null); close(ctx.camera.position, ctx.normalPosition);
  }
});

function playbackFixture() {
  const ctx = sceneFixture();
  const state = { ...ctx.env.lastState, explode: 0 };
  Object.assign(ctx.env, { latest: { current: state }, lastState: state, amount: 0, lastExtent: 0, lastReset: state.reset, lastView: state.view, fitExplosion() {} });
  ctx.env.intent.orbit(); // Keep the sample's customized camera during playback.
  const run = { from: 0, to: .3, start: 1000, duration: 2600, scope: {}, current: 0, cancelled: false };
  ctx.env.latestExplodePlayback.current = run;
  ctx.env.explosionLayout.targets.set('part', {});
  ctx.env.evaluateExplosionOffset = (_target, amount) => [amount, 0, 0];
  return { ...ctx, run };
}

test('Playback transforms advance on every scene frame without React amount feedback', () => {
  const ctx = playbackFixture(), reports = [];
  ctx.env.latestPlaybackUpdate.current = (_run, amount, done) => reports.push({ amount, done });
  ctx.tick(1000); ctx.tick(1016); const first = ctx.env.data[0];
  ctx.tick(1032); assert.ok(ctx.env.data[0] > first, 'second rendered frame advances before any UI report');
  assert.equal(reports.length, 0); assert.equal(ctx.env.latest.current.explode, 0);
  ctx.tick(1064); assert.equal(reports.length, 1); const previous = ctx.env.data[0];
  ctx.tick(1080); assert.ok(ctx.env.data[0] > previous, 'an unchanged React value cannot rewind playback');
  ctx.tick(2300); assert.ok(Math.abs(ctx.env.data[0] - .15) < 1e-6);
  ctx.tick(3600); assert.equal(ctx.env.amount, .3); assert.equal(reports.filter(report => report.done).length, 1);
  ctx.tick(3616); assert.equal(reports.filter(report => report.done).length, 1);
});

test('Playback pause retains the last rendered amount until React acknowledges it', () => {
  const ctx = playbackFixture(); ctx.tick(1000); ctx.tick(2300);
  const paused = ctx.env.amount; ctx.run.cancelled = true; ctx.tick(2316);
  assert.equal(ctx.env.amount, paused, 'stale UI amount must not cause a backwards jump');
  ctx.env.latest.current = { ...ctx.env.latest.current, explode: paused };
  ctx.env.latestExplodePlayback.current = null; ctx.tick(2332);
  assert.equal(ctx.env.amount, paused);
});

test('Continuous explosion frames let the existing front-camera assist finish', () => {
  const ctx = playbackFixture(); ctx.env.intent.reset();
  ctx.tick(1000); ctx.tick(1016); assert.ok(ctx.env.frontAssist);
  ctx.tick(1032); assert.ok(ctx.env.frontAssist, 'next expansion frame must not cancel its own camera assist');
});

test('A delayed React view acknowledgement cannot snap a completed camera assist backwards', () => {
  const ctx = playbackFixture(); ctx.env.intent.reset(); let fits = 0;
  ctx.env.fit = () => { fits++; };
  ctx.tick(1000); ctx.tick(1016); ctx.tick(1300);
  assert.equal(ctx.env.lastView, 'front'); assert.ok(ctx.env.assistedViewPending);
  const pose = ctx.camera.position.clone(); ctx.tick(1316);
  assert.equal(fits, 0); close(ctx.camera.position, pose);
  ctx.env.latest.current = { ...ctx.env.latest.current, view: 'front' }; ctx.tick(1332);
  assert.equal(ctx.env.assistedViewPending, null); assert.equal(fits, 0);
});

function collapseFixture(options = {}) {
  const ctx = sceneFixture(options), state = { ...ctx.env.lastState, view: 'front', explode: 0 };
  Object.assign(ctx.env, { latest: { current: state }, lastState: { ...state, explode: .3 },
    amount: .3, lastExtent: .3, lastReset: state.reset, lastView: state.view,
    fitExplosion() { ctx.camera.position.copy(ctx.target).add(new T.Vector3(0, .02, 1).normalize().multiplyScalar(7)); },
  });
  ctx.env.intent.orbit();
  return ctx;
}

test('Manual zero restores the three-quarter angle while retaining assembled zoom, pan, projection and scene state', () => {
  const ctx = collapseFixture(), state = ctx.env.latest.current, target = ctx.target.clone(), projection = ctx.camera.projectionMatrix.clone();
  let assisted;
  ctx.env.latestAssistedView.current = view => { assisted = view; };
  ctx.tick(1000);
  close(ctx.camera.position.clone().sub(ctx.target).normalize(), new T.Vector3(0, .02, 1).normalize(), 'first frame retains the restored source angle');
  assert.ok(ctx.env.assembledReturn); assert.equal(ctx.env.resetFade, null);
  ctx.tick(1325);
  assert.ok(ctx.camera.position.x > ctx.target.x);
  assert.ok(Math.abs(ctx.camera.position.distanceTo(ctx.target) - 7) < 1e-9);
  ctx.tick(1650);
  close(ctx.camera.position.clone().sub(ctx.target).normalize(), new T.Vector3(.35, .06, 1).normalize());
  close(ctx.target, target); assert.deepEqual(ctx.camera.projectionMatrix, projection);
  assert.equal(ctx.env.latest.current, state, 'no full viewer reset'); assert.equal(assisted, 'three-quarter');
  ctx.tick(1700); // React has not acknowledged the camera view yet.
  assert.equal(ctx.env.lastView, 'three-quarter'); assert.equal(ctx.env.resetMotion, null);
  ctx.env.latest.current = { ...state, view: assisted }; ctx.tick(1750);
  assert.equal(ctx.env.assistedViewPending, null);
  assert.ok(Math.abs(ctx.camera.position.distanceTo(ctx.target) - 7) < 1e-9);
});

test('Manual zero obeys reduced motion and view lock, and new input cancels its angle return', () => {
  const reduced = collapseFixture({ reduced: true }); reduced.tick(1000);
  assert.equal(reduced.env.resetMotion, null); assert.equal(reduced.env.lastView, 'three-quarter');
  const locked = collapseFixture({ locked: true }); locked.tick(1000);
  assert.equal(locked.env.resetMotion, null); assert.equal(locked.env.lastView, 'front');
  const interrupted = collapseFixture(); interrupted.tick(1000); interrupted.tick(1200);
  const pose = interrupted.camera.position.clone(); interrupted.interruptAssist(); interrupted.tick(1500);
  close(interrupted.camera.position, pose); assert.equal(interrupted.env.assembledReturn, false);
  const resumed = collapseFixture(); resumed.tick(1000); resumed.env.latest.current = { ...resumed.env.latest.current, explode: .1 }; resumed.tick(1100);
  assert.equal(resumed.env.resetMotion, null); assert.equal(resumed.env.assembledReturn, false);
});

test('Manual zero drains real OrbitControls damping without displacing its pan or final angle', () => {
  const dom = new JSDOM('<canvas></canvas>'), ctx = collapseFixture();
  const controls = new OrbitControls(ctx.camera, dom.window.document.querySelector('canvas'));
  controls.target = ctx.target; controls.enableDamping = true;
  controls._sphericalDelta.theta = .4; controls._panOffset.set(.2, .1, 0);
  ctx.env.controls = controls; const target = ctx.target.clone();
  try {
    ctx.tick(1000); ctx.tick(1650); ctx.tick(1700);
    close(ctx.target, target);
    close(ctx.camera.position.clone().sub(ctx.target).normalize(), new T.Vector3(.35, .06, 1).normalize());
    assert.ok(Math.abs(ctx.camera.position.distanceTo(ctx.target) - 7) < 1e-9);
    assert.equal(controls.enableDamping, true);
  } finally { controls.dispose(); dom.window.close(); }
});


test('embedded isolation fits every selected bound corner inside the actual canvas', () => {
  for (const [width, height] of [[340, 330], [760, 590]]) {
    const ctx = sceneFixture(), env = ctx.env;
    env.embedded = true;
    env.el.clientWidth = width; env.el.clientHeight = height;
    env.camera.aspect = width / height; env.camera.updateProjectionMatrix();
    const bounds = new T.Box3(new T.Vector3(-.03, .8, -.03), new T.Vector3(.03, 1.2, .03));
    env.bounds = [bounds];
    env.fitRegionCamera = fitRegionCamera;
    env.viewport = (w, h) => ({ left: 16, right: w - 16, top: 16, bottom: h - 16 });
    env.latest.current = { ...env.latest.current, isolate: true, isolatedPartIds: new Set(['part']), selected: ['part'], cameraIntent: 'preset', cameraIntentRevision: env.intentRevision, reset: env.lastReset, view: 'front' };
    ctx.tick(1000);
    env.camera.lookAt(env.controls.target); env.camera.updateMatrixWorld(true);
    const center = bounds.getCenter(new T.Vector3());
    assert.ok(env.controls.target.distanceTo(center) < 1e-9);
    for (let corner = 0; corner < 8; corner++) {
      const point = new T.Vector3(corner & 1 ? bounds.max.x : bounds.min.x, corner & 2 ? bounds.max.y : bounds.min.y, corner & 4 ? bounds.max.z : bounds.min.z).project(env.camera);
      const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
      assert.ok(x >= 16 && x <= width - 16 && y >= 16 && y <= height - 16, `${width}x${height}: ${x}, ${y}`);
    }
  }
});

test('actual embedded explosion fitting receives the canvas budget without full-screen panel margins', () => {
  const start = source.indexOf('  const fitExplosion='), end = source.indexOf('  const resize=', start);
  const code = ts.transpileModule(source.slice(start, end) + ';return fitExplosion;', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const createFit = new Function('env', `with(env){${code}}`);
  for (const [width, height] of [[340, 330], [760, 590]]) {
    let available;
    const camera = new T.PerspectiveCamera(34, width / height, .005, 100); camera.position.set(0, 1, 3);
    const env = { embedded: true, el: { clientWidth: width, clientHeight: height }, camera, controls: { target: new T.Vector3(0, 1, 0) }, T,
      explosionLayout: { targets: new Map([['part', {}]]), lanes: [{}] }, explosionZoom: null, sliderFrame: null, amount: 1, dirty: false,
      explosionWorldBounds: () => [[-1, 0, -.2], [1, 2, .2]], explosionProgress: () => ({ piece: 1, family: 1 }),
      explosionFitDistance: (...args) => { available = args.slice(-2); return 4; },
    };
    createFit(env)(0);
    assert.deepEqual(available, [width - 32, height - 32]);
    assert.ok(Math.abs(camera.position.distanceTo(env.controls.target) - 4) < 1e-9);
  }
});
