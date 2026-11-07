import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';
import { build } from 'esbuild';

const dom=new JSDOM('<!doctype html><html lang="en"><head><title>Human Atlas</title></head><body><div id="root"></div></body></html>',{url:'http://localhost/learn/digestive',pretendToBeVisual:true});
const {window}=dom;
for(const key of ['window','document','navigator','HTMLElement','HTMLTextAreaElement','HTMLInputElement','HTMLButtonElement','Element','Node','NodeFilter','DocumentFragment','MutationObserver','Event','MouseEvent','KeyboardEvent'])Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?window:window[key]});
globalThis.indexedDB=window.indexedDB=new IDBFactory();
globalThis.getComputedStyle=window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);
globalThis.BASE_UI_ANIMATIONS_DISABLED=true;
window.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),media:query,addEventListener(){},removeEventListener(){}});
window.ResizeObserver=globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
window.HTMLElement.prototype.getAnimations=()=>[];
window.HTMLCanvasElement.prototype.getContext=()=>null;
window.Range.prototype.getBoundingClientRect=()=>({left:200,top:260,width:150,height:20});
window.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled='true';};
let confirmation=true,networkCalls=0,exportedBlob;
window.confirm=()=>confirmation;
globalThis.fetch=()=>{networkCalls++;throw new Error('Annotation data must never be fetched or uploaded.');};
URL.createObjectURL=blob=>{exportedBlob=blob;return'blob:local-notes';};URL.revokeObjectURL=()=>{};
document.addEventListener('click',event=>{if(event.target.closest?.('a[href^="blob:"]'))event.preventDefault();},true);
const nativeAnchorClick=window.HTMLAnchorElement.prototype.click;
window.HTMLAnchorElement.prototype.click=function(){if(!this.href.startsWith('blob:'))nativeAnchorClick.call(this);};

