/** Read frozen donor evidence, write canonical sidecars only; never repack geometry. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createIdentityIndex} from '../app/identity-index.ts';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createRegionIndex,assertRegionDataset} from '../app/regions.ts';
import {BODY_REGION} from '../app/region-contracts.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const sha='7c2ea6ee4fe0022085c692d1a8ff25f7d4482a50',tag='donor/mvmt-base',repository='https://github.com/calvinyu94-debug/mvmt-atlas';
const write=process.argv.includes('--write');
if(!write&&!process.argv.includes('--check'))throw new Error('Use --write or --check');
const git=(args)=>execFileSync('git',args,{cwd:root,maxBuffer:30000000});
if(git(['rev-parse',tag]).toString().trim()!==sha)throw new Error('MVMT donor tag drift');
const bytes=git(['show',`${sha}:public/models/atlas.json`]),donor=JSON.parse(bytes);
const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
const sidecar=read('public/identity/core-crosswalk-v1.json');
const indexes=Object.fromEntries(Object.values(MODEL_REGISTRY).map(model=>[model.id,createIdentityIndex(model,read(`public${model.manifestUrl}`),sidecar)]));
const male=indexes['bp3d-male-4'];
const names=[['body','Whole body'],['head-jaw','Head & jaw'],['cervical','Cervical'],['shoulder','Shoulder'],['elbow-wrist','Elbow & wrist'],['thoracic','Thoracic'],['lumbar','Lumbar'],['hip','Hip'],['knee','Knee'],['ankle-foot','Ankle & foot']];
const valid=new Set(names.slice(1).map(([id])=>id));
const method='Frozen Part.region/Part.spans -> BP3D male source part -> unique most-specific Phase 1 exact link -> canonical membership. No bounds, names or chunks used for mapping.';
const provenance={sourceId:repository,sourceRevision:sha,sourcePath:'public/models/atlas.json',note:'Donor assignments are source-derived candidates for anatomical boundary review, not independent scientific approval.'};
const regions=names.map(([slug,name],order)=>({id:`atlas:region:${slug}`,name,...(order?{parentRegionId:BODY_REGION}:{}),order,provenance:[provenance],review:{status:'source-derived'}}));
// Index only exact relationships. Broad hierarchy links cannot seed membership.
const direct=new Map();
for(const c of sidecar.concepts){const rs=male.resolve(c.id,male.modelId);for(const r of rs)if(r.link.relation==='exact'){
 const list=direct.get(r.sourcePart.id)??[];list.push({conceptId:c.id,sourceConceptId:r.link.evidence.sourceId,size:rs.length});direct.set(r.sourcePart.id,list);
}}
const membership=new Map(),unresolved=[],mapped=[];
const seeds=donor.parts.map(p=>({partId:p.id,region:p.region??null,spans:p.spans??[]})).sort((a,b)=>a.partId.localeCompare(b.partId,'en'));
for(const p of seeds){
 const representation=male.representationForPart(p.partId);
 let reason=null;
 if(!representation||representation.sourcePartId.namespace!=='BP3D-part')reason='No current BP3D male source part; donor supplement excluded from Phase 2.';
 else if(!p.region)reason='Frozen donor has no primary region evidence; no regional membership inferred.';
 else if(!valid.has(p.region)||p.spans.some(r=>!valid.has(r)))reason='Unknown donor region evidence.';
 const links=(direct.get(p.partId)??[]).sort((a,b)=>a.size-b.size||a.conceptId.localeCompare(b.conceptId,'en'));
 const best=links.filter(r=>r.size===links[0]?.size);
 if(!reason&&best.length!==1)reason='No unique most-specific exact canonical relationship.';
 if(reason){unresolved.push({...p,reason});continue;}
 const link=best[0];mapped.push({partId:p.partId,...link});
 for(const [slug,role,field] of [[p.region,'primary','region'],...[...new Set(p.spans)].filter(r=>r!==p.region).map(r=>[r,'spanning','spans'])]){
  const regionId=`atlas:region:${slug}`,key=`${regionId}/${link.conceptId}/${role}`;
  const row=membership.get(key)??{regionId,conceptId:link.conceptId,role,evidence:[],review:{status:'source-derived'}};
  row.evidence.push({...provenance,sourcePartId:{namespace:'BP3D-part',value:p.partId},sourceConceptId:link.sourceConceptId,field,donorRegionId:slug});membership.set(key,row);
 }
}
const dataset={schemaVersion:1,revision:'canonical-regions-v1',identityRevision:sidecar.mappingRevision,donor:{repository,tag,sha,manifestSha256:createHash('sha256').update(bytes).digest('hex'),method},regions,memberships:[...membership.values()].sort((a,b)=>a.regionId.localeCompare(b.regionId,'en')||a.conceptId.localeCompare(b.conceptId,'en')||a.role.localeCompare(b.role,'en'))};
assertRegionDataset(dataset,sidecar);
const regionIndexes=Object.fromEntries(Object.entries(indexes).map(([model,id])=>[model,createRegionIndex(dataset,sidecar,id)]));
const multiple=new Map();for(const m of dataset.memberships){const r=multiple.get(m.conceptId)??new Set();r.add(m.regionId);multiple.set(m.conceptId,r);}
const audit={schemaVersion:1,revision:dataset.revision,donor:dataset.donor,canonicalRegionCount:regions.length,totalMemberships:dataset.memberships.length,primaryMemberships:dataset.memberships.filter(m=>m.role==='primary').length,spanningMemberships:dataset.memberships.filter(m=>m.role==='spanning').length,donorPartsExamined:seeds.length,donorPartsMapped:mapped.length,donorPartsUnresolved:unresolved.length,unresolvedCurrentBP3DParts:unresolved.filter(p=>male.representationForPart(p.partId)).length,excludedDonorSupplementParts:unresolved.filter(p=>!male.representationForPart(p.partId)).length,canonicalConceptsRepresented:multiple.size,conceptsInMultipleRegions:[...multiple].filter(([,r])=>r.size>1).map(([conceptId,r])=>({conceptId,regionIds:[...r].sort()})),regions:regions.map(r=>({regionId:r.id,name:r.name,neutral:r.id===BODY_REGION,concepts:regionIndexes[male.modelId].conceptsForRegion(r.id).length,primary:dataset.memberships.filter(m=>m.regionId===r.id&&m.role==='primary').length,spanning:dataset.memberships.filter(m=>m.regionId===r.id&&m.role==='spanning').length,models:Object.fromEntries(Object.entries(regionIndexes).map(([model,index])=>{const concepts=index.conceptsForRegion(r.id);const available=concepts.filter(c=>indexes[model].resolve(c,model).length);return [model,{availableConcepts:available.length,unavailableConcepts:concepts.length-available.length,representations:index.representationsForRegion(r.id,model).length}];}))})),mapped,unresolved};
function output(p,data){const url=new URL(`../${p}`,import.meta.url),content=JSON.stringify(data,null,1)+'\n';if(write){fs.mkdirSync(new URL('.',url),{recursive:true});fs.writeFileSync(url,content);}else if(!fs.existsSync(url)||fs.readFileSync(url,'utf8').replace(/\r\n/g,'\n')!==content)throw new Error(`Region drift: ${p}`);}
output('data/regions/mvmt-seed-v1.json',{schemaVersion:1,donor:dataset.donor,parts:seeds});
output('public/regions/canonical-regions-v1.json',dataset);
output('data/regions/region-audit-v1.json',audit);
console.log(JSON.stringify({...audit,mapped:undefined,unresolved:undefined,conceptsInMultipleRegions:audit.conceptsInMultipleRegions.length},null,2));
