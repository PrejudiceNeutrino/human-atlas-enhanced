/** Offline exact source-identity projection; never classifies names, bounds or coordinates. */
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {areaValidationInput,validateAreas} from './validate-areas.mjs';
import {createAreaIndex} from '../app/areas.ts';
import {assertAreaRepresentationScopes,AREA_SCOPE_REVISION} from '../app/area-scopes.ts';

export const scopePath='public/areas/area-representation-scopes-v1.json';
export const scopeAuditPath='data/areas/representation-scope-audit-v1.json';
const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
export function generateAreaScopes(input){
 validateAreas(input); // Frozen matches and accepted mappings must still reproduce Phase 3.
 const {dataset:areas,audit:historical,sidecar,regions,indexes}=input;
 const provenance=[{sourceId:areas.donor.repository,sourcePath:'data/areas/area-audit-v1.json',sourceRevision:areas.donor.sha,note:'Exact frozen donor part set; source fidelity only, independent anatomical review pending.'}];
 const scopes=[],rows=[];
 for(const area of areas.areas){
  const matches=historical.matches.find(m=>m.areaId===area.id).matchedPartIds;
  for(const [modelId,identity] of Object.entries(indexes)){
   const method=modelId==='bp3d-male-4'?'frozen-donor-part-identity':modelId==='female-study-v3'?'exact-retained-source-part-identity':'no-accepted-source-scope';
   const retained=[],missing=[];
   for(const sourcePartId of matches){
    const representation=modelId==='hra-female-v1.5'?undefined:identity.representationForPart(sourcePartId);
    if(representation?.available&&representation.modelId===modelId&&representation.sourcePartId.namespace==='BP3D-part'&&representation.sourcePartId.relation==='exact'&&representation.sourcePartId.value===sourcePartId)retained.push({sourcePartId,representationId:representation.id});
    else missing.push({sourcePartId,reason:modelId==='hra-female-v1.5'?'No accepted HRA source scope.':'No exact retained registered BP3D source part.'});
   }
   if(modelId==='bp3d-male-4'&&missing.length)throw new Error(`Male donor parity missing for ${area.id}`);
   const api=createAreaIndex(areas,sidecar,regions,identity);
   const old=api.conceptRepresentationsForArea(area.id,modelId),ids=new Set(retained.map(r=>r.representationId));
   const removed=old.filter(r=>!ids.has(r.representation.id)).map(r=>({representationId:r.representation.id,sourcePartId:r.sourcePart.id,name:r.sourcePart.name,system:r.sourcePart.system})).sort((a,b)=>a.representationId.localeCompare(b.representationId,'en'));
   if(modelId!=='hra-female-v1.5')scopes.push({areaId:area.id,modelId,representationIds:retained.map(r=>r.representationId),method,provenance,review:{status:'source-derived'}});
   rows.push({areaId:area.id,name:area.name,modelId,canonicalConcepts:api.conceptsForArea(area.id).length,donorMatchedParts:matches.length,oldConceptExpandedRepresentations:old.length,scopedRepresentations:retained.length,reduction:old.length-retained.length,removed,retained,missingSourceParts:missing,method,review:{status:'source-derived'},unresolved:[],hasExplicitScope:modelId!=='hra-female-v1.5'});
  }
 }
 const dataset={schemaVersion:1,revision:AREA_SCOPE_REVISION,areaRevision:areas.revision,identityRevision:sidecar.mappingRevision,donor:areas.donor,scopes};
 assertAreaRepresentationScopes(dataset,areas,sidecar,indexes);
 // Ensure explicit geometry also has existing semantic evidence, without expanding it.
 for(const identity of Object.values(indexes))createAreaIndex(areas,sidecar,regions,identity,dataset);
 const audit={schemaVersion:1,revision:'representation-scope-audit-v1',scopeRevision:dataset.revision,areaRevision:areas.revision,identityRevision:sidecar.mappingRevision,donor:areas.donor,rows,coverage:Object.fromEntries(Object.keys(indexes).map(modelId=>[modelId,{explicitScopes:scopes.filter(s=>s.modelId===modelId).length,availableAreas:rows.filter(r=>r.modelId===modelId&&r.scopedRepresentations>0).length,retainedAreaPartMatches:rows.filter(r=>r.modelId===modelId).reduce((n,r)=>n+r.retained.length,0),missingAreaPartMatches:rows.filter(r=>r.modelId===modelId).reduce((n,r)=>n+r.missingSourceParts.length,0)}])),limitations:['Source-derived fidelity to frozen PR #1 heuristic matches; not independent anatomical validation.','Canonical semantic membership, region affiliations and historical Phase 3 expansion audit are unchanged.','Brachial plexus remains an incomplete-trunk corridor; female-specific pelvic membership requires separate evidence.','No name/spatial/concept fallback or HRA scope is fabricated.']};
 return {dataset,audit};
}
export function scopeValidationInput(){return {...areaValidationInput(),scopes:read(scopePath),scopeAudit:read(scopeAuditPath)};}
export function validateAreaScopes(input){
 assertAreaRepresentationScopes(input.scopes,input.dataset,input.sidecar,input.indexes);
 const expected=generateAreaScopes(input);
 if(!isDeepStrictEqual(expected.dataset,input.scopes))throw new Error('Area scope source/parity drift');
 if(!isDeepStrictEqual(expected.audit,input.scopeAudit))throw new Error('Area scope audit drift');
 return {ok:true,revision:input.scopes.revision,coverage:expected.audit.coverage};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.includes('--validate'))console.log(JSON.stringify(validateAreaScopes(scopeValidationInput()),null,2));
 else{
  const write=process.argv.includes('--write');if(!write&&!process.argv.includes('--check'))throw new Error('Use --write, --check or --validate');
  const generated=generateAreaScopes(areaValidationInput());
  for(const [p,data] of [[scopePath,generated.dataset],[scopeAuditPath,generated.audit]]){
   const url=new URL(`../${p}`,import.meta.url),text=JSON.stringify(data,null,1)+'\n';
   if(write)fs.writeFileSync(url,text);else if(fs.readFileSync(url,'utf8').replace(/\r\n/g,'\n')!==text)throw new Error(`Area scope drift: ${p}`);
  }
  console.log(JSON.stringify({revision:generated.dataset.revision,coverage:generated.audit.coverage},null,2));
 }
}