const {createElement}=await import('react'),{createRoot}=await import('react-dom/client'),{flushSync}=await import('react-dom'),{default:axe}=await import('axe-core');
const output=path.resolve('work/annotation-tests/ui.mjs');
await build({stdin:{contents:"export {default as LearnPage} from './app/learn/page';export {default as NotesPage} from './app/notes/page';export * from './app/notes/annotation-store';export * from './app/notes/annotation-storage';export * from './app/notes/annotation-content';export * from './app/notes/annotation-core';",resolveDir:process.cwd()},outfile:output,tsconfig:path.resolve('tsconfig.json'),bundle:true,packages:'external',platform:'node',format:'esm',loader:{'.css':'empty'},alias:{'@':process.cwd()}});
const {LearnPage,NotesPage,annotationStore,createAnnotationStore,createAnnotationStorage,annotationSources,annotationTargetUrl,ANNOTATION_EXPORT_KIND,fingerprint}=await import(pathToFileURL(output).href);
const root=createRoot(document.querySelector('#root'));let renderKey=0;
const render=async Component=>{flushSync(()=>root.render(createElement(Component===NotesPage?LearnPage:Component,{pathname:'/learn/digestive',initialNotesOpen:Component===NotesPage,key:++renderKey})));await delay(90);if(Component===NotesPage)await waitFor(()=>document.querySelector('#notes-content'),'lazy Notes workspace');};
const click=async element=>{assert.ok(element,'control exists');flushSync(()=>element.click());await delay(80);};
const named=(root,label)=>[...root.querySelectorAll('button,a')].find(item=>item.textContent===label);
const tab=label=>[...document.querySelectorAll('[role=tab]')].find(item=>item.querySelector('span')?.textContent===label);
const change=async(element,value)=>{const descriptor=Object.getOwnPropertyDescriptor(element instanceof window.HTMLTextAreaElement?window.HTMLTextAreaElement.prototype:element instanceof window.HTMLSelectElement?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype,'value');descriptor.set.call(element,value);flushSync(()=>element.dispatchEvent(new window.Event(element.tagName==='SELECT'?'change':'input',{bubbles:true})));await delay(40);};
const waitFor=async(predicate,message)=>{for(let i=0;i<40;i++){if(predicate())return;await delay(30);}assert.ok(predicate(),message);};
const select=async(block,from=0,to=Math.min(22,block.textContent.length))=>{
  const walker=document.createTreeWalker(block,window.NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  const point=offset=>{for(const node of nodes){if(offset<=node.textContent.length)return[node,offset];offset-=node.textContent.length;}throw Error('range outside block');};
  const range=document.createRange(),a=point(from),b=point(to);range.setStart(...a);range.setEnd(...b);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
  block.dispatchEvent(new window.Event('pointerup',{bubbles:true}));await waitFor(()=>document.querySelector('.annotation-toolbar'),'selection toolbar');return range.toString();
};
const makeRecord=(source=annotationSources[0],note='A private note.')=>{
  const block=source.blocks[0],now='2026-11-04T12:00:00.000Z',start=0,end=Math.min(20,block.text.length);
  return{id:crypto.randomUUID(),schemaVersion:1,target:source.target,anchor:{blockId:block.id,start,end,exact:block.text.slice(start,end),prefix:'',suffix:block.text.slice(end,end+48),blockText:block.text,contentVersion:source.version},note,style:'ochre',status:'anchored',createdAt:now,modifiedAt:now};
};
const selectRange=async(range,origin)=>{
  const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
  origin.dispatchEvent(new window.Event('pointerup',{bubbles:true}));await waitFor(()=>document.querySelector('.annotation-toolbar'),'range tools');
};
await annotationStore.initialize();
after(async()=>{flushSync(()=>root.unmount());await annotationStore.dispose();window.close();});

test('selection creates a persistent highlight across inline emphasis without changing educational text or selection identity',async()=>{
  await annotationStore.clear();await render(LearnPage);
  assert.equal(document.querySelector('.site-notes-trigger').textContent,'Notes');
  const block=document.querySelector('.learn-markdown[data-annotation-source$="/intro"]').querySelectorAll('[data-annotation-block]')[1],before=block.textContent;
  const emphasis=block.querySelector('strong').textContent;
  const excerpt=await select(block,4,55);await click(named(document.querySelector('.annotation-toolbar'),'Highlight'));
  await waitFor(()=>document.querySelector('[data-annotation-first]'),'highlight render');
  assert.equal(annotationStore.getSnapshot().records[0].anchor.exact,excerpt);assert.equal(block.textContent,before);assert.ok(block.isConnected,'React keeps the original block connected');
  assert.equal(block.querySelector('strong').textContent,emphasis);
  assert.equal(document.querySelector('[data-annotation-first]').getAttribute('role'),'button');
  await click(tab('Deep Dive'));await click(tab('General Overview'));assert.ok(document.querySelector('[data-annotation-first]'));
  await render(LearnPage);assert.ok(document.querySelector('[data-annotation-first]'),'reload-equivalent remount restores mark from the shared store');
  assert.equal(networkCalls,0);
});
test('selectionchange and keyboard shortcuts can create a note; Escape dismisses tools without altering selected text',async()=>{
  await annotationStore.clear();await render(LearnPage);
  const block=document.querySelector('.learn-markdown[data-annotation-source$="/intro"] [data-annotation-block]'),range=document.createRange();
  range.setStart(block.firstChild,0);range.setEnd(block.firstChild,30);window.getSelection().removeAllRanges();window.getSelection().addRange(range);
  document.dispatchEvent(new window.Event('selectionchange'));await waitFor(()=>document.querySelector('.annotation-toolbar'),'tools after selection handles or keyboard selection');
  flushSync(()=>block.dispatchEvent(new window.KeyboardEvent('keydown',{key:'n',altKey:true,bubbles:true,cancelable:true})));await waitFor(()=>document.querySelector('textarea'),'Alt+N editor');
  await change(document.querySelector('textarea'),'Keyboard note');await click(named(document.querySelector('[role=dialog]'),'Save note'));
  assert.equal(annotationStore.getSnapshot().records[0].note,'Keyboard note');
  await select(block,35,55);const selected=window.getSelection().toString();
  flushSync(()=>window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));await delay(30);
  assert.equal(document.querySelector('.annotation-toolbar'),null);assert.equal(window.getSelection().toString(),selected);window.getSelection().removeAllRanges();
});
test('Add Note and existing marks share an accessible plain-text editor, save/edit and reject overlapping highlights',async()=>{
  await annotationStore.clear();await render(LearnPage);
  const block=document.querySelector('.learn-markdown[data-annotation-source$="/intro"] [data-annotation-block]');
  await select(block,0,30);await click(named(document.querySelector('.annotation-toolbar'),'Add Note'));
  await waitFor(()=>document.querySelector('[role=dialog]'),'note editor');
  const field=document.querySelector('textarea'),note='<img src=x onerror=alert(1)> My thought';
  assert.equal(document.activeElement,field);await change(field,note);await click(named(document.querySelector('[role=dialog]'),'Save note'));
  assert.equal(annotationStore.getSnapshot().records[0].note,note);assert.equal(document.querySelector('img'),null);
  let mark=document.querySelector('[data-annotation-first]');mark.focus();flushSync(()=>mark.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));await delay(80);
  assert.equal(document.querySelector('textarea').value,note);
  await change(document.querySelector('textarea'),'Edited personal note');await click(named(document.querySelector('[role=dialog]'),'Save note'));
  assert.equal(annotationStore.getSnapshot().records[0].note,'Edited personal note');
  await select(block,10,35);await click(named(document.querySelector('.annotation-toolbar'),'Highlight'));
  assert.match(document.querySelector('.annotation-status').textContent,/overlaps/);assert.equal(annotationStore.getSnapshot().records.length,1);
  window.getSelection().removeAllRanges();
});
test('cross-block selection saves as one highlight and note while Ctrl+C remains untouched',async()=>{
  await annotationStore.clear();await render(LearnPage);
  const blocks=[...document.querySelector('.learn-markdown[data-annotation-source$="/intro"]').querySelectorAll('[data-annotation-block]')];
  const range=document.createRange();range.setStart(blocks[0].firstChild,0);range.setEnd(blocks[1],1);window.getSelection().removeAllRanges();window.getSelection().addRange(range);
  const before=window.getSelection().toString();blocks[0].dispatchEvent(new window.Event('pointerup',{bubbles:true}));await delay(210);
  assert.ok(document.querySelector('.annotation-toolbar'));
  const event=new window.KeyboardEvent('keydown',{key:'c',ctrlKey:true,bubbles:true,cancelable:true});blocks[0].dispatchEvent(event);assert.equal(event.defaultPrevented,false);assert.equal(window.getSelection().toString(),before);
  await click(named(document.querySelector('.annotation-toolbar'),'Add Note'));
  await waitFor(()=>document.querySelector('textarea'),'grouped note editor');
  const saved=annotationStore.getSnapshot().records;
  assert.equal(saved.length,1);assert.equal(saved[0].schemaVersion,2);assert.equal(saved[0].selectionKind,'range');assert.equal(saved[0].segments.length,2);
  assert.equal(new Set([...document.querySelectorAll('mark')].map(mark=>mark.dataset.annotationId)).size,1);
  await change(document.querySelector('textarea'),'One note across paragraphs');await click(named(document.querySelector('[role=dialog]'),'Save note'));
  await render(LearnPage);assert.equal(document.querySelectorAll('[data-annotation-first]').length,2);
  await render(NotesPage);assert.equal(document.querySelectorAll('.notes-entry').length,1);assert.equal(document.querySelector('.notes-personal-text').textContent,'One note across paragraphs');
  assert.equal(document.querySelector('blockquote').textContent,saved[0].segments.map(segment=>segment.anchor.exact).join('\n\n'));
});
test('heading-only highlights persist, revisit and delete as one saved record',async()=>{
  await annotationStore.clear();window.history.replaceState(null,'','/learn/digestive');await render(LearnPage);
  const heading=document.querySelector('.learn-article-section h3'),text=heading.textContent;
  await select(heading,0,text.length);await click(named(document.querySelector('.annotation-toolbar'),'Highlight'));
  const record=annotationStore.getSnapshot().records[0];assert.equal(record.selectionKind,'heading');assert.equal(record.anchor.exact,text);assert.equal(record.segments.length,1);
  const connection=createAnnotationStorage();const stored=await connection.readAll();assert.equal(stored[0].selectionKind,'heading');await connection.close();
  window.history.replaceState(null,'',annotationTargetUrl(record));await render(LearnPage);
  await waitFor(()=>document.activeElement?.dataset.annotationId===record.id,'heading revisit focus');
  await click(document.querySelector('h3 mark'));
  assert.equal(document.querySelector('[role=dialog] blockquote').textContent,text);
  await click(named(document.querySelector('[role=dialog]'),'Delete highlight'));
  assert.equal(annotationStore.getSnapshot().records.length,0);window.history.replaceState(null,'','/learn/digestive');
});

