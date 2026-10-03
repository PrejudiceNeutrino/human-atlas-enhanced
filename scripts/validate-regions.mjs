import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {assertRegionDataset,createRegionIndex} from '../app/regions.ts';
import {BODY_REGION} from '../app/region-contracts.ts';

const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
export function regionValidationInput(){
 const sidecar=read('public/identity/core-crosswalk-v1.json');
 return {dataset:read('public/regions/canonical-regions-v1.json'),seed:read('data/regions/mvmt-seed-v1.json'),audit:read('data/regions/region-audit-v1.json'),sidecar,indexes:Object.fromEntries(Object.values(MODEL_REGISTRY).map(m=>[m.id,createIdentityIndex(m,read(`public${m.manifestUrl}`),sidecar)]))};
}
export function validateRegions({dataset,sidecar,seed,audit,indexes}){
 assertRegionDataset(dataset,sidecar);
 if(JSON.stringify(seed.donor)!==JSON.stringify(dataset.donor)||JSON.stringify(audit.donor)!==JSON.stringify(dataset.donor))throw new Error('Donor provenance differs across artifacts');
 const seeds=new Map(seed.parts.map(p=>[p.partId,p]));
 if(seeds.size!==seed.parts.length)throw new Error('Duplicate donor source part');
 const male=indexes['bp3d-male-4'],mapped=new Set(),evidenceKeys=new Set();
 if(audit.canonicalRegionCount!==dataset.regions.length||audit.regions.length!==dataset.regions.length||new Set(audit.regions.map(r=>r.regionId)).size!==dataset.regions.length||audit.regions.some(r=>!dataset.regions.some(d=>d.id===r.regionId)))throw new Error('Incomplete region coverage audit');
 for(const m of dataset.memberships)for(const e of m.evidence){
  const p=seeds.get(e.sourcePartId.value);
  if(!p||(m.role==='primary'?p.region!==e.donorRegionId:!p.spans.includes(e.donorRegionId)))throw new Error('Membership does not match frozen donor evidence');
  const key=`${m.regionId}/${m.conceptId}/${m.role}/${p.partId}`;
  if(evidenceKeys.has(key))throw new Error('Duplicate membership source evidence');evidenceKeys.add(key);
  const rs=male.resolve(m.conceptId,male.modelId);
  const exact=rs.find(r=>r.sourcePart.id===p.partId&&r.link.relation==='exact'&&r.link.evidence.sourceId===e.sourceConceptId);
  if(!exact)throw new Error('Membership requires a direct exact canonical link');
  // A larger exact grouping cannot replace an available more specific direct concept.
  for(const c of sidecar.concepts){const candidates=male.resolve(c.id,male.modelId);if(candidates.length<rs.length&&candidates.some(r=>r.sourcePart.id===p.partId&&r.link.relation==='exact'))throw new Error('Membership is not the most specific direct concept');}
  mapped.add(p.partId);
 }
 const unresolved=new Set(audit.unresolved.map(p=>p.partId));
 if(unresolved.size!==audit.unresolved.length||[...unresolved].some(id=>mapped.has(id))||mapped.size+unresolved.size!==seeds.size)throw new Error('Donor coverage accounting mismatch');
 for(const p of audit.unresolved)if(!p.reason||!seeds.has(p.partId))throw new Error('Missing unresolved donor audit');
 if(audit.donorPartsMapped!==mapped.size||audit.donorPartsUnresolved!==unresolved.size||audit.donorPartsExamined!==seeds.size||audit.totalMemberships!==dataset.memberships.length||audit.primaryMemberships!==dataset.memberships.filter(m=>m.role==='primary').length||audit.spanningMemberships!==dataset.memberships.filter(m=>m.role==='spanning').length)throw new Error('Audit membership totals drift');
 if(audit.canonicalConceptsRepresented!==new Set(dataset.memberships.map(m=>m.conceptId)).size||audit.mapped.length!==mapped.size||audit.mapped.some(p=>!mapped.has(p.partId)))throw new Error('Audit canonical/mapped counts drift');
 if(audit.unresolvedCurrentBP3DParts!==audit.unresolved.filter(p=>male.representationForPart(p.partId)).length||audit.excludedDonorSupplementParts!==audit.unresolved.filter(p=>!male.representationForPart(p.partId)).length)throw new Error('Unresolved audit category drift');
 for(const r of audit.regions)for(const [modelId,identity] of Object.entries(indexes)){
  const index=createRegionIndex(dataset,sidecar,identity),cs=index.conceptsForRegion(r.regionId),rs=index.representationsForRegion(r.regionId,modelId),available=cs.filter(c=>identity.resolve(c,modelId).length).length;
  if(r.concepts!==cs.length||r.primary!==dataset.memberships.filter(m=>m.regionId===r.regionId&&m.role==='primary').length||r.spanning!==dataset.memberships.filter(m=>m.regionId===r.regionId&&m.role==='spanning').length)throw new Error('Per-region audit totals drift');
  if(rs.some(x=>x.representation.modelId!==modelId)||r.models[modelId].representations!==rs.length||r.models[modelId].availableConcepts!==available||r.models[modelId].unavailableConcepts!==cs.length-available)throw new Error(`Region model coverage drift ${modelId}`);
  if(r.regionId===BODY_REGION&&rs.length!==identity.representationCount)throw new Error('Whole-body representation parity failed');
 }
 return {ok:true,regions:dataset.regions.length,memberships:dataset.memberships.length,mapped:mapped.size,unresolved:unresolved.size};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){console.log(JSON.stringify(validateRegions(regionValidationInput()),null,2));}
