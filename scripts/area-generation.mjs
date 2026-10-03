/** Offline migration only. No module here is imported by the viewer. */
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {createAreaIndex,assertAreaDataset,AREA_DONOR_SHA,AREA_SLUGS} from '../app/areas.ts';
import {createRegionIndex} from '../app/regions.ts';

export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const affiliations=[['head-jaw'],['head-jaw'],['head-jaw','cervical'],['cervical'],['thoracic'],['thoracic'],['lumbar'],['lumbar'],['lumbar'],['shoulder','cervical'],['shoulder'],['elbow-wrist'],['elbow-wrist'],['elbow-wrist'],['hip'],['knee'],['ankle-foot']];
export const limitations=[
 'PR #1 English-name rules and hand/foot spatial guards are frozen source-derived heuristics, not independent anatomical validation.',
 'Membership means included in an educational station, not anatomical equivalence. Surrounding and long corridor structures may enlarge framing.',
 'Brachial plexus is a corridor: named plexus trunks are not all available in the baseline atlas.',
 'Pelvic viscera donor rules are male-biased; female structures are not inferred or added by name.',
 'Coverage uses only accepted Phase 1 canonical identity. Zero geometry is valid; no cross-model spatial fallback.',
];
export function donorRules(seed){
 if(seed.schemaVersion!==1||seed.donor.sha!==AREA_DONOR_SHA||seed.donor.rulesSha256!=='fd8555870714f4cd75327d7cb8a7ab73cb7352a3a4e72934b277e3bd5a54e744'||seed.donor.manifestSha256!=='c359f4bcd2cba90b7411d66d5e9fc04dc81294d46cd5c1e8b212c824f2e5bbee'||hash(seed.source.anatomy)!==seed.donor.rulesSha256||hash(JSON.stringify(seed.parts))!=='b7667474e3ddc37ad397128cbf63a1c6cfa719fc70684b5556e351e5ef17225a')throw new Error('Frozen area source hash/revision drift');
 // Execute only the pinned, checked-in offline evidence, retaining the exact original guards.
 const donor={};
 new Function('exports',ts.transpileModule(seed.source.anatomy,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(donor);
 const rules=donor.AREAS.map(a=>({donorAreaId:a.id,name:a.name,legacyRegionIds:a.regions,regexSource:a.match.source,regexFlags:a.match.flags,guard:a.id==='hand'?'partRegion(part, donorBodyBounds) === arm':a.id==='foot'?'partRegion(part, donorBodyBounds) === legs':null}));
 if(rules.length!==17||JSON.stringify(rules)!==JSON.stringify(seed.rules))throw new Error('Frozen area rule drift');
 return donor;
}
export function acceptedPartLinks(identity,sidecar){
 const direct=new Map();
 for(const c of sidecar.concepts){
  const rs=identity.resolve(c.id,identity.modelId);
  for(const r of rs)if(r.link.relation==='exact'&&['source-derived','reviewed'].includes(r.link.review.status)){
   const list=direct.get(r.sourcePart.id)??[];
   list.push({conceptId:c.id,sourceConceptId:r.link.evidence.sourceId,size:rs.length});direct.set(r.sourcePart.id,list);
  }
 }
 return direct;
}
export function mostSpecificLink(partId,identity,direct){
 const rep=identity.representationForPart(partId);
 if(!rep||rep.sourcePartId.namespace!=='BP3D-part')return {reason:'No current BP3D male representation.'};
 const links=(direct.get(partId)??[]).sort((a,b)=>a.size-b.size||a.conceptId.localeCompare(b.conceptId,'en'));
 const best=links.filter(r=>r.size===links[0]?.size);
 return best.length===1?{link:best[0]}:{reason:'No unique most-specific accepted exact canonical link.'};
}
export function generateAreas(seed,sidecar,regions,indexes){
 const donor=donorRules(seed),male=indexes['bp3d-male-4'],body=donor.bodyBounds(seed.parts),direct=acceptedPartLinks(male,sidecar);
 const provenance={sourceId:seed.donor.repository,sourcePath:'app/anatomy.ts',sourceRevision:AREA_DONOR_SHA,note:'Candidate teaching membership, source-derived from frozen PR #1; requires anatomical review.'};
 const areas=donor.AREAS.map((a,order)=>({id:`atlas:area:${AREA_SLUGS[order]}`,name:a.name,regionIds:affiliations[order].map(r=>`atlas:region:${r}`),order,provenance:[provenance],review:{status:'source-derived'},...(a.id==='brachial-plexus'?{scopeNote:'Scalenes, clavicle, and subclavian/axillary vessels form a teaching corridor. Named plexus trunks are not all in this atlas; station membership does not assert anatomical equivalence.'}:a.id==='pelvic-viscera'?{scopeNote:'Frozen male-source station includes urinary bladder, rectum and male reproductive anatomy. Female-specific station membership requires separate evidence.'}:{})}));
 const membership=new Map(),mapped=[],unresolved=[],matches=[];
 for(const [order,a] of donor.AREAS.entries()){
  const areaId=areas[order].id,regexMatches=seed.parts.filter(p=>a.match.test(p.name)),selected=seed.parts.filter(p=>donor.partInArea(p,a.id,body));
  matches.push({areaId,donorAreaId:a.id,examined:seed.parts.length,regexMatches:regexMatches.length,guardExcludedPartIds:regexMatches.filter(p=>!selected.includes(p)).map(p=>p.id),matchedPartIds:selected.map(p=>p.id)});
  for(const p of selected){
   const {link,reason}=mostSpecificLink(p.id,male,direct);
   if(reason){unresolved.push({areaId,donorAreaId:a.id,partId:p.id,reason});continue;}
   mapped.push({areaId,partId:p.id,...link});
   const key=`${areaId}/${link.conceptId}`,row=membership.get(key)??{areaId,conceptId:link.conceptId,evidence:[],review:{status:'source-derived'}};
   row.evidence.push({...provenance,donorAreaId:a.id,sourcePartId:{namespace:'BP3D-part',value:p.id},sourceConceptId:link.sourceConceptId});membership.set(key,row);
  }
 }
 const dataset={schemaVersion:1,revision:'canonical-areas-v1',identityRevision:sidecar.mappingRevision,regionRevision:regions.revision,donor:seed.donor,areas,memberships:[...membership.values()].sort((a,b)=>a.areaId.localeCompare(b.areaId,'en')||a.conceptId.localeCompare(b.conceptId,'en'))};
 assertAreaDataset(dataset,sidecar,regions);
 const areaIndexes=Object.fromEntries(Object.entries(indexes).map(([model,id])=>[model,createAreaIndex(dataset,sidecar,regions,id)]));
 const multiple=new Map();for(const m of dataset.memberships){const list=multiple.get(m.conceptId)??[];list.push(m.areaId);multiple.set(m.conceptId,list);}
 const coverage=areas.map(a=>({areaId:a.id,name:a.name,regionIds:a.regionIds,donorPartsExamined:seed.parts.length,donorPartsMatched:matches.find(m=>m.areaId===a.id).matchedPartIds.length,canonicalConcepts:areaIndexes[male.modelId].conceptsForArea(a.id).length,unresolved:unresolved.filter(m=>m.areaId===a.id).length,maleResolverExpansionPartIds:areaIndexes[male.modelId].representationsForArea(a.id,male.modelId).map(r=>r.sourcePart.id).filter(id=>!matches.find(m=>m.areaId===a.id).matchedPartIds.includes(id)).sort(),models:Object.fromEntries(Object.entries(areaIndexes).map(([model,index])=>{const cs=index.conceptsForArea(a.id),available=cs.filter(c=>indexes[model].resolve(c,model).length);return [model,{availableConcepts:available.length,unavailableConcepts:cs.length-available.length,representations:index.representationsForArea(a.id,model).length}];}))}));
 const regional=createRegionIndex(regions,sidecar,male);
 const organRegression=areas.filter(a=>['heart','lung-roots','porta-hepatis','celiac-trunk','kidneys','pelvic-viscera'].some(s=>a.id===`atlas:area:${s}`)).map(a=>{
  const regionParts=new Set(regional.representationsForRegion(a.regionIds[0],male.modelId).map(r=>r.sourcePart.id)),rs=areaIndexes[male.modelId].representationsForArea(a.id,male.modelId);
  return {areaId:a.id,regionId:a.regionIds[0],areaRepresentations:rs.length,areaRepresentationsWithoutRegionMembership:rs.filter(r=>!regionParts.has(r.sourcePart.id)).length};
 });
 const audit={schemaVersion:1,revision:dataset.revision,donor:dataset.donor,canonicalAreaCount:areas.length,totalMemberships:dataset.memberships.length,donorPartsExamined:seed.parts.length,totalDonorMatches:mapped.length+unresolved.length,mappedMatches:mapped.length,unresolvedMatches:unresolved.length,deduplicatedMemberships:mapped.length-dataset.memberships.length,uniqueCanonicalConcepts:multiple.size,conceptsInMultipleAreas:[...multiple].filter(([,a])=>a.length>1).map(([conceptId,areaIds])=>({conceptId,areaIds})),areas:coverage,zeroGeometryAreasByModel:Object.fromEntries(Object.keys(indexes).map(id=>[id,coverage.filter(a=>a.models[id].representations===0).map(a=>a.areaId)])),organRegression,limitations:[...limitations,'Canonical resolver closure can include more representations than regex matches when a most-specific accepted exact source concept contains several parts; expansion IDs are reported per station. No renderer-local donor-part restriction is imposed.'],matches,mapped,unresolved};
 return {dataset,audit};
}
