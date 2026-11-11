import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const output = path.resolve('work/respiratory-audit/runtime.mjs');
await build({stdin:{contents:"export * from './app/learn/anatomy-companion/model';export * from './app/learn/anatomy-companion/references';export * from './app/model-registry';export * from './app/identity-index';export * from './app/regions';",resolveDir:process.cwd()},outfile:output,bundle:true,platform:'node',format:'esm',packages:'external'});
const {MODEL_REGISTRY,createIdentityIndex,createRegionIndex,availableRepresentations,learningScope,lessonForModel} = await import(pathToFileURL(output).href);
const lesson = read('data/learn/respiratory-anatomy-references.json');
const candidates = read('docs/integration/respiratory-source/phase-05-visuals/anatomy-3d-candidates.json').candidates;
const crosswalk = read('public/identity/core-crosswalk-v1.json');
const regions = read('public/regions/canonical-regions-v1.json');
const models = [];
for (const modelId of lesson.modelIds) {
  const model = MODEL_REGISTRY[modelId], atlas = read(`public${model.manifestUrl}`);
  const identity = createIdentityIndex(model,atlas,crosswalk);
  const catalogue = {model,atlas,identity,regions:createRegionIndex(regions,crosswalk,identity)};
  const configured = lessonForModel(lesson,modelId);
  const scope = learningScope(catalogue,configured,false);
  const chunks = new Map();
  const verified = configured.structures.map(reference => {
    if (identity.sourceConceptCanonicalId(reference.sourceConceptId) !== reference.conceptId) throw Error(`Canonical identity drift: ${modelId}/${reference.label}`);
    const representations = availableRepresentations(catalogue,reference.conceptId);
    if (!representations.length) throw Error(`No actual representation: ${modelId}/${reference.label}`);
    for (const {sourcePart:part} of representations) {
      const url = atlas.chunks[part.chunk].url;
      if (!chunks.has(url)) chunks.set(url,fs.readFileSync(`public${url}`));
      const bytes = chunks.get(url);
      if (part.positions + part.vertexCount*12 > bytes.length || part.indices + part.indexCount*4 > bytes.length) throw Error(`Out of range geometry: ${part.id}`);
      for(let i=0;i<part.vertexCount*3;i++) if(!Number.isFinite(bytes.readFloatLE(part.positions+i*4))) throw Error(`Nonfinite vertex: ${part.id}`);
      for(let i=0;i<part.indexCount;i++) if(bytes.readUInt32LE(part.indices+i*4)>=part.vertexCount) throw Error(`Invalid triangle: ${part.id}`);
    }
    return {...reference,representationCount:representations.length,parts:representations.map(({sourcePart:p,link})=>({id:p.id,name:p.name,sourceConceptId:p.conceptId,system:p.system,relation:link.relation}))};
  });
  const coverage = candidates.map(candidate => {
    const refs = verified.filter(ref=>ref.candidateId===candidate.id);
    const partial = candidate.id==='nasal-conchae' || (modelId==='hra-female-v1.5' && candidate.id==='epiglottis');
    const lungAssembly = modelId!=='hra-female-v1.5' && /^(lungs|right-lung|left-lung|.*-lobe)$/.test(candidate.id);
    return {candidateId:candidate.id,label:candidate.label,status:refs.length?(partial?'partial-anatomy':'verified-and-integrated'):lungAssembly?'combined-or-coarser-anatomy':'not-represented',shortcuts:refs.map(ref=>ref.conceptId),note:refs.length?(partial?'Only the explicitly labeled anatomical subset is offered.':'Resolved through canonical identity and actual indexed geometry.'):lungAssembly?'Only bronchovascular assemblies exist; no lung tissue shortcut is published.':'No verified complete target in this model; no replacement geometry is selected.'};
  });
  models.push({modelId,experimental:model.experimental,structureShortcuts:verified.length,primaryParts:atlas.parts.filter(part=>part.system==='respiratory').length,scopedParts:scope.atlas.parts.length,coverage,verified});
}
const report={subjectId:'respiratory',candidateCount:23,models,limitations:['Female study geometry remains experimental.','Canonical identity and binary geometry validation do not constitute independent anatomical review.','HRA epiglottic cartilage is partial coverage of the epiglottis.','Inferior nasal conchae are partial coverage of nasal conchae.','Nasal cavity, complete pharynx and pleura have no verified shortcuts.','GPU interaction and visual review must be reported separately from this audit.']};
const destination=process.argv.includes('--write')?'docs/integration/RESPIRATORY_ANATOMY_AUDIT.json':'work/respiratory-audit/report.json';
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({report:destination,candidates:23,models:models.map(({modelId,structureShortcuts,primaryParts,scopedParts})=>({modelId,structureShortcuts,primaryParts,scopedParts}))},null,2));
