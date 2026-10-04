import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {createRegionIndex} from '../app/regions.ts';
import {createAreaIndex} from '../app/areas.ts';
import {scopeRepresentations,systemCountsForScope} from '../app/viewer-polish.ts';
import {allSystemsForAtlas,selectIncludedMember,toggleAllSystems,showAllSystems} from '../app/viewer-interaction.ts';
import {selectRepresentations,hiddenPartIdsForModel,hideSelectedRepresentations,restoreHiddenRepresentations} from '../app/hide-restore.ts';
import {partIsVisible} from '../app/visibility.ts';
import {THEME_KEY,THEME_MODES,normalizeTheme,resolveTheme,createThemeController} from '../app/theme.ts';
import {navigationSearch} from '../app/area-navigation.ts';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sidecar=read('public/identity/core-crosswalk-v1.json'),regions=read('public/regions/canonical-regions-v1.json'),areas=read('public/areas/canonical-areas-v1.json');
const base={breastView:'tissue',explode:0,visible:[],selected:[],isolate:false,rotate:false,view:'side',reset:3,regionId:'atlas:region:shoulder',areaId:'atlas:area:axilla',hiddenRepresentationIds:[]};
for(const model of Object.values(MODEL_REGISTRY)){
 const atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),ri=createRegionIndex(regions,sidecar,identity),ai=createAreaIndex(areas,sidecar,regions,identity);
 const group=atlas.concepts.find(c=>c.elements.length>5&&c.elements.length<30),member=group.elements[0],other=atlas.parts.find(p=>!group.elements.includes(p.id));
 const display=s=>atlas.parts.filter(p=>partIsVisible(p,{...s,hiddenPartIds:hiddenPartIdsForModel(identity,s.hiddenRepresentationIds)})).map(p=>p.id);
 for(const explode of [0,1])test(`${model.id}: isolated member drill-down at explode ${explode}, filters and context preserved`,()=>{
  const hidden=identity.representationForPart(other.id).id;
  const state={...base,selected:group.elements,isolate:true,explode,regionPartIds:new Set(),areaPartIds:new Set(),hiddenRepresentationIds:[hidden]};
  assert.deepEqual(display(state),group.elements);
  const next=selectIncludedMember(state,identity,member);assert.equal(next.isolate,true);assert.deepEqual(next.selected,[member]);assert.deepEqual(display(next),[member]);
  for(const key of ['regionId','areaId','visible','hiddenRepresentationIds','explode','view','reset','regionPartIds','areaPartIds'])assert.strictEqual(next[key],state[key]);
  const surrounding={...next,isolate:false,selected:[]};assert.equal(display(surrounding).length,0,'Disabled systems/empty station remain excluded after isolate exit');
  assert.deepEqual(selectIncludedMember(state,identity,other.id),state,'Non-member cannot drill into group');
  assert.deepEqual(selectIncludedMember(state,identity,'unknown'),state,'Invalid model-specific input is rejected');
 });
 test(`${model.id}: ordinary member and unrelated search retain reviewed behavior`,()=>{
  const state={...base,visible:allSystemsForAtlas(atlas),areaId:null,regionId:'atlas:region:body',selected:group.elements};
  const next=selectIncludedMember(state,identity,member);assert.equal(next.isolate,false);assert.ok(display(next).includes(other.id));
  assert.equal(selectRepresentations({...state,isolate:true},identity,[other.id]).isolate,false);
  const hidden=hideSelectedRepresentations({...state,selected:[member,other.id]},identity);
  const restored=selectIncludedMember({...hidden,selected:group.elements,isolate:true},identity,member);
  assert.deepEqual(restored.hiddenRepresentationIds,[identity.representationForPart(other.id).id]);assert.deepEqual(display(restored),[member]);
 });
 test(`${model.id}: reversible systems uses All inventory and preserves independent dissection/navigation/counts`,()=>{
  const all=allSystemsForAtlas(atlas);assert.ok(all.includes('reproductive'));assert.ok(!all.includes('pregnancy'));
  const scope=scopeRepresentations(atlas,identity,ri,ai,base.regionId,base.areaId),counts=systemCountsForScope(scope,atlas,model.id);
  const state={...base,visible:all,hiddenRepresentationIds:[identity.representationForPart(member).id],selected:[],regionPartIds:new Set(scope.map(r=>r.sourcePartId.value)),areaPartIds:new Set(scope.map(r=>r.sourcePartId.value))};
  const off=toggleAllSystems(state,all);assert.deepEqual(off.visible,[]);assert.deepEqual(display(off),[]);
  const on=toggleAllSystems(off,all);assert.deepEqual(on,showAllSystems(off,all));assert.deepEqual(on.visible,all);assert.ok(!display(on).includes(member));
  for(const s of [off,on]){assert.strictEqual(s.hiddenRepresentationIds,state.hiddenRepresentationIds);assert.equal(s.regionId,state.regionId);assert.equal(s.areaId,state.areaId);assert.deepEqual(systemCountsForScope(scopeRepresentations(atlas,identity,ri,ai,s.regionId,s.areaId),atlas,model.id),counts);}
  assert.deepEqual(restoreHiddenRepresentations(off).visible,[]);assert.deepEqual(display(restoreHiddenRepresentations(off)),[]);
 });
}

