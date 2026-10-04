import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {resolveSearchPartIds} from '../app/anatomy-search.ts';
import {buildDiscoveryIndex,filterDiscoveryEntries,sortDiscoveryEntries,searchDiscoveryEntries,discoveryWindow,shouldOpenDiscovery,DISCOVERY_ROW_HEIGHT} from '../app/anatomy-discovery.ts';
import {selectRepresentations} from '../app/hide-restore.ts';
import {partIsVisible} from '../app/visibility.ts';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sidecar=read('public/identity/core-crosswalk-v1.json');
const models=Object.values(MODEL_REGISTRY).map(model=>{
 const atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar);
 return {model,atlas,identity,entries:buildDiscoveryIndex(atlas,identity)};
});
for(const {model,atlas,identity,entries} of models){
 test(`${model.id}: complete selectable inventory, model-safe deduplicated representation counts`,()=>{
  assert.ok(entries.length>0);assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
  for(const entry of entries){
   assert.equal(entry.modelId,model.id);assert.ok(entry.modeledPieceCount>=1);
   assert.equal(entry.modeledPieceCount,entry.representationIds.length);
   assert.equal(new Set(entry.representationIds).size,entry.modeledPieceCount);
   assert.equal(new Set(entry.partIds).size,entry.modeledPieceCount);
   const expected=[...new Set(resolveSearchPartIds(entry.concept,identity))];assert.deepEqual(entry.partIds,expected);
   for(const id of entry.representationIds){const r=identity.representation(id);assert.equal(r.modelId,model.id);assert.ok(r.available&&r.vertexCount>0&&r.indexCount>0);}
   assert.deepEqual(new Set(entry.systemIds),new Set(atlas.parts.filter(p=>entry.partIds.includes(p.id)).map(p=>p.system)));
  }
 });
 test(`${model.id}: all sorts deterministic, name tie breakers and no mutation`,()=>{
  const before=entries.map(e=>e.id);
  for(const sort of ['name','largest','smallest']){
   const sorted=sortDiscoveryEntries(entries,sort);
   assert.deepEqual(sorted.map(e=>e.id),sortDiscoveryEntries([...entries].reverse(),sort).map(e=>e.id));
   for(let i=1;i<sorted.length;i++){
    const a=sorted[i-1],b=sorted[i];
    if(sort==='largest')assert.ok(a.modeledPieceCount>=b.modeledPieceCount);
    if(sort==='smallest')assert.ok(a.modeledPieceCount<=b.modeledPieceCount);
    if(sort==='name'||a.modeledPieceCount===b.modeledPieceCount)assert.ok(a.name.toLowerCase().localeCompare(b.name.toLowerCase(),'en')<=0);
   }
  }
  assert.deepEqual(entries.map(e=>e.id),before);
 });
 test(`${model.id}: System filter includes multi-system entries once and resets`,()=>{
  for(const system of new Set(atlas.parts.map(p=>p.system))){
   const filtered=filterDiscoveryEntries(entries,system);
   assert.deepEqual(filtered,entries.filter(e=>e.systemIds.includes(system)));
   assert.equal(new Set(filtered.map(e=>e.id)).size,filtered.length);
  }
  assert.deepEqual(filterDiscoveryEntries(entries,'all'),entries);
  const multi=entries.find(e=>e.systemIds.length>1);assert.ok(multi);
  for(const system of multi.systemIds)assert.equal(filterDiscoveryEntries(entries,system).filter(e=>e.id===multi.id).length,1);
 });
 test(`${model.id}: suggestions, aliases and shortest-name ranking preserved`,()=>{
  assert.ok(searchDiscoveryEntries(entries,'').length<=8);
  assert.equal(searchDiscoveryEntries(entries,'no such structure xyz').length,0);
  const matches=searchDiscoveryEntries(entries,'heart');assert.ok(matches.length>0);
  for(let i=1;i<matches.length;i++)assert.ok(matches[i-1].name.length<=matches[i].name.length);
  if(model.id!=='hra-female-v1.5')assert.ok(searchDiscoveryEntries(entries,'quads').some(e=>e.id==='ATLAS:group:quadriceps'));
 });
 test(`${model.id}: Browse uses Search resolution and ordinary selection/isolation semantics`,()=>{
  const entry=entries.find(e=>e.name.toLowerCase()==='foot')??entries.find(e=>e.modeledPieceCount>1);
  assert.ok(entry.modeledPieceCount>1);
  const state={visible:[],selected:[],isolate:false,rotate:false,explode:0,breastView:'tissue',view:'front',reset:0,regionId:'atlas:region:thoracic',areaId:'atlas:area:heart',regionPartIds:new Set(),areaPartIds:new Set(),hiddenRepresentationIds:entry.representationIds};
  const selected=selectRepresentations(state,identity,resolveSearchPartIds(entry.concept,identity));
  assert.deepEqual(selected.selected,entry.partIds);assert.deepEqual(selected.hiddenRepresentationIds,[]);
  assert.equal(selected.regionId,state.regionId);assert.equal(selected.areaId,state.areaId);
  assert.deepEqual(atlas.parts.filter(p=>partIsVisible(p,{...selected,isolate:true})).map(p=>p.id).sort(),[...entry.partIds].sort());
 });
}
test('male/female index derives independent counts by identity, no model fallback',()=>{
 const male=models.find(m=>m.model.id==='bp3d-male-4'),female=models.find(m=>m.model.id==='female-study-v3');
 const femaleById=new Map(female.entries.map(e=>[e.id,e]));
 const changed=male.entries.filter(e=>femaleById.has(e.id)&&femaleById.get(e.id).modeledPieceCount!==e.modeledPieceCount);
 assert.ok(changed.length>0);
 console.log(JSON.stringify({models:models.map(m=>({model:m.model.id,entries:m.entries.length,pieces:m.identity.representationCount,foot:m.entries.find(e=>e.name.toLowerCase()==='foot')?.modeledPieceCount})),modelSpecificExample:changed.slice(0,3).map(e=>({name:e.name,male:e.modeledPieceCount,female:femaleById.get(e.id).modeledPieceCount}))}));
});
test('invalid, zero geometry, unavailable and foreign representations safely excluded',()=>{
 const {atlas,identity}=models.find(m=>m.model.id==='bp3d-male-4'),valid=atlas.parts[0];
 const fixture={...atlas,concepts:[{id:'empty',name:'Empty',elements:[]},{id:'bad',name:'Bad',elements:['missing']},{id:'valid',name:'Valid',elements:[valid.id,valid.id]}]};
 const noCanonical={...identity,sourceConceptCanonicalId:()=>undefined};
 const entries=buildDiscoveryIndex(fixture,noCanonical);assert.equal(entries.length,5); // Valid + four existing verified shortcuts.
 assert.equal(entries.find(e=>e.id==='valid').modeledPieceCount,1);
 assert.deepEqual(buildDiscoveryIndex(fixture,{...identity,sourceConceptCanonicalId:()=> 'atlas:concept:empty',resolve:()=>[]}),[],'Mapped zero-geometry concepts never fall back to raw elements');
 for(const patch of [{modelId:'foreign'},{available:false},{vertexCount:0},{indexCount:0},{chunkIndex:999}]){
  const bad={...noCanonical,representationForPart:id=>{const r=identity.representationForPart(id);return r?{...r,...patch}:undefined;}};
  assert.deepEqual(buildDiscoveryIndex(fixture,bad),[]);
 }
});
test('local window bounds stay small through full inventory and reach last row',()=>{
 for(const {entries} of models)for(const height of [56,180,336,580])for(const top of [0,560,Math.max(0,entries.length*56-height)]){
  const {start,end}=discoveryWindow(entries.length,top,height);assert.ok(start>=0&&end<=entries.length);
  assert.ok(end-start<=Math.ceil(height/DISCOVERY_ROW_HEIGHT)+9);
  if(top===Math.max(0,entries.length*56-height))assert.equal(end,entries.length);
 }
});
test('slash guard preserves editable controls and modified/composing shortcuts',()=>{
 const base={key:'/',target:null,ctrlKey:false,metaKey:false,altKey:false,defaultPrevented:false,isComposing:false,repeat:false};
 assert.ok(shouldOpenDiscovery(base));
 for(const flag of ['ctrlKey','metaKey','altKey','defaultPrevented','isComposing','repeat'])assert.equal(shouldOpenDiscovery({...base,[flag]:true}),false);
 const editable={closest:selector=>{assert.match(selector,/contenteditable/);assert.match(selector,/select/);return {};}};
 assert.equal(shouldOpenDiscovery({...base,target:editable}),false);assert.equal(shouldOpenDiscovery({...base,key:'h'}),false);
});
