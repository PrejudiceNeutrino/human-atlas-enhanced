import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {after,test} from 'node:test';
import {setTimeout as delay} from 'node:timers/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const dom=new JSDOM('<!doctype html><html lang="en"><head><title>Human Atlas</title></head><body><div id="root"></div></body></html>',{url:'http://localhost/learn/respiratory',pretendToBeVisual:true});
const {window}=dom;
for(const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLButtonElement','HTMLTextAreaElement','HTMLAnchorElement','Element','Node','NodeFilter','DocumentFragment','MutationObserver','Event','MouseEvent','KeyboardEvent'])Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?window:window[key]});
globalThis.getComputedStyle=window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame=window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame=window.cancelAnimationFrame.bind(window);
globalThis.BASE_UI_ANIMATIONS_DISABLED=true;
window.indexedDB=globalThis.indexedDB=new IDBFactory();
window.matchMedia=query=>({matches:query.includes('reduced-motion'),media:query,addEventListener(){},removeEventListener(){}});
window.ResizeObserver=globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
window.HTMLElement.prototype.getAnimations=()=>[];
window.HTMLElement.prototype.scrollIntoView=function(){this.dataset.scrolled='true';};
window.HTMLElement.prototype.scrollTo=function({top}){this.scrollTop=top;};
window.HTMLCanvasElement.prototype.getContext=()=>null;
window.Range.prototype.getBoundingClientRect=()=>({left:100,top:200,width:200,height:20});
const requests=[],originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{requests.push(String(url));const file=path.join('public',String(url));return fs.existsSync(file)?new Response(fs.readFileSync(file)):new Response('',{status:404});};
const output=path.resolve('work/respiratory-tests/runtime.mjs');
await build({stdin:{contents:`export {default as LearnPage} from './app/learn/page';export * from './app/learn/subjects';export * from './app/learn/content';export {studyBank,unresolvedReferences} from './app/learn/study-tools/respiratory-data';export * from './app/learn/study-tools/model';export * from './app/learn/study-tools/progress';export * from './app/learn/study-tools/validation';export * from './app/learn/anatomy-companion/references';export * from './app/learn/anatomy-companion/model';export {annotationStore} from './app/notes/annotation-store';export * from './app/notes/annotation-content';`,resolveDir:process.cwd()},outfile:output,tsconfig:'tsconfig.json',bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},alias:{'@':process.cwd()},plugins:[{name:'cpu-scene',setup(build){build.onLoad({filter:/[\\/]app[\\/]scene\.tsx$/},()=>({contents:`import {useEffect} from 'react';export default function Scene(props){globalThis.__respiratoryScene=props;useEffect(()=>{const timer=setTimeout(()=>{props.onReady();props.onSettled()},0);return()=>clearTimeout(timer)},[props.atlas]);return <canvas/>}`,loader:'tsx'}));}}]});
const api=await import(pathToFileURL(output).href);
const {createElement}=await import('react'),{flushSync}=await import('react-dom'),{createRoot}=await import('react-dom/client');
const {renderToStaticMarkup}=await import('react-dom/server'),{default:Markdown}=await import('react-markdown'),{default:remarkGfm}=await import('remark-gfm'),{default:axe}=await import('axe-core');
const root=createRoot(document.querySelector('#root'));
let revision=0;
const render=async(route='/learn/respiratory',hash='')=>{window.history.replaceState(null,'',route+hash);flushSync(()=>root.render(createElement(api.LearnPage,{pathname:route,key:++revision})));await delay(100);};
const waitFor=async(predicate,message)=>{for(let i=0;i<100;i++){if(predicate())return;await delay(25);}assert.ok(predicate(),message);};
const click=async node=>{assert.ok(node,'control exists');flushSync(()=>node.click());await delay(65);};
const tab=title=>[...document.querySelectorAll('.learn-tab-trigger')].find(node=>node.querySelector('span')?.textContent===title);
const named=(scope,label)=>[...scope.querySelectorAll('button,a')].find(node=>(node.textContent===label||node.textContent.replace(/\d+$/,'')===label));
const panel=()=>document.querySelector('.learn-tab-panel:not([hidden])');
const normalized=text=>text.replace(/\s+/g,' ').trim();
const markdownText=md=>normalized(JSDOM.fragment(renderToStaticMarkup(createElement(Markdown,{remarkPlugins:[remarkGfm],children:md}))).textContent);
const setInput=async(node,value)=>{Object.getOwnPropertyDescriptor(node instanceof window.HTMLTextAreaElement?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,'value').set.call(node,value);flushSync(()=>node.dispatchEvent(new window.Event('input',{bubbles:true})));await delay(40);};
after(async()=>{flushSync(()=>root.unmount());await api.annotationStore.dispose();globalThis.fetch=originalFetch;window.close();});