test('clearing a selection or pressing outside dismisses tools without leaving a selected-text toast',async()=>{
  await annotationStore.clear();await render(LearnPage);
  const block=document.querySelector('.learn-markdown[data-annotation-source$="/intro"] [data-annotation-block]');
  await select(block);assert.equal(document.querySelector('.annotation-status').textContent,'');
  window.getSelection().removeAllRanges();document.dispatchEvent(new window.Event('selectionchange'));
  await waitFor(()=>!document.querySelector('.annotation-toolbar'),'collapsed selection dismisses tools');
  assert.equal(document.querySelector('.annotation-status').textContent,'');
  await select(block);const button=named(document.querySelector('.annotation-toolbar'),'Highlight');button.focus();
  window.getSelection().removeAllRanges();
  document.querySelector('.learn-article-header').dispatchEvent(new window.Event('pointerdown',{bubbles:true}));
  await waitFor(()=>!document.querySelector('.annotation-toolbar'),'outside press dismisses despite toolbar focus');
  assert.equal(document.querySelector('.annotation-status').textContent,'');
  await select(block);document.querySelector('.learn-shell').dispatchEvent(new window.Event('scroll'));
  await waitFor(()=>!document.querySelector('.annotation-toolbar'),'scroll dismisses tools');
  assert.equal(document.querySelector('.annotation-status').textContent,'');window.getSelection().removeAllRanges();
});

