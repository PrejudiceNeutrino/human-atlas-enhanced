import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {Color} from 'three';
import {SYSTEMS} from '../app/anatomy.ts';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {representationIdsForPartIds,hiddenPartIdsForModel,hideSelectedRepresentations,selectRepresentations,restoreHiddenRepresentations,hiddenRepresentationsForModel,restoreHiddenRepresentation,shouldHideSelection} from '../app/hide-restore.ts';
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

test('realistic dissection restores the middle piece, then reverses the remaining stack',()=>{
 const pieces=male.atlas.parts.filter(p=>p.system==='skeletal').slice(0,3),[a,b,c]=pieces;
 let s={...base};for(const p of pieces)s=hideSelectedRepresentations(selectRepresentations(s,male.identity,[p.id]),male.identity);
 assert.equal(s.hiddenRepresentationIds.length,3);assert.deepEqual(hiddenRepresentationsForModel(male.identity,s.hiddenRepresentationIds).map(r=>r.id),[c,b,a].map(p=>rid(male,p)));
 for(const p of pieces)assert.deepEqual(result(p,derived(male,s)),off);
 s=restoreHiddenRepresentation(s,rid(male,b));assert.deepEqual(hiddenRepresentationsForModel(male.identity,s.hiddenRepresentationIds).map(r=>r.id),[c,a].map(p=>rid(male,p)));assert.equal(result(b,derived(male,s)).packingEligible,true);for(const p of [a,c])assert.deepEqual(result(p,derived(male,s)),off);
 s=restoreHiddenRepresentation(s,rid(male,c));s=restoreHiddenRepresentation(s,rid(male,a));assert.deepEqual(s.hiddenRepresentationIds,[]);assert.deepEqual(s.selected,[]);
 const again=hidden(male,pieces);assert.equal(restoreHiddenRepresentations(again).hiddenRepresentationIds.length,0);
});
test('individual restore preserves unrelated selection, camera, explode and every ordinary filter',()=>{
 const s={...hidden(male,[part,other]),selected:['unrelated'],visible:[],isolate:true,regionId:'atlas:region:shoulder',areaId:'atlas:area:axilla',explode:1,breastView:'cutaway',rotate:true,inspectorOpen:true},next=restoreHiddenRepresentation(s,rid(male,other));
 assert.deepEqual(next,{...s,hiddenRepresentationIds:[rid(male,part)]});assert.strictEqual(next.selected,s.selected);assert.equal(partIsVisible(other,derived(male,next)),false);assert.deepEqual(result(part,derived(male,next)),off);
 assert.deepEqual(restoreHiddenRepresentation(s,rid(female,female.atlas.parts[0])),s);
});
test('duplicate hides do not duplicate or reorder the newest-first presentation',()=>{
 const s=hidden(male,[part,other]),again=hideSelectedRepresentations({...s,selected:[part.id,part.id]},male.identity);assert.deepEqual(again.hiddenRepresentationIds,s.hiddenRepresentationIds);assert.deepEqual(hiddenRepresentationsForModel(male.identity,[...again.hiddenRepresentationIds,rid(male,part)]).map(r=>r.id),[rid(male,other),rid(male,part)]);
});
test('multi-piece hides remain individually restorable and foreign/unknown list records are ignored',()=>{
 const c=male.atlas.concepts.find(c=>c.elements.length===8),s=hideSelectedRepresentations({...base,selected:c.elements},male.identity);assert.equal(hiddenRepresentationsForModel(male.identity,s.hiddenRepresentationIds).length,8);const id=s.hiddenRepresentationIds[3],next=restoreHiddenRepresentation(s,id);assert.equal(next.hiddenRepresentationIds.length,7);assert.equal(next.hiddenRepresentationIds.includes(id),false);assert.deepEqual(next.selected,[]);
 assert.deepEqual(hiddenRepresentationsForModel(male.identity,['unknown',part.id,rid(female,female.atlas.parts[0]),...next.hiddenRepresentationIds]).map(r=>r.id),[...next.hiddenRepresentationIds].reverse());
});
const key=(overrides={})=>({key:'H',target:null,ctrlKey:false,metaKey:false,altKey:false,defaultPrevented:false,isComposing:false,repeat:false,...overrides});
test('H and h guard the same hide action, while slash remains a separate search action',()=>{
 for(const letter of ['H','h']){const s={...base,selected:[part.id]};assert.equal(shouldHideSelection(key({key:letter}),male.identity,s.selected),true);assert.deepEqual(hideSelectedRepresentations(s,male.identity).hiddenRepresentationIds,[rid(male,part)]);}
 assert.equal(shouldHideSelection(key({key:'/'}),male.identity,[part.id]),false);
 const page=fs.readFileSync('app/page.tsx','utf8');assert.match(page,/shouldHideSelection\(event,identity,state\.selected\).*?hideSelected\(\)/);assert.match(page,/onClick=\{hideSelected\}/);assert.match(page,/e\.key==='\/'/);
});
test('H rejects absent or unresolvable selection, foreign IDs and inappropriate key combinations',()=>{
 assert.equal(shouldHideSelection(key(),male.identity,[]),false);assert.equal(shouldHideSelection(key(),null,[part.id]),false);assert.equal(shouldHideSelection(key(),male.identity,['unknown',rid(female,female.atlas.parts[0])]),false);
 for(const field of ['ctrlKey','metaKey','altKey','defaultPrevented','isComposing','repeat'])assert.equal(shouldHideSelection(key({[field]:true}),male.identity,[part.id]),false,field);
});
test('H defers to editable ancestors including search, selects and contenteditable',()=>{
 let selector;assert.equal(shouldHideSelection(key({target:{closest:s=>{selector=s;return {};}}}),male.identity,[part.id]),false);
 for(const part of ['input','textarea','select','[contenteditable]','[role="combobox"]','[role="textbox"]','[role="searchbox"]'])assert.ok(selector.includes(part));
 assert.equal(shouldHideSelection(key({target:{closest:()=>null}}),male.identity,[part.id]),true);
});
test('selection shader replaces every system base with a saturated teal while retaining normal shading',()=>{
 const scene=fs.readFileSync('app/scene.tsx','utf8'),match=scene.match(/diffuseColor\.rgb = mix\(diffuseColor\.rgb, vec3\(([^)]+)\), partSelected\)/);assert.ok(match,'Full-strength, system-independent selection tint');const accent=match[1].split(',').map(Number);assert.ok(accent[1]>accent[0]*10&&accent[2]>accent[0]*10,'Saturated teal rather than white');assert.ok(accent[1]>.2&&accent[2]>.2,'Tint retains lit surface legibility');
 for(const system of SYSTEMS){const normal=new Color(system.color).toArray();assert.ok(Math.hypot(...normal.map((v,i)=>v-accent[i]))>.2,`${system.id} selection differs from its material`);}
 assert.match(scene,/diffuseColor\.a = mix\(diffuseColor\.a, 1\.0, partSelected\)/);assert.match(scene,/selectedData\[i\*4\]=selected\?255:0/);assert.match(scene,/selection\.has\(p\.id\)&&visibility\.displayed/);assert.doesNotMatch(scene,/OutlinePass|EffectComposer|BloomPass|SSAOPass/);
 const next=restoreHiddenRepresentation(hidden(male,[part]),rid(male,part));assert.deepEqual(next.selected,[],'Restore never auto-selects');
});
