import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {allSystemsForAtlas,toggleAllSystems} from '../app/viewer-interaction.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {hiddenPartIdsForModel} from '../app/hide-restore.ts';
import {partIsVisible} from '../app/visibility.ts';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
for(const model of Object.values(MODEL_REGISTRY)){
 const atlas=read('public'+model.manifestUrl),identity=createIdentityIndex(model,atlas,read('public/identity/core-crosswalk-v1.json')),all=allSystemsForAtlas(atlas);
 const part=atlas.parts.find(p=>all.includes(p.system)),representation=identity.representationForPart(part.id);
 const state={visible:[all[0]],selected:[part.id],isolate:true,isolatedRepresentationIds:[representation.id],isolatedPartIds:new Set([part.id]),workspaceInspector:{modelId:model.id,conceptId:part.conceptId},hiddenRepresentationIds:[representation.id],breastView:'cutaway',explode:.37,view:'side',rotate:false,reset:8,cameraIntent:'preset',cameraIntentRevision:4,regionId:'atlas:region:head-jaw',areaId:'atlas:area:brainstem',regionPartIds:new Set(),areaPartIds:new Set()};
 test(`${model.id}: partial -> none -> all changes layers without losing workspace, selection, history or camera intent`,()=>{
  const off=toggleAllSystems(state,all),on=toggleAllSystems(off,all);
  assert.deepEqual(off.visible,[]);assert.deepEqual(on.visible,all);
  assert.equal(off.systemVisibilityRevision,1);assert.equal(on.systemVisibilityRevision,2);
  for(const [key,value] of Object.entries(state))if(key!=='visible'){
   assert.strictEqual(off[key],value,key+' survives off');assert.strictEqual(on[key],value,key+' survives on');
  }
  for(const next of [off,on])assert.equal(partIsVisible(part,{...next,hiddenPartIds:hiddenPartIdsForModel(identity,next.hiddenRepresentationIds)}),false,'individually hidden part stays suppressed even in isolation');
 });
 test(`${model.id}: all-on uses only available adult systems and ordinary off disables rendered layers`,()=>{
  assert.ok(all.length);assert.ok(!all.includes('pregnancy'));
  assert.ok(all.every(id=>atlas.parts.some(p=>p.system===id)));
  const ordinary={...state,isolate:false,selected:[],areaId:null,areaPartIds:undefined,regionPartIds:undefined};
  const off=toggleAllSystems(ordinary,all),on=toggleAllSystems(off,all);
  assert.equal(atlas.parts.filter(p=>partIsVisible(p,off)).length,0);
  assert.deepEqual(on.visible,all);assert.ok(atlas.parts.some(p=>partIsVisible(p,on)));
 });
}