test('whole sections and partial selections across adjacent section headings save one highlight and survive backups',async()=>{
  await annotationStore.clear();await render(LearnPage);
  const sections=document.querySelectorAll('.learn-article-section'),heading=sections[0].querySelector('h3');
  const whole=document.createRange();whole.selectNodeContents(sections[0]);
  await selectRange(whole,heading);await click(named(document.querySelector('.annotation-toolbar'),'Highlight'));
  let record=annotationStore.getSnapshot().records[0];assert.equal(record.selectionKind,'range');assert.equal(record.segments.length,sections[0].querySelectorAll('[data-annotation-block]').length);
  assert.equal(record.segments[0].anchor.exact,heading.textContent);
  await annotationStore.clear();await render(LearnPage);
  const current=document.querySelectorAll('.learn-article-section'),start=current[0].querySelector('h3'),end=current[1].querySelector('.learn-markdown').lastElementChild;
  const range=document.createRange();range.setStart(start.firstChild,4);range.setEnd(end,end.childNodes.length);
  await selectRange(range,start);await click(named(document.querySelector('.annotation-toolbar'),'Add Note'));
  await change(document.querySelector('textarea'),'One note for two sections');await click(named(document.querySelector('[role=dialog]'),'Save note'));
  record=annotationStore.getSnapshot().records[0];assert.equal(record.anchor.start,4);assert.ok(new Set(record.segments.map(segment=>segment.target.sourceId)).size>1);
  const before=[...document.querySelectorAll('mark')].map(mark=>mark.textContent).join('');
  await render(NotesPage);assert.equal(document.querySelectorAll('.notes-entry').length,1);await click(named(document,'Export backup'));const backup=JSON.parse(await exportedBlob.text());assert.equal(backup.schemaVersion,2);
  await annotationStore.clear();await annotationStore.importBackup(backup,annotationSources);await render(LearnPage);
  assert.equal(annotationStore.getSnapshot().records.length,1);assert.equal([...document.querySelectorAll('mark')].map(mark=>mark.textContent).join(''),before);
  const first=document.querySelector('mark');await click(first);assert.equal(document.querySelector('textarea').value,'One note for two sections');await click(named(document.querySelector('[role=dialog]'),'Cancel'));
});

test('large selections include list items, table cells and linked text without stealing link navigation',async()=>{
  await annotationStore.clear();await render(LearnPage);
  await click(tab("Who Cares?"));await click(document.querySelectorAll('.learn-more-trigger')[1]);
  const table=document.querySelector('.learn-facts table'),range=document.createRange();range.selectNodeContents(table);
  await selectRange(range,table);await click(named(document.querySelector('.annotation-toolbar'),'Highlight'));
  assert.equal(annotationStore.getSnapshot().records[0].segments.length,table.querySelectorAll('th,td').length);
  await annotationStore.clear();await click(tab('Exam Cram'));
  const list=document.querySelector('.learn-reading ul');range.selectNodeContents(list);
  await selectRange(range,list);await click(named(document.querySelector('.annotation-toolbar'),'Highlight'));
  assert.equal(annotationStore.getSnapshot().records[0].segments.length,list.querySelectorAll('li').length);
  await annotationStore.clear();await click(tab('General Overview'));
  const link=document.querySelector('.learn-reading a[href="#digestive-system-deep-dive"]'),paragraph=link.closest('p');range.selectNodeContents(paragraph);
  await selectRange(range,paragraph);await click(named(document.querySelector('.annotation-toolbar'),'Highlight'));
  const markedLink=document.querySelector('.learn-reading a[href="#digestive-system-deep-dive"]');
  assert.ok(markedLink.querySelector('mark'));assert.equal(markedLink.querySelector('mark[role=button]'),null);
  await click(markedLink);assert.equal(tab('Deep Dive').getAttribute('aria-selected'),'true');assert.equal(document.querySelector('[role=dialog]'),null);
  window.history.replaceState(null,'','/learn/digestive');
});

