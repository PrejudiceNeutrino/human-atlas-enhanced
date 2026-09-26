import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {MODEL_REGISTRY,GEOMETRY_SETS,modelForRoute,modelForViewer} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {resolveVisibility} from '../app/visibility.ts';
import {auditCoreContracts} from './validate-core-contracts.mjs';

const read=relative=>JSON.parse(fs.readFileSync(new URL(`../${relative}`,import.meta.url),'utf8'));
const sidecar=read('public/identity/core-crosswalk-v1.json');
const snapshot=read('data/identity/phase-1-baseline.json');
const manifests={},manifestHashes={},indexes={};
for(const [id,model] of Object.entries(MODEL_REGISTRY)){
 const bytes=fs.readFileSync(new URL(`../public${model.manifestUrl}`,import.meta.url));
 manifests[id]=JSON.parse(bytes);manifestHashes[id]=createHash('sha256').update(bytes).digest('hex');
 indexes[id]=createIdentityIndex(model,manifests[id],sidecar);
}
const input=()=>({registry:MODEL_REGISTRY,geometrySets:GEOMETRY_SETS,sidecar,snapshot,manifests,manifestHashes});
const clone=value=>structuredClone(value);

test('registry keeps two routes and registers the internal HRA reference',()=>{
 assert.equal(modelForRoute('/male')?.id,'bp3d-male-4');
 assert.equal(modelForRoute('/female')?.id,'female-study-v3');
 assert.equal(modelForRoute('/female-reference'),null);
 assert.equal(modelForViewer('female-reference').id,'hra-female-v1.5');
 assert.deepEqual(Object.keys(MODEL_REGISTRY).sort(),['bp3d-male-4','female-study-v3','hra-female-v1.5']);
 assert.deepEqual(Object.values(manifests).map(atlas=>atlas.parts.length),[2234,888,2245]);
});

test('every source concept resolves to exactly its existing ordered mesh elements',()=>{
 for(const [modelId,atlas] of Object.entries(manifests))for(const source of atlas.concepts){
  const canonicalId=indexes[modelId].sourceConceptCanonicalId(source.id);
  assert.ok(canonicalId,`${modelId}:${source.id}`);
  assert.deepEqual(indexes[modelId].resolve(canonicalId,modelId).map(item=>item.sourcePart.id),source.elements,`${modelId}:${source.id}`);
 }
 const male=indexes['bp3d-male-4'],study=indexes['female-study-v3'];
 const one=manifests['bp3d-male-4'].concepts.find(c=>c.elements.length===1);
 const many=manifests['bp3d-male-4'].concepts.find(c=>c.elements.length>1);
 assert.equal(male.resolve(male.sourceConceptCanonicalId(one.id),'bp3d-male-4').length,1);
 assert.ok(male.resolve(male.sourceConceptCanonicalId(many.id),'bp3d-male-4').length>1);
 assert.deepEqual(study.resolve(male.sourceConceptCanonicalId(one.id),'bp3d-male-4'),[],'foreign model ID cannot return this model’s coordinates');
 const maleOnly=sidecar.mappings['bp3d-male-4'].find(row=>!sidecar.mappings['female-study-v3'].some(other=>other.canonicalId===row.canonicalId));
 assert.ok(maleOnly);
 assert.deepEqual(study.resolve(maleOnly.canonicalId,'female-study-v3'),[],'missing female representation stays unavailable');
});

test('same source part across male and female study has distinct model/frame representations',()=>{
 const id='FJ1252';
 const male=indexes['bp3d-male-4'].representationForPart(id),study=indexes['female-study-v3'].representationForPart(id);
 assert.ok(male&&study);assert.notEqual(male.id,study.id);assert.notEqual(male.frameId,study.frameId);
 assert.equal(male.sourcePartId.value,id);assert.equal(study.sourcePartId.value,id);
 assert.equal(male.sourcePartId.namespace,'BP3D-part');
});

