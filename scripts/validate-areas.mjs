import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {assertAreaDataset} from '../app/areas.ts';
import {generateAreas} from './area-generation.mjs';

const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
export function areaValidationInput(artifacts=true){
 const sidecar=read('public/identity/core-crosswalk-v1.json');
 return {sidecar,regions:read('public/regions/canonical-regions-v1.json'),seed:read('data/areas/pr1-seed-v1.json'),...(artifacts?{dataset:read('public/areas/canonical-areas-v1.json'),audit:read('data/areas/area-audit-v1.json')}:{}),indexes:Object.fromEntries(Object.values(MODEL_REGISTRY).map(m=>[m.id,createIdentityIndex(m,read(`public${m.manifestUrl}`),sidecar)]))};
}
export function validateAreas({dataset,audit,seed,sidecar,regions,indexes}){
 assertAreaDataset(dataset,sidecar,regions);
 if(new Set(seed.parts.map(p=>p.id)).size!==seed.parts.length)throw new Error('Duplicate donor source part');
 const expected=generateAreas(seed,sidecar,regions,indexes);
 if(!isDeepStrictEqual(dataset,expected.dataset))throw new Error('Area canonical mapping/source provenance drift');
 if(!isDeepStrictEqual(audit,expected.audit))throw new Error('Area audit match/unresolved/coverage drift');
 return {ok:true,areas:dataset.areas.length,memberships:dataset.memberships.length,matched:audit.totalDonorMatches,unresolved:audit.unresolvedMatches};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(validateAreas(areaValidationInput()),null,2));
