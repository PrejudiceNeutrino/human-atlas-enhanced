import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as T from 'three';
import {execFileSync} from 'node:child_process';
import {createAreaIndex,assertAreaDataset} from '../app/areas.ts';
import {createRegionIndex,regionBounds} from '../app/regions.ts';
import {BODY_REGION} from '../app/region-contracts.ts';
import {selectArea,normalizeNavigation,parseNavigation,navigationSearch} from '../app/area-navigation.ts';
import {selectRegion,resetViewer,switchRegionModel} from '../app/region-navigation.ts';
import {resolveVisibility,partIsVisible} from '../app/visibility.ts';
import {areaValidationInput,validateAreas} from './validate-areas.mjs';
import {generateAreas,donorRules,hash} from './area-generation.mjs';

const input=areaValidationInput(),{dataset,sidecar,regions,indexes,seed,audit}=input;
const areaIndexes=Object.fromEntries(Object.entries(indexes).map(([model,id])=>[model,createAreaIndex(dataset,sidecar,regions,id)]));
const base={breastView:'tissue',explode:0,visible:['skeletal','muscular'],selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0,regionId:BODY_REGION};
const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
const manifests=Object.fromEntries(Object.entries(indexes).map(([id])=>[id,read(`public${id==='bp3d-male-4'?'/models/atlas.json':id==='hra-female-v1.5'?'/models/atlas-female.json':'/models/atlas-female-reconstructed.json'}`)]));
const compile=p=>{const out={};new Function('exports','require',ts.transpileModule(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(out,()=>T);return out;};

test('17 explicit canonical stations, deduplication, pinned evidence and complete audit',()=>{
 assert.deepEqual(validateAreas(input),{ok:true,areas:17,memberships:616,matched:746,unresolved:0});
 assert.equal(audit.deduplicatedMemberships,130);
 assert.equal(audit.uniqueCanonicalConcepts,590);
 assert.equal(new Set(dataset.areas.map(a=>a.id)).size,17);
 for(const m of dataset.memberships)assert.match(m.conceptId,/^atlas:concept:/);
 assert.ok(dataset.memberships.some(m=>m.evidence.length>1));
 const plexus=areaIndexes['bp3d-male-4'].area('atlas:area:brachial-plexus');
 assert.deepEqual(plexus.regionIds,['atlas:region:shoulder','atlas:region:cervical']);assert.match(plexus.scopeNote,/corridor/);
});

test('offline rules reproduce exact frozen donor parts, guards and matches deterministically',()=>{
 const source=execFileSync('git',['show',`${dataset.donor.sha}:app/anatomy.ts`],{encoding:'utf8'});
 assert.equal(source,seed.source.anatomy);assert.equal(hash(source),dataset.donor.rulesSha256);
 const bytes=execFileSync('git',['show',`${dataset.donor.sha}:public/models/atlas.json`],{maxBuffer:30000000});
 assert.equal(hash(bytes),dataset.donor.manifestSha256);
 assert.deepEqual(JSON.parse(bytes).parts.map(({id,name,conceptId,bounds})=>({id,name,conceptId,bounds})).sort((a,b)=>a.id.localeCompare(b.id,'en')),seed.parts);
 const donor=donorRules(seed),body=donor.bodyBounds(seed.parts);
 for(const m of audit.matches)assert.deepEqual(m.matchedPartIds,seed.parts.filter(p=>donor.partInArea(p,m.donorAreaId,body)).map(p=>p.id));
 assert.ok(audit.matches.find(m=>m.donorAreaId==='hand').guardExcludedPartIds.length>0);
 assert.deepEqual(generateAreas(seed,sidecar,regions,indexes),{dataset,audit});
});

test('runtime membership has no name/regex/spatial/chunk classification dependency',()=>{
 const source=fs.readFileSync(new URL('../app/areas.ts',import.meta.url),'utf8');
 assert.doesNotMatch(source,/partInArea|RegExp|\.name\s*\)|\.bounds|\.chunk|centroid/);
 // Changing source display names cannot change memberships or representation resolution.
 for(const [model,index] of Object.entries(areaIndexes))for(const a of index.areas()){
  const original=index.representationsForArea(a.id,model).map(r=>r.representation.id);
  const names=indexes[model].resolve(index.conceptsForArea(a.id)[0],model);
  for(const r of names){const saved=r.sourcePart.name;r.sourcePart.name='Unrelated translated label';assert.deepEqual(index.representationsForArea(a.id,model).map(r=>r.representation.id),original);r.sourcePart.name=saved;}
 }
});

test('model-neutral API and independent coverage never leak model IDs or bounds',()=>{
 for(const [model,index] of Object.entries(areaIndexes)){
  assert.equal(index.areas().length,17);assert.equal(index.areasForRegion(BODY_REGION).length,17);
  for(const a of index.areas()){
   const rs=index.representationsForArea(a.id,model);assert.equal(rs.length,audit.areas.find(row=>row.areaId===a.id).models[model].representations);
   for(const r of a.regionIds)assert.ok(index.areasForRegion(r).some(x=>x.id===a.id));
   for(const c of index.conceptsForArea(a.id))assert.ok(index.areasForConcept(c).some(x=>x.id===a.id));
   for(const r of rs){assert.equal(r.representation.modelId,model);assert.strictEqual(r.representation.bounds,r.sourcePart.bounds);}
   for(const other of Object.keys(indexes).filter(id=>id!==model))assert.deepEqual(index.representationsForArea(a.id,other),[]);
   if(rs.length===0){assert.equal(regionBounds(rs),null);const state={...base,areaId:a.id,areaPartIds:new Set()};assert.equal(manifests[model].parts.filter(p=>partIsVisible(p,state)).length,0);}
  }
  assert.deepEqual(index.conceptsForArea('atlas:area:unknown'),[]);assert.equal(index.area('atlas:area:unknown'),undefined);
 }
 const a='atlas:area:heart';assert.notDeepEqual(regionBounds(areaIndexes['bp3d-male-4'].representationsForArea(a,'bp3d-male-4')),regionBounds(areaIndexes['female-study-v3'].representationsForArea(a,'female-study-v3')));
 assert.equal(audit.zeroGeometryAreasByModel['hra-female-v1.5'].length,17);
});

test('systems, selected search exceptions, isolation, clear selection and explosion share visibility',()=>{
 const layout=compile('app/explosion-layout.ts').createExplosionLayout;
 for(const [model,index] of Object.entries(areaIndexes))for(const a of index.areas()){
  const atlas=manifests[model],ids=new Set(index.representationsForArea(a.id,model).map(r=>r.sourcePart.id)),outside=atlas.parts.find(p=>!ids.has(p.id));
  const state={...base,visible:['arterial','muscular'],regionPartIds:new Set(),areaId:a.id,areaPartIds:ids};
  const context={systems:new Set(state.visible),selected:new Set()};
  for(const p of atlas.parts){const expected=ids.has(p.id)&&state.visible.includes(p.system),v=resolveVisibility(p,state,context);assert.deepEqual(v,{displayed:expected,pickable:expected,packingEligible:expected});}
  const selected={...state,selected:[outside.id]};assert.equal(partIsVisible(outside,selected),true);
  assert.deepEqual(atlas.parts.filter(p=>partIsVisible(p,{...selected,isolate:true})).map(p=>p.id),[outside.id]);
  assert.equal(partIsVisible(outside,{...selected,selected:[]}),false);
  const eligible=atlas.parts.filter(p=>resolveVisibility(p,selected,{...context,selected:new Set(selected.selected)}).packingEligible);
  for(const aspect of [.48,1.6])assert.deepEqual([...layout(eligible,aspect).cells.keys()].sort(),eligible.map(p=>p.id).sort());
  assert.ok(eligible.every(p=>ids.has(p.id)||p.id===outside.id));
  for(const block of [{hidden:true},{loaded:false}])assert.equal(resolveVisibility(outside,selected,{...context,selected:new Set([outside.id]),...block}).displayed,false);
  const contextual=resolveVisibility(outside,selected,{...context,selected:new Set([outside.id]),contextGeometry:true});assert.deepEqual(contextual,{displayed:true,pickable:false,packingEligible:false});
 }
});

test('organ stations supersede missing Phase 2 regional memberships on male',()=>{
 const male=indexes['bp3d-male-4'],index=areaIndexes[male.modelId],ri=createRegionIndex(regions,sidecar,male);
 for(const slug of ['heart','lung-roots','porta-hepatis','celiac-trunk','kidneys','pelvic-viscera']){
  const a=index.area(`atlas:area:${slug}`),rs=index.representationsForArea(a.id,male.modelId),regional=new Set(ri.representationsForRegion(a.regionIds[0],male.modelId).map(r=>r.sourcePart.id));
  const missing=rs.filter(r=>!regional.has(r.sourcePart.id));assert.ok(missing.length>0,slug+' has legitimate area pieces absent from region');
  const s={...base,visible:[...new Set(rs.map(r=>r.sourcePart.system))],areaId:a.id,areaPartIds:new Set(rs.map(r=>r.sourcePart.id)),regionId:a.regionIds[0],regionPartIds:regional};
  for(const r of missing){const v=resolveVisibility(r.sourcePart,s,{systems:new Set(s.visible),selected:new Set(),regionMember:false});assert.ok(v.displayed&&v.pickable&&v.packingEligible);}
  assert.equal(manifests[male.modelId].parts.filter(p=>partIsVisible(p,s)).length,rs.length);
 }
});

test('navigation/None/reset/switch and URL normalization discard stale geometry state',()=>{
 const index=areaIndexes['bp3d-male-4'],ri=createRegionIndex(regions,sidecar,indexes[index.modelId]);
 const a=index.area('atlas:area:brachial-plexus'),dirty={...base,regionId:'atlas:region:cervical',areaId:a.id,selected:['stale'],isolate:true,rotate:true,explode:1,areaPartIds:new Set(['stale']),areaFocus:[[1,2,3],[4,5,6]],regionPartIds:new Set(['stale']),regionFocus:[[1,2,3],[4,5,6]]};
 const chosen=selectArea(dirty,a);assert.equal(chosen.regionId,dirty.regionId);assert.equal(chosen.areaId,a.id);assert.deepEqual(chosen.visible,dirty.visible);
 for(const s of [chosen,selectRegion(dirty,'atlas:region:hip'),switchRegionModel(dirty,['skeletal']),resetViewer(dirty,['skeletal'])]){assert.equal(s.areaFocus,undefined);assert.equal(s.areaPartIds,undefined);assert.equal(s.regionFocus,undefined);assert.deepEqual(s.selected,[]);assert.equal(s.isolate,false);assert.equal(s.rotate,false);assert.equal(s.explode,0);}
 assert.equal(selectArea(dirty,null).areaId,null);assert.equal(selectArea(dirty,null).regionId,dirty.regionId);assert.equal(selectRegion(dirty,BODY_REGION).areaId,null);
 assert.equal(resetViewer(dirty,['skeletal']).areaId,undefined);assert.equal(switchRegionModel(dirty,['skeletal']).areaId,a.id);
 assert.deepEqual(parseNavigation(''),{regionId:BODY_REGION,areaId:null});
 const canonical={regionId:'atlas:region:cervical',areaId:a.id};assert.deepEqual(parseNavigation(navigationSearch('',canonical.regionId,a.id)),canonical);
 assert.equal(navigationSearch('?region=bad&area=bad&keep=1',BODY_REGION,null),'?keep=1');
 assert.deepEqual(normalizeNavigation('atlas:region:unknown','atlas:area:unknown',ri,index),{regionId:BODY_REGION,areaId:null});
 assert.deepEqual(normalizeNavigation(BODY_REGION,a.id,ri,index),{regionId:a.regionIds[0],areaId:a.id});
});

test('current-model camera fits every area bound corner at desktop/mobile in all existing views',()=>{
 const fit=compile('app/region-camera.ts').fitRegionCamera;
 for(const [model,index] of Object.entries(areaIndexes))for(const a of index.areas())for(const [w,h] of [[1440,900],[390,844]])for(const view of ['three-quarter','front','side','back']){
  const bounds=regionBounds(index.representationsForArea(a.id,model));if(!bounds)continue;
  const safe={left:w<768?20:285,right:w-(w<768?62:90),top:w<768?320:130,bottom:h-(w<768?175:200)},f=fit(bounds,view,34,w,h,safe),camera=new T.PerspectiveCamera(34,w/h,.005,100);
  camera.setViewOffset(w,h,f.offsetX,f.offsetY,w,h);camera.position.copy(f.center).addScaledVector(f.direction,f.distance);camera.lookAt(f.center);camera.updateMatrixWorld();
  for(let i=0;i<8;i++){const p=new T.Vector3(bounds[i&1?1:0][0],bounds[i&2?1:0][1],bounds[i&4?1:0][2]).project(camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;assert.ok(x>=safe.left&&x<=safe.right&&y>=safe.top&&y<=safe.bottom&&p.z>-1&&p.z<1,`${model} ${a.id} ${w} ${view}`);}
 }
});

test('corruptions reject guessed mappings, missing evidence/coverage and changed source rules',()=>{
 for(const mutate of [d=>d.areas.pop(),d=>d.areas.push(d.areas[0]),d=>d.areas[0].name='',d=>d.areas[0].id='Orbit',d=>d.areas[0].regionIds=['atlas:region:unknown'],d=>d.areas[0].regionIds=[],d=>d.memberships.push(d.memberships[0]),d=>d.memberships[0].conceptId='FMA123',d=>d.memberships[0].areaId='atlas:area:unknown',d=>d.memberships[0].evidence=[],d=>d.memberships[0].evidence[0].sourceRevision='floating',d=>d.memberships[0].review.status='reviewed',d=>d.identityRevision='unknown',d=>d.regionRevision='unknown']){
  const bad=structuredClone(dataset);mutate(bad);assert.throws(()=>assertAreaDataset(bad,sidecar,regions));
 }
 const guessed={...input,dataset:structuredClone(dataset)};guessed.dataset.memberships[0].evidence[0].sourceConceptId='guessed';assert.throws(()=>validateAreas(guessed));
 const missing={...input,audit:structuredClone(audit)};missing.audit.areas[0].models['hra-female-v1.5'].representations=1;assert.throws(()=>validateAreas(missing));
 const changed={...input,seed:structuredClone(seed)};changed.seed.source.anatomy+='\n';assert.throws(()=>validateAreas(changed));
 // An absent representation must remain unresolved and accounted for, rather than guessed.
 const missingMale={...indexes['bp3d-male-4'],representationForPart:()=>undefined},simulated=generateAreas(seed,sidecar,regions,{...indexes,'bp3d-male-4':missingMale});
 assert.equal(simulated.audit.unresolvedMatches,746);assert.equal(simulated.dataset.memberships.length,0);assert.equal(simulated.audit.unresolved.length,746);
 const damaged={...input,indexes:{...indexes,'bp3d-male-4':missingMale},...simulated};damaged.audit=structuredClone(simulated.audit);damaged.audit.unresolved.pop();assert.throws(()=>validateAreas(damaged));
});
