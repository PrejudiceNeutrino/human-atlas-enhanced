import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import * as T from 'three';
import { createStableExplosionLayout, evaluateExplosionBounds, explosionFitDistance, explosionProgress } from '../app/explosion-layout.ts';
import { DEFAULT_VISIBLE } from '../app/anatomy.ts';
import { resolveVisibility } from '../app/visibility.ts';
import { modelGrounding } from '../app/spatial-presentation.ts';

const source = fs.readFileSync(new URL('../app/scene.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  const explosionWorldBounds='), end = source.indexOf('  const resize=', start);
assert.ok(start > 0 && end > start);
const code = ts.transpileModule(source.slice(start, end) + '\nreturn fitExplosion;', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const factory = new Function('env', `with(env){${code}}`);
const distance = ctx => ctx.env.camera.position.distanceTo(ctx.env.controls.target);
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} != ${expected}`);

function fixture(file = 'atlas.json', initialDistance = 4, width = 1440, height = 900) {
  const atlas = JSON.parse(fs.readFileSync('public/models/' + file, 'utf8'));
  const state = { isolate: false, breastView: 'tissue' }, context = { selected: new Set(), systems: new Set(DEFAULT_VISIBLE) };
  const parts = atlas.parts.filter(part => resolveVisibility(part, state, context).packingEligible);
  const model = file === 'atlas.json' ? 'bp3d-male-4' : 'female-study-v3';
  const camera = new T.PerspectiveCamera(34, width / height, .005, 100), target = new T.Vector3(0, .68, 0);
  camera.position.copy(target).addScaledVector(new T.Vector3(.35, .06, 1).normalize(), initialDistance);
  const env = { T, embedded: false, camera, controls: { target, maxDistance: 40 }, el: { clientWidth: width, clientHeight: height }, groundOffset: modelGrounding(atlas.parts),
    explosionLayout: createStableExplosionLayout(parts, model), evaluateExplosionBounds, explosionFitDistance, explosionProgress,
    sliderFrame: null, explosionZoom: null, amount: 0, dirty: false };
  const fit = factory(env);
  return { env, parts, model, step(amount) { const previous = env.amount; env.amount = amount; fit(previous); },
    reanchor(turn = .1) { const radius = distance({ env }); camera.position.copy(target).addScaledVector(new T.Vector3(turn, .02, 1).normalize(), radius); env.sliderFrame = null; } };
}

for (const file of ['atlas.json', 'atlas-female-reconstructed.json']) {
  test(`${file}: expand/retract restores the assembled distance while front assist reanchors the camera`, () => {
    const ctx = fixture(file), original = distance(ctx);
    for (let percent = 1; percent <= 100; percent++) { ctx.step(percent / 100); if (percent <= 20) ctx.reanchor(.35 * (1 - percent / 20)); }
    for (let percent = 99; percent >= 0; percent--) ctx.step(percent / 100);
    close(distance(ctx), original, 'assembled scale must round-trip');
  });
}

test('Partial expansion and repeated direction changes cannot accumulate zoom drift', () => {
  const ctx = fixture(), original = distance(ctx);
  for (let cycle = 0; cycle < 12; cycle++) {
    for (const amount of [.05, .17, .3, .12, .7, .45, .3, 0]) { ctx.step(amount); if (amount > 0) ctx.reanchor(); }
    close(distance(ctx), original, 'cycle ' + cycle);
  }
});

test('Intentional user zoom/pan during expansion is retained when returning to assembled', () => {
  const ctx = fixture(); ctx.step(.3);
  const { camera, controls } = ctx.env;
  camera.position.sub(controls.target).multiplyScalar(.7).add(controls.target);
  const pan = new T.Vector3(.1, .04, -.02); camera.position.add(pan); controls.target.add(pan);
  const target = controls.target.clone(); ctx.reanchor(); ctx.step(.8); ctx.step(0);
  close(distance(ctx), 4 * .7, 'manual zoom factor'); assert.ok(controls.target.distanceTo(target) < 1e-9, 'manual pan target');
});

test('Custom initial zoom and compact viewports retain their own assembled baseline', () => {
  for (const [width, height, initialDistance] of [[1440, 900, 7], [390, 844, 9], [900, 600, 5]]) {
    const ctx = fixture('atlas.json', initialDistance, width, height); ctx.step(.3); ctx.reanchor(); ctx.step(1); ctx.step(0);
    close(distance(ctx), initialDistance, `${width}x${height}`);
  }
});

test('Changing packed membership does not redefine the assembled camera distance', () => {
  const ctx = fixture(); ctx.step(.3);
  ctx.env.explosionLayout = createStableExplosionLayout(ctx.parts.filter(part => part.system === 'muscular'), ctx.model);
  ctx.reanchor(); ctx.step(.7); ctx.step(0);
  close(distance(ctx), 4, 'membership change');
});
