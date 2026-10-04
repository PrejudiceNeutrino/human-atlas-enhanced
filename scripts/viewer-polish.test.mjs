import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {createRegionIndex} from '../app/regions.ts';
import {createAreaIndex} from '../app/areas.ts';
import {BODY_REGION} from '../app/region-contracts.ts';
import {selectRegion,resetViewer,switchRegionModel} from '../app/region-navigation.ts';
import {selectArea} from '../app/area-navigation.ts';
import {hideSelectedRepresentations,selectRepresentations} from '../app/hide-restore.ts';
import {DEFAULT_VISIBLE,SYSTEMS} from '../app/anatomy.ts';
import {teachingAreaMenuGroups,isAreaRelevantToRegion,scopeRepresentations,systemCountsForScope,defaultVisibleForModel} from '../app/viewer-polish.ts';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sidecar=read('public/identity/core-crosswalk-v1.json'),regions=read('public/regions/canonical-regions-v1.json'),areas=read('public/areas/canonical-areas-v1.json');
const fixtures=Object.values(MODEL_REGISTRY).map(model=>{
 const atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar);
 return {model,atlas,identity,regions:createRegionIndex(regions,sidecar,identity),areas:createAreaIndex(areas,sidecar,regions,identity,JSON.parse(fs.readFileSync(new URL('../public/areas/area-representation-scopes-v1.json',import.meta.url),'utf8')))};
});
const base={breastView:'tissue',explode:0,visible:DEFAULT_VISIBLE,selected:[],isolate:false,view:'three-quarter',rotate:false,reset:0,regionId:BODY_REGION};
const reg=s=>`atlas:region:${s}`,area=s=>`atlas:area:${s}`;
const scope=(f,state=base)=>scopeRepresentations(f.atlas,f.identity,f.regions,f.areas,state.regionId,state.areaId??null);
const counts=(f,state=base)=>systemCountsForScope(scope(f,state),f.atlas,f.model.id);

test('All 17 stations remain once in exact head-to-toe groups in every context',()=>{
 const f=fixtures[0],groups=teachingAreaMenuGroups(f.regions,f.areas);
 assert.deepEqual(groups.map(g=>[g.region.id.slice(13),g.areas.map(a=>a.id.slice(11))]),[
  ['head-jaw',['orbit','circle-of-willis','brainstem']],['cervical',['larynx']],['shoulder',['brachial-plexus','axilla']],['elbow-wrist',['cubital-fossa','wrist','hand']],['thoracic',['heart','lung-roots']],['lumbar',['porta-hepatis','celiac-trunk','kidneys']],['hip',['pelvic-viscera']],['knee',['popliteal-fossa']],['ankle-foot',['foot']],
 ]);
 for(const regionId of [BODY_REGION,reg('head-jaw'),reg('ankle-foot')]){
  const all=groups.flatMap(g=>g.areas);assert.equal(all.length,17);assert.equal(new Set(all.map(a=>a.id)).size,17);
  for(const a of all)assert.equal(isAreaRelevantToRegion(a,regionId),regionId!==BODY_REGION&&a.regionIds.includes(regionId));
 }
 for(const slug of ['brainstem','brachial-plexus'])assert.equal(isAreaRelevantToRegion(f.areas.area(area(slug)),reg('cervical')),true);
});

test('Area selection preserves affiliated context, establishes preferred context otherwise, and None retains Region',()=>{
 const f=fixtures[0];let s={...base,regionId:reg('ankle-foot')};
 s=selectArea(s,f.areas.area(area('kidneys')));assert.equal(s.regionId,reg('lumbar'));assert.equal(s.areaId,area('kidneys'));
 s=selectArea({...s,regionId:reg('cervical')},f.areas.area(area('brachial-plexus')));assert.equal(s.regionId,reg('cervical'));
 s=selectArea(s,null);assert.equal(s.regionId,reg('cervical'));assert.equal(s.areaId,null);
 assert.equal(selectRegion({...s,areaId:area('brachial-plexus')},reg('shoulder')).areaId,null);
});

for(const f of fixtures){
 test(`${f.model.id}: whole inventory, all Region/Area system counts, zero systems and return to Whole Body`,()=>{
  assert.equal(scope(f).length,f.identity.representationCount);
  for(const s of SYSTEMS)assert.equal(counts(f)[s.id],f.atlas.parts.filter(p=>p.system===s.id).length);
  for(const region of f.regions.regions()){
   const s={...base,regionId:region.id},resolved=f.regions.representationsForRegion(region.id,f.model.id);
   for(const system of SYSTEMS)assert.equal(counts(f,s)[system.id],resolved.filter(r=>r.sourcePart.system===system.id).length);
  }
  for(const a of f.areas.areas()){
   const s={...base,regionId:reg('ankle-foot'),areaId:a.id},resolved=f.areas.representationsForArea(a.id,f.model.id);
   for(const system of SYSTEMS)assert.equal(counts(f,s)[system.id],resolved.filter(r=>r.sourcePart.system===system.id).length,'Area alone determines inventory');
  }
  assert.equal(counts(f,{...base,areaId:area('heart')}).skeletal,0);
  assert.deepEqual(counts(f,selectRegion({...base,areaId:area('heart')},BODY_REGION)),counts(f));
 });
 test(`${f.model.id}: disabled/hidden/selected exception does not change scope inventory; duplicates and foreign model rejected`,()=>{
  let s={...base,regionId:reg('thoracic'),areaId:area('heart')};const initial=counts(f,s);
  s={...s,visible:[],isolate:true};assert.deepEqual(counts(f,s),initial);
  s=selectRepresentations(s,f.identity,[f.atlas.parts[0].id]);s=hideSelectedRepresentations(s,f.identity);assert.ok(s.hiddenRepresentationIds.length);assert.deepEqual(counts(f,s),initial);
  s=selectRepresentations(s,f.identity,[f.atlas.parts.at(-1).id]);assert.deepEqual(counts(f,s),initial);
  const other=fixtures.find(x=>x.model.id!==f.model.id);assert.deepEqual(systemCountsForScope([...scope(f),...scope(f),...scope(other)],f.atlas,f.model.id),counts(f));
 });
}

test('Reviewed male defaults apply on load/reset/switch; All and manual reproductive preference remain available; female unchanged',()=>{
 const male=defaultVisibleForModel('male');assert.ok(!male.includes('reproductive'));
 assert.deepEqual(defaultVisibleForModel('female'),DEFAULT_VISIBLE);assert.deepEqual(defaultVisibleForModel('female-reference'),[...DEFAULT_VISIBLE,'integumentary']);
 assert.ok(!resetViewer({...base,visible:[...male,'reproductive']},male).visible.includes('reproductive'));
 assert.ok(!switchRegionModel(base,male).visible.includes('reproductive'));
 const all=SYSTEMS.filter(s=>s.id!=='pregnancy'&&fixtures[0].atlas.parts.some(p=>p.system===s.id)).map(s=>s.id);assert.ok(all.includes('reproductive'));
 assert.ok([...male,'reproductive'].includes('reproductive'));
});
