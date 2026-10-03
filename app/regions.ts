import type {IdentityIndex, IdentitySidecar} from './identity-index';
import type {CanonicalConceptId, ModelId, ResolvedRepresentation} from './identity-contracts';
import {BODY_REGION, type RegionDataset, type RegionId} from './region-contracts.ts';

/** One canonical collection; meshes and bounds always come from the active Phase 1 resolver. */
export function createRegionIndex(dataset:RegionDataset,sidecar:IdentitySidecar,identity:IdentityIndex){
 assertRegionDataset(dataset,sidecar);
 const definitions=new Map(dataset.regions.map(r=>[r.id,r]));
 const members=new Map<RegionId,Set<CanonicalConceptId>>();
 const byConcept=new Map<CanonicalConceptId,Set<RegionId>>();
 for(const m of dataset.memberships){
  if(!members.has(m.regionId))members.set(m.regionId,new Set());
  members.get(m.regionId)!.add(m.conceptId);
  if(!byConcept.has(m.conceptId))byConcept.set(m.conceptId,new Set());
  byConcept.get(m.conceptId)!.add(m.regionId);
 }
 const all=sidecar.concepts.map(c=>c.id);
 const conceptsForRegion=(id:RegionId):CanonicalConceptId[]=>!definitions.has(id)?[]:id===BODY_REGION?[...all]:[...(members.get(id)??[])];
 const representationsForRegion=(id:RegionId,modelId:ModelId):ResolvedRepresentation[]=>{
  const unique=new Map<string,ResolvedRepresentation>();
  for(const concept of conceptsForRegion(id))for(const r of identity.resolve(concept,modelId))unique.set(r.representation.id,r);
  return [...unique.values()];
 };
 return {
  modelId:identity.modelId,
  regions:()=>[...dataset.regions].sort((a,b)=>a.order-b.order),
  region:(id:RegionId)=>definitions.get(id),
  conceptsForRegion,
  regionsForConcept:(id:CanonicalConceptId)=>[...(byConcept.get(id)??[])].map(r=>definitions.get(r)!),
  representationsForRegion,
 };
}
export type RegionIndex=ReturnType<typeof createRegionIndex>;

export function assertRegionDataset(data:RegionDataset,identity:IdentitySidecar):void {
 if(data.schemaVersion!==1||data.revision!=='canonical-regions-v1'||data.identityRevision!==identity.mappingRevision)throw new Error('Region schema/identity revision mismatch');
 const ids=new Set<string>(),orders=new Set<number>(),concepts=new Set(identity.concepts.map(c=>c.id));
 for(const r of data.regions){
  if(!/^atlas:region:[a-z]+(?:-[a-z]+)*$/.test(r.id)||ids.has(r.id)||!r.name?.trim()||orders.has(r.order)||!Number.isInteger(r.order))throw new Error(`Invalid/duplicate region ${r.id}`);
  if(!r.provenance?.length||r.review?.status!=='source-derived')throw new Error(`Missing region provenance/review ${r.id}`);
  ids.add(r.id);orders.add(r.order);
 }
 const expected=['body','head-jaw','cervical','shoulder','elbow-wrist','thoracic','lumbar','hip','knee','ankle-foot'];
 if(ids.size!==10||expected.some(r=>!ids.has(`atlas:region:${r}`)))throw new Error('Whole body plus nine regions required');
 for(const r of data.regions)if(r.id===BODY_REGION?r.parentRegionId!==undefined:r.parentRegionId!==BODY_REGION)throw new Error(`Invalid region parent ${r.id}`);
 if(data.donor.sha!=='7c2ea6ee4fe0022085c692d1a8ff25f7d4482a50'||data.donor.tag!=='donor/mvmt-base'||!data.donor.repository||!data.donor.method||!/^[a-f0-9]{64}$/.test(data.donor.manifestSha256))throw new Error('Unpinned region donor');
 const seen=new Set<string>();
 for(const m of data.memberships){
  const key=`${m.regionId}/${m.conceptId}/${m.role}`;
  if(!ids.has(m.regionId)||m.regionId===BODY_REGION||!concepts.has(m.conceptId)||!['primary','spanning'].includes(m.role)||seen.has(key))throw new Error(`Invalid/duplicate region membership ${key}`);
  if(m.review?.status!=='source-derived'||!m.evidence?.length)throw new Error(`Missing membership evidence ${key}`);
  for(const e of m.evidence)if(e.sourceRevision!==data.donor.sha||e.sourcePath!=='public/models/atlas.json'||e.sourceId!==data.donor.repository||e.sourcePartId?.namespace!=='BP3D-part'||!/^FJ\d+M?$/.test(e.sourcePartId.value)||!e.sourceConceptId||e.donorRegionId!==m.regionId.slice('atlas:region:'.length)||e.field!==(m.role==='primary'?'region':'spans'))throw new Error(`Invalid membership evidence ${key}`);
  seen.add(key);
 }
}

/** Empty bounds are legitimate; never substitute another model's frame. */
export function regionBounds(representations:readonly ResolvedRepresentation[]):[number[],number[]]|null {
 if(!representations.length)return null;
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const r of representations)for(let axis=0;axis<3;axis++){
  lo[axis]=Math.min(lo[axis],r.representation.bounds[0][axis]);
  hi[axis]=Math.max(hi[axis],r.representation.bounds[1][axis]);
 }
 return [lo,hi];
}