test('15 shared FMA IDs without common retained source parts remain candidates',()=>{
 assert.equal(sidecar.candidates.length,15);
 for(const candidate of sidecar.candidates){assert.notEqual(candidate.left,candidate.right);const right=sidecar.mappings['female-study-v3'].find(row=>row.canonicalId===candidate.right);assert.equal(right.relation,'candidate');assert.equal(right.reviewStatus,'unresolved');}
});

test('visibility keeps current display semantics and reserves independent pick/packing states',()=>{
 const atlas=manifests['female-study-v3'];
 const fat=atlas.parts.find(p=>p.id==='VH_F_fat_L'),muscle=atlas.parts.find(p=>p.system==='muscular');
 const systems=new Set(['mammary','muscular']);
 const context={systems,selected:new Set()};
 assert.deepEqual(resolveVisibility(fat,{isolate:false,breastView:'tissue'},context),{displayed:true,pickable:true,packingEligible:true});
 assert.equal(resolveVisibility(fat,{isolate:false,breastView:'cutaway'},context).displayed,false);
 assert.equal(resolveVisibility(fat,{isolate:false,breastView:'muscle'},context).displayed,false);
 assert.deepEqual(resolveVisibility(fat,{isolate:false,breastView:'tissue'},{...context,contextGeometry:true}),{displayed:true,pickable:false,packingEligible:false});
 assert.deepEqual(resolveVisibility(fat,{isolate:false,breastView:'tissue'},{...context,hidden:true}),{displayed:false,pickable:false,packingEligible:false});
 assert.equal(resolveVisibility(fat,{isolate:false,breastView:'tissue'},{...context,loaded:false}).displayed,false);
 assert.equal(resolveVisibility(fat,{isolate:true,breastView:'muscle'},{...context,selected:new Set([fat.id])}).displayed,true);
 assert.equal(resolveVisibility(muscle,{isolate:false,breastView:'tissue'},context).packingEligible,true);
});

test('validator catches identity, namespace, frame and manifest corruption',()=>{
 assert.equal(auditCoreContracts(input()).ok,true);
 const cases=[
  x=>{x.sidecar.concepts.push(clone(x.sidecar.concepts[0]));return 'Duplicate or malformed canonical ID';},
  x=>{x.sidecar.mappings['bp3d-male-4'][0].canonicalId='atlas:concept:999999';return 'unknown concept';},
  x=>{x.sidecar.concepts[0].externalId.namespace='MVMT';return 'Malformed source namespace';},
  x=>{x.sidecar.concepts[1].externalId=clone(x.sidecar.concepts[0].externalId);return 'Conflicting exact external mapping';},
  x=>{x.sidecar.mappings['foreign-model']=[];return 'unknown model';},
  x=>{x.geometrySets['atlas:geometry:bp3d-male-4'].frameId='female-study-v3-stage';return 'wrong model/frame';},
  x=>{x.registry['bp3d-male-4'].manifestUrl='';return 'Invalid model registry record';},
  x=>{x.snapshot.models[0].sha256='bad';return 'snapshot mismatch';},
  x=>{x.manifests['bp3d-male-4'].concepts[0].elements.push('MISSING');return 'Dangling manifest element';},
  x=>{x.manifests['bp3d-male-4'].parts[0].chunk=999;return 'Invalid chunk reference';},
  x=>{x.manifests['bp3d-male-4'].parts.push(clone(x.manifests['bp3d-male-4'].parts[0]));return 'Duplicate representation ID';},
  x=>{x.sidecar.concepts.push({id:'atlas:concept:999998',externalId:{namespace:'other',value:'orphan',relation:'exact'},sourceModelId:'bp3d-male-4',reviewStatus:'source-derived'});return 'Orphan external ID';},
 ];
 for(const mutate of cases){const x=clone(input()),message=mutate(x),report=auditCoreContracts(x);assert.equal(report.ok,false,message);assert.ok(report.errors.some(error=>error.includes(message)),`${message}: ${report.errors.join('; ')}`);}
});
