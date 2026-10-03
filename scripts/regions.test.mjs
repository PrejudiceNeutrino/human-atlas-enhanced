import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as T from 'three';
import {execFileSync} from 'node:child_process';
import {createRegionIndex,regionBounds,assertRegionDataset} from '../app/regions.ts';
import {BODY_REGION} from '../app/region-contracts.ts';
import {selectRegion,resetViewer,switchRegionModel} from '../app/region-navigation.ts';
import {resolveVisibility,partIsVisible} from '../app/visibility.ts';
import {regionValidationInput,validateRegions} from './validate-regions.mjs';

const input=regionValidationInput(),{dataset,sidecar,indexes}=input;
const region='atlas:region:shoulder';
const base={breastView:'tissue',explode:0,visible:['skeletal','muscular'],selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0};
const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
const manifests=Object.fromEntries(Object.entries(indexes).map(([id])=>[id,read(`public${id==='bp3d-male-4'?'/models/atlas.json':id==='hra-female-v1.5'?'/models/atlas-female.json':'/models/atlas-female-reconstructed.json'}`)]));
const frozenSource=execFileSync('git',['show','af4b1b846bd0eba43fafc90bea30a61fad6c66a2:app/visibility.ts'],{encoding:'utf8'});
const frozenExports={};new Function('exports',ts.transpileModule(frozenSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(frozenExports);

test('taxonomy, explicit primary/spanning records, provenance and complete unresolved audit validate',()=>{
 assert.deepEqual(validateRegions(input),{ok:true,regions:10,memberships:1118,mapped:877,unresolved:2887});
 assert.equal(input.audit.conceptsInMultipleRegions.length,272);
 assert.equal(input.audit.unresolvedCurrentBP3DParts,1357);
 assert.equal(input.audit.excludedDonorSupplementParts,1530);
 // No broad system/limb hierarchy was seeded: every evidence link is exact, checked above.
 for(const m of dataset.memberships)assert.match(m.conceptId,/^atlas:concept:/);
});

test('all three models resolve independently, missing HRA remains unavailable, no stale IDs or bounds',()=>{
 for(const [modelId,identity] of Object.entries(indexes)){
  const index=createRegionIndex(dataset,sidecar,identity);
  assert.equal(index.regions().length,10);
  assert.equal(index.representationsForRegion(BODY_REGION,modelId).length,identity.representationCount);
  for(const r of index.regions()){
   const rs=index.representationsForRegion(r.id,modelId);
   for(const rep of rs){assert.equal(rep.representation.modelId,modelId);assert.equal(rep.representation.frameId,rep.representation.modelId+'-stage');assert.strictEqual(rep.representation.bounds,rep.sourcePart.bounds);}
   for(const other of Object.keys(indexes).filter(id=>id!==modelId))assert.deepEqual(index.representationsForRegion(r.id,other),[]);
  }
  assert.deepEqual(index.conceptsForRegion('atlas:region:unknown'),[]);
  const rs=index.representationsForRegion(region,modelId);
  assert.equal(rs.length,modelId==='hra-female-v1.5'?0:122);
  assert.equal(regionBounds(rs)===null,rs.length===0);
 }
 const male=createRegionIndex(dataset,sidecar,indexes['bp3d-male-4']),study=createRegionIndex(dataset,sidecar,indexes['female-study-v3']);
 assert.notDeepEqual(regionBounds(male.representationsForRegion(region,male.modelId)),regionBounds(study.representationsForRegion(region,study.modelId)));
 assert.ok(male.regionsForConcept(dataset.memberships[0].conceptId).length);
});

test('whole body reproduces every baseline visibility decision under systems, chest, selection and isolate',()=>{
 for(const [modelId,atlas] of Object.entries(manifests))for(const breastView of ['tissue','cutaway','muscle'])for(const isolate of [false,true])for(const visible of [[],['skeletal'],[...new Set(atlas.parts.map(p=>p.system))]]){
  const s={...base,breastView,isolate,visible,selected:[atlas.parts[0].id]};
  for(const p of atlas.parts)assert.deepEqual(frozenExports.resolveVisibility(p,s,{systems:new Set(visible),selected:new Set(s.selected)}),resolveVisibility(p,{...s,regionId:BODY_REGION,regionPartIds:undefined},{systems:new Set(visible),selected:new Set(s.selected)}),`${modelId}:${p.id}`);
 }
});

test('regional systems, search selection, isolate, pickability and exploded packing use one visibility decision',()=>{
 for(const [modelId,identity] of Object.entries(indexes)){
  const index=createRegionIndex(dataset,sidecar,identity),atlas=manifests[modelId];
  const regionPartIds=new Set(index.representationsForRegion(region,modelId).map(r=>r.sourcePart.id));
  const outside=atlas.parts.find(p=>!regionPartIds.has(p.id));
  const s={...base,visible:['skeletal'],regionId:region,regionPartIds};
  const context={systems:new Set(s.visible),selected:new Set()};
  for(const p of atlas.parts){const v=resolveVisibility(p,s,context);assert.equal(v.displayed,regionPartIds.has(p.id)&&p.system==='skeletal');assert.equal(partIsVisible(p,s),v.displayed);assert.equal(v.pickable,v.displayed);assert.equal(v.packingEligible,v.displayed);}
  assert.equal(partIsVisible(outside,s),false);
  const selected={...s,selected:[outside.id]};
  assert.equal(partIsVisible(outside,selected),true,'explicit search selection overrides ordinary region/system filters');
  assert.ok(atlas.parts.filter(p=>resolveVisibility(p,selected,{...context,selected:new Set(selected.selected)}).packingEligible).some(p=>p.id===outside.id),'explosion includes explicit selected exceptions');
  const isolated={...selected,isolate:true};
  assert.deepEqual(atlas.parts.filter(p=>partIsVisible(p,isolated)).map(p=>p.id),[outside.id]);
  assert.deepEqual(atlas.parts.filter(p=>resolveVisibility(p,isolated,{...context,selected:new Set(selected.selected)}).packingEligible).map(p=>p.id),[outside.id]);
  assert.equal(partIsVisible(outside,{...selected,selected:[]}),false);
  const eligible=atlas.parts.filter(p=>resolveVisibility(p,s,context).packingEligible);
  const source=fs.readFileSync(new URL('../app/explosion-layout.ts',import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const exports={};new Function('exports','require',compiled)(exports,()=>T);
  for(const aspect of [.48,1.6]){const layout=exports.createExplosionLayout(eligible,aspect);assert.equal(layout.cells.size,eligible.length);assert.ok([...layout.cells.keys()].every(id=>regionPartIds.has(id)));}
 }
});

test('region changes, model switches and full reset deterministically discard model-specific state',()=>{
 const dirty={...base,regionId:region,selected:['old-male-id'],isolate:true,explode:1,reset:3,regionPartIds:new Set(['old-male-id']),regionFocus:[[1,2,3],[4,5,6]]};
 const picked=selectRegion(dirty,'atlas:region:hip');assert.equal(picked.regionId,'atlas:region:hip');assert.deepEqual(picked.visible,dirty.visible);assert.equal(picked.reset,4);assert.deepEqual(picked.selected,[]);
 const switched=switchRegionModel(dirty,['skeletal']);assert.equal(switched.regionId,region);assert.equal(switched.regionPartIds,undefined);assert.equal(switched.regionFocus,undefined);assert.deepEqual(switched.selected,[]);assert.equal(switched.isolate,false);
 const reset=resetViewer(dirty,['skeletal']);assert.equal(reset.regionId,BODY_REGION);assert.equal(reset.explode,0);assert.equal(reset.view,'three-quarter');assert.equal(reset.breastView,'tissue');assert.equal(reset.reset,4);
});

test('camera fit keeps all model-specific region corners in safe desktop/mobile rectangles for every view',()=>{
 const source=fs.readFileSync(new URL('../app/region-camera.ts',import.meta.url),'utf8'),compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,exports={};new Function('exports','require',compiled)(exports,()=>T);
 for(const identity of Object.values(indexes))for(const r of dataset.regions.filter(r=>r.id!==BODY_REGION))for(const [w,h] of [[1440,900],[390,844]])for(const view of ['three-quarter','front','side','back']){
  const bounds=regionBounds(createRegionIndex(dataset,sidecar,identity).representationsForRegion(r.id,identity.modelId));if(!bounds)continue;
  const area={left:w<768?20:285,right:w-(w<768?62:90),top:w<768?260:130,bottom:h-(w<768?175:200)};
  const f=exports.fitRegionCamera(bounds,view,34,w,h,area),camera=new T.PerspectiveCamera(34,w/h,.005,100);camera.setViewOffset(w,h,f.offsetX,f.offsetY,w,h);camera.position.copy(f.center).addScaledVector(f.direction,f.distance);camera.lookAt(f.center);camera.updateMatrixWorld();
  for(let i=0;i<8;i++){const point=new T.Vector3(bounds[i&1?1:0][0],bounds[i&2?1:0][1],bounds[i&4?1:0][2]).project(camera);const x=(point.x+1)*w/2,y=(1-point.y)*h/2;assert.ok(x>=area.left&&x<=area.right&&y>=area.top&&y<=area.bottom&&point.z>-1&&point.z<1,`${identity.modelId} ${r.id} ${w} ${view}`);}
 }
});

test('negative fixtures reject malformed IDs, memberships, provenance, guessed links and missing unresolved rows',()=>{
 for(const mutate of [d=>d.regions.push(d.regions[0]),d=>d.regions[1].name='',d=>d.regions[0].id='atlas:region:not-body',d=>d.regions[1].id='Head & jaw',d=>d.regions[1].parentRegionId=d.regions[1].id,d=>d.memberships[0].regionId='atlas:region:bogus',d=>d.memberships[0].conceptId='atlas:concept:missing',d=>d.memberships.push(d.memberships[0]),d=>d.memberships[0].role='guessed',d=>d.memberships[0].evidence=[],d=>d.memberships[0].evidence[0].sourceRevision='floating',d=>d.memberships[0].evidence[0].field='chunk']){
  const bad=structuredClone(dataset);mutate(bad);assert.throws(()=>assertRegionDataset(bad,sidecar));
 }
 const missing={...input,audit:structuredClone(input.audit)};missing.audit.unresolved.pop();assert.throws(()=>validateRegions(missing));
 const missingCoverage={...input,audit:structuredClone(input.audit)};missingCoverage.audit.regions.pop();assert.throws(()=>validateRegions(missingCoverage));
 const guessed={...input,dataset:structuredClone(dataset)};guessed.dataset.memberships[0].evidence[0].sourceConceptId='broad-system';assert.throws(()=>validateRegions(guessed));
});
