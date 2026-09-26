import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {MODEL_REGISTRY,GEOMETRY_SETS,assertModelRegistry} from '../app/model-registry.ts';
import {createIdentityIndex,namespaceForConceptId,representationId} from '../app/identity-index.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Pure structural check. Candidate equivalences are reported, not silently promoted. */
export function auditCoreContracts({registry,geometrySets,sidecar,snapshot,manifests,manifestHashes}){
 const errors=[],seenRoutes=new Set(),canonicalIds=new Set(),externalOwners=new Map(),referencedConcepts=new Set(),representationIds=new Set();
 let linkCount=0,representationCount=0;
 try{if(registry===MODEL_REGISTRY)assertModelRegistry();}catch(error){errors.push(error.message);}
 if(sidecar.schemaVersion!==1||!sidecar.mappingRevision)errors.push('Invalid sidecar schema/revision');
 const allowedNamespaces=new Set(['FMA','UBERON','BP3D-part','HRA-node','Z-Anatomy','MVMT','other']);
 for(const concept of sidecar.concepts??[]){
  if(!/^atlas:concept:\d{6,}$/.test(concept.id)||canonicalIds.has(concept.id))errors.push(`Duplicate or malformed canonical ID ${concept.id}`);
  canonicalIds.add(concept.id);
  const x=concept.externalId;
  if(!x||!allowedNamespaces.has(x.namespace)||typeof x.value!=='string'||!x.value||x.namespace!==namespaceForConceptId(x.value))errors.push(`Malformed source namespace record for ${concept.id}`);
  if(x?.relation==='exact'){
   const key=`${x.namespace}\0${x.value}`,previous=externalOwners.get(key);
   if(previous&&previous!==concept.id)errors.push(`Conflicting exact external mapping ${key}`);
   externalOwners.set(key,concept.id);
  }
  if(!registry[concept.sourceModelId])errors.push(`Unknown source model for ${concept.id}`);
 }
 for(const [modelId,rows] of Object.entries(sidecar.mappings??{}))if(!registry[modelId])errors.push(`Mappings reference unknown model ${modelId}`);
 for(const [key,model] of Object.entries(registry)){
  if(model.id!==key||!model.manifestUrl?.startsWith('/models/')||!model.frameId||!model.sourceDatasetIds?.length||!model.geometrySetIds?.length||!model.mappingRevision||model.mappingRevision!==sidecar.mappingRevision)errors.push(`Invalid model registry record ${key}`);
  if(model.route){if(seenRoutes.has(model.route))errors.push(`Duplicate route ${model.route}`);seenRoutes.add(model.route);}
  if(model.kind==='study'&&!model.experimental)errors.push(`Study lacks experimental status ${key}`);
  for(const setId of model.geometrySetIds){const set=geometrySets[setId];if(!set||set.modelId!==key||set.frameId!==model.frameId)errors.push(`Representation set has wrong model/frame ${setId}`);}
  const atlas=manifests[key],reference=snapshot.models?.find(row=>row.modelId===key);
  if(!atlas||!reference){errors.push(`Missing manifest/snapshot reference ${key}`);continue;}
  if(reference.manifest!==model.manifestUrl||reference.sha256!==manifestHashes[key]||reference.partCount!==atlas.parts.length||reference.conceptCount!==atlas.concepts.length||reference.chunkCount!==atlas.chunks.length||reference.frameId!==model.frameId||reference.route!==model.route)errors.push(`Baseline snapshot mismatch ${key}`);
  const actualSystems=new Set(atlas.parts.map(part=>part.system));
  if(actualSystems.size!==new Set(model.availableSystems).size||[...actualSystems].some(system=>!model.availableSystems.includes(system)))errors.push(`Available system mismatch ${key}`);
  const parts=new Set(),concepts=new Set();
  for(const part of atlas.parts){
   if(parts.has(part.id))errors.push(`Duplicate source part ${key}:${part.id}`);parts.add(part.id);
   const repId=representationId(key,part.id);if(representationIds.has(repId))errors.push(`Duplicate representation ID ${repId}`);representationIds.add(repId);
   if(!atlas.chunks[part.chunk])errors.push(`Invalid chunk reference ${key}:${part.id}`);
   for(const offset of ['positions','normals','indices'])if(!Number.isInteger(part[offset])||part[offset]<0)errors.push(`Invalid ${offset} offset ${key}:${part.id}`);
  }
  for(const concept of atlas.concepts){if(concepts.has(concept.id))errors.push(`Duplicate source concept ${key}:${concept.id}`);concepts.add(concept.id);for(const id of concept.elements)if(!parts.has(id))errors.push(`Dangling manifest element ${key}:${concept.id}:${id}`);}
  const rows=sidecar.mappings?.[key];if(!Array.isArray(rows)){errors.push(`Missing mappings ${key}`);continue;}
  const mapped=new Set();
  for(const row of rows){
   if(mapped.has(row.sourceConceptId))errors.push(`Duplicate source concept mapping ${key}:${row.sourceConceptId}`);mapped.add(row.sourceConceptId);
   if(!concepts.has(row.sourceConceptId))errors.push(`Unresolved source concept ${key}:${row.sourceConceptId}`);
   if(!canonicalIds.has(row.canonicalId))errors.push(`Concept link references unknown concept ${row.canonicalId}`);referencedConcepts.add(row.canonicalId);
   if(!['exact','candidate'].includes(row.relation)||!['source-derived','unresolved','reviewed','candidate'].includes(row.reviewStatus))errors.push(`Invalid mapping relation/review ${key}:${row.sourceConceptId}`);
   if(row.relation==='exact'){
    const extKey=`${namespaceForConceptId(row.sourceConceptId)}\0${row.sourceConceptId}`,owner=externalOwners.get(extKey);
    if(owner&&owner!==row.canonicalId)errors.push(`Conflicting exact mapping ${extKey}`);
    externalOwners.set(extKey,row.canonicalId);
   }
  }
  if(mapped.size!==concepts.size)errors.push(`Missing source concept mappings ${key}`);
  if(rows.every(row=>canonicalIds.has(row.canonicalId)&&concepts.has(row.sourceConceptId))){
   try{const index=createIdentityIndex(model,atlas,sidecar);representationCount+=index.representationCount;linkCount+=index.linkCount;for(const part of atlas.parts){const rep=index.representationForPart(part.id);if(!rep||rep.modelId!==key||rep.frameId!==model.frameId||rep.geometrySetId!==model.geometrySetIds[0])errors.push(`Representation frame mismatch ${key}:${part.id}`);}}
   catch(error){errors.push(`Identity adapter failed ${key}: ${error.message}`);}
  }
 }
 for(const concept of sidecar.concepts??[])if(!referencedConcepts.has(concept.id)&&!concept.textOnly)errors.push(`Orphan external ID ${concept.id}`);
 for(const candidate of sidecar.candidates??[])if(!canonicalIds.has(candidate.left)||!canonicalIds.has(candidate.right)||candidate.left===candidate.right)errors.push(`Invalid candidate link ${candidate.sourceConceptId}`);
 const unresolved=sidecar.candidates??[];
 return {ok:errors.length===0,errors,canonicalConceptCount:canonicalIds.size,representationCount,sourceConceptMappingCount:referencedConcepts.size?Object.values(sidecar.mappings??{}).reduce((n,rows)=>n+rows.length,0):0,representationLinkCount:linkCount,candidateCount:unresolved.length,unresolved};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const sidecar=read('public/identity/core-crosswalk-v1.json'),snapshot=read('data/identity/phase-1-baseline.json'),audit=read('data/identity/mapping-audit.json');
 const manifests={},manifestHashes={};
 for(const [id,model] of Object.entries(MODEL_REGISTRY)){
  const filename=path.join(root,'public',model.manifestUrl.slice(1));
  if(!fs.existsSync(filename))throw new Error(`Missing manifest ${model.manifestUrl}`);
  const bytes=fs.readFileSync(filename);manifests[id]=JSON.parse(bytes);manifestHashes[id]=sha(bytes);
  for(const chunk of manifests[id].chunks){const file=path.join(root,'public',chunk.url.slice(1));if(!fs.existsSync(file))throw new Error(`Missing chunk ${chunk.url}`);}
 }
 const report=auditCoreContracts({registry:MODEL_REGISTRY,geometrySets:GEOMETRY_SETS,sidecar,snapshot,manifests,manifestHashes});
 assert.equal(audit.canonicalConceptCount,report.canonicalConceptCount);assert.equal(audit.sourceConceptMappingCount,report.sourceConceptMappingCount);assert.equal(audit.candidateCount,report.candidateCount);
 console.log(JSON.stringify({...report,unresolved:report.unresolved.map(candidate=>({sourceConceptId:candidate.sourceConceptId,left:candidate.left,right:candidate.right}))},null,2));
 if(!report.ok)process.exitCode=1;
}
