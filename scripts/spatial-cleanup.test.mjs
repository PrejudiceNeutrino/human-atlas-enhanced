import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {createCameraIntent} from '../app/camera-intent.ts';
import {modelGrounding,STAGE_CONTACT_Y,GROUND_CLEARANCE,focusedViewport,isOrgansPresentation,ORGAN_SYSTEM_IDS} from '../app/spatial-presentation.ts';
import {fitRegionCamera} from '../app/region-camera.ts';
import {CLASSIC_FLOOR_RADIUS,createClassicFloor} from '../app/classic-floor.ts';
import {createSceneFloor} from '../app/scene-floor.ts';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {buildDiscoveryIndex} from '../app/anatomy-discovery.ts';
import {randomAnatomyWorkspace,randomWorkspaceInspector} from '../app/random-anatomy.ts';
import {selectAssemblyMember,clearActiveSelection,exitIsolation,isolateSelection} from '../app/viewer-interaction.ts';
import {resetViewer,switchRegionModel} from '../app/region-navigation.ts';
import {FEATURED_ANATOMY_IDS,featuredAnatomy} from '../app/featured-anatomy.ts';

const base={breastView:'tissue',explode:0,selected:[],visible:['skeletal','muscular'],isolate:false,view:'three-quarter',rotate:false,reset:0};
test('Camera intent distinguishes orbit/presets from dolly; only an eligible zero edge assists',()=>{
 const intent=createCameraIntent();
 assert.equal(intent.assist(0,.01,false),true);assert.equal(intent.assist(.01,.3,false),false);assert.equal(intent.assist(.3,0,false),false);assert.equal(intent.assist(0,.01,true),false);
 intent.orbit();assert.equal(intent.assist(0,.01,false),false);intent.reset();assert.equal(intent.customized(),false);
 intent.preset();assert.equal(intent.assist(0,.01,false),false);intent.reset();assert.equal(intent.assist(0,.7,false),true);
 const reset=resetViewer({...base,cameraIntent:'preset',cameraIntentRevision:4},base.visible);assert.equal(reset.cameraIntent,'reset');assert.equal(reset.cameraIntentRevision,5);
});
test('Focused camera keeps the old fit budget and zoom while centering desktop on the dock axis',()=>{
 for(const [w,h] of [[1912,905],[1440,900],[1280,600],[900,700]]){
  const area=focusedViewport(w,h);assert.equal((area.left+area.right)/2,w/2);
  const old={...area,left:w>1100?285:245,right:w-90};
  for(const bounds of [[[-.1,.2,-.08],[.13,.8,.12]],[[-.5,.3,-.04],[.2,.45,.06]]])for(const view of ['three-quarter','front','side','back']){
   const f=fitRegionCamera(bounds,view,34,w,h,area),previous=fitRegionCamera(bounds,view,34,w,h,old);assert.equal(f.distance,previous.distance);assert.equal(f.offsetX,0);
   const camera=new T.PerspectiveCamera(34,w/h,.005,100);camera.setViewOffset(w,h,f.offsetX,f.offsetY,w,h);camera.position.copy(f.center).addScaledVector(f.direction,f.distance);camera.lookAt(f.center);camera.updateMatrixWorld();
   const center=f.center.clone().project(camera);assert.ok(Math.abs((center.x+1)*w/2-w/2)<1e-8);
   for(let i=0;i<8;i++){const p=new T.Vector3(bounds[i&1?1:0][0],bounds[i&2?1:0][1],bounds[i&4?1:0][2]).project(camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;assert.ok(x>=area.left&&x<=area.right&&y>=area.top&&y<=area.bottom);}
  }
 }
});
test('Organs fit is scoped away from accepted body/skeleton and focused specimens',()=>{
 assert.equal(isOrgansPresentation({...base,visible:[...ORGAN_SYSTEM_IDS]}),true);
 for(const patch of [{visible:['skeletal']},{visible:[]},{visible:['muscular','digestive']},{isolate:true},{areaId:'atlas:area:heart'},{regionFocus:[[0,0,0],[1,1,1]]}])assert.equal(isOrgansPresentation({...base,visible:['digestive'],...patch}),false);
});
test('All stage footprints share exactly twelve percent growth, with unchanged contact elevation/profile',()=>{
 assert.ok(Math.abs(CLASSIC_FLOOR_RADIUS/.5-1.12)<1e-12);
 const floor=createClassicFloor('light'),stage=floor.group.children[0];assert.equal(stage.geometry.parameters.height,.018);assert.ok(Math.abs(stage.position.y+.009-STAGE_CONTACT_Y)<1e-12);
 const procedural=createSceneFloor('light','grid');assert.equal(procedural.group.children[1].geometry.parameters.width,CLASSIC_FLOOR_RADIUS*2);procedural.dispose();
 floor.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();new Set(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});
});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sidecar=read('public/identity/core-crosswalk-v1.json');
for(const model of Object.values(MODEL_REGISTRY)){
 const atlas=read('public'+model.manifestUrl),identity=createIdentityIndex(model,atlas,sidecar),entries=buildDiscoveryIndex(atlas,identity);
 test(`${model.id}: model-specific grounding is fixed across scope/floor/selection changes`,()=>{
  const before=JSON.stringify(atlas.parts),offset=modelGrounding(atlas.parts),support=atlas.parts.filter(p=>p.system==='skeletal');
  assert.ok(Math.abs(Math.min(...support.map(p=>p.bounds[0][1]))+offset-STAGE_CONTACT_Y-GROUND_CLEARANCE)<1e-10);
  assert.equal(modelGrounding(atlas.parts),offset);assert.equal(JSON.stringify(atlas.parts),before);
 });
 test(`${model.id}: Random inspector survives child clear without selecting the workspace, and cleans up on exit/narrow/model`,()=>{
  const entry=entries.find(e=>e.modeledPieceCount>5&&e.modeledPieceCount<100),workspace=randomAnatomyWorkspace(base,entry,identity);
  assert.deepEqual(workspace.selected,[]);assert.equal(randomWorkspaceInspector(workspace,entries,identity)?.id,entry.id);
  const child=selectAssemblyMember(workspace,identity,entry.partIds[0]);assert.deepEqual(child.selected,[entry.partIds[0]]);assert.deepEqual(child.workspaceInspector,workspace.workspaceInspector);
  const cleared=clearActiveSelection(child);assert.deepEqual(cleared.selected,[]);assert.strictEqual(cleared.isolatedRepresentationIds,workspace.isolatedRepresentationIds);assert.equal(randomWorkspaceInspector(cleared,entries,identity)?.id,entry.id);
  for(const state of [exitIsolation(cleared),isolateSelection(child,identity),switchRegionModel(child,base.visible),{...cleared,workspaceInspector:{modelId:'foreign',conceptId:entry.id}}])assert.equal(randomWorkspaceInspector(state,entries,identity),null);
 });
 test(`${model.id}: manually curated canonical Spine and kidney preserve authoritative model availability/counts`,()=>{
  const featured=featuredAnatomy(entries,model.id);assert.equal(new Set(FEATURED_ANATOMY_IDS).size,FEATURED_ANATOMY_IDS.length);
  if(model.id!=='hra-female-v1.5'){assert.ok(featured.some(e=>e.id==='FMA13478'&&e.name.toLowerCase()==='vertebral column'));assert.ok(featured.some(e=>e.id==='FMA7203'));}
  for(const e of featured){assert.equal(e.modeledPieceCount,new Set(e.representationIds).size);assert.equal(e.modelId,model.id);}
 });
}
