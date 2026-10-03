/** Reproducible from checked-in evidence; --freeze-source alone reads the exact Git donor. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {AREA_DONOR_SHA} from '../app/areas.ts';
import {areaValidationInput} from './validate-areas.mjs';
import {generateAreas,hash} from './area-generation.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const write=process.argv.includes('--write'),freeze=process.argv.includes('--freeze-source');
if(!write&&!process.argv.includes('--check')&&!freeze)throw new Error('Use --write, --check or --freeze-source');
function output(p,data,save=write){const url=new URL(`../${p}`,import.meta.url),text=JSON.stringify(data,null,1)+'\n';if(save){fs.mkdirSync(new URL('.',url),{recursive:true});fs.writeFileSync(url,text);}else if(!fs.existsSync(url)||fs.readFileSync(url,'utf8').replace(/\r\n/g,'\n')!==text)throw new Error(`Area drift: ${p}`);}
if(freeze){
 const git=(args)=>execFileSync('git',args,{cwd:root,maxBuffer:30000000});
 if(git(['rev-parse','donor/pr-1']).toString().trim()!==AREA_DONOR_SHA)throw new Error('PR #1 donor tag drift');
 const anatomy=git(['show',`${AREA_DONOR_SHA}:app/anatomy.ts`]).toString(),manifest=git(['show',`${AREA_DONOR_SHA}:public/models/atlas.json`]);
 const donor={};new Function('exports',ts.transpileModule(anatomy,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(donor);
 const rules=donor.AREAS.map(a=>({donorAreaId:a.id,name:a.name,legacyRegionIds:a.regions,regexSource:a.match.source,regexFlags:a.match.flags,guard:a.id==='hand'?'partRegion(part, donorBodyBounds) === arm':a.id==='foot'?'partRegion(part, donorBodyBounds) === legs':null}));
 const parts=JSON.parse(manifest).parts.map(({id,name,conceptId,bounds})=>({id,name,conceptId,bounds})).sort((a,b)=>a.id.localeCompare(b.id,'en'));
 output('data/areas/pr1-seed-v1.json',{schemaVersion:1,donor:{repository:'https://github.com/ashemag/human-atlas',tag:'donor/pr-1',sha:AREA_DONOR_SHA,manifestSha256:hash(manifest),rulesSha256:hash(anatomy),method:'Pinned PR #1 partInArea() offline -> BP3D male representation -> unique most-specific accepted Phase 1 exact canonical concept. Explicit station memberships; regions are navigation context only.'},source:{anatomy,manifestPath:'public/models/atlas.json',partsMethod:'Original donor id/name/conceptId/bounds only, sorted by source part ID; bounds reproduce hand/foot guards offline.'},rules,parts},true);
}
const input=areaValidationInput(false),generated=generateAreas(input.seed,input.sidecar,input.regions,input.indexes);
output('public/areas/canonical-areas-v1.json',generated.dataset);
output('data/areas/area-audit-v1.json',generated.audit);
console.log(JSON.stringify({areas:generated.audit.canonicalAreaCount,memberships:generated.audit.totalMemberships,matched:generated.audit.totalDonorMatches,unresolved:generated.audit.unresolvedMatches}));
