import type {AreaDataset} from './area-contracts';
import type {AreaRepresentationScopeDataset} from './area-scope-contracts';
import type {IdentityIndex,IdentitySidecar} from './identity-index';
import type {ModelId,RepresentationId} from './identity-contracts';
import {MODEL_REGISTRY} from './model-registry.ts';
import {representationId} from './identity-index.ts';

export const AREA_SCOPE_REVISION='area-representation-scopes-v1';
/** Runtime validates the loaded model; offline validation supplies all registered indexes. */
export function assertAreaRepresentationScopes(data:AreaRepresentationScopeDataset,areas:AreaDataset,sidecar:IdentitySidecar,indexes:Partial<Record<ModelId,IdentityIndex>>):void {
 if(data.schemaVersion!==1||data.revision!==AREA_SCOPE_REVISION||data.areaRevision!==areas.revision||data.identityRevision!==sidecar.mappingRevision)throw new Error('Area scope revision mismatch');
 if(JSON.stringify(data.donor)!==JSON.stringify(areas.donor))throw new Error('Area scope donor provenance mismatch');
 if(!Array.isArray(data.scopes))throw new Error('Area scopes must be an array');
 const areaIds=new Set(areas.areas.map(a=>a.id)),seen=new Set<string>();
 for(const scope of data.scopes){
  const key=`${scope.areaId}/${scope.modelId}`;
  if(!areaIds.has(scope.areaId)||!Object.hasOwn(MODEL_REGISTRY,scope.modelId)||seen.has(key))throw new Error(`Invalid/duplicate area/model scope ${key}`);
  seen.add(key);
  if(!Array.isArray(scope.representationIds))throw new Error(`Scope representations must be an array ${key}`);
  if(scope.review?.status!=='source-derived'||!scope.provenance?.length||!scope.provenance.every(p=>p.sourceId===areas.donor.repository&&p.sourceRevision===areas.donor.sha&&p.sourcePath==='data/areas/area-audit-v1.json'))throw new Error(`Invalid scope provenance/review ${key}`);
  if(scope.method!==(scope.modelId==='bp3d-male-4'?'frozen-donor-part-identity':'exact-retained-source-part-identity'))throw new Error(`Invalid scope method ${key}`);
  const ids=new Set<RepresentationId>();
  for(const id of scope.representationIds){
   const prefix=`atlas:representation:${scope.modelId}:`;
   let valid=false;
   try{valid=typeof id==='string'&&id.startsWith(prefix)&&id.length>prefix.length&&representationId(scope.modelId,decodeURIComponent(id.slice(prefix.length)))===id;}catch{ /* Invalid URI encoding is a malformed identity. */ }
   if(!valid||ids.has(id))throw new Error(`Malformed/foreign/duplicate scope representation ${id}`);
   ids.add(id);
   const index=indexes[scope.modelId];
   if(index){const rep=index.representation(id);if(!rep||rep.modelId!==scope.modelId||!rep.available)throw new Error(`Unknown/unavailable scope representation ${id}`);}
  }
 }
}
