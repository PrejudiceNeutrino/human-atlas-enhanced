import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex,representationId} from '../app/identity-index.ts';
import {contextRevealSubject,enterContextReveal,exitContextReveal,reconcileContextReveal,revealHitWins,CONTEXT_REVEAL_OPACITY} from '../app/context-reveal.ts';
import {createContextRevealRenderer} from '../app/context-reveal-renderer.ts';
import {resolveVisibility} from '../app/visibility.ts';
import {hiddenPartIdsForModel,hideSelectedRepresentations,restoreNewestHidden,selectRepresentations} from '../app/hide-restore.ts';
import {isolateSelection,exitIsolation,clearActiveSelection,selectAssemblyMember,toggleAllSystems} from '../app/viewer-interaction.ts';
import {selectRegion,switchRegionModel} from '../app/region-navigation.ts';
import {selectArea} from '../app/area-navigation.ts';
import {createStableExplosionLayout,explosionLayoutKey,evaluateExplosionOffset} from '../app/explosion-layout.ts';
import {sceneFloorEligible} from '../app/floor-eligibility.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sidecar=read('public/identity/core-crosswalk-v1.json');

for(const model of Object.values(MODEL_REGISTRY)){
 const atlas=read('public'+model.manifestUrl),identity=createIdentityIndex(model,atlas,sidecar);
 const group=atlas.concepts.find(c=>c.elements.length>5&&c.elements.length<30);
 const base={selected:group.elements,visible:[...model.availableSystems],hiddenRepresentationIds:[],breastView:'tissue',isolate:false,explode:.5,view:'side',rotate:false,reset:2,regionId:'atlas:region:body',areaId:null};
 const derive=s=>({...s,hiddenPartIds:hiddenPartIdsForModel(identity,s.hiddenRepresentationIds),isolatedPartIds:s.isolate?hiddenPartIdsForModel(identity,s.isolatedRepresentationIds):undefined});
 const eligible=s=>atlas.parts.filter(p=>resolveVisibility(p,derive(s),{selected:new Set(s.selected),systems:new Set(s.visible)}).packingEligible);
 const apply=(s,action)=>reconcileContextReveal(s,action(s));
 test(`${model.id}: explicit mode, exact multipart model-bound subject, no mutation and no valid target`,()=>{
  const before=structuredClone(base),on=enterContextReveal(base,atlas,identity);
  assert.equal(on.contextReveal.mode,'context');assert.equal(on.contextReveal.modelId,model.id);
  assert.deepEqual(new Set(on.contextReveal.targetRepresentationIds),new Set(group.elements.map(id=>identity.representationForPart(id).id)));
  for(const key of Object.keys(base))assert.strictEqual(on[key],base[key]);assert.deepEqual(base,before);
  assert.equal(exitContextReveal(on).contextReveal,undefined);assert.strictEqual(exitContextReveal(base),base);
  for(const selected of [[],['unknown'],['atlas:representation:foreign:part']]){const s={...base,selected};assert.strictEqual(enterContextReveal(s,atlas,identity),s);}
  const hidden=group.elements.map(id=>identity.representationForPart(id).id),s={...base,hiddenRepresentationIds:hidden};assert.equal(contextRevealSubject(s,atlas,identity),undefined);
 });
 test(`${model.id}: Reveal preserves exact base eligibility, systems exceptions, Area and workspace boundary`,()=>{
  for(const state of [base,{...base,visible:[]},{...base,regionPartIds:new Set()},{...base,areaId:'atlas:area:brainstem',areaPartIds:new Set(),regionPartIds:new Set()},derive(isolateSelection(base,identity))]){
   const on=enterContextReveal(state,atlas,identity);assert.deepEqual(eligible(on),eligible(state));
   assert.strictEqual(on.visible,state.visible);assert.strictEqual(on.isolatedRepresentationIds,state.isolatedRepresentationIds);
   if(state.isolate)assert.ok(eligible(on).every(p=>state.isolatedPartIds.has(p.id)));
   else assert.ok(eligible(on).some(p=>state.selected.includes(p.id)),'existing selected filter exception retained');
  }
  const region={...base,selected:[],regionPartIds:new Set([group.elements[0]])};assert.equal(contextRevealSubject(region,atlas,identity),undefined);assert.ok(eligible(region).every(p=>region.regionPartIds.has(p.id)));
  const area={...region,areaId:'atlas:area:brainstem',areaPartIds:new Set([group.elements[1]])};assert.ok(eligible(area).every(p=>area.areaPartIds.has(p.id)));
  const disabled={...base,selected:[],visible:[]};assert.equal(eligible(disabled).length,0);
 });
 test(`${model.id}: partial Hidden subject, restoration, clear/hide/navigation/model/isolate cleanup`,()=>{
  const hidden=identity.representationForPart(group.elements[0]).id;
  const state={...base,hiddenRepresentationIds:[hidden]},on=enterContextReveal(state,atlas,identity);
  assert.ok(on.contextReveal.targetRepresentationIds.includes(hidden));assert.ok(!eligible(on).some(p=>p.id===group.elements[0]));
  const restored=apply(on,s=>restoreNewestHidden(s,identity));assert.strictEqual(restored.contextReveal,on.contextReveal);assert.ok(eligible(restored).some(p=>p.id===group.elements[0]));
  for(const action of [clearActiveSelection,s=>hideSelectedRepresentations(s,identity),s=>selectRegion(s,'atlas:region:cervical'),s=>selectArea(s,null),s=>switchRegionModel(s,model.availableSystems),s=>exitContextReveal(isolateSelection(s,identity))])assert.equal(apply(on,action).contextReveal,undefined);
  const scoped=enterContextReveal(derive(isolateSelection(base,identity)),atlas,identity);assert.equal(apply(scoped,exitIsolation).contextReveal,undefined);
  const eye=apply(on,s=>toggleAllSystems(s,model.availableSystems));assert.strictEqual(eye.contextReveal,on.contextReveal);assert.deepEqual(eligible(eye),eligible({...state,visible:[]}));
 });
 test(`${model.id}: subject changes exit, same target keeps Reveal, Random root has no target`,()=>{
  const workspace=derive(isolateSelection(base,identity)),child=selectAssemblyMember(workspace,identity,group.elements[0]),on=enterContextReveal(child,atlas,identity);
  const same=apply(on,s=>selectAssemblyMember(s,identity,group.elements[0]));assert.strictEqual(same.contextReveal,on.contextReveal);assert.strictEqual(same.isolatedRepresentationIds,on.isolatedRepresentationIds);
  const next=apply(on,s=>selectAssemblyMember(s,identity,group.elements[1]));assert.equal(next.contextReveal,undefined);assert.strictEqual(next.isolatedRepresentationIds,on.isolatedRepresentationIds);
  const search=apply(on,s=>selectRepresentations(s,identity,[group.elements[1]]));assert.equal(search.contextReveal,undefined);
  assert.equal(contextRevealSubject({...workspace,selected:[],workspaceInspector:{modelId:model.id,conceptId:group.id}},atlas,identity),undefined);
 });
 test(`${model.id}: Reveal at 0/.3/.5/1 preserves explode key/offsets and floor/camera fields`,()=>{
  const parts=eligible(base),layout=createStableExplosionLayout(parts,model.id),key=explosionLayoutKey(parts,model.id);
  for(const explode of [0,.3,.5,1]){
   const state={...base,explode},on=enterContextReveal(state,atlas,identity);
   assert.equal(on.explode,explode);assert.equal(sceneFloorEligible(on),sceneFloorEligible(state));assert.equal(explosionLayoutKey(eligible(on),model.id),key);
   const next=createStableExplosionLayout(eligible(on),model.id);for(const id of group.elements){const a=layout.targets.get(id),b=next.targets.get(id);if(a&&b)assert.deepEqual(evaluateExplosionOffset(a,explode,layout.lanes.length),evaluateExplosionOffset(b,explode,next.lanes.length));}
   assert.equal(on.view,state.view);assert.equal(on.reset,state.reset);
  }
 });
}

