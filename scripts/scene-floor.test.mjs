import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {SCENE_FLOOR_PRESETS,normalizeSceneFloor} from '../app/scene-floor-presets.ts';
import {createSceneFloor} from '../app/scene-floor.ts';
import {createClassicFloor} from '../app/classic-floor.ts';
import {DISPLAY_DEFAULTS,DISPLAY_KEY,createDisplayController} from '../app/display.ts';

test('Seven allowed styles, deterministic validation and migration from old Display storage',()=>{
 assert.deepEqual(SCENE_FLOOR_PRESETS.map(p=>p.id),['classic','minimal','grid','scanner','orbital','event-horizon','void']);
 for(const {id} of SCENE_FLOOR_PRESETS)assert.equal(normalizeSceneFloor(id),id);
 for(const bad of [undefined,null,'Classic','removed','',3,{},['grid']])assert.equal(normalizeSceneFloor(bad),'classic');
 const values=new Map([[DISPLAY_KEY,JSON.stringify({brightness:1.2,contrast:.95})]]);
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const controller=createDisplayController(storage);assert.deepEqual(controller.getSnapshot(),{brightness:1.2,contrast:.95,sceneFloor:'classic'});
 let notices=0;const off=controller.subscribe(()=>notices++);
 for(const {id} of SCENE_FLOOR_PRESETS){controller.set({...controller.getSnapshot(),sceneFloor:id});assert.equal(createDisplayController(storage).getSnapshot().sceneFloor,id);}
 assert.equal(notices,6);off();
 values.set(DISPLAY_KEY,JSON.stringify({sceneFloor:'removed'}));assert.deepEqual(createDisplayController(storage).getSnapshot(),DISPLAY_DEFAULTS);
 controller.reset();assert.deepEqual(controller.getSnapshot(),DISPLAY_DEFAULTS);assert.deepEqual(JSON.parse(values.get(DISPLAY_KEY)),DISPLAY_DEFAULTS);
});

test('Classic geometry, palettes, placement and settled material flags match the reviewed helper',()=>{
 for(const theme of ['light','dark']){
  const reference=createClassicFloor(theme),floor=createSceneFloor(theme);
  const actual=floor.group.children[0].children;
  for(let i=0;i<actual.length;i++){
   const a=actual[i],b=reference.group.children[i];assert.equal(a.geometry.type,b.geometry.type);assert.deepEqual(a.geometry.parameters,b.geometry.parameters);assert.deepEqual(a.position,b.position);assert.deepEqual(a.rotation.toArray(),b.rotation.toArray());
   const materials=m=>Array.isArray(m.material)?m.material:[m.material];
   materials(a).forEach((m,index)=>{const r=materials(b)[index];assert.equal(m.color.getHex(),r.color.getHex());assert.equal(m.opacity,r.opacity);assert.equal(m.transparent,r.transparent);assert.equal(m.depthWrite,r.depthWrite);});
  }
  reference.group.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();new Set(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});floor.dispose();
 }
});

test('Every floor is unpickable, below body origin and bounded by the reviewed stage footprint',()=>{
 for(const {id} of SCENE_FLOOR_PRESETS){
  const floor=createSceneFloor('light',id),ray=new T.Raycaster(new T.Vector3(.2,1,0),new T.Vector3(0,-1,0));floor.group.updateMatrixWorld(true);
  assert.deepEqual(ray.intersectObject(floor.group,true),[]);
  floor.group.traverse(o=>{if(o instanceof T.Mesh)assert.equal(o.userData.presentationOnly,true);});
  const active=new T.Box3();floor.group.traverseVisible(o=>{if(o instanceof T.Mesh)active.union(new T.Box3().setFromObject(o));});
  if(id==='void')assert.equal(active.isEmpty(),true);else {assert.ok(active.max.y<0);assert.ok(active.getSize(new T.Vector3()).x<=1.01601);}
  floor.dispose();
 }
});

test('Static styles do no animation work; dynamic styles freeze while hidden and under live reduced motion',()=>{
 for(const {id,animated} of SCENE_FLOOR_PRESETS){
  const floor=createSceneFloor('dark',id),mesh=floor.group.children[1],time=mesh.material.uniforms.uFloorTime;
  assert.equal(floor.update(.05,false,true),animated);assert.equal(time.value,animated?.05:0);
  const phase=time.value;assert.equal(floor.update(100,false,false),false);assert.equal(time.value,phase);
  floor.update(.05,true,true);assert.equal(time.value,0);assert.equal(floor.group.visible,id!=='void');
  assert.equal(floor.update(.05,true,true),false);floor.dispose();
 }
});

test('Rapid interrupted switches settle, never overlap, reuse resources and dispose each resource once',()=>{
 const floor=createSceneFloor('light'),resources=[],disposals=new Map();
 floor.group.traverse(o=>{if(o instanceof T.Mesh)resources.push(o.geometry,...new Set(Array.isArray(o.material)?o.material:[o.material]));});
 for(const resource of resources)resource.addEventListener('dispose',()=>disposals.set(resource,(disposals.get(resource)??0)+1));
 for(let cycle=0;cycle<30;cycle++)for(const {id} of SCENE_FLOOR_PRESETS){
  floor.setPreset(id,160);floor.update(.03,false,true);floor.setTheme(cycle%2?'dark':'light');
  for(let i=0;i<8;i++){floor.update(.03,false,true);const visible=floor.group.children.filter(o=>o.visible&&floor.group.visible);assert.ok(visible.length<=1);}
  assert.equal(floor.group.visible,id!=='void');
 }
 assert.equal(disposals.size,0);
 const after=[];floor.group.traverse(o=>{if(o instanceof T.Mesh)after.push(o.geometry,...new Set(Array.isArray(o.material)?o.material:[o.material]));});assert.deepEqual(after,resources);
 floor.setPreset('scanner',160);floor.update(.01,true,true);assert.equal(floor.group.children[1].material.uniforms.uFloorPreset.value,3);assert.equal(floor.group.children[1].material.uniforms.uFloorTime.value,0);
 floor.dispose();assert.equal(disposals.size,resources.length);assert.ok([...disposals.values()].every(n=>n===1));
});

test('Scene integration keeps original anatomy-only picker/bounds/packing authority and model-only effect lifetime',()=>{
 const source=fs.readFileSync('app/scene.tsx','utf8'),stage=fs.readFileSync('app/scene-floor.ts','utf8');
 assert.match(source,/pickers\.forEach/);assert.match(source,/const bounds=atlas\.parts\.map/);assert.match(source,/createStableExplosionLayout\(visibleParts,modelId,focus\)/);assert.match(source,/\},\[atlas,modelId\]\)/);
 assert.doesNotMatch(stage,/atlas\.parts|RepresentationId|ModelId|resolveVisibility|createStableExplosionLayout|fitRegionCamera/);
 assert.match(source,/floor\.update\(delta,motionMedia\.matches,!document\.hidden\)/);
});
