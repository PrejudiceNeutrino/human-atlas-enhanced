import type {CanonicalConceptId, EvidenceRef, ReviewState} from './identity-contracts';
import type {RegionId} from './region-contracts';

export type AreaId = `atlas:area:${string}`;
/** Educational station, never anatomical equivalence or a geometry identifier. */
export interface TeachingArea {
 id:AreaId;
 name:string;
 regionIds:RegionId[];
 order:number;
 provenance:EvidenceRef[];
 review:ReviewState;
 scopeNote?:string;
}
export interface AreaEvidence extends EvidenceRef {
 donorAreaId:string;
 sourcePartId:{namespace:'BP3D-part';value:string};
 sourceConceptId:string;
}
export interface AreaMembership {
 areaId:AreaId;
 conceptId:CanonicalConceptId;
 evidence:AreaEvidence[];
 review:ReviewState;
}
export interface AreaDataset {
 schemaVersion:1;
 revision:'canonical-areas-v1';
 identityRevision:string;
 regionRevision:string;
 donor:{repository:string;tag:string;sha:string;manifestSha256:string;rulesSha256:string;method:string};
 areas:TeachingArea[];
 memberships:AreaMembership[];
}
