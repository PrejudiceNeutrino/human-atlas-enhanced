import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const d=JSON.parse(readFileSync(new URL('../data/anatomy/knowledge/pilot-v1.json',import.meta.url)));
const names=JSON.parse(readFileSync(new URL('../data/anatomy/sources/mesh-name-index.json',import.meta.url)));
test('knowledge pilot has unique source concept IDs backed by source mesh index',()=>{
 const ids=new Set();
 for(const r of d.records){
  assert.match(r.sourceConceptId,/^FMA\d+$/);
  assert.ok(!ids.has(r.sourceConceptId));ids.add(r.sourceConceptId);
  assert.ok(names.some(n=>n.conceptId===r.sourceConceptId),r.sourceConceptId);
  for(const k of ['name','summary','definition','function','reviewStatus','system','kind'])assert.ok(r[k],k);
  assert.ok(Array.isArray(r.hierarchy)&&r.hierarchy.length);
  assert.ok(Array.isArray(r.sourceIds)&&r.sourceIds.length);
  for(const s of r.sourceIds)assert.ok(d.sources.some(x=>x.id===s));
  if(r.kind==='muscle')for(const k of ['origin','insertion','innervation','bloodSupply'])assert.ok(r[k],k);
  if(r.kind!=='muscle')assert.equal(r.origin,undefined);
 }
});
test('biliary source mappings remain distinct',()=>{
 assert.equal(d.records.find(x=>x.sourceConceptId==='FMA14669').name,'Right hepatic duct');
 assert.equal(d.records.find(x=>x.sourceConceptId==='FMA14668').name,'Common hepatic duct');
});
