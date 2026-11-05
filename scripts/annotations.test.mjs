import assert from 'node:assert/strict';
import test from 'node:test';
import { IDBFactory } from 'fake-indexeddb';
import { build } from 'esbuild';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const output=path.resolve('work/annotation-tests/core.mjs');
await build({stdin:{contents:"export * from './app/notes/annotation-core';export * from './app/notes/annotation-model';export * from './app/notes/annotation-storage';",resolveDir:process.cwd()},bundle:true,packages:'external',platform:'node',format:'esm',outfile:output});
const {ANNOTATION_EXPORT_KIND,annotationExcerpt,annotationsOverlap,fingerprint,resolveAnchorText,resolveStoredAnchor,validateAnnotation,parseAnnotationExport,mergeAnnotations,rangesOverlap,createAnnotationStorage,ANNOTATION_DB_NAME,markdownBlocks,resolvedAnnotations}=await import(pathToFileURL(output).href);

const tabs=new Map([['digestive',new Set(['digestive-system-general-overview'])]]);
const text='The digestive system moves nutrients into blood and lymph after absorption.';
const record=(overrides={})=>({id:crypto.randomUUID(),schemaVersion:1,target:{kind:'learn',subjectId:'digestive',tabId:'digestive-system-general-overview',sourceId:'digestive-system-general-overview/intro'},
  anchor:{blockId:'b-12345678-0',start:4,end:20,exact:'digestive system',prefix:'The ',suffix:text.slice(20,68),blockText:text,contentVersion:fingerprint(text)},
  note:'A private thought.',style:'ochre',status:'anchored',createdAt:'2026-11-04T12:00:00.000Z',modifiedAt:'2026-11-04T12:00:00.000Z',...overrides});
const backup=annotations=>({kind:ANNOTATION_EXPORT_KIND,schemaVersion:1,exportedAt:'2026-11-04T13:00:00.000Z',annotations});
const segment=(text,sourceId='digestive-system-general-overview/intro')=>{
  const block=markdownBlocks(text)[0];return{target:{...record().target,sourceId},anchor:{blockId:block.id,start:0,end:block.text.length,exact:block.text,prefix:'',suffix:'',blockText:block.text,contentVersion:fingerprint(text)}};
};
const grouped=segments=>({...record(),...segments[0],schemaVersion:2,segments,selectionKind:segments.length>1?'range':'text'});

test('grouped records validate every segment, preserve long excerpts, import legacy backups and reject malformed groups',()=>{
  const parts=[segment('A section title.'),segment('A long paragraph. '.repeat(400),'digestive-system-general-overview/second')],item=grouped(parts);
  assert.ok(validateAnnotation(item,tabs));assert.ok(annotationExcerpt(item).length>5000);
  assert.equal(parseAnnotationExport({...backup([item,record()]),schemaVersion:2},tabs).annotations.length,2);
  assert.equal(parseAnnotationExport(backup([record()]),tabs).annotations.length,1);
  for(const patch of [{segments:[]},{segments:[parts[1],parts[0]]},{selectionKind:'heading'},{segments:[parts[0],{...parts[1],target:{...parts[1].target,tabId:'other'}}]},{segments:[parts[0],parts[0]]}])assert.equal(validateAnnotation({...item,...patch},tabs),null);
  const altered=structuredClone(item);altered.segments[1].anchor.exact='wrong';assert.equal(validateAnnotation(altered,tabs),null);
  const oversized=grouped(Array.from({length:5},(_,i)=>segment('Long passage. '.repeat(1800),`digestive-system-general-overview/part-${i}`)));
  assert.equal(validateAnnotation(oversized,tabs),null);
});