test('renderer: bounded shared variants, target/context disjoint batches, sparse uploads and exact normal restoration',()=>{
 const modelId='bp3d-male-4',atlas={parts:[{id:'a'},{id:'b'},{id:'c'}]},group=new T.Group(),normal=new T.MeshStandardMaterial({transparent:false,depthWrite:true,side:T.DoubleSide});
 normal.onBeforeCompile=shader=>{shader.vertexShader='attribute float partIndex; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected; void main(){vec2 stateUv=vec2(0.0);partSelected = texture2D(selectionState, stateUv).r;}';shader.fragmentShader='varying float partVisible; varying float partSelected; void main(){if (partVisible < 0.5) discard;diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.008, 0.42, 0.32), partSelected);diffuseColor.a = mix(diffuseColor.a, 1.0, partSelected);}';};normal.customProgramCacheKey=()=>'base-test';
 const geometry=new T.BufferGeometry(),meshes=[0,1,2].map(()=>new T.Mesh(geometry,normal));for(const mesh of meshes)group.add(mesh);
 const r=createContextRevealRenderer(atlas,modelId,group);meshes.forEach((mesh,i)=>r.registerBatch(mesh,[i]));
 const data=new Float32Array(16);for(let i=0;i<3;i++)data[i*4+3]=1;
 const on={contextReveal:{mode:'context',modelId,targetRepresentationIds:[representationId(modelId,'b')]}};
 const initialVersion=r.texture.version;r.sync(on,data,1);assert.equal(r.texture.version,initialVersion+1);assert.equal(r.isTarget(1),true);assert.equal(r.isTarget(0),false);
 assert.deepEqual(meshes.map(m=>m.visible),[false,true,false]);const ghosts=group.children.filter(m=>!meshes.includes(m));assert.deepEqual(ghosts.map(m=>m.visible),[true,false,true]);assert.ok(ghosts.every(m=>m.geometry===geometry));assert.strictEqual(ghosts[0].material,ghosts[2].material);
 const target=meshes[1].material,context=ghosts[0].material;
 assert.equal(target.transparent,false);assert.equal(target.depthWrite,true);assert.equal(target.depthTest,true);assert.equal(target.opacity,1);
 assert.equal(context.transparent,true);assert.equal(context.depthWrite,false);assert.equal(context.depthTest,true);assert.equal(context.side,T.DoubleSide);assert.equal(context.forceSinglePass,true);assert.equal(context.blending,T.NormalBlending);assert.equal(r.contextOpacity.value,CONTEXT_REVEAL_OPACITY);
 const shader=()=>({uniforms:{},vertexShader:'',fragmentShader:''}),t=shader(),g=shader();target.onBeforeCompile(t,null);context.onBeforeCompile(g,null);
 assert.match(t.fragmentShader,/revealTarget < 0.5/);assert.match(g.fragmentShader,/revealTarget > 0.5/);assert.match(t.fragmentShader,/diffuseColor.a = 1.0/);assert.match(g.fragmentShader,/diffuseColor.a = revealContextOpacity/);assert.doesNotMatch(g.fragmentShader,/mix\(diffuseColor.rgb/);assert.strictEqual(t.uniforms.revealTargetMask.value,r.texture);
 const version=r.texture.version;for(let i=0;i<50;i++)assert.equal(r.sync(on,data,1),false);assert.equal(r.texture.version,version);
 data[7]=0;r.sync(on,data,2);assert.equal(r.isTarget(1),false);assert.ok(r.texture.image.data.every(n=>n===0));assert.ok(meshes.every(m=>m.material===normal&&m.visible));assert.ok(ghosts.every(m=>!m.visible));
 data[7]=1;r.sync(on,data,3);r.sync({},data,3);assert.ok(meshes.every(m=>m.material===normal&&m.visible));assert.ok(r.texture.image.data.every(n=>n===0));
 const objects=group.children.length;for(let i=0;i<20;i++){r.sync({...on,contextReveal:{...on.contextReveal,targetRepresentationIds:[representationId(modelId,i%2?'a':'c')]}},data,3);r.sync({},data,3);}assert.equal(group.children.length,objects);assert.strictEqual(ghosts[0].material,context);
 r.sync({...on,contextReveal:{...on.contextReveal,modelId:'female-study-v3'}},data,4);assert.ok(r.texture.image.data.every(n=>n===0));
 r.sync({...on,contextReveal:{...on.contextReveal,targetRepresentationIds:['b',representationId('female-study-v3','b')]}},data,4);assert.ok(r.texture.image.data.every(n=>n===0));
 let disposed=0;target.addEventListener('dispose',()=>disposed++);context.addEventListener('dispose',()=>disposed++);r.texture.addEventListener('dispose',()=>disposed++);r.dispose();r.dispose();assert.equal(disposed,3);assert.equal(group.children.length,3);assert.ok(meshes.every(m=>m.material===normal));assert.throws(()=>r.registerBatch(meshes[0],[0]),/disposed/);
 normal.dispose();geometry.dispose();
});
test('picking: exact target hit outranks nearer context, nearest target wins, off mode retains ordinary distance',()=>{
 assert.equal(revealHitWins(2,true,1,false),true);assert.equal(revealHitWins(1,false,2,true),false);assert.equal(revealHitWins(1,true,2,true),true);assert.equal(revealHitWins(2,true,1,true),false);assert.equal(revealHitWins(1,false,2,false),true);
});
