import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createClassicFloor,CLASSIC_FLOOR_RADIUS} from '../app/classic-floor.ts';
import {createSceneFloor} from '../app/scene-floor.ts';

const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
const tokens=selector=>Object.fromEntries([...css.match(selector)[1].matchAll(/(--[\w-]+):([^;}]+)/g)].map(m=>[m[1],m[2]]));
const dark=tokens(/:root\[data-theme=dark\]\{([^}]+)\}/);
const resolve=name=>dark[name]?.startsWith('var(')?resolve(dark[name].slice(4,-1)):dark[name];
const luminance=color=>{
 const channels=color.match(/[a-f\d]{2}/gi).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
};
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(values[0]+.05)/(values[1]+.05);};
test('Dark filled controls retain readable text and clear charcoal separation with shared switch/focus tokens',()=>{
 assert.equal(resolve('--switch-active'),resolve('--primary'));
 assert.equal(resolve('--focus'),resolve('--ring'));
 assert.ok(contrast(resolve('--primary'),resolve('--primary-foreground'))>=4.5);
 assert.ok(contrast(resolve('--primary'),resolve('--card'))>=3);
 assert.ok(contrast(resolve('--primary-hover'),resolve('--primary-foreground'))>=4.5);
 assert.ok(contrast(resolve('--focus'),resolve('--background'))>=3);
});
test('Classic Light is lighter and more neutral; stage footprint, contact and Dark colors stay fixed',()=>{
 const floor=createClassicFloor('light'),stage=floor.group.children[0];
 const light='#'+stage.material[1].color.getHexString();
 assert.ok(luminance(light)>luminance('#d0d7dc'));
 const channels=c=>c.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16));
 const spread=c=>Math.max(...channels(c))-Math.min(...channels(c));
 assert.ok(spread(light)<spread('#d0d7dc'));
 assert.equal(stage.geometry.parameters.radiusTop,CLASSIC_FLOOR_RADIUS);assert.equal(CLASSIC_FLOOR_RADIUS,.56);
 assert.equal(stage.geometry.parameters.height,.018);assert.equal(stage.position.y,-.014);assert.equal(floor.group.children[1].position.y,-.0049);
 floor.setTheme('dark');assert.equal(stage.material[1].color.getHexString(),'303030');assert.equal(stage.material[0].color.getHexString(),'242424');assert.equal(floor.group.children[1].material.color.getHexString(),'626260');
 floor.group.traverse(o=>{o.geometry?.dispose();new Set(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m?.dispose());});
});
test('Procedural Light palettes remain independent of the Classic correction',()=>{
 for(const preset of ['minimal','grid','scanner','orbital','event-horizon']){
  const floor=createSceneFloor('light',preset),u=floor.group.children[1].material.uniforms;
  assert.equal(u.uFloorLine.value.getHexString(),'718697');assert.equal(u.uFloorAccent.value.getHexString(),'547c91');assert.equal(u.uFloorCenter.value.getHexString(),'647583');floor.dispose();
 }
});
