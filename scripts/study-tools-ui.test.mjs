import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {setTimeout as delay} from 'node:timers/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';
import {build} from 'esbuild';
const dom=new JSDOM('<!doctype html><html lang="en"><head><title>Human Atlas</title></head><body><div id="root"></div></body></html>',{url:'http://localhost/learn/digestive',pretendToBeVisual:true}),{window}=dom;
for(const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','HTMLAnchorElement','HTMLTextAreaElement','Element','Node','DocumentFragment','MutationObserver','Event','MouseEvent','KeyboardEvent'])Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?window:window[key]});
globalThis.indexedDB=window.indexedDB=new IDBFactory();globalThis.getComputedStyle=window.getComputedStyle.bind(window);globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);globalThis.BASE_UI_ANIMATIONS_DISABLED=true;
let reduced=true,confirmation=true,exportedBlob,networkCalls=0;
window.matchMedia=query=>({matches:query.includes('prefers-reduced-motion')&&reduced,media:query,addEventListener(){},removeEventListener(){}});
window.ResizeObserver=globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};window.HTMLElement.prototype.getAnimations=()=>[];window.HTMLCanvasElement.prototype.getContext=()=>null;
window.HTMLElement.prototype.scrollIntoView=function(options){this.dataset.scrollOptions=JSON.stringify(options);};window.confirm=()=>confirmation;
window.HTMLElement.prototype.scrollTo=function(options){this.dataset.scrollToOptions=JSON.stringify(options);};
globalThis.fetch=()=>{networkCalls++;throw Error('Study Tools must not fetch geometry or upload progress.');};
URL.createObjectURL=blob=>{exportedBlob=blob;return'blob:study-review';};URL.revokeObjectURL=()=>{};
const nativeClick=window.HTMLAnchorElement.prototype.click;window.HTMLAnchorElement.prototype.click=function(){if(!this.href.startsWith('blob:'))nativeClick.call(this);};
const {createElement}=await import('react'),{createRoot}=await import('react-dom/client'),{flushSync}=await import('react-dom'),{default:axe}=await import('axe-core');
const output=path.resolve('work/study-tools-tests/ui.mjs');
await build({stdin:{contents:"export {default as LearnPage} from './app/learn/page';export * from './app/learn/study-tools/data';export * from './app/learn/study-tools/progress';export * from './app/notes/annotation-store';export * from './app/notes/annotation-content';",resolveDir:process.cwd()},outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},tsconfig:path.resolve('tsconfig.json'),alias:{'@':process.cwd()}});
const {LearnPage,studyBank:bank,studyProgressKey,annotationStore,annotationSources}=await import(pathToFileURL(output).href),root=createRoot(document.querySelector('#root'));let renderKey=0;
const waitFor=async(predicate,label)=>{for(let i=0;i<70;i++){if(predicate())return;await delay(30);}assert.ok(predicate(),label);};
const click=async element=>{assert.ok(element,'click target exists');flushSync(()=>element.click());await delay(65);};
const named=(root,name)=>[...root.querySelectorAll('button')].find(button=>(button.getAttribute('aria-label')??button.textContent.trim())===name);
const tab=name=>[...document.querySelectorAll('[role=tab]')].find(tab=>tab.querySelector('span')?.textContent===name);
const tools=()=>document.querySelector('.study-tools');
const pane=name=>document.getElementById(`study-${name}-heading`)?.closest('.study-panel,.study-glossary');
const open=async()=>{window.history.replaceState(null,'','/learn/digestive');flushSync(()=>root.render(createElement(LearnPage,{pathname:'/learn/digestive',key:++renderKey})));await delay(80);await click(tab('Study Tools'));await waitFor(()=>tools(),'study chunk');};
const closeFlashcards=async()=>{const dialog=document.querySelector('.study-flash-dialog:not([hidden])');if(dialog)await click(named(dialog,'Close flashcard viewer'));};
const activity=async label=>{await closeFlashcards();await click([...tools().querySelectorAll('.study-activity-nav button')].find(button=>button.textContent.startsWith(label)));};
const change=async(element,value)=>{
 if(element.getAttribute('role')==='combobox'){
  await click(element);await waitFor(()=>document.querySelector('.study-topic-menu[data-open]'),'topic menu');
  const option=[...document.querySelectorAll('.study-topic-menu[data-open] [role=option]')].find(option=>option.getAttribute('data-value')===value);
  await click(option);await waitFor(()=>!document.querySelector('.study-topic-menu[data-open]'),'topic menu closed');return;
 }
 const proto=element.tagName==='SELECT'?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(element,value);flushSync(()=>element.dispatchEvent(new window.Event(element.tagName==='SELECT'?'change':'input',{bubbles:true})));await delay(45);
};
const readProgress=()=>JSON.parse(window.localStorage.getItem(studyProgressKey('digestive')));
const press=async(target,key,options={})=>{const event=new window.KeyboardEvent('keydown',{key,code:key===' '?'Space':key,bubbles:true,cancelable:true,...options});flushSync(()=>target.dispatchEvent(event));await delay(45);return event;};
const reset=async()=>{await closeFlashcards();confirmation=true;await click(named(tools(),'Reset Study Progress'));};
const currentQuestion=()=>bank.multipleChoice.find(question=>question.stem===pane('multiple-choice').querySelector('legend')?.textContent);
await annotationStore.initialize();
after(async()=>{flushSync(()=>root.unmount());await annotationStore.dispose();window.close();});

