import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
const output = path.resolve('work/anatomy-companion/model.mjs');
await build({ absWorkingDir: process.cwd(), stdin: { contents: "export * from './app/learn/anatomy-companion/model';export * from './app/learn/anatomy-companion/references';export * from './app/model-registry';export * from './app/identity-index';export * from './app/regions';export {canonicalExploreSelection} from './app/viewer-interaction';", resolveDir: process.cwd() }, outfile: output, bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const { anatomyLessons: [lesson], MODEL_REGISTRY, createIdentityIndex, createRegionIndex, availableRepresentations, learningScope, learningSceneState, partBounds, canonicalExploreSelection } = await import(pathToFileURL(output).href);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sidecar = read('public/identity/core-crosswalk-v1.json'), regions = read('public/regions/canonical-regions-v1.json');
const catalogues = ['bp3d-male-4', 'female-study-v3'].map(id => {
  const model = MODEL_REGISTRY[id], atlas = read(`public${model.manifestUrl}`), identity = createIdentityIndex(model, atlas, sidecar);
  return { model, atlas, identity, regions: createRegionIndex(regions, sidecar, identity) };
});

test('all eight references resolve through pinned canonical IDs to their actual model-specific representations', () => {
  const sources = ['FMA7148', 'FMA7197', 'FMA7202', 'FMA7198', 'FMA7206', 'FMA7200', 'FMA7201', 'FMA7131'];
  assert.equal(lesson.structures.length, 8);
  const article = read('data/learn/digestive-system-deep-dive.json');
  for (const catalogue of catalogues) lesson.structures.forEach((reference, index) => {
    assert.ok(article.sections.some(section => section.id === reference.sectionId));
    assert.equal(catalogue.identity.sourceConceptCanonicalId(sources[index]), reference.conceptId);
    const resolved = availableRepresentations(catalogue, reference.conceptId);
    assert.ok(resolved.length > 0, `${catalogue.model.id}/${reference.label}`);
    assert.ok(resolved.every(item => item.representation.modelId === catalogue.model.id && item.representation.frameId === catalogue.model.frameId));
    assert.equal(new Set(resolved.map(item => item.representation.id)).size, resolved.length);
    const bounds = partBounds(resolved.map(item => item.sourcePart));
    assert.ok(bounds.flat().every(Number.isFinite));
    assert.deepEqual(canonicalExploreSelection(catalogue.atlas, catalogue.identity, reference.conceptId).elements, resolved.map(item => item.sourcePart.id));
  });
});

test('scope views retain original offsets/bounds, fetch only needed original chunks and do not mutate source manifests', () => {
  for (const catalogue of catalogues) {
    const before = JSON.stringify(catalogue.atlas), scope = learningScope(catalogue, lesson, false), context = learningScope(catalogue, lesson, true);
    assert.ok(scope.atlas.parts.length < catalogue.atlas.parts.length);
    assert.ok(scope.atlas.chunks.length < catalogue.atlas.chunks.length);
    assert.ok(context.atlas.parts.length > scope.atlas.parts.length);
    for (const part of context.atlas.parts) {
      const source = catalogue.atlas.parts.find(item => item.id === part.id);
      for (const key of ['positions', 'normals', 'indices', 'vertexCount', 'indexCount', 'bounds']) assert.deepEqual(part[key], source[key]);
      assert.deepEqual(context.atlas.chunks[part.chunk], catalogue.atlas.chunks[source.chunk]);
    }
    for (const part of scope.atlas.parts) assert.ok(context.atlas.parts.some(item => item.id === part.id));
    assert.equal(JSON.stringify(catalogue.atlas), before);
    const bytes = scope.atlas.chunks.reduce((sum, chunk) => sum + (chunk.gzipBytes ?? chunk.bytes), 0);
    console.log(`${catalogue.model.id}: ${scope.atlas.parts.length} parts / ${scope.atlas.chunks.length} chunks / ${(bytes / 1e6).toFixed(2)} MB compressed; context ${context.atlas.parts.length} parts`);
  }
});

test('unavailable, candidate and foreign-model requests return no substitute; context is presentation-only', () => {
  const catalogue = catalogues[0], conceptId = lesson.structures[0].conceptId, resolved = availableRepresentations(catalogue, conceptId);
  assert.deepEqual(availableRepresentations({ ...catalogue, identity: { ...catalogue.identity, resolve: () => [] } }, conceptId), []);
  assert.deepEqual(availableRepresentations({ ...catalogue, model: catalogues[1].model }, conceptId), []);
  assert.deepEqual(availableRepresentations({ ...catalogue, identity: { ...catalogue.identity, resolve: () => resolved.map(item => ({ ...item, link: { ...item.link, relation: 'candidate' } })) } }, conceptId), []);
  assert.equal(canonicalExploreSelection(catalogue.atlas, catalogue.identity, 'Stomach'), null);
  assert.equal(canonicalExploreSelection(catalogue.atlas, catalogue.identity, 'atlas:concept:missing'), null);
  const scope = learningScope(catalogue, lesson, true), selected = resolved.map(item => item.sourcePart.id), focus = partBounds(resolved.map(item => item.sourcePart));
  const state = learningSceneState(catalogue, scope, selected, focus, true, 3, 'front', 'preset');
  assert.deepEqual(state.regionFocus, focus); assert.deepEqual(state.selected, selected); assert.equal(state.isolate, false); assert.equal(state.rotate, false);
  assert.deepEqual(state.contextReveal.targetRepresentationIds, resolved.map(item => item.representation.id));
  const complete = learningSceneState(catalogue, scope, [], null, false, 4, 'three-quarter', 'reset');
  assert.deepEqual(complete.regionFocus, scope.fullBounds); assert.equal(complete.contextReveal, undefined); assert.deepEqual(complete.selected, []);
});
