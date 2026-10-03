import type {CanonicalConceptId, EvidenceRef, ReviewState} from './identity-contracts';

export type RegionId = `atlas:region:${string}`;
export const BODY_REGION:RegionId = 'atlas:region:body';
export interface Region {
 id:RegionId;
 name:string;
 parentRegionId?:RegionId;
 order:number;
 provenance:EvidenceRef[];
 review:ReviewState;
}
export interface RegionEvidence extends EvidenceRef {
 sourcePartId:{namespace:'BP3D-part';value:string};
 sourceConceptId:string;
 field:'region'|'spans';
 donorRegionId:string;
}
export interface RegionMembership {
 regionId:RegionId;
 conceptId:CanonicalConceptId;
 role:'primary'|'spanning';
 evidence:RegionEvidence[];
 review:ReviewState;
}
export interface RegionDataset {
 schemaVersion:1;
 revision:'canonical-regions-v1';
 identityRevision:string;
 donor:{repository:string;tag:string;sha:string;manifestSha256:string;method:string};
 regions:Region[];
 memberships:RegionMembership[];
}
