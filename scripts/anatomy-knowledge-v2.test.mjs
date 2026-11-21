import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const knowledge=load('../data/anatomy/knowledge/poc-v2.json');
const crosswalk=load('../public/identity/core-crosswalk-v1.json');
const manifests=['atlas.json','atlas-female-reconstructed.json'].map(name=>load('../public/models/'+name));
const sources=new Set(knowledge.sources.map(s=>s.id));
const knownIds=new Set(crosswalk.concepts.map(c=>c.id));
const allIds=new Set(knowledge.records.map(r=>r.id));
const predicates=new Set(['innervated-by','supplied-by','originates-from','inserts-on','part-of','drains-into','connected-via','joins','continues-as','adjacent-to','is-a-lateral-instance-of']);
const details={muscle:['origin','insertion','innervation','actions'],bone:['landmarks','articulations'],nerve:['roots','course','motorDistribution'],artery:['origin','course','territory'],organ:['internalOrganization','physiology'],duct:['drainage'],'duct-network':['drainage'],group:['members']};
const fieldsWithEvidence=['summary','definition','development'];
function citations(field,context){assert.equal(typeof field.text,'string',context);assert.ok(field.text.trim().length>0,context);assert.ok(Array.isArray(field.sourceIds),context);for(const id of field.sourceIds)assert.ok(sources.has(id),'unknown source '+id);assert.ok(['candidate','reviewed','unresolved','source-derived'].includes(field.review.status),context);}
test('canonical records and knowledge-only identity isolation',()=>{
 assert.equal(knowledge.schemaVersion,2);
 assert.equal(knowledge.mappingRevision,crosswalk.mappingRevision);
 assert.equal(allIds.size,knowledge.records.length);
 const reserved=new Set(knowledge.knowledgeOnlyConceptIds);
 assert.equal(reserved.size,knowledge.knowledgeOnlyConceptIds.length);
 for(const id of reserved)assert.ok(!knownIds.has(id),'text-only concept shadows real atlas canonical ID');
 for(const r of knowledge.records){
  assert.match(r.id,/^atlas:concept:\d{6}$/);
  assert.ok(knownIds.has(r.id)||reserved.has(r.id),'unresolved knowledge concept '+r.id);
  assert.equal(!!r.textOnly,reserved.has(r.id),'text-only flag mismatch '+r.id);
  assert.ok(['candidate','reviewed','unresolved'].includes(r.review.status));
  assert.ok(r.terminology.preferredEnglish.value.trim());
  for(const key of fieldsWithEvidence)if(r[key])citations(r[key],r.id+' '+key);
  for(const [key,val] of Object.entries(r.details)){
   for(const f of Array.isArray(val)?val:[val])citations(f,r.id+' '+key);
  }
  for(const id of r.sourceConceptIds){
   const rows=Object.values(crosswalk.mappings).flatMap(a=>a.filter(row=>row.sourceConceptId===id));
   assert.ok(rows.some(x=>x.canonicalId===r.id),'source mapping mismatch '+id+' to '+r.id);
  }
  if(r.inheritsFrom){const b=knowledge.records.find(x=>x.id===r.inheritsFrom);assert.ok(b,'missing base '+r.id);assert.equal(r.kind,b.kind,'kind inheritance mismatch');assert.ok(!b.inheritsFrom,'nested inheritance unsupported');assert.ok(r.laterality,'sided record has no laterality');}
  else if(r.kind in details)for(const key of details[r.kind])assert.ok(key in r.details,'missing '+key+' for '+r.id);
 }
});
test('relationship endpoints, provenance and reverse traversal',()=>{
 const relIds=new Set;
 for(const e of knowledge.relationships){
  assert.ok(!relIds.has(e.id),'duplicate edge');relIds.add(e.id);
  assert.ok(allIds.has(e.subjectConceptId),'dangling subject '+e.id);
  assert.ok(allIds.has(e.objectConceptId),'dangling object '+e.id);
  assert.ok(predicates.has(e.predicate),'unknown relation '+e.predicate);
  assert.ok(['candidate','reviewed','unresolved'].includes(e.review.status));
  for(const id of e.evidence.sourceIds)assert.ok(sources.has(id),'unknown edge source '+id);
 }
 const nerve=knowledge.records.find(r=>r.terminology.preferredEnglish.value==='Suprascapular nerve');
 const muscle=knowledge.records.find(r=>r.terminology.preferredEnglish.value==='Right supraspinatus');
 assert.ok(nerve?.textOnly);
 assert.ok(knowledge.relationships.some(e=>e.subjectConceptId===muscle.id&&e.objectConceptId===nerve.id&&e.predicate==='innervated-by'));
 assert.ok(knowledge.relationships.filter(e=>e.objectConceptId===nerve.id&&e.predicate==='innervated-by').length>=2);
 assert.ok(manifests[0].concepts.some(x=>x.id==='FMA71857'&&x.name==='right hepatic biliary tree'));
});
test('source citation and terminology assertions',()=>{
 for(const s of knowledge.sources){assert.ok(/^https:\/\//.test(s.url));assert.ok(s.license&&s.kind);}
 for(const r of knowledge.records){
  const t=r.terminology.latinCandidate;
  if(t){assert.equal(t.review.status,'candidate','unreviewed Latin falsely marked verified');for(const sourceId of t.sourceIds)assert.ok(sources.has(sourceId));}
 }
});