function host(saved=null,dark=false){
 const values=new Map(saved===null?[]:[[THEME_KEY,saved]]),listeners=new Set(),applied=[];
 const media={matches:dark,addEventListener:(name,fn)=>listeners.add(fn),removeEventListener:(name,fn)=>listeners.delete(fn)};
 const controller=createThemeController({storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},media,apply:t=>applied.push(t)});
 return {controller,values,applied,listeners,os:dark=>{media.matches=dark;listeners.forEach(fn=>fn());}};
}
test('Theme modes, explicit Light default and invalid preferences',()=>{
 assert.deepEqual(THEME_MODES,['light','dark','system']);
 for(const value of [null,undefined,'',{},'auto','DARK'])assert.equal(normalizeTheme(value),'light');
 for(const saved of [null,'invalid'])assert.deepEqual(host(saved,true).controller.getSnapshot(),{mode:'light',resolved:'light'});
 assert.equal(resolveTheme('system',true),'dark');assert.equal(resolveTheme('system',false),'light');
});
test('Every explicit mode persists and survives initialization',()=>{
 const h=host();for(const mode of THEME_MODES){h.controller.setMode(mode);assert.equal(h.values.get(THEME_KEY),mode);assert.equal(host(h.values.get(THEME_KEY)).controller.getSnapshot().mode,mode);}
});
test('System follows OS changes, explicit modes ignore OS, snapshots notify only presentation changes',()=>{
 const h=host('system');let notified=0;const unsubscribe=h.controller.subscribe(()=>notified++);
 h.os(true);assert.equal(h.controller.getSnapshot().resolved,'dark');assert.equal(notified,1);
 h.controller.setMode('light');const snapshot=h.controller.getSnapshot();h.os(false);h.os(true);assert.strictEqual(h.controller.getSnapshot(),snapshot);
 h.controller.setMode('dark');h.os(false);assert.equal(h.controller.getSnapshot().resolved,'dark');
 unsubscribe();h.controller.dispose();assert.equal(h.listeners.size,0);
});
test('Unavailable storage is safe; theme controller never changes anatomy or URL',()=>{
 const state={...base,isolate:true,explode:1,selected:['FJ1'],hiddenRepresentationIds:['model-bound-id']},before=structuredClone(state),url=navigationSearch('',base.regionId,base.areaId);
 const controller=createThemeController({storage:{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}},media:{matches:true,addEventListener:()=>{},removeEventListener:()=>{}},apply:()=>{}});
 assert.equal(controller.getSnapshot().mode,'light');for(const mode of THEME_MODES)controller.setMode(mode);
 assert.deepEqual(state,before);assert.equal(navigationSearch('',base.regionId,base.areaId),url);assert.doesNotMatch(url,/theme/);
});
