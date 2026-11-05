import type { Atlas, Part, SceneState } from '../../anatomy';
import type { CanonicalConceptId, Model, ResolvedRepresentation } from '../../identity-contracts';
import { createIdentityIndex, type IdentityIndex, type IdentitySidecar } from '../../identity-index';
import { createRegionIndex, type RegionIndex } from '../../regions';
import type { RegionDataset } from '../../region-contracts';
import type { AnatomyLesson } from './references';

export interface LearningCatalogue { model: Model; atlas: Atlas; identity: IdentityIndex; regions: RegionIndex }

export async function loadLearningCatalogue(model: Model, signal: AbortSignal): Promise<LearningCatalogue> {
  const responses = await Promise.all([model.manifestUrl, '/identity/core-crosswalk-v1.json', '/regions/canonical-regions-v1.json'].map(url => fetch(url, { signal })));
  if (responses.some(response => !response.ok)) throw new Error('The anatomy catalogue could not be loaded.');
  const [atlas, crosswalk, regions] = await Promise.all(responses.map(response => response.json())) as [Atlas, IdentitySidecar, RegionDataset];
  const identity = createIdentityIndex(model, atlas, crosswalk);
  return { model, atlas, identity, regions: createRegionIndex(regions, crosswalk, identity) };
}

/** Never resolve through labels or through another model's representation. */
export function availableRepresentations(catalogue: LearningCatalogue, conceptId: CanonicalConceptId): ResolvedRepresentation[] {
  return catalogue.identity.resolve(conceptId, catalogue.model.id).filter(({ representation: r, link }) =>
    r.modelId === catalogue.model.id && r.frameId === catalogue.model.frameId && r.available && r.vertexCount > 0 && r.indexCount > 0 &&
    !!catalogue.atlas.chunks[r.chunkIndex] && link.relation !== 'candidate' && !['candidate', 'rejected', 'unresolved'].includes(link.review.status));
}

export function partBounds(parts: readonly Part[]): [number[], number[]] | null {
  if (!parts.length) return null;
  const lower = [Infinity, Infinity, Infinity], upper = [-Infinity, -Infinity, -Infinity];
  for (const part of parts) for (let axis = 0; axis < 3; axis++) {
    lower[axis] = Math.min(lower[axis], part.bounds[0][axis]); upper[axis] = Math.max(upper[axis], part.bounds[1][axis]);
  }
  return [lower, upper];
}

export function learningScope(catalogue: LearningCatalogue, lesson: AnatomyLesson, context: boolean) {
  const digestive = new Set(catalogue.atlas.parts.filter(part => lesson.primarySystems.includes(part.system)).map(part => part.id));
  for (const reference of lesson.structures) for (const resolved of availableRepresentations(catalogue, reference.conceptId)) digestive.add(resolved.sourcePart.id);
  const included = new Set(digestive);
  if (context) for (const region of lesson.contextRegionIds) for (const resolved of catalogue.regions.representationsForRegion(region, catalogue.model.id)) {
    if (lesson.contextSystems.includes(resolved.sourcePart.system)) included.add(resolved.sourcePart.id);
  }
  const parts = catalogue.atlas.parts.filter(part => included.has(part.id));
  const chunkIds = [...new Set(parts.map(part => part.chunk))].sort((a, b) => a - b);
  // A runtime view of the existing manifest: original offsets, bytes, names, IDs and bounds stay unchanged.
  const atlas: Atlas = { ...catalogue.atlas, parts: parts.map(part => ({ ...part, chunk: chunkIds.indexOf(part.chunk) })), chunks: chunkIds.map(index => catalogue.atlas.chunks[index]) };
  return { atlas, digestive, fullBounds: partBounds(parts.filter(part => digestive.has(part.id))), chunkIds };
}

export function learningSceneState(catalogue: LearningCatalogue, scope: ReturnType<typeof learningScope>, selected: string[], focus: [number[], number[]] | null, context: boolean, reset: number, view: SceneState['view'], intent: 'reset' | 'preset'): SceneState {
  const targets = selected.length ? selected : [...scope.digestive];
  return {
    breastView: 'tissue', explode: 0, visible: [...new Set(scope.atlas.parts.map(part => part.system))], selected, isolate: false,
    view, rotate: false, reset, cameraIntentRevision: reset, cameraIntent: intent, regionPartIds: new Set(scope.atlas.parts.map(part => part.id)), regionFocus: focus ?? scope.fullBounds,
    contextReveal: context ? { mode: 'context', modelId: catalogue.model.id, targetRepresentationIds: targets.flatMap(id => {
      const representation = catalogue.identity.representationForPart(id); return representation ? [representation.id] : [];
    }) } : undefined,
  };
}
