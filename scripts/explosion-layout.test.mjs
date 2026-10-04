import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createStableExplosionLayout,explosionLayoutKey,evaluateExplosionOffset,evaluateExplosionBounds,explosionFitDistance,SYSTEM_SEPARATION_END,EXPLODE_FAMILY_BY_SYSTEM,EXPLODE_FAMILY_ORDER,explosionValueText} from '../app/explosion-layout.ts';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {SYSTEMS,DEFAULT_VISIBLE} from '../app/anatomy.ts';
import {resolveVisibility} from '../app/visibility.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {createRegionIndex} from '../app/regions.ts';
import {createAreaIndex} from '../app/areas.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sidecar=read('public/identity/core-crosswalk-v1.json'),regions=read('public/regions/canonical-regions-v1.json'),areas=read('public/areas/canonical-areas-v1.json'),scopes=read('public/areas/area-representation-scopes-v1.json');
const models=Object.values(MODEL_REGISTRY).map(model=>({model,atlas:read('public'+model.manifestUrl)}));
const finite=vector=>vector.every(Number.isFinite);
const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const fixture=(id,system,x=0,width=.2,height=1)=>({id,system,bounds:[[x,0,-.1],[x+width,height,.1]]});
const fixtureParts=[fixture('bone','skeletal',-.2),fixture('cartilage','connective',0),fixture('muscle','muscular',-.1,.5),fixture('artery','arterial',-.2,.3),fixture('vein','venous',0,.25),fixture('organ','cardiac',.1,.2,.25)];