test('readings and study revisions retain their supplied bytes; protected source assets remain unchanged',()=>{
  const inventory=read('docs/integration/respiratory-source/archive-inventory.json').entries;
  const editorialHashes=new Map([...read('docs/integration/editorial-consistency-source/archive-inventory.json').installedFiles,...read('docs/integration/exam-cram-final-source/archive-inventory.json').installedFiles].map(entry=>[entry.targetPath,entry.sha256]));
  const mappings=inventory.flatMap(entry=>{
    const name=entry.path.split('/').at(-1);
    if(/^phase-0[23]-readings\/respiratory-system-.*\.json$/.test(entry.path))return [[entry,`data/learn/${name}`]];
    if(entry.path.startsWith('phase-04-study-tools/')&&['concepts.json','multiple-choice.json','fill-in-the-blank.json','flashcards.json','manifest.json'].includes(name))return [[entry,`data/learn/respiratory-study-tools/${name}`]];
    if(/^phase-05-visuals\/(gallery.json|images\/.*|thumbnails\/.*)$/.test(entry.path))return [[entry,`public/images/learn/respiratory/gallery/${entry.path.split('/').slice(1).join('/')}`]];
    return [];
  });
  assert.equal(mappings.length,69);
  for(const [entry,file] of mappings)assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),editorialHashes.get(file)??entry.sha256,file);
  assert.equal(fs.readdirSync('public/images/learn/respiratory/gallery/images').length,29);
  assert.equal(fs.readdirSync('public/images/learn/respiratory/gallery/thumbnails').length,29);
});