test('all Learn blocks correspond to canonical catalog text; existing tables and fact disclosures remain annotatable',async()=>{
  await render(LearnPage);
  for(const label of ['General Overview','Deep Dive','How It Connects',"Who Cares?",'Exam Cram']){
    await click(tab(label));
    const panel=document.getElementById(tab(label).getAttribute('aria-controls'));
    const rendered=[...panel.querySelectorAll('[data-annotation-block]')];
    for(const source of annotationSources.filter(source=>source.target.tabId===tab(label).getAttribute('data-value')||source.tabTitle===label)){
      const blocks=rendered.filter(block=>block.closest('[data-annotation-source]')?.dataset.annotationSource===source.target.sourceId);
      assert.equal(blocks.length,source.blocks.length,source.target.sourceId);
      blocks.forEach(block=>assert.equal(block.textContent,source.blocks.find(item=>item.id===block.dataset.annotationBlock)?.text,source.target.sourceId));
    }
  }
});
test('global Notes groups/filter records, keeps unresolved excerpts, and displays private notes as plain text',async()=>{
  await annotationStore.clear();
  const first=makeRecord(),second=makeRecord(annotationSources.find(item=>item.tabTitle==='Deep Dive'),'');
  const lost=makeRecord(annotationSources.find(item=>item.tabTitle==='Exam Cram'),'<script>private()</script>');
  lost.anchor={...lost.anchor,blockId:'b-removed-0',blockText:'The original paragraph has been completely removed from the content.',start:0,end:12,exact:'The original',prefix:'',suffix:' paragraph has been completely removed from the content.',contentVersion:fingerprint('removed')};
  await annotationStore.create(first);await annotationStore.create(second);await annotationStore.create(lost);await render(NotesPage);
  assert.equal(document.querySelectorAll('.notes-entry').length,3);assert.equal(document.querySelectorAll('.notes-unresolved').length,1);
  assert.ok([...document.querySelectorAll('.notes-personal-text')].some(item=>item.textContent==='<script>private()</script>'));assert.equal(document.querySelector('script'),null);
  const filters=document.querySelector('.notes-filters');await click(filters.querySelector('input[type=checkbox]'));assert.equal(document.querySelectorAll('.notes-entry').length,2);
  await change(filters.querySelectorAll('select')[1],'digestive-system-exam-cram');assert.equal(document.querySelectorAll('.notes-entry').length,1);
  const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(results.violations.map(item=>item.id),[]);
});
test('revisit waits for storage, opens the correct tab and More Info panel, focuses and identifies the saved highlight',async()=>{
  await annotationStore.clear();
  const source=annotationSources.find(item=>item.disclosureId&&item.blocks.length),record=makeRecord(source);
  await annotationStore.create(record);const href=annotationTargetUrl(record);assert.match(href,/#annotation=/);assert.ok(!href.includes('?'));
  window.history.replaceState(null,'',href);await render(LearnPage);
  await waitFor(()=>document.querySelector('[data-annotation-first]')?.dataset.annotationId===record.id,'requested mark');
  await waitFor(()=>document.activeElement?.dataset.annotationId===record.id,'focus after tab/disclosure opening');
  assert.equal(tab("Who Cares?").getAttribute('aria-selected'),'true');
  assert.equal(document.getElementById(`${source.disclosureId}-trigger`).getAttribute('aria-expanded'),'true');
  assert.ok(document.querySelector('[data-annotation-first]').classList.contains('annotation-target'));
  const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(results.violations.map(item=>item.id),[]);
  window.history.replaceState(null,'','/learn/digestive');
});
test('export/import round trips all records, deduplicates, enforces size and requires explicit clear/delete confirmation',async()=>{
  await render(NotesPage);const count=annotationStore.getSnapshot().records.length;
  await click(named(document,'Export backup'));const backup=JSON.parse(await exportedBlob.text());assert.equal(backup.kind,ANNOTATION_EXPORT_KIND);assert.equal(backup.annotations.length,count);
  confirmation=false;await click(named(document,'Clear all highlights and notes'));assert.equal(annotationStore.getSnapshot().records.length,count);
  await click(named(document,'Delete'));assert.equal(annotationStore.getSnapshot().records.length,count);
  confirmation=true;await click(named(document,'Clear all highlights and notes'));assert.equal(annotationStore.getSnapshot().records.length,0);
  const input=document.querySelector('input[type=file]');
  const importFile=async file=>{Object.defineProperty(input,'files',{configurable:true,value:[file]});flushSync(()=>input.dispatchEvent(new window.Event('change',{bubbles:true})));await delay(100);};
  await importFile({size:100,text:async()=>JSON.stringify(backup)});assert.equal(annotationStore.getSnapshot().records.length,count);
  await importFile({size:100,text:async()=>JSON.stringify(backup)});assert.equal(annotationStore.getSnapshot().records.length,count);assert.match(document.querySelector('.notes-status').textContent,/skipped 1/);
  await importFile({size:5_000_001,text:async()=>{throw Error('should not read');}});assert.match(document.querySelector('.notes-status').textContent,/smaller than 5 MB/);assert.equal(annotationStore.getSnapshot().records.length,count);
  await importFile({size:100,text:async()=>JSON.stringify({...backup,kind:'toye-private-annotations'})});assert.match(document.querySelector('.notes-status').textContent,/supported Human Atlas/);assert.equal(annotationStore.getSnapshot().records.length,count);
});
test('storage failures are explicit; stale note saves are rejected; private data never reaches a network API',async()=>{
  const failing=createAnnotationStore({readAll:async()=>{throw Error('denied');},mutate:async()=>{throw Error('denied');},close:async()=>{}});
  await failing.initialize();assert.equal(failing.getSnapshot().status,'error');await assert.rejects(failing.clear(),/storage is unavailable/);await failing.dispose();
  const record=annotationStore.getSnapshot().records[0];await annotationStore.saveNote(record.id,'new version',record.modifiedAt);
  await assert.rejects(annotationStore.saveNote(record.id,'stale version',record.modifiedAt),/changed in another tab/);assert.equal(annotationStore.getSnapshot().records[0].note,'new version');
  assert.equal(networkCalls,0);
  const entry=fs.readFileSync('web/main.tsx','utf8');assert.match(entry,/pathname !== '\/notes'.*!pathname.startsWith\('\/learn'\).*Analytics/);
  assert.match(fs.readFileSync('vercel.json','utf8'),/"source": "\/notes"/);
});

test('retired local content remains unresolved and exportable; storage budget prevents creating unimportable backups atomically',async()=>{
  const storage=createAnnotationStorage(new IDBFactory()),store=createAnnotationStore(storage),legacy=makeRecord();
  legacy.target={...legacy.target,tabId:'retired-digestive-tab'};
  await storage.mutate(()=>({put:[legacy],result:undefined}));await store.initialize();await store.reconcile(annotationSources);
  assert.equal(store.getSnapshot().records.length,1);assert.equal(store.getSnapshot().records[0].status,'unresolved');assert.equal(store.getSnapshot().records[0].note,legacy.note);
  await store.clear();
  const records=Array.from({length:500},(_,i)=>{const item=makeRecord(undefined,'x'.repeat(10000));item.target={...item.target,sourceId:`budget/${i}`};return item;});
  while(new TextEncoder().encode(JSON.stringify(records)).byteLength>4_800_000)records.pop();
  await storage.mutate(()=>({put:records,result:undefined}));
  const extra=makeRecord(undefined,'x'.repeat(10000));extra.target={...extra.target,sourceId:'budget/'+ 'z'.repeat(350)};
  await assert.rejects(store.create(extra),/backup limit/);assert.equal((await storage.readAll()).length,records.length);
  await store.clear();await store.dispose();
});

test('blocked optional BroadcastChannel does not disable storage; note timestamps remain monotonic after clock-skewed imports',async()=>{
  const prior=Object.getOwnPropertyDescriptor(window,'BroadcastChannel');
  Object.defineProperty(window,'BroadcastChannel',{configurable:true,value:class{constructor(){throw Error('messaging blocked');}}});
  const store=createAnnotationStore(createAnnotationStorage(new IDBFactory()));
  try{
    await store.initialize();assert.equal(store.getSnapshot().status,'ready');
    const record=makeRecord();record.modifiedAt='2099-11-04T12:00:00.000Z';await store.create(record);
    await store.saveNote(record.id,'Newer than the imported record',record.modifiedAt);
    assert.ok(Date.parse(store.getSnapshot().records[0].modifiedAt)>Date.parse(record.modifiedAt));
    await store.clear();
  }finally{await store.dispose();if(prior)Object.defineProperty(window,'BroadcastChannel',prior);else delete window.BroadcastChannel;}
});


test('Notes opens over the mounted reading and restores header focus and scroll', async () => {
  window.history.replaceState(null, '', '/learn/digestive');
  await render(LearnPage);
  const shell = document.querySelector('.learn-shell'), reading = document.querySelector('.learn-reading'), title = document.title, href = window.location.href;
  shell.scrollTop = 730;
  for (const selector of ['.site-notes-trigger']) {
    const trigger = document.querySelector(selector); trigger.focus(); await click(trigger);
    await waitFor(() => document.querySelector('#notes-content'), 'Notes content');
    assert.equal(document.querySelector('.learn-reading'), reading);
    assert.equal(shell.scrollTop, 730);
    assert.equal(document.title, title); assert.equal(window.location.href, href);
    assert.equal(document.querySelector('.notes-workspace-dialog').getAttribute('aria-modal'), 'true');
    await click(document.querySelector('[aria-label="Close Notes"]'));
    await waitFor(() => !document.querySelector('.notes-workspace-dialog'), 'Notes closed');
    assert.equal(document.activeElement, trigger);
  }
});

test('Notes keeps its editor nested, protects drafts and returns to the workspace', async () => {
  await annotationStore.clear(); const record = makeRecord(); await annotationStore.create(record);
  await render(LearnPage); await click(document.querySelector('.site-notes-trigger'));
  await waitFor(() => document.querySelector('.notes-entry'), 'saved entry');
  await click(named(document.querySelector('.notes-entry'), 'Edit note'));
  await waitFor(() => document.querySelector('.notes-editor'), 'nested editor');
  assert.equal(document.querySelectorAll('[role="dialog"]').length, 2);
  await change(document.querySelector('.notes-editor textarea'), 'Unsaved modal draft');
  confirmation = false; await click(named(document.querySelector('.notes-editor'), 'Cancel'));
  assert.ok(document.querySelector('.notes-editor')); assert.equal(document.querySelector('textarea').value, 'Unsaved modal draft');
  confirmation = true; await click(named(document.querySelector('.notes-editor'), 'Cancel'));
  assert.equal(document.querySelector('.notes-editor'), null); assert.ok(document.querySelector('.notes-workspace-dialog'));
  assert.equal(annotationStore.getSnapshot().records[0].note, record.note);
  await click(document.querySelector('[aria-label="Close Notes"]'));
});

test('revisiting a highlight from Notes activates and focuses the existing reading without remounting', async () => {
  await annotationStore.clear(); window.history.replaceState(null, '', '/learn/digestive');
  const source = annotationSources.find(item => item.disclosureId && item.blocks.length), record = makeRecord(source);
  await annotationStore.create(record); await render(LearnPage);
  const shell = document.querySelector('.learn-shell');
  for (let revisit = 0; revisit < 2; revisit++) {
    await click(document.querySelector('.site-notes-trigger'));
    await waitFor(() => document.querySelector('.notes-entry-actions a'), 'revisit link');
    await click(document.querySelector('.notes-entry-actions a'));
    await waitFor(() => document.activeElement?.dataset.annotationId === record.id, 'focused saved passage');
    assert.equal(document.querySelector('.learn-shell'), shell);
    assert.equal(document.querySelector('.notes-workspace-dialog'), null);
    assert.equal(tab("Who Cares?").getAttribute('aria-selected'), 'true');
    assert.equal(document.getElementById(`${source.disclosureId}-trigger`).getAttribute('aria-expanded'), 'true');
    assert.equal(window.location.hash, '#annotation=' + record.id);
  }
  assert.equal(networkCalls, 0);
});
