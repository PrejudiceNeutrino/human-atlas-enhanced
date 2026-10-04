import type {EvidenceRef,ModelId,RepresentationId,ReviewState} from './identity-contracts';
import type {AreaDataset,AreaId} from './area-contracts';

/** Semantic AreaMembership is independent of this model-specific display authority. */
export interface AreaRepresentationScope {
 areaId:AreaId;
 modelId:ModelId;
 representationIds:RepresentationId[];
 method:'frozen-donor-part-identity'|'exact-retained-source-part-identity';
 provenance:EvidenceRef[];
 review:ReviewState;
}
export interface AreaRepresentationScopeDataset {
 schemaVersion:1;
 revision:'area-representation-scopes-v1';
 areaRevision:AreaDataset['revision'];
 identityRevision:string;
 donor:AreaDataset['donor'];
 scopes:AreaRepresentationScope[];
}