test('subject registry shares eight descriptions in order and all reading sections render complete original Markdown',async()=>{
  const respiratory=api.learnSubjects.find(s=>s.slug==='respiratory'),digestive=api.learnSubjects.find(s=>s.slug==='digestive');
  assert.deepEqual(respiratory.tabs.map(t=>t.title),['General Overview','Deep Dive','How It Connects','Who Cares?','Visualize','Gallery','Exam Cram','Study Tools']);
  assert.deepEqual(respiratory.tabs.map(t=>t.description),digestive.tabs.map(t=>t.description));
  await render('/learn');assert.ok(document.querySelector('a[href="/learn/respiratory"]'));await render();
  assert.equal(document.querySelector('h1').textContent,'Respiratory System');
  for(const [title,count] of [['General Overview',8],['Deep Dive',23],['How It Connects',11],['Exam Cram',18]]){
    await click(tab(title));if(title==='Exam Cram')await click(document.querySelector('.learn-exam-mode input[value="detailed-review"]'));const active=panel(),article=api.articles[respiratory.tabs.find(t=>t.title===title).id];
    assert.equal(active.querySelectorAll('.learn-article-section').length,count);
    assert.equal(normalized(active.querySelector('header .learn-markdown').textContent),markdownText(article.introMarkdown));
    for(const section of article.sections){const heading=document.getElementById(`${article.id}-${section.id}`);assert.equal(heading.textContent,section.title);assert.equal(normalized(heading.closest('section').querySelector('.learn-markdown').textContent),markdownText(section.markdown));}
    assert.equal(active.querySelectorAll('.learn-index-desktop nav a').length,count);
    const ids=[...document.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  }
  await click(tab('Who Cares?'));
  const facts=api.factSections['respiratory-system-why-is-this-cool'];
  assert.equal(facts.sections.length,3);
  for(const [i,entry] of facts.sections.entries()){
    const button=panel().querySelectorAll('.learn-more-trigger')[i];await click(button);
    const expansion=document.getElementById(button.getAttribute('aria-controls'));
    assert.ok(normalized(expansion.textContent).includes(markdownText(entry.moreInfoMarkdown)));
  }
  const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(results.violations.map(v=>v.id),[]);
});

test('subject hashes and all source references activate the correct Respiratory section',async()=>{
  const bank=api.studyBank;
  assert.deepEqual([bank.concepts.length,bank.multipleChoice.length,bank.fillInTheBlank.length,bank.flashcards.length,bank.manifest.topics.length],[192,106,67,114,14]);
  assert.deepEqual(api.unresolvedReferences,[]);
  for(const record of [...bank.concepts,...bank.multipleChoice,...bank.fillInTheBlank,...bank.flashcards])for(const ref of record.sourceRefs){const target=api.sourceTarget(ref,api.articles,'/learn/respiratory');assert.equal(target?.href,`/learn/respiratory#${ref.articleId}-${ref.sectionId}`);}
  const ref=bank.concepts[0].sourceRefs[0];await render('/learn/respiratory',`#${ref.articleId}-${ref.sectionId}`);
  assert.equal(document.querySelector('.learn-tab-trigger[aria-selected=true]').getAttribute('data-slot'),'tabs-trigger');
  assert.equal(document.activeElement.id,`${ref.articleId}-${ref.sectionId}`);
  const invalid=structuredClone(bank);invalid.concepts[0].sourceRefs[0].slideReferences={'23-Respiratory System.pptx':[43]};assert.throws(()=>api.validateStudyBank(invalid,api.articles),/invalid slide/);
  const foreign=structuredClone(bank);foreign.concepts[0].sourceRefs[0].articleId='digestive-system-deep-dive';assert.throws(()=>api.validateStudyBank(foreign,api.articles),/another subject/);
  for(const group of ['concepts','multipleChoice','fillInTheBlank','flashcards'])assert.equal(bank.manifest.topics.reduce((sum,t)=>sum+api.byTopic(bank[group],t.id).length,0),bank[group].length);
  let seed=23;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  const session=api.createQuizSession(bank.multipleChoice,'all',random);assert.equal(session.length,106);assert.ok(new Set(session.map(item=>item.choiceIds.indexOf(bank.multipleChoice.find(q=>q.id===item.id).correctChoiceId))).size>1);
  for(const q of bank.multipleChoice)assert.ok(api.isCorrectChoice(q,q.correctChoiceId));
  for(const q of bank.fillInTheBlank)for(const answer of [q.answer,...q.acceptedAnswers])assert.ok(api.isAcceptedAnswer(q,answer.toUpperCase()),q.id);
});

test('all 30 curriculum objectives retain their authored reading and study-tool targets',()=>{
  const prefix='docs/integration/respiratory-source/';
  const stage2=read(prefix+'phase-02-readings/study-guide-stage2-coverage.json').items;
  const stage3=read(prefix+'phase-03-readings/study-guide-stage3-coverage.json').objectives;
  const study=read(prefix+'phase-04-study-tools/chapter23-study-guide-alignment.json').objectives;
  assert.equal(stage2.length,30);assert.equal(stage3.length,30);assert.equal(study.length,30);
  for(const objective of stage2)assert.ok(api.articles['respiratory-system-deep-dive'].sections.some(section=>section.id===objective.deepDiveSectionId),objective.id);
  for(const objective of stage3)assert.ok(api.articles[objective.targetArticleId].sections.some(section=>section.id===objective.targetSectionId),objective.id);
  for(const objective of study)for(const [field,group] of [['multipleChoiceIds','multipleChoice'],['fillBlankIds','fillInTheBlank'],['flashcardIds','flashcards']]){
    assert.ok(objective[field].length>0,objective.id);
    for(const id of objective[field])assert.ok(api.studyBank[group].some(record=>record.id===id),`${objective.id}/${id}`);
  }
  assert.equal(read(prefix+'phase-01-curriculum/scientific-review-queue.json').length,15);
});

test('study activities use Respiratory bank; shared IDs persist independently across subjects',async()=>{
  const storage=window.localStorage;storage.clear();
  const digestive=api.createStudyProgressStore('digestive',storage),respiratory=api.createStudyProgressStore('respiratory',storage);
  digestive.answerMultipleChoice('mc-001',false);respiratory.answerMultipleChoice('mc-001',true);digestive.markCard('fc-001','known');respiratory.markCard('fc-001','needs-review');
  assert.equal(api.createStudyProgressStore('digestive',storage).getSnapshot().progress.multipleChoice['mc-001'].incorrect,1);
  assert.equal(api.createStudyProgressStore('respiratory',storage).getSnapshot().progress.multipleChoice['mc-001'].correct,1);
  respiratory.reset();assert.equal(digestive.getSnapshot().progress.flashcards['fc-001'].status,'known');
  await render();await click(tab('Study Tools'));await waitFor(()=>document.querySelector('.study-overview-count'),'Respiratory Study Tools');
  assert.deepEqual([...document.querySelectorAll('.study-overview-count')].map(n=>n.textContent),['106 questions','67 questions','192 concepts','114 cards']);
  for(const [activity,selector] of [['Multiple Choice','.study-mc'],['Fill in the Blank','.study-fill'],['Glossary','.study-glossary']]){await click(named(document.querySelector('.study-activity-nav'),activity));assert.ok(document.querySelector(selector)||document.getElementById(`study-${activity.toLowerCase().replaceAll(' ','-')}-heading`));}
  assert.equal(document.querySelectorAll('.study-concept').length,192);
  await click(named(document.querySelector('.study-activity-nav'),'Flashcards'));await waitFor(()=>document.querySelector('.study-flash-dialog'),'flashcard dialog');
  assert.ok(document.querySelector('.study-flash-dialog').textContent.includes('Respiratory System'));await click(document.querySelector('[aria-label="Close flashcard viewer"]'));
  assert.ok(!requests.some(url=>url.includes('/models/')),'reading and Study Tools never load geometry');
});

test('all 29 gallery cards use thumbnails, filters/stars/inspection work and unavailable label practice stays hidden',async()=>{
  await render();await click(tab('Gallery'));await waitFor(()=>document.querySelectorAll('.learn-gallery-card').length===29,'29 figures');
  assert.equal(document.getElementById('respiratory-system-gallery-heading').textContent,'Respiratory System Gallery');
  assert.equal(document.querySelectorAll('.learn-gallery-filters button').length,5);
  assert.ok([...document.querySelectorAll('.learn-gallery-thumbnail img')].every(img=>img.getAttribute('src').includes('/respiratory/gallery/thumbnails/')&&img.getAttribute('loading')==='lazy'));
  await click(document.querySelector('[aria-label^="Star figure:"]'));await click(document.querySelector('.learn-gallery-starred-filter'));assert.equal(document.querySelectorAll('.learn-gallery-card').length,1);
  await click(document.querySelector('.learn-gallery-starred-filter'));await click(document.querySelectorAll('.learn-gallery-filters button')[3]);assert.equal(document.querySelectorAll('.learn-gallery-card').length,5);
  await click(document.querySelector('.learn-gallery-filters button'));await click(document.querySelector('.learn-gallery-card'));
  assert.ok(document.querySelector('.learn-gallery-viewer img').getAttribute('src').includes('/respiratory/gallery/images/'));
  assert.equal(document.querySelector('[aria-label="Label Practice"]'),null);assert.equal(document.querySelector('[aria-label="Edit label masks"]'),null);
  await click(document.querySelector('[aria-label="Next figure"]'));assert.ok(document.querySelector('.learn-gallery-page-controls').textContent.includes('2 / 29'));
  await click(document.querySelector('[aria-label="Close image viewer"]'));assert.equal(document.querySelector('.learn-gallery-viewer'),null);
  assert.ok(!requests.some(url=>url.includes('respiratory/gallery/label-practice')));
});

test('Respiratory highlights and personal notes persist and restore through shared annotation identities',async()=>{
  await render();await api.annotationStore.initialize();
  const block=document.querySelector('.learn-markdown[data-annotation-source$="/intro"] [data-annotation-block]');
  const walker=document.createTreeWalker(block,window.NodeFilter.SHOW_TEXT);walker.nextNode();const text=walker.currentNode;
  const range=document.createRange();range.setStart(text,0);range.setEnd(text,Math.min(20,text.textContent.length));window.getSelection().removeAllRanges();window.getSelection().addRange(range);block.dispatchEvent(new window.Event('pointerup',{bubbles:true}));
  await waitFor(()=>document.querySelector('.annotation-toolbar'),'highlight toolbar');await click(named(document.querySelector('.annotation-toolbar'),'Add Note'));await waitFor(()=>document.querySelector('textarea'),'note editor');
  await setInput(document.querySelector('textarea'),'Respiratory review note');await click(named(document.querySelector('[role=dialog]'),'Save note'));
  const record=api.annotationStore.getSnapshot().records.find(r=>r.note==='Respiratory review note');assert.equal(record.target.subjectId,'respiratory');assert.ok(api.annotationTargetUrl(record).startsWith('/learn/respiratory#annotation='));
  window.getSelection().removeAllRanges();await render('/learn/digestive');assert.equal(document.querySelector('[data-annotation-first]'),null);
  await render('/learn/respiratory',`#annotation=${record.id}`);await waitFor(()=>document.querySelector('[data-annotation-first]'),'restored respiratory highlight');
  assert.equal(api.annotationStore.getSnapshot().records.find(r=>r.id===record.id).note,'Respiratory review note');
  const keys=api.annotationSources.map(s=>`${s.target.subjectId}/${s.target.sourceId}`);assert.equal(keys.length,new Set(keys).size);
});

test('Respiratory context menu uses eight actual tabs, headings, section guide and subject switcher',async()=>{
  await render();const context=async()=>{flushSync(()=>document.querySelector('h1').dispatchEvent(new window.MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:300,clientY:200})));await delay(50);};
  const item=label=>[...document.querySelectorAll('[role=menuitem]')].find(node=>node.querySelector('span')?.textContent===label);
  await context();assert.equal(document.querySelector('[role=menuitem]').textContent,'Respiratory Model');await click(item('Navigate'));
  assert.deepEqual([...document.querySelectorAll('[role=menu][aria-label=Navigate] .site-context-item > span:first-child')].map(n=>n.textContent),api.learnSubjects[1].tabs.map(t=>t.title));await click(item('Deep Dive'));
  assert.equal(window.location.hash,'#respiratory-system-deep-dive');await context();await click(item('On This Page'));
  assert.equal(document.querySelectorAll('[role=menu][aria-label="On This Page"] .site-context-item').length,23);
  const heading=document.querySelectorAll('.learn-article-section h3')[3];await click(item(heading.textContent));assert.equal(document.activeElement,heading);
  await click(document.querySelector('[aria-label="About these sections"]'));assert.equal(document.querySelectorAll('.learn-section-guide dt').length,8);await click(document.querySelector('[aria-label="Close section guide"]'));
  await click(document.querySelector('.learn-subject-switcher'));assert.ok(document.querySelector('a[href="/learn/digestive"]'));
});

