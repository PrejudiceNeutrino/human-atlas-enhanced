import type {CanonicalConceptId,ModelId,ResolvedRepresentation} from './identity-contracts';
import type {IdentityIndex,IdentitySidecar} from './identity-index';
import type {AreaDataset,AreaId} from './area-contracts';
import type {RegionDataset,RegionId} from './region-contracts';
import {BODY_REGION} from './region-contracts.ts';
import type {AreaRepresentationScopeDataset} from './area-scope-contracts';
import {assertAreaRepresentationScopes} from './area-scopes.ts';

export const AREA_DONOR_SHA='c9dfdcfe0ecd4aac5b71f8ab82ccd37301c775e0';
export const AREA_SLUGS=['orbit','circle-of-willis','brainstem','larynx','heart','lung-roots','porta-hepatis','celiac-trunk','kidneys','brachial-plexus','axilla','cubital-fossa','wrist','hand','pelvic-viscera','popliteal-fossa','foot'] as const;

export function assertAreaDataset(data:AreaDataset,identity:IdentitySidecar,regions:RegionDataset):void {
 if(data.schemaVersion!==1||data.revision!=='canonical-areas-v1'||data.identityRevision!==identity.mappingRevision||data.regionRevision!==regions.revision)throw new Error('Area schema/identity/region revision mismatch');
 const ids=new Set<string>(),orders=new Set<number>(),regionIds=new Set(regions.regions.map(r=>r.id)),conceptIds=new Set(identity.concepts.map(c=>c.id));
 const pinned=(e:{sourceRevision?:string;sourcePath?:string;sourceId:string})=>e.sourceRevision===AREA_DONOR_SHA&&e.sourcePath==='app/anatomy.ts'&&e.sourceId===data.donor.repository;
 if(data.donor.sha!==AREA_DONOR_SHA||data.donor.tag!=='donor/pr-1'||!data.donor.repository||!data.donor.method||![data.donor.manifestSha256,data.donor.rulesSha256].every(h=>/^[a-f0-9]{64}$/.test(h)))throw new Error('Unpinned area donor');
 for(const a of data.areas){
  if(!AREA_SLUGS.some(s=>a.id===`atlas:area:${s}`)||ids.has(a.id)||!a.name?.trim()||!Number.isInteger(a.order)||orders.has(a.order))throw new Error(`Invalid/duplicate area ${a.id}`);
  if(!a.regionIds?.length||new Set(a.regionIds).size!==a.regionIds.length||a.regionIds.some(r=>r===BODY_REGION||!regionIds.has(r)))throw new Error(`Invalid area regions ${a.id}`);
  if(a.review?.status!=='source-derived'||!a.provenance?.length||!a.provenance.every(pinned))throw new Error(`Missing area provenance/review ${a.id}`);
  ids.add(a.id);orders.add(a.order);
 }
 if(ids.size!==17)throw new Error('Exactly 17 teaching areas required');
 const seen=new Set<string>();
 for(const m of data.memberships){
  const key=`${m.areaId}/${m.conceptId}`;
  if(!ids.has(m.areaId)||!conceptIds.has(m.conceptId)||seen.has(key))throw new Error(`Invalid/duplicate area membership ${key}`);
  if(m.review?.status!=='source-derived'||!m.evidence?.length)throw new Error(`Missing area membership evidence ${key}`);
  const parts=new Set<string>();
  for(const e of m.evidence){
   if(!pinned(e)||!e.donorAreaId||!e.sourceConceptId||e.sourcePartId?.namespace!=='BP3D-part'||!/^FJ\d+M?$/.test(e.sourcePartId.value)||parts.has(e.sourcePartId.value))throw new Error(`Invalid area evidence ${key}`);
   parts.add(e.sourcePartId.value);
  }
  seen.add(key);
 }
}

/** Model-bound Phase 1 resolver; a foreign-model request deliberately resolves nothing. */
export function createAreaIndex(dataset:AreaDataset,sidecar:IdentitySidecar,regions:RegionDataset,identity:IdentityIndex,scopes?:AreaRepresentationScopeDataset){
 assertAreaDataset(dataset,sidecar,regions);
 if(scopes)assertAreaRepresentationScopes(scopes,dataset,sidecar,{[identity.modelId]:identity});
 const definitions=new Map(dataset.areas.map(a=>[a.id,a]));
 const members=new Map<AreaId,Set<CanonicalConceptId>>(),byConcept=new Map<CanonicalConceptId,Set<AreaId>>();
 for(const m of dataset.memberships){
  if(!members.has(m.areaId))members.set(m.areaId,new Set());
  members.get(m.areaId)!.add(m.conceptId);
  if(!byConcept.has(m.conceptId))byConcept.set(m.conceptId,new Set());
  byConcept.get(m.conceptId)!.add(m.areaId);
 }
 const areas=()=>[...dataset.areas].sort((a,b)=>a.order-b.order);
 const conceptsForArea=(id:AreaId)=>[...(members.get(id)??[])];
 /** Knowledge/audit resolution only. Never used as a missing-scope display fallback. */
 const conceptRepresentationsForArea=(id:AreaId,modelId:ModelId):ResolvedRepresentation[]=>{
  const unique=new Map<string,ResolvedRepresentation>();
  for(const c of conceptsForArea(id))for(const r of identity.resolve(c,modelId))unique.set(r.representation.id,r);
  return [...unique.values()];
 };
 const scoped=new Map<AreaId,ResolvedRepresentation[]>();
 for(const scope of scopes?.scopes??[]){
  if(scope.modelId!==identity.modelId)continue;
  // Resolve metadata for the explicit IDs only; concept closure never determines inclusion.
  const metadata=new Map(conceptRepresentationsForArea(scope.areaId,identity.modelId).map(r=>[r.representation.id,r]));
  scoped.set(scope.areaId,scope.representationIds.map(id=>{
   const resolved=metadata.get(id);
   if(!resolved)throw new Error(`Scope representation lacks canonical area relationship ${id}`);
   return resolved;
  }));
 }
 return {
  modelId:identity.modelId,areas,area:(id:AreaId)=>definitions.get(id),
  areasForRegion:(id:RegionId)=>areas().filter(a=>id===BODY_REGION||a.regionIds.includes(id)),
  conceptsForArea,
  conceptRepresentationsForArea,
  areasForConcept:(id:CanonicalConceptId)=>[...(byConcept.get(id)??[])].map(a=>definitions.get(a)!),
  representationsForArea:(id:AreaId,modelId:ModelId):ResolvedRepresentation[]=>{
   return modelId===identity.modelId?[...(scoped.get(id)??[])]:[];
  },
 };
}
export type AreaIndex=ReturnType<typeof createAreaIndex>;
