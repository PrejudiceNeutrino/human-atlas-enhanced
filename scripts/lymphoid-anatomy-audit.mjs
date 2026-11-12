import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const output = path.resolve('work/lymphoid-audit/runtime.mjs');
await build({stdin:{contents:"export * from './app/learn/anatomy-companion/model';export * from './app/learn/anatomy-companion/references';export * from './app/model-registry';export * from './app/identity-index';export * from './app/regions';",resolveDir:process.cwd()},outfile:output,bundle:true,platform:'node',format:'esm',packages:'external'});
const {MODEL_REGISTRY,createIdentityIndex,createRegionIndex,availableRepresentations,learningScope,lessonForModel} = await import(pathToFileURL(output).href);
const lesson = read('data/learn/lymphoid-anatomy-references.json');
const candidates = read('docs/integration/lymphoid-source/phase-5-gallery/anatomy-3d-candidates.json').candidates;
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
  const coverage = candidates.map((candidate,index) => {
    const refs = verified.filter(ref=>ref.candidateIndex===index);
    const sampleOnly = modelId==='hra-female-v1.5' && [2,3,4,14].includes(index);
    return {candidateIndex:index,label:candidate.label,status:refs.length?'verified-and-integrated':sampleOnly?(index===14?'partial-anatomy-not-integrated':'uncertain'):'not-represented',shortcuts:refs.map(ref=>ref.conceptId),note:refs.length?'Resolved through canonical identity and actual indexed geometry.':sampleOnly?'The HRA sample node has afferent/efferent vessel geometry but no verified regional identity or whole-body drainage mapping. It is excluded from this lesson.':'No verified target in this model; no substitute anatomy is selected.'};
  });
  for (const excluded of lesson.excludedPartIds) {
    if (scope.partIds.has(excluded) || learningScope(catalogue,configured,true).partIds.has(excluded)) throw Error(`Excluded sample geometry leaked into the lesson: ${excluded}`);
  }

  models.push({modelId,experimental:model.experimental,structureShortcuts:verified.length,primaryParts:atlas.parts.filter(part=>part.system==='lymphatic').length,scopedParts:scope.atlas.parts.length,coverage,verified});
}
const report={subjectId:'lymphoid',candidateCount:19,models,excludedSampleGeometry:lesson.excludedPartIds,limitations:['Female study geometry remains experimental.','Canonical identity and binary geometry checks do not constitute independent anatomical peer review.','Regional node groups, thoracic/right lymphatic ducts, cisterna chyli, pharyngeal tonsil and red marrow have no verified shortcuts.','Peyer patches, lymphatic capillaries, individual immune cells and splenic pulp are not represented as whole-body selectable targets.','The HRA Yao sample node has no verified cervical, axillary or inguinal assignment; its sample geometry is excluded.','GPU interaction and visual review must be reported separately from this audit.']};
const destination=process.argv.includes('--write')?'docs/integration/LYMPHOID_ANATOMY_AUDIT.json':'work/lymphoid-audit/report.json';
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({report:destination,candidates:19,models:models.map(({modelId,structureShortcuts,primaryParts,scopedParts})=>({modelId,structureShortcuts,primaryParts,scopedParts}))},null,2));
