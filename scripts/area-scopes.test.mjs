import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {scopeValidationInput,generateAreaScopes,validateAreaScopes} from './generate-area-scopes.mjs';
import {assertAreaRepresentationScopes} from '../app/area-scopes.ts';
import {createAreaIndex} from '../app/areas.ts';
import {createRegionIndex,regionBounds} from '../app/regions.ts';
import {scopeRepresentations,systemCountsForScope} from '../app/viewer-polish.ts';
import {partIsVisible,resolveVisibility} from '../app/visibility.ts';
import {hideSelectedRepresentations,restoreHiddenRepresentation,hiddenPartIdsForModel} from '../app/hide-restore.ts';
import {BODY_REGION} from '../app/region-contracts.ts';
const input=scopeValidationInput(),{dataset,sidecar,regions,indexes,scopes,scopeAudit,audit}=input;
const area='atlas:area:lung-roots',male='bp3d-male-4',study='female-study-v3',hra='hra-female-v1.5';
const api=(model,data=scopes)=>createAreaIndex(dataset,sidecar,regions,indexes[model],data);
const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
const manifests={[male]:read('public/models/atlas.json'),[study]:read('public/models/atlas-female-reconstructed.json'),[hra]:read('public/models/atlas-female.json')};

test('pinned deterministic 34 scopes reproduce all exact frozen source sets and audit',()=>{
 assert.equal(validateAreaScopes(input).ok,true);
 assert.deepEqual(generateAreaScopes(input),{dataset:scopes,audit:scopeAudit});
 assert.deepEqual(generateAreaScopes(input),generateAreaScopes(input));
 assert.equal(scopes.revision,'area-representation-scopes-v1');assert.equal(scopes.donor.sha,'c9dfdcfe0ecd4aac5b71f8ab82ccd37301c775e0');
 assert.equal(scopes.scopes.length,34);
 for(const match of audit.matches)for(const model of [male,study]){
  const expected=match.matchedPartIds.map(p=>indexes[model].representationForPart(p)).filter(r=>r?.sourcePartId.namespace==='BP3D-part');
  assert.deepEqual(api(model).representationsForArea(match.areaId,model).map(r=>r.representation.id),expected.map(r=>r.id));
 }
 assert.equal(scopeAudit.coverage[study].retainedAreaPartMatches,737);assert.equal(scopeAudit.coverage[study].missingAreaPartMatches,9);
 assert.equal(scopeAudit.coverage[hra].explicitScopes,0);
});

test('concept semantics and historical expansion remain intact; six reductions and eleven exact parities',()=>{
 const index=api(male);let reduced=0,parity=0;
 for(const a of dataset.areas){
  assert.deepEqual(index.conceptsForArea(a.id),createAreaIndex(dataset,sidecar,regions,indexes[male]).conceptsForArea(a.id));
  const old=index.conceptRepresentationsForArea(a.id,male),current=index.representationsForArea(a.id,male),row=scopeAudit.rows.find(r=>r.areaId===a.id&&r.modelId===male);
  assert.equal(old.length,audit.areas.find(r=>r.areaId===a.id).models[male].representations);
  assert.equal(current.length,row.donorMatchedParts);assert.equal(old.length-current.length,row.removed.length);
  const ids=new Set(current.map(r=>r.representation.id));assert.ok(old.every(r=>ids.has(r.representation.id)||row.removed.some(x=>x.representationId===r.representation.id)));
  if(row.reduction){reduced++;assert.deepEqual(row.removed.map(r=>r.sourcePartId).sort(),audit.areas.find(r=>r.areaId===a.id).maleResolverExpansionPartIds);}
  else{parity++;assert.deepEqual(current.map(r=>r.representation.id).sort(),old.map(r=>r.representation.id).sort());}
 }
 assert.equal(reduced,6);assert.equal(parity,11);
});

