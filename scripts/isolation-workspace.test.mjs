import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {isolateSelection,exitIsolation,clearActiveSelection,selectAssemblyMember,selectIncludedMember,isolationCameraKey} from '../app/viewer-interaction.ts';
import {hideSelectedRepresentations,hiddenPartIdsForModel,restoreHiddenRepresentation,restoreHiddenRepresentations,selectRepresentations} from '../app/hide-restore.ts';
import {resolveVisibility} from '../app/visibility.ts';
import {createStableExplosionLayout,evaluateExplosionOffset} from '../app/explosion-layout.ts';
import {selectRegion,switchRegionModel} from '../app/region-navigation.ts';
import {selectArea} from '../app/area-navigation.ts';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sidecar=read('public/identity/core-crosswalk-v1.json');
for(const model of Object.values(MODEL_REGISTRY)){
 const atlas=read('public'+model.manifestUrl),identity=createIdentityIndex(model,atlas,sidecar);
 const group=atlas.concepts.find(c=>c.elements.length>5&&c.elements.length<30),members=group.elements.slice(0,3);
 const outside=atlas.parts.find(p=>!group.elements.includes(p.id));
 const base={breastView:'tissue',explode:.6,visible:[],selected:group.elements,isolate:false,rotate:false,view:'side',reset:3,regionId:'atlas:region:shoulder',areaId:'atlas:area:axilla',regionPartIds:new Set(),areaPartIds:new Set(),hiddenRepresentationIds:[]};
 const derive=s=>({...s,hiddenPartIds:hiddenPartIdsForModel(identity,s.hiddenRepresentationIds)});
 const eligible=s=>atlas.parts.filter(p=>resolveVisibility(p,derive(s),{systems:new Set(s.visible),selected:new Set(s.selected)}).packingEligible);
 const shown=s=>eligible(s).map(p=>p.id).sort();
 const layout=s=>createStableExplosionLayout(eligible(s),model.id);
 const scope=()=>isolateSelection(base,identity);
 test(`${model.id}: ordinary selection, explicit entry/narrowing/exit and current-model authority`,()=>{
  const ordinary=selectRepresentations({...base,visible:model.availableSystems,areaId:null,regionPartIds:undefined},identity,group.elements);
  assert.equal(ordinary.isolate,false);assert.ok(shown(ordinary).includes(outside.id));
  const state=scope();assert.equal(state.explode,0);assert.equal(state.isolate,true);
  assert.ok(state.isolatedRepresentationIds.every(id=>identity.representation(id)?.modelId===model.id));
  assert.deepEqual(shown(state),[...group.elements].sort());
  const child=selectAssemblyMember(state,identity,members[0]);assert.strictEqual(child.isolatedRepresentationIds,state.isolatedRepresentationIds);
  const narrow=isolateSelection(child,identity);assert.deepEqual(shown(narrow),[members[0]]);
  assert.equal(narrow.isolatedRepresentationIds.length,1);assert.notEqual(isolationCameraKey(narrow,1.6),isolationCameraKey(state,1.6));
  const exit=exitIsolation(narrow);assert.equal(exit.isolate,false);assert.equal(exit.isolatedRepresentationIds,undefined);assert.strictEqual(exit.selected,narrow.selected);
  assert.strictEqual(isolateSelection({...child,selected:['unknown']},identity).isolatedRepresentationIds,state.isolatedRepresentationIds);
 });
 test(`${model.id}: repeated direct/Included inspection changes only active member, not camera or layout`,()=>{
  let state={...scope(),explode:.6,inspectorOpen:true};const original=state,originalLayout=layout(state),key=isolationCameraKey(state,1.6);
  for(const id of [...members,members[0]])for(const select of [selectAssemblyMember,selectIncludedMember]){
   state=select(state,identity,id);assert.deepEqual(state.selected,[id]);
   assert.strictEqual(state.isolatedRepresentationIds,original.isolatedRepresentationIds);
   assert.strictEqual(state.hiddenRepresentationIds,original.hiddenRepresentationIds);
   assert.equal(isolationCameraKey(state,1.6),key);assert.deepEqual(layout(state),originalLayout);
  }
  assert.strictEqual(selectIncludedMember(state,identity,outside.id),state);assert.strictEqual(selectAssemblyMember(state,identity,'unknown'),state);
  const clear=clearActiveSelection(state);assert.deepEqual(clear.selected,[]);assert.deepEqual(shown(clear),shown(original));
  assert.equal(isolationCameraKey(clear,1.6),key);assert.deepEqual(layout(clear),originalLayout);
  assert.equal(isolationCameraKey({...clear,inspectorOpen:true},1.6),key,'Reopening inspector cannot refit');
 });
 test(`${model.id}: hide, individual Restore and Restore all retain membership and camera through empty workspace`,()=>{
  let state={...scope(),explode:.6,inspectorOpen:true};const original=state,key=isolationCameraKey(state,1.6),fullLayout=layout(state);
  for(const member of members){state=hideSelectedRepresentations(selectAssemblyMember(state,identity,member),identity);
   assert.strictEqual(state.isolatedRepresentationIds,original.isolatedRepresentationIds);assert.equal(state.isolate,true);
   assert.equal(isolationCameraKey(state,1.6),key);assert.deepEqual(state.selected,[]);
   const p=atlas.parts.find(p=>p.id===member);assert.deepEqual(resolveVisibility(p,derive(state),{systems:new Set(state.visible),selected:new Set([member])}),{displayed:false,pickable:false,packingEligible:false});
   assert.ok(!layout(state).targets.has(member));
  }
  assert.equal(shown(state).length,group.elements.length-3);
  for(const member of members){state=restoreHiddenRepresentation(state,identity.representationForPart(member).id);assert.ok(shown(state).includes(member));assert.equal(isolationCameraKey(state,1.6),key);assert.strictEqual(state.isolatedRepresentationIds,original.isolatedRepresentationIds);}
  assert.deepEqual(layout(state),fullLayout);
  state=hideSelectedRepresentations({...state,selected:group.elements},identity);assert.equal(shown(state).length,0);assert.equal(state.isolate,true);assert.equal(isolationCameraKey(state,1.6),key);
  state=restoreHiddenRepresentations(state);assert.deepEqual(shown(state),shown(original));assert.deepEqual(layout(state),fullLayout);assert.deepEqual(state.selected,[]);
  assert.deepEqual(evaluateExplosionOffset(layout(state).targets.get(members[0]),.6,layout(state).lanes.length),evaluateExplosionOffset(fullLayout.targets.get(members[0]),.6,fullLayout.lanes.length));
 });
 test(`${model.id}: navigation, unrelated search and model switch retain established explicit transitions`,()=>{
  const state=hideSelectedRepresentations(selectAssemblyMember(scope(),identity,members[0]),identity);
  // Same-model search within the workspace uses the existing member semantics.
  assert.equal(selectAssemblyMember(state,identity,members[0]).isolate,true);
  // Discovery remains an explicit navigation action, as accepted in Phase 4.9.
  const search=selectRepresentations(state,identity,[outside.id]);assert.equal(search.isolate,false);assert.strictEqual(search.hiddenRepresentationIds,state.hiddenRepresentationIds);
  for(const next of [selectRegion(state,'atlas:region:body'),selectArea(state,null)]){assert.equal(next.isolate,false);assert.equal(next.isolatedRepresentationIds,undefined);assert.strictEqual(next.hiddenRepresentationIds,state.hiddenRepresentationIds);}
  const switched=switchRegionModel(state,[]);assert.equal(switched.isolate,false);assert.equal(switched.isolatedRepresentationIds,undefined);assert.deepEqual(switched.hiddenRepresentationIds,[]);assert.deepEqual(switched.selected,[]);
  const foreign=Object.values(MODEL_REGISTRY).find(m=>m.id!==model.id),foreignIdentity=createIdentityIndex(foreign,read('public'+foreign.manifestUrl),sidecar);
  const foreignId=foreignIdentity.representationForPart(read('public'+foreign.manifestUrl).parts[0].id).id;
  assert.equal(hiddenPartIdsForModel(identity,[foreignId]).size,0);
  assert.strictEqual(selectIncludedMember({...scope(),isolatedRepresentationIds:[foreignId]},identity,members[0]).selected,base.selected);
 });
}
