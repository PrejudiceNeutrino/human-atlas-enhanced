import type {Atlas, Part, SystemId} from './anatomy';

/** Internal IDs are pinned in a versioned sidecar. Display names never create IDs. */
export type CanonicalConceptId = `atlas:concept:${string}`;
export type RepresentationId = `atlas:representation:${string}`;
export type ModelId = 'bp3d-male-4'|'hra-female-v1.5'|'female-study-v3';
export type GeometrySetId = `atlas:geometry:${string}`;
export type ExternalNamespace = 'FMA'|'UBERON'|'BP3D-part'|'HRA-node'|'Z-Anatomy'|'MVMT'|'other';
export type ReviewStatus = 'source-derived'|'candidate'|'reviewed'|'rejected'|'unresolved';
export type LinkRelation = 'exact'|'part-of'|'context'|'candidate';
export type Laterality = 'left'|'right'|'midline'|'bilateral'|'unknown';

export interface EvidenceRef {
 sourceId: string;
 sourcePath?: string;
 sourceRevision?: string;
 note?: string;
}
export interface ReviewState {
 status: ReviewStatus;
 reviewer?: string;
 reviewedAt?: string;
 note?: string;
}
export interface ExternalId {
 namespace: ExternalNamespace;
 value: string;
 relation: 'exact'|'broader'|'narrower'|'related'|'candidate';
 evidence: EvidenceRef;
 review: ReviewState;
}
export interface AnatomicalConcept {
 id: CanonicalConceptId;
 externalIds: ExternalId[];
 /** Phase 1 deliberately leaves knowledge/terminology content in source manifests. */
 preferredName?: string;
 textOnly?: boolean;
 review: ReviewState;
}
export interface Model {
 id: ModelId;
 displayLabel: string;
 sex: 'male'|'female';
 kind: 'reference'|'study';
 manifestUrl: string;
 frameId: string;
 sourceDatasetIds: readonly string[];
 availableSystems: readonly SystemId[];
 geometrySetIds: readonly GeometrySetId[];
 mappingRevision: string;
 review: ReviewState;
 experimental: boolean;
 route: '/male'|'/female'|null;
}
export interface GeometrySet {
 id: GeometrySetId;
 modelId: ModelId;
 frameId: string;
 sourceDatasetIds: readonly string[];
 fidelity: 'source-derived'|'adapted-study'|'schematic'|'projected';
 licenseIds: readonly string[];
 review: ReviewState;
}
export interface ConceptRepresentationLink {
 conceptId: CanonicalConceptId;
 representationId: RepresentationId;
 relation: LinkRelation;
 evidence: EvidenceRef;
 review: ReviewState;
}
export interface MeshRepresentation {
 id: RepresentationId;
 modelId: ModelId;
 geometrySetId: GeometrySetId;
 frameId: string;
 sourcePartId: ExternalId;
 chunkIndex: number;
 offsets: {positions:number; normals:number; indices:number};
 vertexCount: number;
 indexCount: number;
 bounds: Part['bounds'];
 laterality: Laterality;
 lateralityBasis: 'source-id'|'source-name'|'unresolved';
 available: boolean;
}
export interface ResolvedRepresentation {
 representation: MeshRepresentation;
 link: ConceptRepresentationLink;
 sourcePart: Part;
}
export interface ModelAtlas extends Atlas {
 /** Geometry manifests remain unchanged; this is an in-memory adapter only. */
 modelId?: ModelId;
}