test('no scope is zero geometry; unknown area/model and foreign requests never expand concepts',()=>{
 for(const model of Object.keys(indexes)){
  const index=api(model),missing=createAreaIndex(dataset,sidecar,regions,indexes[model]);
  for(const a of dataset.areas){
   assert.deepEqual(missing.representationsForArea(a.id,model),[]);assert.ok(missing.conceptsForArea(a.id).length>0);
   assert.deepEqual(index.representationsForArea(a.id,'unknown'),[]);
   for(const other of Object.keys(indexes).filter(id=>id!==model))assert.deepEqual(index.representationsForArea(a.id,other),[]);
   if(model===hra){assert.deepEqual(index.representationsForArea(a.id,model),[]);assert.equal(regionBounds(index.representationsForArea(a.id,model)),null);}
  }
  assert.deepEqual(index.representationsForArea('atlas:area:unknown',model),[]);
 }
 const empty=structuredClone(scopes);empty.scopes.find(s=>s.areaId===area&&s.modelId===male).representationIds=[];
 assert.deepEqual(api(male,empty).representationsForArea(area,male),[]);
});

test('scope corruption rejects revisions, donor, references, duplicates, foreign/malformed/unknown IDs',()=>{
 const mutations=[d=>d.revision='floating',d=>d.areaRevision='bad',d=>d.identityRevision='bad',d=>d.schemaVersion=2,d=>d.donor.sha='bad',d=>d.scopes[0].areaId='atlas:area:unknown',d=>d.scopes[0].modelId='unknown',d=>d.scopes.push(d.scopes[0]),d=>d.scopes[0].representationIds.push(d.scopes[0].representationIds[0]),d=>d.scopes[0].representationIds[0]='FJ123',d=>d.scopes[0].representationIds[0]='atlas:representation:bp3d-male-4:FJ99999999',d=>d.scopes[0].representationIds[0]=d.scopes[1].representationIds[0],d=>d.scopes[0].method='name-match',d=>d.scopes[0].provenance=[],d=>d.scopes[0].provenance[0].sourceRevision='floating',d=>d.scopes[0].review.status='reviewed'];
 for(const mutate of mutations){const bad=structuredClone(scopes);mutate(bad);assert.throws(()=>assertAreaRepresentationScopes(bad,dataset,sidecar,indexes));}
 const missing={...input,scopes:structuredClone(scopes)};missing.scopes.scopes.pop();assert.throws(()=>validateAreaScopes(missing));
 const expanded={...input,scopes:structuredClone(scopes)};
 expanded.scopes.scopes.find(s=>s.areaId===area&&s.modelId===male).representationIds.push(scopeAudit.rows.find(r=>r.areaId===area&&r.modelId===male).removed[0].representationId);
 assert.throws(()=>validateAreaScopes(expanded)); // A real same-concept representation still lacks frozen donor support.
 const changed={...input,scopeAudit:structuredClone(scopeAudit)};changed.scopeAudit.rows[0].removed=[];changed.scopeAudit.rows[0].scopedRepresentations++;assert.throws(()=>validateAreaScopes(changed));
 const fabricated={...input,scopes:structuredClone(scopes)};fabricated.scopes.scopes.push({areaId:area,modelId:hra,representationIds:[],method:'exact-retained-source-part-identity',provenance:scopes.scopes[0].provenance,review:{status:'source-derived'}});assert.throws(()=>validateAreaScopes(fabricated));
});

test('female scope rejects absent, foreign or changed retained source identity without inference',()=>{
 const part=scopeAudit.rows.find(r=>r.areaId===area&&r.modelId===study).retained[0].sourcePartId;
 const original=indexes[study].representationForPart(part);
 for(const wrong of [undefined,{...original,modelId:male},{...original,sourcePartId:{...original.sourcePartId,value:'other'}},{...original,sourcePartId:{...original.sourcePartId,namespace:'HRA-node'}},{...original,sourcePartId:{...original.sourcePartId,relation:'candidate'}}]){
  const altered={...indexes[study],representationForPart:id=>id===part?wrong:indexes[study].representationForPart(id)};
  const generated=generateAreaScopes({...input,indexes:{...indexes,[study]:altered}});
  assert.equal(generated.dataset.scopes.find(s=>s.areaId===area&&s.modelId===study).representationIds.includes(original.id),false);
  assert.ok(generated.audit.rows.find(r=>r.areaId===area&&r.modelId===study).missingSourceParts.some(p=>p.sourcePartId===part));
 }
});