test('presentation mapping exhaustively covers current systems without modifying their inventory',()=>{
 assert.deepEqual(Object.keys(EXPLODE_FAMILY_BY_SYSTEM).sort(),SYSTEMS.map(s=>s.id).sort());
 assert.deepEqual(EXPLODE_FAMILY_ORDER,['support','muscular','visceral','vascular','neural-sensory','surface']);
});
for(const {model,atlas} of models)test(`${model.id}: every 1% step, 34-41%, round trip and repeated visits have fixed finite targets`,()=>{
 const context={systems:new Set(DEFAULT_VISIBLE),selected:new Set()},state={isolate:false,breastView:'tissue'};
 const parts=atlas.parts.filter(p=>resolveVisibility(p,state,context).packingEligible),start=performance.now();
 const layout=createStableExplosionLayout(parts,model.id),snapshot=JSON.stringify([...layout.targets]),key=layout.key;
 console.log(`${model.id} layout: ${(performance.now()-start).toFixed(2)} ms, ${parts.length} targets`);
 let previous=new Map();
 for(let percent=0;percent<=100;percent++){
  for(const [id,t] of layout.targets){
   const offset=evaluateExplosionOffset(t,percent/100,layout.lanes.length);assert.ok(finite(offset));
   if(previous.has(id)){
    // Smoothstep has derivative <=1.5; this bound rejects a target/cell reassignment.
    const before=previous.get(id);for(let a=0;a<3;a++)assert.ok(Math.abs(offset[a]-before[a])<=.015*(Math.abs(t.familyTranslation[a])/SYSTEM_SEPARATION_END+Math.abs(t.pieceTranslation[a])/(1-SYSTEM_SEPARATION_END))+1e-9);
   }
   previous.set(id,offset);
  }
  assert.equal(layout.key,key);assert.equal(JSON.stringify([...layout.targets]),snapshot);
 }
 for(const percent of [34,35,36,37,38,39,40,41,100,0,25,60,10,90,35,40,0]){
  const repeated=createStableExplosionLayout([...parts].reverse(),model.id);assert.equal(repeated.key,key);assert.equal(JSON.stringify([...repeated.targets]),snapshot);
  for(const [id,t] of layout.targets){assert.deepEqual(evaluateExplosionOffset(t,percent/100,layout.lanes.length),evaluateExplosionOffset(repeated.targets.get(id),percent/100,repeated.lanes.length));if(!percent)assert.deepEqual(evaluateExplosionOffset(t,0,layout.lanes.length),[0,0,0]);}
 }
});
test('midpoint families are rigid, nonoverlapping and centered; final zones retain order',()=>{
 for(const {model,atlas} of models){
  const parts=atlas.parts.filter(p=>p.system!=='integumentary'),layout=createStableExplosionLayout(parts,model.id);
  for(const lane of layout.lanes){
   const targets=[...layout.targets.values()].filter(t=>t.family===lane.family),translation=evaluateExplosionOffset(targets[0],SYSTEM_SEPARATION_END,layout.lanes.length);
   for(const t of targets)assert.deepEqual(evaluateExplosionOffset(t,SYSTEM_SEPARATION_END,layout.lanes.length),translation);
   for(const t of targets){const offset=evaluateExplosionOffset(t,1,layout.lanes.length);assert.ok(t.bounds[0][0]+offset[0]>=lane.final[0]-1e-9);assert.ok(t.bounds[1][0]+offset[0]<=lane.final[1]+1e-9);}
  }
  for(let i=1;i<layout.lanes.length;i++){assert.ok(layout.lanes[i-1].midpoint[1]<layout.lanes[i].midpoint[0]);assert.ok(layout.lanes[i-1].final[1]<layout.lanes[i].final[0]);}
  const b=evaluateExplosionBounds(layout,SYSTEM_SEPARATION_END);close((b[0][0]+b[1][0])/2,layout.center[0]);
 }
});
test('single-family uses the whole range; single representation and empty views remain assembled',()=>{
 const layout=createStableExplosionLayout(fixtureParts.filter(p=>p.system==='skeletal'||p.system==='connective'),'bp3d-male-4');
 assert.equal(layout.lanes.length,1);assert.ok([...layout.targets.values()].some(t=>evaluateExplosionOffset(t,.1,1).some(n=>n!==0)));assert.equal(explosionValueText(.3,1),'Separating individual structures, 30 percent');
 const single=createStableExplosionLayout([fixtureParts[0]],'bp3d-male-4');for(let i=0;i<=100;i++)assert.deepEqual(evaluateExplosionOffset(single.targets.values().next().value,i/100,1),[0,0,0]);
 const empty=createStableExplosionLayout([],'bp3d-male-4');assert.equal(empty.targets.size,0);assert.deepEqual(evaluateExplosionBounds(empty,1),[[0,0,0],[0,0,0]]);
});
test('missing, zero, reversed, nonfinite and thin bounds never poison packing or interpolation',()=>{
 const parts=[fixture('zero','skeletal',0,0,0),fixture('thin','venous',0,1e-10),{id:'invalid',system:'muscular',bounds:[[NaN,Infinity],[]]},{id:'missing',system:'cardiac'},{id:'reversed',system:'sensory',bounds:[[1,2,3],[-1,-2,-3]]}];
 const layout=createStableExplosionLayout(parts,'bp3d-male-4');for(let i=0;i<=100;i++)for(const t of layout.targets.values())assert.ok(finite(evaluateExplosionOffset(t,i/100,layout.lanes.length)));assert.ok(evaluateExplosionBounds(layout,1).flat().every(Number.isFinite));
});
test('key is model-bound and order independent; hide/restore, selection, systems, chest and explicit scopes compose via resolver',()=>{
 for(const {model,atlas} of models){
  const identity=createIdentityIndex(model,atlas,sidecar),regionIndex=createRegionIndex(regions,sidecar,identity),areaIndex=createAreaIndex(areas,sidecar,regions,identity,scopes);
  const states=[{isolate:false,breastView:'tissue'},...['tissue','cutaway','muscle'].map(breastView=>({isolate:false,breastView})),...regionIndex.regions().map(r=>({isolate:false,breastView:'tissue',regionPartIds:r.id==='atlas:region:body'?undefined:new Set(regionIndex.representationsForRegion(r.id,model.id).map(r=>r.sourcePart.id))})),...areaIndex.areas().map(a=>({isolate:false,breastView:'tissue',areaId:a.id,areaPartIds:new Set(areaIndex.representationsForArea(a.id,model.id).map(r=>r.sourcePart.id))}))];
  for(const state of states){
   const context={systems:new Set(DEFAULT_VISIBLE),selected:new Set()},parts=atlas.parts.filter(p=>resolveVisibility(p,state,context).packingEligible),layout=createStableExplosionLayout(parts,model.id);
   assert.equal(layout.targets.size,parts.length);assert.equal(layout.key,explosionLayoutKey([...parts].reverse(),model.id));
   if(parts.length){const hiddenPartIds=new Set([parts[0].id]),remaining=atlas.parts.filter(p=>resolveVisibility(p,{...state,hiddenPartIds},context).packingEligible),hidden=createStableExplosionLayout(remaining,model.id);assert.ok(!hidden.targets.has(parts[0].id));assert.equal(hidden.targets.size,parts.length-1);assert.equal(createStableExplosionLayout(parts,model.id).key,layout.key);}
   for(const t of layout.targets.values())assert.ok(finite(evaluateExplosionOffset(t,1,layout.lanes.length)));
  }
  const ids=new Set(atlas.parts.slice(0,5).map(p=>p.id)),isolated=atlas.parts.filter(p=>resolveVisibility(p,{isolate:true,isolatedPartIds:ids,breastView:'tissue'},{systems:new Set(),selected:new Set([atlas.parts[0].id])}).packingEligible);assert.deepEqual(isolated.map(p=>p.id),[...ids]);
 }
 assert.notEqual(explosionLayoutKey(fixtureParts,'bp3d-male-4'),explosionLayoutKey(fixtureParts,'female-study-v3'));
 assert.notEqual(explosionLayoutKey(fixtureParts,'bp3d-male-4',[0,1,0]),explosionLayoutKey(fixtureParts,'bp3d-male-4',[0,2,0]));
});
test('fixed-target camera fit is continuous at every 1% increment and the family breakpoint',()=>{
 const layout=createStableExplosionLayout(fixtureParts,'bp3d-male-4');
 for(const direction of [[0,0,1],[.35,.06,1],[1,.02,0],[0,.02,-1]]){
  const fit=amount=>explosionFitDistance(evaluateExplosionBounds(layout,amount),layout.center,direction,34,1440,900,840,630);
  for(let i=1;i<=100;i++)assert.ok(Math.abs(fit(i/100)-fit((i-1)/100))<.4);
  close(fit(.3-1e-7),fit(.3+1e-7),1e-5);for(const amount of [0,.3,.35,.36,.4,1])assert.ok(Number.isFinite(fit(amount)));
 }
});
test('slider accessibility describes the two stages and endpoints',()=>{
 assert.equal(explosionValueText(0,5),'Assembled');assert.equal(explosionValueText(.18,5),'Separating system families, 18 percent');assert.equal(explosionValueText(.3,5),'Systems apart');assert.equal(explosionValueText(.65,5),'Separating individual structures, 65 percent');assert.equal(explosionValueText(1,5),'Every piece');
});
