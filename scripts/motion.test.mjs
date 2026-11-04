import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {motionMilliseconds,motionProgress,typewriterRamp} from '../app/motion.ts';
import {createClassicFloor,CLASSIC_FLOOR_RADIUS} from '../app/classic-floor.ts';

// Exercise the scene's actual texture-update block, before any animation frame
// advances. This catches a delayed first highlight without needing WebGL.
const sceneSource=fs.readFileSync(new URL('../app/scene.tsx',import.meta.url),'utf8');
const highlightStart=sceneSource.indexOf('const selected=selection.has(p.id)&&visibility.displayed;');
const highlightEnd=sceneSource.indexOf('     markerPositions.set(',highlightStart);
assert.ok(highlightStart>=0&&highlightEnd>highlightStart);
const highlightCode=ts.transpileModule(sceneSource.slice(highlightStart,highlightEnd),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const updateHighlight=new Function('selection','p','visibility','data','dx','dy','dz','selectedData','highlights','motionMedia','ready','i',highlightCode);
function highlight({selected=true,displayed=true,reduced=false,ready=true,from=0,active}={}){
 const bytes=new Uint8Array([from,0,0,0]),pending=new Map(active?[[0,active]]:[]);
 updateHighlight(new Set(selected?['part']:[]),{id:'part'},{displayed},new Float32Array(4),0,0,0,bytes,pending,{matches:reduced},ready,0);
 return {value:bytes[0],pending};
}

test('A newly selected part is fully highlighted before the next paint, including interrupted fade-out',()=>{
 for(const from of [0,64,192,255]){
  const first=highlight({from});assert.equal(first.value,255);assert.equal(first.pending.size,0);
  const reselected=highlight({from,active:{from:255,to:0,start:performance.now()}});
  assert.equal(reselected.value,255);assert.equal(reselected.pending.size,0);
 }
});

test('Old highlights retain fade-out, while reduced-motion, loading and hidden parts stay correct',()=>{
 const fading=highlight({selected:false,from:255});assert.equal(fading.value,255);assert.equal(fading.pending.get(0).to,0);
 for(const options of [{selected:false,reduced:true},{selected:false,ready:false},{displayed:false,reduced:true}]){
  const result=highlight({...options,from:255});assert.equal(result.value,0);assert.equal(result.pending.size,0);
 }
 const hidden=highlight({displayed:false});assert.equal(hidden.value,0);assert.equal(hidden.pending.size,0);
});

test('CSS timings accept seconds and milliseconds; disabled timing settles immediately',()=>{
 assert.equal(motionMilliseconds(' 120ms '),120);
 assert.equal(motionMilliseconds('.28s'),280);
 for(const value of ['', 'bad','-1ms'])assert.equal(motionMilliseconds(value),0);
 assert.equal(motionProgress(0,0),1);
});
test('Finite reveal is monotonic, clamps early frames and settles exactly after a late frame',()=>{
 assert.equal(motionProgress(-200,280),0);
 let previous=0;
 for(let elapsed=0;elapsed<=280;elapsed+=7){const value=motionProgress(elapsed,280);assert.ok(value>=previous&&value<=1);previous=value;}
 assert.equal(motionProgress(10000,280),1);
});
test('Typing ramp starts fast, slows monotonically and each caret follows its completed letter',()=>{
 const steps=typewriterRamp(19);let end=0,previous=0;
 for(const t of steps){const delay=t.index*40+t.precedingWeight*(180-40),duration=40+t.weight*(180-40);assert.ok(Math.abs(delay-end)<1e-9);assert.ok(duration>=previous);end=delay+duration;previous=duration;}
 assert.equal(previous,180);assert.ok(end>1600&&end<1700);
 assert.deepEqual(typewriterRamp(1),[{index:0,weight:0,precedingWeight:0}]);
});
test('Pivot reveal preserves static geometry, theme, origin and non-pickable status',()=>{
 for(const theme of ['light','dark']){
  const floor=createClassicFloor(theme),children=[...floor.group.children],geometries=children.map(c=>c.geometry),positions=children.map(c=>c.position.clone());
  for(const value of [0,.25,.75,1]){
   floor.setReveal(value);assert.equal(floor.group.visible,value>0);
   children.forEach((mesh,i)=>{assert.strictEqual(mesh.geometry,geometries[i]);assert.deepEqual(mesh.position,positions[i]);assert.equal(mesh.userData.presentationOnly,true);for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){assert.equal(m.opacity,value);assert.equal(m.transparent,value<1);}});
  }
  assert.equal(children[0].geometry.parameters.radiusTop,CLASSIC_FLOOR_RADIUS);
  for(const mesh of children){mesh.geometry.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();}
 }
});
