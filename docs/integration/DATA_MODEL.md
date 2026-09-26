# Canonical data model proposal

Stable internal IDs are opaque, namespaced IDs such as `atlas:concept:000042`, `atlas:region:shoulder`, `atlas:area:axilla`, and `atlas:representation:bp3d-male-4:FJ1234`. They are never generated from an English display name. FMA, UBERON, HRA node IDs, `FJ*`, `VH*`, `ZA*`, `ZN*`, and MVMT IDs are **typed external identifiers**. Reuse an external ontology ID as a crosswalk only when its meaning and granularity match; do not assume each FMA code represents a single mesh or every HRA record has FMA coverage. Maintain aliases and deprecated IDs with redirects.

```ts
type Id = string;
type Evidence = {sourceId: Id; citation?: string; sourcePath?: string; revision?: string};
type Review = {status: 'candidate'|'reviewed'|'rejected'; reviewer?: string; date?: string; note?: string};
type ExternalId = {namespace: 'FMA'|'UBERON'|'BP3D-part'|'HRA-node'|'Z-Anatomy'|'MVMT'|'other'; value: string; relation: 'exact'|'broader'|'narrower'|'related'; evidence: Evidence; review: Review};
type AnatomicalConcept = {id: Id; englishName: string; latinName?: string; aliases: {text:string; language:string; kind:'synonym'|'abbreviation'|'legacy'; evidence?:Evidence}[]; externalIds: ExternalId[]; systemIds: Id[]; kind: 'structure'|'group'|'space'|'landmark'; sexApplicability?: ('male'|'female'|'all')[]; provenance: Evidence[]; review: Review};
type Relationship = {id: Id; subjectConceptId: Id; predicate: 'part-of'|'contains'|'adjacent-to'|'supplied-by'|'innervated-by'|'continues-as'|'other'; objectConceptId: Id; evidence: Evidence[]; review: Review};
type Region = {id: Id; name: string; parentRegionId?: Id; memberConceptIds: Id[]; evidence: Evidence[]; review: Review};
type TeachingArea = {id: Id; name: string; regionIds: Id[]; focalConceptIds: Id[]; contextConceptIds: Id[]; overview?: string; evidence: Evidence[]; review: Review};
type KnowledgeContent = {id: Id; conceptId: Id; field: 'description'|'function'|'location'|'latin-name'|'relationship-note'; text: string; language: string; evidence: Evidence[]; review: Review};
type ClinicalLink = {id: Id; conceptId: Id; kind: 'clinical-relevance'|'condition-affects'|'injury-affects'|'drug-targets'|'drug-treats-condition'; targetId?: Id; text?: string; evidence: Evidence[]; review: Review};
type Source = {id: Id; title: string; authors?: string[]; url?: string; doi?: string; sourceRevision?: string; retrievedAt?: string; licenseId?: Id; sha256?: string};
type Model = {id: Id; label: string; sex: 'male'|'female'; kind: 'reference'|'study'; frameId: Id; manifestUrl: string; geometrySetIds: Id[]; mappingRevision: string; review: Review};
type GeometrySet = {id: Id; modelId: Id; sourceId: Id; chunks: {url:string; sha256?:string; bytes:number}[]; sourceFrame: string; targetFrame: string; transform?: number[]; registration?: {method:string; landmarkConceptIds:Id[]; residuals?:number[]; reportSourceId?:Id}; licenseId:Id; fidelity:'source-derived'|'fitted'|'schematic'|'projected'; review:Review};
type MeshRepresentation = {id: Id; modelId: Id; geometrySetId: Id; sourcePartId: ExternalId; chunkIndex:number; offsets:{positions:number; normals:number; indices:number}; vertexCount:number; indexCount:number; bounds:[number[],number[]]; laterality:'left'|'right'|'midline'|'bilateral'|'unknown'; conceptLinks:{conceptId:Id; relation:'exact'|'part-of'|'context'|'candidate'; review:Review}[]; available:boolean};
```

These are design contracts, not a migration already applied. Store records in separately versioned JSON collections (or a later database) and generate compact client indexes. Geometry manifests contain buffer layout and source part IDs; concept links can live in a sidecar keyed by model and manifest hash. A many-to-many `conceptLinks` table supports one concept represented by several meshes (e.g., sided parts or compound HRA structures) and a mesh linked to a broader teaching concept. The same canonical concept can link to male BP3D, female HRA, female study and multiple supplemental nerve representations. Choose a default representation **per model**; alternatives remain separately attributed.

Example: an axillary nerve concept can carry a reviewed FMA exact/broader mapping, a male `ZN*` source-derived tube, an MVMT schematic male tube, and no female mesh. The female inspector still shows the concept and reviewed text, with `geometry unavailable`. A PR #1 teaching area can include it as focal even when the current model cannot draw it. No false female fallback is permitted.

## Validation rules

IDs unique within namespace; all references resolve; exact external-ID mappings cannot silently point to two incompatible concepts; each representation has one model/frame and one source/license chain; every nonempty chunk span is in bounds; a concept-to-mesh link names its relation and review state; area membership is an explicit concept relation; side is explicit rather than parsed from a display name; unsupported text/geometry can be excluded by review status. Detect orphan source IDs and ambiguous name candidates in generated audit reports.