test('enabled Study Tools exposes all four counts and exact topics alongside Gallery without editorial UI or geometry',async()=>{
 await open();assert.equal(tab('Study Tools').getAttribute('aria-selected'),'true');assert.equal(tab('Quizzes'),undefined);assert.ok(tab('Gallery'));
 assert.match(tools().querySelector('header p').textContent,/Test your understanding with multiple-choice questions/);
 assert.deepEqual([...tools().querySelectorAll('.study-overview-count')].map(node=>node.textContent),['111 questions','55 questions','194 concepts','101 cards']);
 const topic=tools().querySelector('[aria-label="Study topic"]');assert.equal(topic.getAttribute('role'),'combobox');assert.equal(topic.querySelector('[data-slot=select-value]').textContent,'All Topics');
 const shell=document.querySelector('.learn-shell'),bodyStyle=document.body.getAttribute('style'),htmlStyle=document.documentElement.getAttribute('style');
 await click(topic);await waitFor(()=>document.querySelector('.study-topic-menu[data-open]'),'themed topic menu');
 assert.equal(document.documentElement.hasAttribute('data-base-ui-scroll-locked'),false);assert.equal(document.body.getAttribute('style'),bodyStyle);assert.equal(document.documentElement.getAttribute('style'),htmlStyle);
 const wheel=new window.WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true});shell.dispatchEvent(wheel);assert.equal(wheel.defaultPrevented,false,'page wheel scrolling remains available outside the open menu');
 assert.deepEqual([...document.querySelectorAll('.study-topic-menu[data-open] [role=option]')].map(option=>[option.getAttribute('data-value'),option.textContent.trim()]),[['all','All Topics'],...bank.manifest.topics.map(topic=>[topic.id,topic.label])]);
 await press(document.activeElement,'Escape');await waitFor(()=>!document.querySelector('.study-topic-menu[data-open]'),'topic menu dismissed');assert.equal(topic.querySelector('[data-slot=select-value]').textContent,'All Topics');assert.equal(document.activeElement,topic);
 assert.equal(tools().querySelector('iframe'),null);assert.doesNotMatch(tools().textContent,/Editorial Review|Export correction/);assert.equal(tools().querySelector('canvas'),null);assert.equal(networkCalls,0);
});
test('multiple choice preserves randomized answer positions, accepts one submission, keeps scroll position and makes Next directly available',async()=>{
 await reset();await activity('Multiple Choice');await click(named(pane('multiple-choice'),'Start session'));
 let panel=pane('multiple-choice'),question=currentQuestion(),order=[...panel.querySelectorAll('input[type=radio]')].map(input=>input.value);
 await click(panel.querySelector(`input[value="${question.correctChoiceId}"]`));assert.deepEqual([...panel.querySelectorAll('input[type=radio]')].map(input=>input.value),order);
 const shell=document.querySelector('.learn-shell');shell.scrollTop=300;delete shell.dataset.scrollToOptions;
 const form=panel.querySelector('form');await click(named(panel,'Submit answer'));flushSync(()=>form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await delay(40);
 assert.equal(readProgress().multipleChoice[question.id].attempts,1);assert.equal(readProgress().multipleChoice[question.id].correct,1);assert.equal(panel.querySelector('.study-feedback p').textContent,question.explanation);
 assert.equal(shell.dataset.scrollToOptions,undefined);assert.equal(shell.scrollTop,300);assert.equal(document.activeElement,named(panel,'Next question'));
 await activity('Glossary');await activity('Multiple Choice');assert.equal(currentQuestion().id,question.id);assert.deepEqual([...panel.querySelectorAll('input[type=radio]')].map(input=>input.value),order);
 await click(named(panel,'Next question'));question=currentQuestion();panel=pane('multiple-choice');const wrong=question.choices.find(choice=>choice.id!==question.correctChoiceId).id;
 reduced=false;await click(panel.querySelector(`input[value="${wrong}"]`));await click(named(panel,'Submit answer'));assert.equal(readProgress().multipleChoice[question.id].incorrect,1);assert.equal(shell.dataset.scrollToOptions,undefined);reduced=true;
 assert.equal(named(tools(),'Review missed (1)').disabled,false);await click(named(panel,'Previous'));assert.ok(pane('multiple-choice').querySelector('.study-feedback'));await click(named(pane('multiple-choice'),'Finish session'));
 assert.match(pane('multiple-choice').textContent,/1 \/ 10 correct/);assert.match(pane('multiple-choice').textContent,/8 unanswered/);await click(named(tools(),'Review missed (1)'));assert.match(pane('multiple-choice').querySelector('.study-session-navigation').textContent,/1 of 1/);
});
test('persistent session controls support 20/all questions, missed review and topic-filtered pools',async()=>{
 const size=tools().querySelector('[aria-label="Questions per session"]');await change(size,'20');await click(named(tools(),'New randomized session'));assert.match(pane('multiple-choice').querySelector('.study-session-navigation').textContent,/1 of 20/);
 await change(size,'all');await click(named(tools(),'New randomized session'));assert.match(pane('multiple-choice').querySelector('.study-session-navigation').textContent,/1 of 111/);
 const topic=bank.manifest.topics[2];await change(tools().querySelector('[aria-label="Study topic"]'),topic.id);await click(named(tools(),'New randomized session'));assert.equal(currentQuestion().topicId,topic.id);assert.equal(tools().querySelector('[aria-label="Study topic"]').querySelector('[data-slot=select-value]').textContent,topic.label);
 await activity('Flashcards');assert.equal(tools().querySelector('[aria-label="Study topic"]').querySelector('[data-slot=select-value]').textContent,topic.label);assert.ok(bank.flashcards.filter(card=>card.topicId===topic.id).some(card=>card.front===pane('flashcards').querySelector('.study-card-text').textContent));await closeFlashcards();await change(tools().querySelector('[aria-label="Study topic"]'),'all');
});
test('fill in the blank preserves the sentence, handles hints/retry and never scores a revealed answer as independent recall',async()=>{
 await reset();await activity('Fill in the Blank');let panel=pane('fill-in-the-blank');
 const findQuestion=()=>bank.fillInTheBlank.find(question=>question.prompt.replace('_____','')===pane('fill-in-the-blank').querySelector('.study-fill-prompt').textContent);
 let question=findQuestion();assert.ok(question);assert.equal(panel.querySelector('.study-revealed-answer'),null);await click(named(panel,'Hint'));assert.equal(panel.querySelector('.study-hint p').textContent,question.hint);
 await change(panel.querySelector('input'),'definitely incorrect');await click(named(panel,'Check Answer'));assert.equal(readProgress().fillInTheBlank[question.id].incorrect,1);assert.equal(panel.querySelector('.study-feedback > p').textContent,question.explanation);
 await click(named(panel,'Retry'));await change(panel.querySelector('input'),` ${question.answer.toUpperCase()}! `);await click(named(panel,'Check Answer'));assert.equal(readProgress().fillInTheBlank[question.id].correct,1);assert.equal(readProgress().fillInTheBlank[question.id].hints,1);
 await click(named(panel,'Next'));panel=pane('fill-in-the-blank');question=findQuestion();await click(named(panel,'Reveal Answer'));assert.equal(panel.querySelector('.study-revealed-answer').textContent,question.answer);assert.equal(readProgress().fillInTheBlank[question.id].correct,0);
 await click(named(panel,'Retry'));await change(panel.querySelector('input'),question.answer);await click(named(panel,'Check Answer'));assert.equal(readProgress().fillInTheBlank[question.id].correct,0);assert.equal(readProgress().fillInTheBlank[question.id].assisted,1);assert.equal(readProgress().fillInTheBlank[question.id].reveals,1);
 await click(named(panel,'Review session'));assert.match(pane('fill-in-the-blank').textContent,/1 \/ 55 recalled/);assert.ok(named(tools(),'Review missed or unanswered (54)'));
});
test('glossary continuously renders all concepts without pages, filters aliases/definitions/letters and follows related/source links',async()=>{
 await activity('Glossary');let panel=pane('glossary'),search=panel.querySelector('input[type=search]');
 assert.equal(panel.querySelectorAll('.study-concept').length,194);assert.match(panel.querySelector('.study-count').textContent,/194/);
 assert.deepEqual([...panel.querySelectorAll('.study-concept')].map(node=>node.dataset.conceptId),[...bank.concepts].sort((a,b)=>a.term.localeCompare(b.term,'en',{sensitivity:'base'})||a.id.localeCompare(b.id)).map(concept=>concept.id));
 assert.equal(panel.querySelector('.study-session-navigation'),null);assert.equal(named(panel,'Next concepts'),undefined);assert.equal(named(panel,'Previous concepts'),undefined);
 await change(search,'GI tract');assert.ok(panel.querySelector('[data-concept-id="gastrointestinal-tract"]'));await change(search,'continuous alimentary canal');assert.ok(panel.querySelector('[data-concept-id="gastrointestinal-tract"]'));
 await change(search,'');await change(panel.querySelector('select'),'A');assert.ok([...panel.querySelectorAll('.study-concept h4')].every(h=>h.textContent.toUpperCase().startsWith('A')));await change(panel.querySelector('select'),'all');
 const concept=bank.concepts.find(concept=>concept.relatedConceptIds.length);await change(search,concept.term);let entry=panel.querySelector(`[data-concept-id="${concept.id}"]`);assert.ok(entry);await click(entry.querySelector('summary'));await click(entry.querySelector('.study-related-concepts button'));
 panel=pane('glossary');const related=bank.concepts.find(item=>item.id===concept.relatedConceptIds[0]);assert.equal(panel.querySelector('.study-concept h4').textContent,related.term);
 const link=panel.querySelector('.study-sources a'),hash=new URL(link.href).hash;await click(link);await waitFor(()=>document.getElementById(hash.slice(1))===document.activeElement,'source heading focus');assert.equal(window.location.hash,hash);assert.equal(document.activeElement.dataset.scrollOptions,JSON.stringify({block:'start',behavior:'instant'}));assert.equal(document.querySelector('[role=tab][aria-selected=true]').textContent,hash.includes('exam-cram')?'Exam Cram':'Deep Dive');
 flushSync(()=>root.render(createElement(LearnPage,{pathname:'/learn/digestive',key:++renderKey})));await delay(100);assert.ok(document.getElementById(hash.slice(1)));assert.equal(document.activeElement.id,hash.slice(1));await click(tab('Study Tools'));await waitFor(()=>tools(),'return to tools');
});
test('flashcards flip/reset faces, mark progress, persist across remounts, and review only Needs Review cards',async()=>{
 await reset();await activity('Flashcards');let panel=pane('flashcards'),card=bank.flashcards.find(card=>card.front===panel.querySelector('.study-card-text').textContent);assert.ok(card);
 await click(panel.querySelector('.study-flashcard'));assert.equal(panel.querySelector('.study-card-text').textContent,card.back);await click(named(panel,'Mark Needs Review'));assert.equal(readProgress().flashcards[card.id].status,'needs-review');
 await click(named(panel,'Next'));assert.equal(panel.querySelector('.study-card-side').textContent,'Front · Recall');await click(named(panel,'Previous'));assert.equal(panel.querySelector('.study-card-text').textContent,card.front);
 await click(named(panel,'Needs Review only'));assert.equal(panel.querySelector('.study-card-text').textContent,card.front);assert.match(panel.querySelector('.study-session-navigation').textContent,/1 of 1/);await click(named(panel,'Mark Known'));assert.equal(readProgress().flashcards[card.id].reviews,2);
 await click(named(panel,'Needs Review only'));assert.match(panel.textContent,/No cards are marked Needs Review/);await open();await activity('Flashcards');assert.equal(readProgress().flashcards[card.id].status,'known');assert.match(pane('flashcards').textContent,/1 known/);
});
test('flashcard modal arrows work from blank areas immediately and release keyboard control on close',async()=>{
 await open();await reset();await activity('Flashcards');
 const panel=pane('flashcards'),dialog=document.querySelector('.study-flash-dialog:not([hidden])');assert.ok(dialog);
 for(const selector of ['.study-flash-dialog-header','.study-session-heading','.study-flash-progress','.study-flashcard','.study-flash-ratingbar','.study-session-navigation','.study-flash-shortcut-guide']){
  const area=dialog.querySelector(selector);assert.ok(area,selector);await click(area);
  assert.equal((await press(document.activeElement,'ArrowRight')).defaultPrevented,true,selector);
  assert.match(panel.querySelector('.study-session-navigation').textContent,/2 of 101/,selector);
  await press(document.activeElement,'ArrowLeft');assert.match(panel.querySelector('.study-session-navigation').textContent,/1 of 101/,selector);
  const front=panel.querySelector('.study-card-side').textContent;
  await press(document.activeElement,'ArrowUp');assert.notEqual(panel.querySelector('.study-card-side').textContent,front,selector);
  await press(document.activeElement,'ArrowDown');assert.equal(panel.querySelector('.study-card-side').textContent,front,selector);
 }
 const field=document.createElement('input');dialog.append(field);field.focus();assert.equal((await press(field,'ArrowRight')).defaultPrevented,false);assert.match(panel.querySelector('.study-session-navigation').textContent,/1 of 101/);field.remove();
 await click(named(panel,'List view'));assert.equal((await press(document.activeElement,'ArrowDown')).defaultPrevented,false);
 await click(named(panel,'Back to cards'));await press(document.activeElement,'ArrowRight');assert.match(panel.querySelector('.study-session-navigation').textContent,/2 of 101/);
 await press(document.activeElement,'Escape');await waitFor(()=>dialog.hasAttribute('hidden'),'flashcards closed');
 assert.equal((await press(document.body,'ArrowRight')).defaultPrevented,false);assert.match(panel.querySelector('.study-session-navigation').textContent,/2 of 101/);
});

test('flashcard keyboard shortcuts navigate, flip, mark both states, shuffle/restart and list every shortcut in the interface',async()=>{
 await reset();await activity('Flashcards');const panel=pane('flashcards');let face=panel.querySelector('.study-flashcard'),card=bank.flashcards.find(card=>card.front===panel.querySelector('.study-card-text').textContent);panel.querySelector('h3').focus();
 assert.equal(panel.querySelector('.study-flash-auto input').checked,false);assert.equal((await press(panel.querySelector('h3'),'ArrowLeft')).defaultPrevented,true);assert.equal(panel.querySelector('.study-card-text').textContent,card.front);
 await press(panel.querySelector('h3'),' ');assert.equal(panel.querySelector('.study-card-text').textContent,card.back);assert.equal(document.activeElement,face);await press(face,' ');assert.equal(panel.querySelector('.study-card-text').textContent,card.front);
 await press(face,'k');assert.equal(readProgress().flashcards[card.id].status,'known');assert.equal(panel.querySelector('.study-flash-status').textContent,'Known');await press(face,'U');assert.equal(readProgress().flashcards[card.id].status,'needs-review');assert.equal(panel.querySelector('.study-flash-status').textContent,'Needs Review');
 await press(face,'u',{repeat:true});assert.equal(readProgress().flashcards[card.id].reviews,2);
 await press(face,'ArrowRight');assert.match(panel.querySelector('.study-session-navigation').textContent,/2 of 101/);assert.equal(panel.querySelector('.study-card-side').textContent,'Front · Recall');assert.equal(document.activeElement,panel.querySelector('.study-flashcard'));
 await press(panel.querySelector('.study-flashcard'),'ArrowLeft');assert.equal(panel.querySelector('.study-card-text').textContent,card.front);await press(panel.querySelector('.study-flashcard'),'r');assert.equal(panel.querySelector('progress').value,0);assert.equal(panel.querySelector('.study-card-text').textContent,card.front);assert.equal(readProgress().flashcards[card.id].status,'needs-review');
 await press(panel.querySelector('.study-flashcard'),'s');assert.match(panel.querySelector('.study-session-navigation').textContent,/1 of 101/);assert.ok(bank.flashcards.some(card=>card.front===panel.querySelector('.study-card-text').textContent));
 assert.deepEqual([...panel.querySelectorAll('.study-flash-shortcut-guide kbd')].map(node=>node.textContent),['←','→','Space','↑','↓','K','U','S','R','Esc']);
 for(const [label,key] of [['Mark Known','K'],['Mark Needs Review','U'],['Shuffle deck','S'],['Restart review','R'],['Previous','ArrowLeft'],['Next','ArrowRight']])assert.equal(named(panel,label).getAttribute('aria-keyshortcuts'),key);
 assert.equal(face.getAttribute('aria-keyshortcuts'),'Space Enter ArrowUp ArrowDown');
});
test('flashcard shortcuts ignore typing, editable text, held keys, modifier shortcuts, hidden activities and native button activation',async()=>{
 await reset();await activity('Flashcards');const panel=pane('flashcards'),face=panel.querySelector('.study-flashcard'),before=panel.querySelector('.study-card-text').textContent,saved=window.localStorage.getItem(studyProgressKey('digestive'));
 for(const options of [{ctrlKey:true},{metaKey:true},{altKey:true},{repeat:true},{isComposing:true}]){assert.equal((await press(face,'k',options)).defaultPrevented,false);assert.equal(window.localStorage.getItem(studyProgressKey('digestive')),saved);}
 assert.equal((await press(face,'ArrowRight',{shiftKey:true})).defaultPrevented,false);assert.equal(panel.querySelector('.study-card-text').textContent,before);
 const field=document.createElement('input');panel.append(field);field.focus();for(const key of ['k','u','s','r',' ','ArrowRight'])assert.equal((await press(field,key)).defaultPrevented,false);field.remove();assert.equal(window.localStorage.getItem(studyProgressKey('digestive')),saved);
 const text=panel.querySelector('.study-card-text');text.setAttribute('contenteditable','true');await press(text,'k');text.removeAttribute('contenteditable');assert.equal(window.localStorage.getItem(studyProgressKey('digestive')),saved);
 const next=named(panel,'Next');assert.equal((await press(next,' ')).defaultPrevented,false);await click(next);const current=bank.flashcards.find(card=>card.front===panel.querySelector('.study-card-text').textContent);assert.ok(current);
 assert.equal((await press(panel.querySelector('.study-flashcard'),'Enter')).defaultPrevented,false);await click(panel.querySelector('.study-flashcard'));assert.equal(panel.querySelector('.study-card-text').textContent,current.back);
 await activity('Glossary');const previous=panel.querySelector('.study-card-text').textContent;assert.equal((await press(face,'ArrowRight')).defaultPrevented,false);await press(face,'k');await press(document.body,'k');assert.equal(panel.querySelector('.study-card-text').textContent,previous);assert.equal(window.localStorage.getItem(studyProgressKey('digestive')),saved);
});
test('optional auto-advance marks the right card and handles single-card review completion and restart with keyboard focus',async()=>{
 await reset();await activity('Flashcards');const panel=pane('flashcards');await click(panel.querySelector('.study-flash-auto input'));
 let card=bank.flashcards.find(card=>card.front===panel.querySelector('.study-card-text').textContent);await press(panel.querySelector('.study-flashcard'),'k');assert.equal(readProgress().flashcards[card.id].status,'known');assert.match(panel.querySelector('.study-session-navigation').textContent,/2 of 101/);
 card=bank.flashcards.find(card=>card.front===panel.querySelector('.study-card-text').textContent);await press(panel.querySelector('.study-flashcard'),'u');assert.equal(readProgress().flashcards[card.id].status,'needs-review');assert.match(panel.querySelector('.study-session-navigation').textContent,/3 of 101/);
 await click(named(panel,'Needs Review only'));assert.match(panel.querySelector('.study-session-navigation').textContent,/1 of 1/);assert.equal(panel.querySelector('.study-card-text').textContent,card.front);await press(panel.querySelector('.study-flashcard'),'k');assert.match(panel.textContent,/Review complete/);assert.equal(document.activeElement,panel.querySelector('.study-empty h4'));assert.equal(readProgress().flashcards[card.id].status,'known');
 await press(document.activeElement,'r');assert.equal(document.activeElement,panel.querySelector('.study-flashcard'));assert.equal(panel.querySelector('.study-card-side').textContent,'Front · Recall');await press(document.activeElement,'ArrowRight');assert.match(panel.textContent,/Review complete/);
 await click(named(panel,'Needs Review only'));assert.match(panel.textContent,/No cards are marked Needs Review/);const saved=window.localStorage.getItem(studyProgressKey('digestive'));await press(panel.querySelector('h3'),'k');assert.equal(window.localStorage.getItem(studyProgressKey('digestive')),saved);
});
test('review export includes study results/review queues only, and confirmed reset preserves actual Notes and theme',async()=>{
 await activity('Multiple Choice');await click(named(tools(),'New randomized session'));const question=currentQuestion(),panel=pane('multiple-choice');await click(panel.querySelector('input[value=c2]'));await click(named(panel,'Submit answer'));await click(named(tools(),'Export review notes'));
 const report=JSON.parse(await exportedBlob.text());assert.equal(report.kind,'human-atlas-study-review');assert.ok(report.reviewList.multipleChoice.includes(question.id));assert.equal(report.annotations,undefined);assert.equal(report.notes,undefined);
 const source=annotationSources.find(source=>source.blocks.some(block=>block.id.startsWith('b-'))),block=source.blocks.find(block=>block.id.startsWith('b-')),now=new Date().toISOString();
 const note={id:crypto.randomUUID(),schemaVersion:1,target:source.target,anchor:{blockId:block.id,start:0,end:10,exact:block.text.slice(0,10),prefix:'',suffix:block.text.slice(10,58),blockText:block.text,contentVersion:source.version},note:'Keep this personal note',style:'ochre',status:'anchored',createdAt:now,modifiedAt:now};await annotationStore.create(note);
 window.localStorage.setItem('human-atlas-theme','dark');confirmation=false;await click(named(tools(),'Reset Study Progress'));assert.ok(readProgress());confirmation=true;await click(named(tools(),'Reset Study Progress'));assert.equal(readProgress(),null);assert.equal(window.localStorage.getItem('human-atlas-theme'),'dark');assert.equal(annotationStore.getSnapshot().records.find(record=>record.id===note.id).note,note.note);
 assert.ok(named(tools(),'New randomized session'));assert.equal(networkCalls,0);
});
test('multiple-choice full key shows all questions and options, marks correct IDs, respects topic filters and preserves the unfinished session',async()=>{
 await reset();await activity('Multiple Choice');await click(named(tools(),'New randomized session'));
 const panel=pane('multiple-choice'),question=currentQuestion(),order=[...panel.querySelectorAll('input[type=radio]')].map(input=>input.value);await click(panel.querySelector('input[value=c3]'));
 const saved=window.localStorage.getItem(studyProgressKey('digestive'));await click(named(tools(),'View key'));
 let key=tools().querySelector('#study-multiple-choice-answer-key'),items=[...key.querySelectorAll('.study-key-list > li')];assert.equal(items.length,111);assert.equal(key.querySelector('input'),null);
 items.forEach((item,index)=>{const source=bank.multipleChoice[index];assert.equal(item.dataset.questionId,source.id);assert.equal(item.querySelector('.study-key-question').textContent,source.stem);assert.deepEqual([...item.querySelectorAll('.study-key-choice-text')].map(node=>node.textContent),source.choices.map(choice=>choice.text));assert.equal(item.querySelectorAll('[data-correct]').length,1);assert.equal(item.querySelector('[data-correct]').dataset.choiceId,source.correctChoiceId);assert.equal(item.querySelector('.study-key-correct').textContent,'Correct answer');assert.equal(item.querySelector('.study-key-explanation').textContent,source.explanation);});
 assert.equal(document.activeElement,key.querySelector('h3'));assert.equal(window.localStorage.getItem(studyProgressKey('digestive')),saved);
 await click(named(key,'Back to practice'));assert.equal(currentQuestion().id,question.id);assert.deepEqual([...pane('multiple-choice').querySelectorAll('input[type=radio]')].map(input=>input.value),order);assert.equal(pane('multiple-choice').querySelector('input:checked').value,'c3');assert.equal(document.activeElement,named(tools(),'View key'));
 await change(tools().querySelector('[aria-label="Study topic"]'),'oral');await click(named(tools(),'View key'));key=tools().querySelector('#study-multiple-choice-answer-key');assert.equal(key.querySelectorAll('.study-key-list > li').length,bank.multipleChoice.filter(question=>question.topicId==='oral').length);assert.equal(window.localStorage.getItem(studyProgressKey('digestive')),saved);
 await click(named(key,'Back to practice'));await change(tools().querySelector('[aria-label="Study topic"]'),'all');
});
test('fill full key completes all authored prompts, includes alternatives and explanations, and leaves reveals/progress and draft unchanged',async()=>{
 await reset();await activity('Fill in the Blank');let panel=pane('fill-in-the-blank');const prompt=panel.querySelector('.study-fill-prompt').textContent;await change(panel.querySelector('input'),'Draft to keep');
 const saved=window.localStorage.getItem(studyProgressKey('digestive'));await click(named(tools(),'Reveal full key'));
 const key=tools().querySelector('#study-fill-in-the-blank-answer-key'),items=[...key.querySelectorAll('.study-key-list > li')];assert.equal(items.length,55);
 items.forEach((item,index)=>{const source=bank.fillInTheBlank[index];assert.equal(item.dataset.questionId,source.id);assert.equal(item.querySelector('.study-key-question').textContent,source.prompt.replace('_____',source.answer));assert.equal(item.querySelector('mark').textContent,source.answer);assert.equal(item.querySelector('.study-key-explanation').textContent,source.explanation);for(const accepted of source.acceptedAnswers)assert.ok(item.querySelector('.study-key-alternatives').textContent.includes(accepted));});
 assert.equal(window.localStorage.getItem(studyProgressKey('digestive')),saved);assert.equal(document.activeElement,key.querySelector('h3'));
 const result=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(issue=>issue.id),[]);
 await click(named(key,'Back to practice'));panel=pane('fill-in-the-blank');assert.equal(panel.querySelector('input').value,'Draft to keep');assert.equal(panel.querySelector('.study-fill-prompt').textContent,prompt);assert.equal(panel.querySelector('.study-feedback'),null);assert.equal(document.activeElement,named(tools(),'Reveal full key'));
});
test('activity controls, feedback and theme controls pass DOM accessibility checks',async()=>{
 for(const label of ['Multiple Choice','Fill in the Blank','Glossary','Flashcards']){await activity(label);const result=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(issue=>issue.id),[],label+' '+JSON.stringify(result.violations.map(issue=>({id:issue.id,nodes:issue.nodes.map(node=>({html:node.html,summary:node.failureSummary}))}))));}
 await closeFlashcards();await click(document.querySelector('[aria-label="Appearance settings"]'));await click(named(document.querySelector('.appearance-popover'),'Dark'));assert.equal(document.documentElement.dataset.theme,'dark');
});
