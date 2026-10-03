import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {representationIdsForPartIds,hiddenPartIdsForModel,hideSelectedRepresentations,selectRepresentations,restoreHiddenRepresentations} from '../app/hide-restore.ts';
import {resolveVisibility,partIsVisible,currentVisibilityContext} from '../app/visibility.ts';
import {selectRegion,resetViewer,switchRegionModel} from '../app/region-navigation.ts';
import {selectArea,navigationSearch} from '../app/area-navigation.ts';
import {createExplosionLayout} from '../app/explosion-layout.ts';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sidecar=read('public/identity/core-crosswalk-v1.json');
const models=Object.values(MODEL_REGISTRY).map(model=>{const atlas=read(`public${model.manifestUrl}`);return {model,atlas,identity:createIdentityIndex(model,atlas,sidecar)};});
const [male,hra,female]=models;
const base={breastView:'tissue',explode:0,visible:['skeletal','cardiac','nervous'],selected:[],isolate:false,view:'side',rotate:false,reset:7,regionId:'atlas:region:body',hiddenRepresentationIds:[]};
const part=male.atlas.parts.find(p=>p.system==='skeletal'),other=male.atlas.parts.find(p=>p.system==='skeletal'&&p.id!==part.id);
const rid=(m,p)=>m.identity.representationForPart(p.id).id;
const derived=(m,s)=>({...s,hiddenPartIds:hiddenPartIdsForModel(m.identity,s.hiddenRepresentationIds)});
const hidden=(m,parts,s=base)=>hideSelectedRepresentations({...s,selected:parts.map(p=>p.id)},m.identity);
const visible=(m,s)=>m.atlas.parts.filter(p=>partIsVisible(p,derived(m,s)));
const result=(p,s,extra={})=>resolveVisibility(p,s,{...currentVisibilityContext(s),...extra});
const off={displayed:false,pickable:false,packingEligible:false};