test('Lung roots excludes verified distal expansion; selection, isolation, hide and restore compose',()=>{
 for(const model of [male,study]){
  const atlas=manifests[model],index=api(model),rs=index.representationsForArea(area,model),ids=new Set(rs.map(r=>r.sourcePart.id));
  const distal=atlas.concepts.find(c=>c.name.toLowerCase()==='right anterior segmental artery');assert.ok(distal);
  const extras=distal.elements.map(id=>atlas.parts.find(p=>p.id===id));assert.ok(extras.every(p=>!ids.has(p.id)&&scopeAudit.rows.find(r=>r.areaId===area&&r.modelId===model).removed.some(r=>r.sourcePartId===p.id)));
  const s={breastView:'tissue',visible:[...new Set(rs.map(r=>r.sourcePart.system))],selected:[],isolate:false,explode:0,rotate:false,reset:0,view:'three-quarter',regionId:'atlas:region:thoracic',regionPartIds:new Set(),areaId:area,areaPartIds:ids,hiddenRepresentationIds:[]};
  assert.equal(atlas.parts.filter(p=>partIsVisible(p,s)).length,11);
  for(const p of extras){assert.equal(partIsVisible(p,s),false);assert.equal(partIsVisible(p,{...s,selected:distal.elements}),true);}
  assert.equal(atlas.parts.filter(p=>partIsVisible(p,{...s,selected:distal.elements,isolate:true})).length,extras.length);
  const p=rs[0].sourcePart,hidden=hideSelectedRepresentations({...s,selected:[p.id]},indexes[model]);
  const display={...hidden,hiddenPartIds:hiddenPartIdsForModel(indexes[model],hidden.hiddenRepresentationIds)};
  assert.deepEqual(resolveVisibility(p,display,{systems:new Set(s.visible),selected:new Set([p.id])}),{displayed:false,pickable:false,packingEligible:false});
  const restored=restoreHiddenRepresentation(hidden,rs[0].representation.id);assert.equal(restored.hiddenRepresentationIds.length,0);
  assert.equal(atlas.parts.filter(p=>partIsVisible(p,{...restored,hiddenPartIds:new Set()})).length,11);
 }
});

test('camera/current-model bounds and contextual System inventory consume explicit geometry only',()=>{
 for(const model of Object.keys(indexes)){
  const index=api(model),atlas=manifests[model],regional=createRegionIndex(regions,sidecar,indexes[model]);
  for(const a of dataset.areas){
   const rs=index.representationsForArea(a.id,model),scope=scopeRepresentations(atlas,indexes[model],regional,index,'atlas:region:thoracic',a.id),counts=systemCountsForScope(scope,atlas,model);
   assert.deepEqual(scope.map(r=>r.id),rs.map(r=>r.representation.id));assert.equal(Object.values(counts).reduce((n,v)=>n+v,0),rs.length);
   for(const r of rs){assert.equal(r.representation.modelId,model);assert.strictEqual(r.representation.bounds,r.sourcePart.bounds);}
  }
  assert.equal(scopeRepresentations(atlas,indexes[model],regional,index,BODY_REGION,null).length,atlas.parts.length);
 }
});

test('runtime/generator contain no name/spatial scope matching and no automatic display fallback',()=>{
 const source=fs.readFileSync(new URL('./generate-area-scopes.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/RegExp|partInArea|\.bounds|centroid|\.test\(|\.name\s*===/);
 const runtime=fs.readFileSync(new URL('../app/areas.ts',import.meta.url),'utf8').split('representationsForArea:')[1];
 assert.doesNotMatch(runtime,/identity\.resolve|conceptsForArea|conceptRepresentationsForArea/);
 for(const model of [male,study]){const index=api(model),before=index.representationsForArea(area,model).map(r=>r.representation.id);for(const r of index.conceptRepresentationsForArea(area,model))r.sourcePart.name='Translated label';assert.deepEqual(index.representationsForArea(area,model).map(r=>r.representation.id),before);}
});
