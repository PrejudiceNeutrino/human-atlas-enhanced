/** Generate pinned identity crosswalk and immutable Phase 1 manifest snapshot. No mesh files are touched. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {MODEL_REGISTRY,assertModelRegistry} from '../app/model-registry.ts';
import {namespaceForConceptId} from '../app/identity-index.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const crosswalkPath=path.join(root,'public/identity/core-crosswalk-v1.json');
const snapshotPath=path.join(root,'data/identity/phase-1-baseline.json');
const auditPath=path.join(root,'data/identity/mapping-audit.json');
const write=process.argv.includes('--write');
if(!write&&!process.argv.includes('--check'))throw new Error('Use --write to generate or --check to verify the pinned files.');
assertModelRegistry();
const modelOrder=['bp3d-male-4','hra-female-v1.5','female-study-v3'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const readOptional=filename=>fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8')):null;
const previous=readOptional(crosswalkPath);
const pinned=new Map();
for(const [modelId,rows] of Object.entries(previous?.mappings??{}))for(const row of rows)pinned.set(`${modelId}\0${row.sourceConceptId}`,row.canonicalId);
let serial=Math.max(0,...[...pinned.values()].map(id=>Number(id.split(':').at(-1))||0));
const nextId=()=>`atlas:concept:${String(++serial).padStart(6,'0')}`;
const concepts=[];
const mappings={};
const candidates=[];
const sourceByModel=new Map();
const snapshots=[];
for(const modelId of modelOrder){
 const model=MODEL_REGISTRY[modelId];
 const manifestFile=path.join(root,'public',model.manifestUrl.replace(/^\//,''));
 const bytes=fs.readFileSync(manifestFile),atlas=JSON.parse(bytes);
 const sourceMap=new Map(atlas.concepts.map(concept=>[concept.id,concept]));
 const partIds=new Set(atlas.parts.map(part=>part.id));
 if(sourceMap.size!==atlas.concepts.length||partIds.size!==atlas.parts.length)throw new Error(`Duplicate source IDs in ${modelId}`);
 const previousModels=[...sourceByModel.entries()];
 const rows=[];
 for(const source of [...atlas.concepts].sort((a,b)=>a.id.localeCompare(b.id,'en'))){
  const sameSource=previousModels.map(([otherId,record])=>({modelId:otherId,record,concept:record.concepts.get(source.id)})).filter(item=>item.concept);
  const continuity=sameSource.find(item=>source.elements.some(partId=>item.concept.elements.includes(partId)));
  const oldId=pinned.get(`${modelId}\0${source.id}`);
  const canonicalId=oldId??continuity?.record.mapping.get(source.id)??nextId();
  const ambiguous=sameSource.length>0&&!continuity;
  const relation=ambiguous?'candidate':'exact';
  const reviewStatus=ambiguous?'unresolved':'source-derived';
  rows.push({sourceConceptId:source.id,canonicalId,relation,reviewStatus});
  if(!concepts.some(concept=>concept.id===canonicalId))concepts.push({id:canonicalId,externalId:{namespace:namespaceForConceptId(source.id),value:source.id,relation},sourceModelId:modelId,reviewStatus});
  if(ambiguous)for(const item of sameSource){const otherId=item.record.mapping.get(source.id);if(otherId&&otherId!==canonicalId)candidates.push({left:otherId,right:canonicalId,sourceConceptId:source.id,reason:'Same source concept ID, but no retained source part is shared between these model manifests.'});}
 }
 mappings[modelId]=rows;
 sourceByModel.set(modelId,{concepts:sourceMap,mapping:new Map(rows.map(row=>[row.sourceConceptId,row.canonicalId]))});
 snapshots.push({modelId,manifest:model.manifestUrl,sha256:digest(bytes),partCount:atlas.parts.length,conceptCount:atlas.concepts.length,chunkCount:atlas.chunks.length,source:atlas.source??null,manifestVersion:atlas.version,modelKind:model.kind,route:model.route,experimental:model.experimental,frameId:model.frameId});
}
concepts.sort((a,b)=>a.id.localeCompare(b.id,'en'));
candidates.sort((a,b)=>a.sourceConceptId.localeCompare(b.sourceConceptId,'en'));
const crosswalk={schemaVersion:1,mappingRevision:'core-crosswalk-v1',concepts,mappings,candidates};
const snapshot={schemaVersion:1,sourceCommit:'3ae9e8f60679f827a74b7e1150beac799033577f',mappingRevision:crosswalk.mappingRevision,models:snapshots};
const audit={schemaVersion:1,mappingRevision:crosswalk.mappingRevision,canonicalConceptCount:concepts.length,sourceConceptMappingCount:Object.values(mappings).reduce((n,rows)=>n+rows.length,0),candidateCount:candidates.length,unresolvedCount:candidates.length,candidates};
function output(filename,value){
 const content=JSON.stringify(value,null,1)+'\n';
 if(write){fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,content);}
 else if(!fs.existsSync(filename)||fs.readFileSync(filename,'utf8')!==content)throw new Error(`Pinned contract drift: ${path.relative(root,filename)}. Review source changes before regenerating.`);
}
output(crosswalkPath,crosswalk);output(snapshotPath,snapshot);output(auditPath,audit);
console.log(JSON.stringify({models:snapshots.map(({modelId,partCount,conceptCount,chunkCount})=>({modelId,partCount,conceptCount,chunkCount})),canonicalConceptCount:audit.canonicalConceptCount,sourceConceptMappingCount:audit.sourceConceptMappingCount,candidateCount:audit.candidateCount,mode:write?'write':'check'},null,2));