test('representations remain model-bound for all three registered models',()=>{
 for(const m of models){const p=m.atlas.parts[0],id=rid(m,p);assert.ok(id.startsWith(`atlas:representation:${m.model.id}:`));assert.deepEqual([...hiddenPartIdsForModel(m.identity,[id])],[p.id]);for(const foreign of models.filter(x=>x!==m))assert.equal(hiddenPartIdsForModel(foreign.identity,[id]).size,0);}
});
test('raw source IDs, concept IDs and display names cannot hide geometry',()=>{
 assert.equal(hiddenPartIdsForModel(male.identity,[part.id,part.conceptId,part.name,male.identity.sourceConceptCanonicalId(part.conceptId)]).size,0);
 const s=hidden(male,[part]);assert.deepEqual(s.hiddenRepresentationIds,[rid(male,part)]);assert.ok(!s.hiddenRepresentationIds.includes(part.id));
});
test('single mesh hides exactly one representation and closes selection/isolate/rotation',()=>{
 const s=hidden(male,[part],{...base,isolate:true,rotate:true,inspectorOpen:true});assert.deepEqual(s.hiddenRepresentationIds,[rid(male,part)]);assert.deepEqual(s.selected,[]);assert.equal(s.isolate,false);assert.equal(s.rotate,false);assert.equal(s.inspectorOpen,false);
});
test('multi-piece canonical selection hides every resolved current-model representation',()=>{
 for(const m of models){const c=m.atlas.concepts.find(c=>c.elements.length>3&&c.elements.length<20),rs=m.identity.resolve(m.identity.sourceConceptCanonicalId(c.id),m.model.id);const s=hideSelectedRepresentations({...base,selected:rs.map(r=>r.sourcePart.id)},m.identity);assert.deepEqual(s.hiddenRepresentationIds,rs.map(r=>r.representation.id));assert.equal(hiddenPartIdsForModel(m.identity,s.hiddenRepresentationIds).size,rs.length);}
});
test('existing hidden IDs and duplicate selected pieces deduplicate without broadening',()=>{
 const s=hideSelectedRepresentations({...hidden(male,[other]),selected:[part.id,part.id,other.id]},male.identity);assert.deepEqual(s.hiddenRepresentationIds,[rid(male,other),rid(male,part)]);
});
test('hidden is not displayed, pickable or packing eligible',()=>assert.deepEqual(result(part,derived(male,hidden(male,[part]))),off));
test('hidden wins over explicit selection and every enabled filter/context',()=>{
 const s=derived(male,{...hidden(male,[part]),selected:[part.id],regionPartIds:new Set([part.id]),areaId:'atlas:area:heart',areaPartIds:new Set([part.id])});assert.deepEqual(result(part,s,{regionMember:true,areaMember:true,depthMember:true,contextGeometry:true}),off);
});
test('hidden wins over isolation even for the isolated selection',()=>assert.deepEqual(result(part,derived(male,{...hidden(male,[part]),selected:[part.id],isolate:true})),off));
test('search restores selected representations and selects them atomically',()=>{
 const s=selectRepresentations(hidden(male,[part,other]),male.identity,[part.id]);assert.deepEqual(s.hiddenRepresentationIds,[rid(male,other)]);assert.deepEqual(s.selected,[part.id]);assert.equal(result(part,derived(male,s)).displayed,true);
});
test('partial multi-piece search restore preserves unrelated hidden structures',()=>{
 const c=male.atlas.concepts.find(c=>c.elements.length>3&&c.elements.length<10&&!c.elements.includes(other.id)),s=hideSelectedRepresentations({...base,selected:[...c.elements.slice(0,2),other.id]},male.identity),chosen=selectRepresentations(s,male.identity,c.elements);assert.deepEqual(chosen.hiddenRepresentationIds,[rid(male,other)]);assert.deepEqual(chosen.selected,c.elements);
});
test('Restore hidden clears only the override, preserving disabled systems and selection',()=>{
 const s={...hidden(male,[part]),visible:[],selected:[other.id],isolate:true,explode:1,breastView:'cutaway',areaId:'atlas:area:heart'},restored=restoreHiddenRepresentations(s);assert.deepEqual(restored,{...s,hiddenRepresentationIds:[]});assert.equal(partIsVisible(part,derived(male,restored)),false);
});
test('system toggles preserve hiding; restore in disabled system does not enable it',()=>{
 const s=hidden(male,[part]);const disabled={...s,visible:[]},enabled={...disabled,visible:['skeletal']};assert.deepEqual(result(part,derived(male,enabled)),off);assert.equal(partIsVisible(part,derived(male,restoreHiddenRepresentations(disabled))),false);
});
test('region transitions preserve hiding and canonical focus stays independent',()=>{
 const s=hidden(male,[part]);for(const r of ['atlas:region:knee','atlas:region:body','atlas:region:shoulder'])assert.deepEqual(selectRegion(s,r).hiddenRepresentationIds,s.hiddenRepresentationIds);assert.equal(s.reset,base.reset);
});
test('teaching area/None transitions preserve hiding',()=>{
 const areas=read('public/areas/canonical-areas-v1.json').areas,s=hidden(male,[part]);for(const area of [...areas,null])assert.deepEqual(selectArea(s,area).hiddenRepresentationIds,s.hiddenRepresentationIds);
});
test('model switch clears hidden IDs/masks but preserves canonical navigation',()=>{
 const s={...derived(male,hidden(male,[part])),regionId:'atlas:region:thoracic',areaId:'atlas:area:heart'};const next=switchRegionModel(s,['cardiac']);assert.deepEqual(next.hiddenRepresentationIds,[]);assert.equal(next.hiddenPartIds,undefined);assert.equal(next.regionId,s.regionId);assert.equal(next.areaId,s.areaId);assert.deepEqual(next.selected,[]);
});
test('full reset clears hiding and retains deterministic Phase 3 reset semantics',()=>{
 const next=resetViewer({...derived(male,hidden(male,[part])),areaId:'atlas:area:heart'},['skeletal']);assert.deepEqual(next,{breastView:'tissue',visible:['skeletal'],regionId:'atlas:region:body',hiddenRepresentationIds:[],selected:[],isolate:false,explode:0,rotate:false,view:'three-quarter',reset:8});
});
test('Hide all system layers is independent from hidden state',()=>{
 const s={...hidden(male,[part]),visible:[],selected:[],isolate:false};assert.equal(visible(male,s).length,0);assert.deepEqual(s.hiddenRepresentationIds,[rid(male,part)]);assert.equal(visible(male,restoreHiddenRepresentations(s)).length,0);
});
test('visible count uses shared semantics without double-decrement for filtered pieces',()=>{
 const before=visible(male,base).length;assert.equal(visible(male,hidden(male,[part])).length,before-1);const disabled={...base,visible:['cardiac']};assert.equal(visible(male,hidden(male,[part],disabled)).length,visible(male,disabled).length);
});
test('exploded layout has exactly eligible cells and no hidden inventory gaps',()=>{
 const s=derived(male,{...hidden(male,[part,other]),explode:1}),eligible=male.atlas.parts.filter(p=>result(p,s).packingEligible),layout=createExplosionLayout(eligible);assert.equal(layout.cells.size,eligible.length);assert.equal(layout.cells.has(part.id),false);assert.equal(layout.cells.has(other.id),false);assert.deepEqual([...layout.cells.keys()].sort(),eligible.map(p=>p.id).sort());
});
test('foreign model representation cannot hide a coincident source ID',()=>{
 const shared=female.atlas.parts.find(p=>male.identity.representationForPart(p.id)),id=rid(female,shared);assert.equal(hiddenPartIdsForModel(male.identity,[id]).size,0);assert.equal(result(shared,derived(male,{...base,selected:[shared.id],hiddenRepresentationIds:[id]})).displayed,true);
});
test('unknown/malformed/encoded-alias hidden IDs are safely ignored',()=>{
 const invalid=['',null,123,{},'atlas:representation:bp3d-male-4:unknown',`atlas:representation:bp3d-male-4:%${part.id.charCodeAt(0).toString(16)}${part.id.slice(1)}`];assert.equal(hiddenPartIdsForModel(male.identity,invalid).size,0);assert.deepEqual(representationIdsForPartIds(male.identity,['unknown',rid(female,female.atlas.parts[0])]),[]);
});
test('female study hiding cannot leak to male',()=>assert.equal(hiddenPartIdsForModel(male.identity,hidden(female,[female.atlas.parts[0]]).hiddenRepresentationIds).size,0));
test('male hiding cannot leak to internal HRA',()=>assert.equal(hiddenPartIdsForModel(hra.identity,hidden(male,[part]).hiddenRepresentationIds).size,0));
test('hidden outside-area selected exception disappears and ordinary area resumes',()=>{
 const brain=male.atlas.concepts.find(c=>c.name==='brain'),area={...base,areaId:'atlas:area:heart',areaPartIds:new Set([other.id]),visible:['skeletal']};const selected=selectRepresentations(area,male.identity,brain.elements);assert.equal(visible(male,selected).length,brain.elements.length+1);const s=hideSelectedRepresentations(selected,male.identity);assert.deepEqual(visible(male,s).map(p=>p.id),[other.id]);assert.equal(s.areaId,area.areaId);
});
test('all breast/chest states retain pre-Phase-4 visibility when no hidden override exists',()=>{
 const source=execFileSync('git',['show','401d187642dc07221d3cf3e130bc40e16ab720f6:app/visibility.ts'],{encoding:'utf8'}),exports={};new Function('exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports);
 for(const breastView of ['tissue','cutaway','muscle'])for(const isolate of [false,true]){const s={...base,breastView,isolate,visible:female.model.availableSystems,selected:[female.atlas.parts[0].id]};for(const p of female.atlas.parts)assert.deepEqual(result(p,s),exports.resolveVisibility(p,s,currentVisibilityContext(s)));}
 for(const p of female.atlas.parts.filter(p=>/^VH_F_/.test(p.id)))for(const breastView of ['tissue','cutaway','muscle'])assert.deepEqual(result(p,derived(female,hidden(female,[p],{...base,breastView}))),off);
});
test('hide/restore preserves camera, explode, filters and excludes hidden IDs from URL',()=>{
 const s={...base,view:'back',explode:1,regionId:'atlas:region:thoracic',areaId:'atlas:area:heart',breastView:'muscle',visible:['cardiac']},next=hidden(male,[part],s);for(const key of ['view','reset','explode','regionId','areaId','breastView','visible'])assert.strictEqual(next[key],s[key]);assert.doesNotMatch(navigationSearch('',next.regionId,next.areaId),/representation|hidden|FJ/);
});
test('direct selection rejects unknown/foreign inputs and restores exactly a valid part',()=>{
 const s=hidden(male,[part,other]);assert.deepEqual(selectRepresentations(s,male.identity,[rid(female,female.atlas.parts[0]),'unknown']).hiddenRepresentationIds,s.hiddenRepresentationIds);const next=selectRepresentations(s,male.identity,[part.id,part.id]);assert.deepEqual(next.selected,[part.id]);assert.deepEqual(next.hiddenRepresentationIds,[rid(male,other)]);
});
