import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {buildDiscoveryIndex} from '../app/anatomy-discovery.ts';
import {randomAnatomyCandidates,chooseRandomAnatomy} from '../app/random-anatomy.ts';
import {createRotationController,normalizeRotation,orbitRotationSpeed,ROTATION_KEY} from '../app/rotation.ts';
import {createClassicFloor,CLASSIC_FLOOR_RADIUS} from '../app/classic-floor.ts';
import {hideSelectedRepresentations,restoreNewestHidden,restoreHiddenRepresentations,hiddenRepresentationsForModel,hiddenPartIdsForModel,shouldRestoreNewest} from '../app/hide-restore.ts';
import {isolateSelection,selectAssemblyMember,isolationCameraKey} from '../app/viewer-interaction.ts';
import {selectRepresentations} from '../app/hide-restore.ts';
import {partIsVisible} from '../app/visibility.ts';

test('Rotation has a faster calibrated default, independent multiplier range and safe values',()=>{
 assert.equal(orbitRotationSpeed(1),1.5);assert.ok(orbitRotationSpeed(1)>.65);
 for(const input of [null,'2',NaN,Infinity,{},undefined])assert.equal(normalizeRotation(input),1);
 assert.equal(normalizeRotation(-99),.25);assert.equal(normalizeRotation(99),3);
 assert.equal(orbitRotationSpeed(.25),.375);assert.equal(orbitRotationSpeed(3),4.5);
});
test('Rotation storage reloads, clamps and tolerates malformed/denied storage',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const controller=createRotationController(storage);let changes=0;const off=controller.subscribe(()=>changes++);
 controller.set(2);assert.equal(changes,1);assert.equal(createRotationController(storage).getSnapshot(),2);off();controller.set(3);assert.equal(changes,1);
 values.set(ROTATION_KEY,'99');assert.equal(createRotationController(storage).getSnapshot(),3);
 values.set(ROTATION_KEY,'"2"');assert.equal(createRotationController(storage).getSnapshot(),1);
 values.set(ROTATION_KEY,'malformed');assert.equal(createRotationController(storage).getSnapshot(),1);
 const denied=createRotationController({getItem:()=>{throw Error();},setItem:()=>{throw Error();}});denied.set(.5);assert.equal(denied.getSnapshot(),.5);
});
test('Classic floor is a finite filled stage with rim, fixed diameter and disabled raycasting',()=>{
 const floor=createClassicFloor('light'),children=floor.group.children;
 assert.equal(children.length,2);assert.equal(children[0].geometry.type,'CylinderGeometry');assert.equal(children[1].geometry.type,'RingGeometry');
 assert.equal(children[0].geometry.parameters.radiusTop,CLASSIC_FLOOR_RADIUS);assert.equal(CLASSIC_FLOOR_RADIUS*2,1);
 const box=new T.Box3().setFromObject(floor.group);assert.ok(box.max.y<0);assert.ok(box.getSize(new T.Vector3()).x<1.02);
 const hits=[];for(const mesh of children){mesh.raycast(new T.Raycaster(),hits);assert.equal(mesh.userData.presentationOnly,true);}assert.deepEqual(hits,[]);
 const before=children[0].material[1].color.getHex();floor.setTheme('dark');assert.notEqual(children[0].material[1].color.getHex(),before);
 for(const mesh of children){mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}
});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sidecar=read('public/identity/core-crosswalk-v1.json');
for(const model of Object.values(MODEL_REGISTRY)){
 const atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),entries=buildDiscoveryIndex(atlas,identity);
 const base={breastView:'tissue',explode:0,visible:[],selected:[],isolate:false,view:'front',rotate:false,reset:0,hiddenRepresentationIds:[]};
 test(`${model.id}: random uses only valid active-model 5-200-piece inventory and avoids repeat`,()=>{
  const pool=randomAnatomyCandidates(entries,identity);assert.ok(pool.length>1);
  for(const entry of pool){assert.equal(entry.modelId,model.id);assert.ok(entry.modeledPieceCount>=5&&entry.modeledPieceCount<=200);assert.equal(entry.representationIds.length,entry.modeledPieceCount);}
  assert.deepEqual(randomAnatomyCandidates(pool.map(e=>({...e,modelId:'foreign'})),identity),[]);
  assert.deepEqual(randomAnatomyCandidates(pool.map(e=>({...e,representationIds:e.representationIds.map(()=> 'invalid')})),identity),[]);
  const first=chooseRandomAnatomy(pool,null,()=>0),second=chooseRandomAnatomy(pool,first.id,()=>0);assert.notEqual(first.id,second.id);
  assert.equal(chooseRandomAnatomy([],null),null);assert.equal(chooseRandomAnatomy([first],first.id,()=>1),first);
  const selected=selectRepresentations(base,identity,first.partIds),isolated=isolateSelection(selected,identity);assert.deepEqual(isolated.isolatedRepresentationIds,first.representationIds);
 });
 test(`${model.id}: J walks the same newest-first ordering and preserves empty/active isolation camera`,()=>{
  const group=randomAnatomyCandidates(entries,identity)[0],scope=isolateSelection(selectRepresentations(base,identity,group.partIds),identity);
  let state=scope;const ids=group.partIds.slice(0,3);
  for(const id of ids)state=hideSelectedRepresentations(selectAssemblyMember(state,identity,id),identity);
  const order=hiddenRepresentationsForModel(identity,state.hiddenRepresentationIds).map(r=>r.sourcePartId.value);assert.deepEqual(order,[...ids].reverse());
  for(const id of [...ids].reverse()){
   const key=isolationCameraKey(state,1.6),next=restoreNewestHidden(state,identity);assert.equal(next.isolate,true);assert.strictEqual(next.isolatedRepresentationIds,scope.isolatedRepresentationIds);assert.equal(isolationCameraKey(next,1.6),key);
   assert.ok(!hiddenPartIdsForModel(identity,next.hiddenRepresentationIds).has(id));state=next;
  }
  assert.strictEqual(restoreNewestHidden(state,identity),state);
  const allHidden=hideSelectedRepresentations(scope,identity),restored=restoreHiddenRepresentations(allHidden);
  assert.equal(restored.isolate,true);assert.deepEqual(atlas.parts.filter(p=>partIsVisible(p,{...restored,hiddenPartIds:hiddenPartIdsForModel(identity,restored.hiddenRepresentationIds)})).map(p=>p.id).sort(),group.partIds.slice().sort());
 });
}
test('J keyboard guard rejects typing, editable ancestors, composition, repeat and modifiers',()=>{
 const base={key:'j',target:null,ctrlKey:false,metaKey:false,altKey:false,defaultPrevented:false,isComposing:false,repeat:false};
 assert.equal(shouldRestoreNewest(base),true);assert.equal(shouldRestoreNewest({...base,key:'J'}),true);
 for(const key of ['ctrlKey','metaKey','altKey','defaultPrevented','isComposing','repeat'])assert.equal(shouldRestoreNewest({...base,[key]:true}),false);
 for(const tag of ['input','textarea','select','contenteditable','combobox','textbox','searchbox','slider','spinbutton'])assert.equal(shouldRestoreNewest({...base,target:{closest:selector=>selector.includes(tag)?{}:null}}),false);
 assert.equal(shouldRestoreNewest({...base,key:'z'}),false);
});
