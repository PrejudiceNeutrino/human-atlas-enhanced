import test from 'node:test';
import assert from 'node:assert/strict';
import {motionMilliseconds,motionProgress,typewriterRamp} from '../app/motion.ts';
import {createClassicFloor,CLASSIC_FLOOR_RADIUS} from '../app/classic-floor.ts';

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