test('Visualize uses real Respiratory scope and model-specific references with explicit coverage limits',async()=>{
  await render();await click(tab('Visualize'));assert.ok(panel().textContent.includes('Explore the Respiratory System in 3D.'));assert.ok(panel().textContent.includes('no verified shortcuts'));
  await click(named(panel(),'Load interactive model'));await waitFor(()=>globalThis.__respiratoryScene?.revealed,'CPU scene props (not WebGL)');
  assert.ok(globalThis.__respiratoryScene.atlas.parts.some(p=>p.system==='respiratory'));assert.ok(!panel().textContent.includes('digestive'));
  const choose=async(trigger,value)=>{await click(trigger);const option=[...document.querySelectorAll('[role=option]')].find(node=>node.getAttribute('data-value')===value);await click(option);await delay(100);};
  const lesson=api.anatomyLessons.find(l=>l.subjectId==='respiratory');
  await choose(document.querySelector('[aria-label="Focus anatomy"]'),lesson.structures[0].conceptId);await waitFor(()=>globalThis.__respiratoryScene.state.isolate,'tracheal isolation');
  assert.ok(globalThis.__respiratoryScene.atlas.parts.filter(p=>globalThis.__respiratoryScene.state.isolatedPartIds?.has(p.id)).every(p=>p.conceptId==='FMA7394'));
  await choose(document.querySelector('[aria-label="Anatomy model"]'),'hra-female-v1.5');await waitFor(()=>globalThis.__respiratoryScene.modelId==='hra-female-v1.5'&&globalThis.__respiratoryScene.revealed,'HRA reference');
  const hra=api.lessonForModel(lesson,'hra-female-v1.5');assert.equal(hra.structures.length,18);await choose(document.querySelector('[aria-label="Focus anatomy"]'),hra.structures[0].conceptId);assert.ok(globalThis.__respiratoryScene.state.isolate);
  await click(document.querySelector('[aria-label="Zoom in"]'));assert.ok(globalThis.__respiratoryScene.zoomSteps>0);await click(document.querySelector('[aria-label="Reset view"]'));
});