test('group resolution is atomic across sources and overlap checks include every segment',()=>{
  const first=segment('A heading and its section.'),second=segment(text,'digestive-system-general-overview/body'),item=grouped([first,second]);
  const sources=[first,second].map(part=>({target:part.target,blocks:markdownBlocks(part.anchor.blockText),version:part.anchor.contentVersion}));
  assert.equal(resolvedAnnotations([item],sources)[0].status,'anchored');
  const lost=resolvedAnnotations([item],sources.slice(0,1))[0];assert.equal(lost.status,'unresolved');assert.equal(lost.segments.length,2);assert.equal(lost.note,item.note);
  const conflicting={...record(),...second};assert.equal(annotationsOverlap(item,conflicting),true);
  assert.equal(mergeAnnotations([item],[conflicting]).skipped,1);
  assert.deepEqual(resolvedAnnotations([item,conflicting],sources).map(item=>item.status),['anchored','unresolved']);
  const heading=markdownBlocks('## A heading\n\nA paragraph.');assert.equal(heading[0].text,'A heading');assert.equal(heading.length,2);
});

test('legacy and grouped highlights persist together across IndexedDB connections and backup merge',async()=>{
  const factory=new IDBFactory(),storage=createAnnotationStorage(factory),old=record(),item=grouped([segment('A heading.'),segment('A different paragraph.','digestive-system-general-overview/other')]);
  await storage.mutate(()=>({put:[old,item],result:undefined}));await storage.close();
  const reopened=createAnnotationStorage(factory),records=await reopened.readAll();assert.deepEqual(records.find(record=>record.id===item.id),item);
  const parsed=parseAnnotationExport({...backup(records),schemaVersion:2},tabs);assert.equal(mergeAnnotations([],parsed.annotations).imported,2);await reopened.close();
});

