import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DISPLAY_DEFAULTS,DISPLAY_KEY,normalizeDisplay,createDisplayController} from '../app/display.ts';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {toggleIsolation,selectAssemblyMember,selectIncludedMember} from '../app/viewer-interaction.ts';
import {selectRepresentations,hideSelectedRepresentations,hiddenPartIdsForModel} from '../app/hide-restore.ts';
import {partIsVisible} from '../app/visibility.ts';
import {selectRegion,switchRegionModel} from '../app/region-navigation.ts';

test('Display values validate types, nonfinite values, defaults and independent bounds',()=>{
 for(const value of [null,undefined,'bad',[],{brightness:'1',contrast:NaN},{brightness:Infinity,contrast:-Infinity}])assert.deepEqual(normalizeDisplay(value),DISPLAY_DEFAULTS);
 assert.deepEqual(normalizeDisplay({brightness:99,contrast:-99}),{brightness:1.3,contrast:.85});
 assert.deepEqual(normalizeDisplay({brightness:.1,contrast:2}),{brightness:.7,contrast:1.15});
});
test('Display persists, reloads, resets only its own values, and tolerates unavailable storage',()=>{
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const controller=createDisplayController(storage);let changes=0;controller.subscribe(()=>changes++);
 controller.set({brightness:1.24,contrast:.91});assert.equal(changes,1);
 assert.deepEqual(createDisplayController(storage).getSnapshot(),{brightness:1.24,contrast:.91});
 controller.reset();assert.deepEqual(controller.getSnapshot(),DISPLAY_DEFAULTS);assert.deepEqual(JSON.parse(values.get(DISPLAY_KEY)),DISPLAY_DEFAULTS);
 values.set(DISPLAY_KEY,'broken JSON');assert.deepEqual(createDisplayController(storage).getSnapshot(),DISPLAY_DEFAULTS);
 const denied=createDisplayController({getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}});denied.set({brightness:.8,contrast:1.1});assert.equal(denied.getSnapshot().brightness,.8);
});
test('Contrast curve is neutral at baseline, monotonic, smooth and preserves endpoints/midpoint',()=>{
 const curve=(x,c)=>x**c/(x**c+(1-x)**c);
 for(const contrast of [.85,1,1.15]){let previous=-1;for(let i=0;i<=100;i++){const x=i/100,y=curve(x,contrast);assert.ok(y>previous);assert.ok(y>=0&&y<=1);if(contrast===1)assert.ok(Math.abs(y-x)<1e-12);previous=y;}assert.equal(curve(0,contrast),0);assert.equal(curve(.5,contrast),.5);assert.equal(curve(1,contrast),1);}
});
const read=path=>JSON.parse(fs.readFileSync(path,'utf8')),sidecar=read('public/identity/core-crosswalk-v1.json');
for(const model of Object.values(MODEL_REGISTRY))test(`${model.id}: persistent scope survives repeated direct and Included member picks, hidden precedence, exit and model switch`,()=>{
 const atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),group=atlas.concepts.find(c=>c.elements.length>5&&c.elements.length<30);
 const base={breastView:'tissue',explode:0,visible:[],selected:group.elements,isolate:false,rotate:false,view:'front',reset:0};
 let state=toggleIsolation(base,identity);const scopeIds=state.isolatedRepresentationIds;
 for(const id of group.elements){state=selectAssemblyMember(state,identity,id);assert.deepEqual(state.selected,[id]);assert.strictEqual(state.isolatedRepresentationIds,scopeIds);assert.deepEqual(atlas.parts.filter(p=>partIsVisible(p,state)).map(p=>p.id),group.elements);}
 state=selectIncludedMember(state,identity,group.elements[0]);assert.equal(state.isolate,true);
 assert.deepEqual(selectAssemblyMember(state,identity,'unknown'),state);
 const foreign=Object.values(MODEL_REGISTRY).find(m=>m.id!==model.id),foreignIdentity=createIdentityIndex(foreign,read(`public${foreign.manifestUrl}`),sidecar);
 const foreignScope={...state,isolatedRepresentationIds:[foreignIdentity.representationForPart(read(`public${foreign.manifestUrl}`).parts[0].id).id]};
 assert.equal(selectAssemblyMember(foreignScope,identity,group.elements[0]).isolate,false,'Foreign representation scope cannot authorize a member');
 const hidden=identity.representationForPart(group.elements[1]).id;
 const masked={...state,hiddenPartIds:hiddenPartIdsForModel(identity,[hidden])};assert.equal(atlas.parts.filter(p=>partIsVisible(p,masked)).length,group.elements.length-1);
 const surrounding=toggleIsolation(state,identity);assert.equal(surrounding.isolate,false);assert.equal(surrounding.isolatedRepresentationIds,undefined);assert.deepEqual(surrounding.selected,state.selected);
 assert.equal(hideSelectedRepresentations(state,identity).isolatedRepresentationIds,undefined);
 assert.equal(selectRepresentations(state,identity,group.elements).isolatedRepresentationIds,undefined);
 assert.equal(selectRegion(state,'atlas:region:body').isolatedRepresentationIds,undefined);
 assert.equal(switchRegionModel(state,[]).isolatedRepresentationIds,undefined);
});
