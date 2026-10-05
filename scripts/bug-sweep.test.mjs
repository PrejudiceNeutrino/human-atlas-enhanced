import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sceneFloorEligible} from '../app/floor-eligibility.ts';
import {createSceneFloor} from '../app/scene-floor.ts';
import {SCENE_FLOOR_PRESETS} from '../app/scene-floor-presets.ts';
import {createDisplayController,DISPLAY_KEY} from '../app/display.ts';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {buildDiscoveryIndex,searchDiscoveryEntries} from '../app/anatomy-discovery.ts';
import {featuredAnatomy,FEATURED_ANATOMY_IDS} from '../app/featured-anatomy.ts';
import {randomAnatomyWorkspace,randomAnatomyCandidates} from '../app/random-anatomy.ts';
import {selectAssemblyMember,isolationCameraKey,exitIsolation} from '../app/viewer-interaction.ts';
import {hideSelectedRepresentations,restoreNewestHidden,restoreHiddenRepresentations,restoreHiddenRepresentation} from '../app/hide-restore.ts';

const base={selected:[],isolate:false,explode:0,visible:['skeletal','muscular'],view:'three-quarter',reset:0,rotate:false,regionId:'atlas:region:body',areaId:null,hiddenRepresentationIds:[],breastView:'tissue'};
test('Floor targets assembled body/skeleton and suppresses every positive explosion and specimen context',()=>{
 assert.equal(sceneFloorEligible(base),true);assert.equal(sceneFloorEligible({...base,visible:['skeletal']}),true);
 for(const explode of [.0001,.01,.15,1])assert.equal(sceneFloorEligible({...base,explode}),false);
 for(const override of [{isolate:true},{areaId:'atlas:area:heart'},{regionId:'atlas:region:thoracic'},{visible:['digestive']},{visible:[]}])assert.equal(sceneFloorEligible({...base,...override}),false);
 const before=structuredClone(base);sceneFloorEligible(base);assert.deepEqual(base,before);
});
test('Every preset persists across suppression, interrupted fades and restoration; reduced motion settles immediately',()=>{
 for(const {id} of SCENE_FLOOR_PRESETS){
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},display=createDisplayController(storage);
  display.set({...display.getSnapshot(),sceneFloor:id});const floor=createSceneFloor('light',display.getSnapshot().sceneFloor);
  floor.setEligible(false,180);floor.update(.09,false,true);
  if(id!=='void')assert.equal(floor.group.visible,true);
  floor.update(.09,false,true);assert.equal(floor.group.visible,false);
  floor.setEligible(true,180);floor.update(.18,false,true);assert.equal(floor.group.visible,id!=='void');
  assert.equal(createDisplayController(storage).getSnapshot().sceneFloor,id);assert.equal(JSON.parse(values.get(DISPLAY_KEY)).sceneFloor,id);
  floor.setEligible(false,180);floor.update(.03,false,true);floor.setEligible(true,180);floor.update(.18,false,true);assert.equal(floor.group.visible,id!=='void');
  floor.setEligible(false,180);floor.update(.001,true,true);assert.equal(floor.group.visible,false);floor.setEligible(true,180);floor.update(.001,true,true);assert.equal(floor.group.visible,id!=='void');
  floor.setEligible(false);floor.setPreset('grid',180);floor.update(.18,false,true);assert.equal(floor.group.visible,false);floor.setEligible(true);assert.equal(floor.group.children[1].material.uniforms.uFloorPreset.value,2);
  floor.dispose();
 }
});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sidecar=read('public/identity/core-crosswalk-v1.json');
for(const model of Object.values(MODEL_REGISTRY)){
 const atlas=read('public'+model.manifestUrl),identity=createIdentityIndex(model,atlas,sidecar),entries=buildDiscoveryIndex(atlas,identity);
 test(`${model.id}: curated identities, availability, deduped counts and ordinary selection`,()=>{
  const featured=featuredAnatomy(entries,model.id);
  assert.deepEqual(featured.map(e=>e.id),FEATURED_ANATOMY_IDS.filter(id=>entries.some(e=>e.id===id)));
  assert.deepEqual(searchDiscoveryEntries(entries,''),featured);assert.deepEqual(featuredAnatomy([],model.id),[]);
  assert.equal(new Set(featured.map(e=>e.id)).size,featured.length);assert.equal(new Set(featured.map(e=>[...e.representationIds].sort().join('|'))).size,featured.length);
  if(model.id!=='hra-female-v1.5'){assert.equal(featured.length,14);assert.ok(new Set(featured.flatMap(e=>e.systemIds)).size>=6);}
  for(const e of featured){assert.equal(e.modelId,model.id);assert.equal(e.modeledPieceCount,new Set(e.representationIds).size);assert.equal(e.modeledPieceCount,new Set(e.partIds).size);for(const id of e.representationIds)assert.equal(identity.representation(id).modelId,model.id);}
  assert.deepEqual(featuredAnatomy(entries.map(e=>({...e,modelId:'foreign'})),model.id),[]);
 });
 test(`${model.id}: Random clears highlight while retaining scope, navigation, camera fit and member hide/restore`,()=>{
  const e=randomAnatomyCandidates(entries,identity)[0],state=randomAnatomyWorkspace({...base,regionId:'atlas:region:shoulder',areaId:'atlas:area:axilla'},e,identity);
  assert.equal(state.isolate,true);assert.deepEqual(state.selected,[]);assert.equal(state.inspectorOpen,false);assert.deepEqual(state.isolatedRepresentationIds,e.representationIds);assert.equal(state.regionId,'atlas:region:shoulder');assert.equal(state.areaId,'atlas:area:axilla');assert.equal(sceneFloorEligible(state),false);
  const key=isolationCameraKey(state,1.6);assert.notEqual(key,'');
  for(const id of e.partIds.slice(0,2)){
   const member=selectAssemblyMember(state,identity,id);assert.deepEqual(member.selected,[id]);assert.strictEqual(member.isolatedRepresentationIds,state.isolatedRepresentationIds);assert.equal(isolationCameraKey(member,1.6),key);
   const hidden=hideSelectedRepresentations(member,identity);assert.equal(hidden.hiddenRepresentationIds.length,1);
   for(const restored of [restoreNewestHidden(hidden,identity),restoreHiddenRepresentations(hidden),restoreHiddenRepresentation(hidden,hidden.hiddenRepresentationIds[0])]){assert.deepEqual(restored.hiddenRepresentationIds,[]);assert.strictEqual(restored.isolatedRepresentationIds,state.isolatedRepresentationIds);assert.equal(isolationCameraKey(restored,1.6),key);}
  }
  const surrounding=exitIsolation(state);assert.equal(surrounding.isolate,false);assert.deepEqual(surrounding.selected,[]);
  assert.strictEqual(randomAnatomyWorkspace(base,{...e,modelId:'foreign'},identity),base);
 });
}