test('unchanged offsets verify the exact quote; moved text requires unique context',()=>{
  const a=record().anchor;
  assert.deepEqual(resolveAnchorText(text,a),{start:4,end:20,method:'offset'});
  assert.equal(resolveAnchorText(text.replace('digestive system','cardiovascular system'),a),null);
  assert.deepEqual(resolveAnchorText('In summary: '+text,a),{start:16,end:32,method:'context'});
  assert.equal(resolveAnchorText(text+' '+text,{...a,start:0,end:16}),null);
});
test('paragraph identities survive insertion/reordering and conservative edits; deleted or ambiguous paragraphs stay unresolved',()=>{
  const a=record().anchor;
  const blocks=markdownBlocks('A different paragraph.\n\n'+text);
  assert.ok(resolveStoredAnchor(blocks,a));
  assert.ok(resolveStoredAnchor(markdownBlocks('In summary: '+text),a));
  assert.equal(resolveStoredAnchor(markdownBlocks(text+'\n\n'+text),a),null);
  assert.equal(resolveStoredAnchor(markdownBlocks('No original passage remains.'),a),null);
  assert.equal(resolveStoredAnchor(markdownBlocks('A paragraph about the digestive system with an unrelated context.'),a),null);
});
test('block metadata preserves full Markdown text and distinguishes paragraphs, list items and cells',()=>{
  const blocks=markdownBlocks('A **bold** and *italic* paragraph.\n\n- First item.\n- Second item.\n\n| Term | Meaning |\n| --- | --- |\n| Bile | Emulsifies |');
  assert.deepEqual(blocks.map(block=>block.text),['A bold and italic paragraph.','First item.','Second item.','Term','Meaning','Bile','Emulsifies']);
  assert.equal(new Set(blocks.map(block=>block.id)).size,blocks.length);
  const after=markdownBlocks('Inserted paragraph.\n\nA **bold** and *italic* paragraph.');
  assert.equal(after[1].id,blocks[0].id);
});
test('versioned import projects only bounded trusted fields, rejects foreign formats and preserves plain note text',()=>{
  const note='<img src=x onerror=alert(1)><script>private()</script>';
  const a=record({note,externalUrl:'https://example.invalid/secret'});
  assert.equal(validateAnnotation(a,tabs).note,note);assert.equal(validateAnnotation(a,tabs).externalUrl,undefined);
  assert.equal(parseAnnotationExport(backup([a]),tabs).annotations.length,1);
  for(const invalid of [{...backup([a]),kind:'toye-private-annotations'},{...backup([a]),schemaVersion:3},{hello:'world'},{...backup([a]),annotations:Array(5001).fill(a)}])assert.throws(()=>parseAnnotationExport(invalid,tabs));
  for(const patch of [{target:{...a.target,subjectId:'foreign'}},{style:'red'},{note:'x'.repeat(10001)},{modifiedAt:'not-a-date'},{anchor:{...a.anchor,end:19}},{anchor:{...a.anchor,contentVersion:'invalid'}},{id:'../unsafe'}])assert.equal(validateAnnotation({...a,...patch},tabs),null);
  assert.equal(parseAnnotationExport(backup([a,{...a,note:8}]),tabs).invalid,1);
});
test('import merge deduplicates, retains newer notes, refuses overlap and identity changes; adjacency is allowed',()=>{
  const a=record(),later={...a,note:'Newer',modifiedAt:'2026-11-04T14:00:00.000Z'};
  let merged=mergeAnnotations([a],[a,later,record()]);assert.equal(merged.updated,1);assert.equal(merged.skipped,2);assert.equal(merged.records[0].note,'Newer');
  assert.equal(mergeAnnotations([later],[a]).skipped,1);
  assert.equal(mergeAnnotations([a],[{...later,target:{...a.target,sourceId:'different'}}]).skipped,1);
  assert.equal(rangesOverlap({start:0,end:4},{start:4,end:8}),false);
  const adjacent=record({anchor:{...a.anchor,start:20,end:26,exact:' moves'}});assert.equal(mergeAnnotations([a],[adjacent]).imported,1);
});
test('resolution is confined to the original source, preserves unresolved notes and prevents conflicting marks',()=>{
  const a=record(),source={target:a.target,blocks:markdownBlocks(text),version:fingerprint(text)};
  let output=resolvedAnnotations([a,record()], [source]);assert.deepEqual(output.map(item=>item.status),['anchored','unresolved']);
  output=resolvedAnnotations([a],[{...source,target:{...source.target,sourceId:'different'}}]);assert.equal(output[0].status,'unresolved');assert.equal(output[0].note,a.note);
});
test('actual IndexedDB adapter persists across connections and isolates Human Atlas storage',async()=>{
  const factory=new IDBFactory(),first=createAnnotationStorage(factory),a=record();
  assert.equal(ANNOTATION_DB_NAME,'human-atlas-personal-notes');
  await first.mutate(()=>({put:[a],result:'saved'}));await first.close();
  const second=createAnnotationStorage(factory);assert.deepEqual(await second.readAll(),[a]);
  await second.mutate(()=>({put:[{...a,note:'edited'}],result:undefined}));assert.equal((await second.readAll())[0].note,'edited');
  await second.mutate(()=>({remove:[a.id],result:undefined}));assert.deepEqual(await second.readAll(),[]);await second.close();
});
test('failed transactions preserve existing records; concurrent adapters do not lose writes; clear commits',async()=>{
  const factory=new IDBFactory(),a=createAnnotationStorage(factory),b=createAnnotationStorage(factory),one=record(),two=record();
  await Promise.all([a.mutate(()=>({put:[one],result:1})),b.mutate(()=>({put:[two],result:2}))]);assert.equal((await a.readAll()).length,2);
  await assert.rejects(a.mutate(()=>{throw new Error('planned failure');}),/planned failure/);assert.equal((await b.readAll()).length,2);
  await assert.rejects(a.mutate(()=>({put:[{...one,note:()=>{}}],result:1})));assert.equal((await b.readAll()).length,2);
  await a.mutate(()=>({clear:true,result:undefined}));assert.deepEqual(await b.readAll(),[]);await a.close();await b.close();
});
test('unavailable IndexedDB fails explicitly instead of pretending persistence',async()=>{
  const failing=createAnnotationStorage({open(){throw new Error('storage denied');}});
  await assert.rejects(failing.readAll(),/storage denied/);
  await assert.rejects(failing.mutate(()=>({clear:true,result:undefined})),/storage denied/);
});
