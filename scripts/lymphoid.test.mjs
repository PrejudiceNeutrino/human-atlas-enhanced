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
const dom=new JSDOM('<!doctype html><html lang="en"><head><title>Human Atlas</title></head><body><div id="root"></div></body></html>',{url:'http://localhost/learn/lymphoid',pretendToBeVisual:true});
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
const output=path.resolve('work/lymphoid-tests/runtime.mjs');
await build({stdin:{contents:`export {default as LearnPage} from './app/learn/page';export * from './app/learn/subjects';export * from './app/learn/content';export {studyBank,unresolvedReferences} from './app/learn/study-tools/lymphoid-data';export * from './app/learn/study-tools/model';export * from './app/learn/study-tools/progress';export * from './app/learn/study-tools/validation';export * from './app/learn/anatomy-companion/references';export * from './app/learn/anatomy-companion/model';export {annotationStore} from './app/notes/annotation-store';export * from './app/notes/annotation-content';`,resolveDir:process.cwd()},outfile:output,tsconfig:'tsconfig.json',bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},alias:{'@':process.cwd()},plugins:[{name:'cpu-scene',setup(build){build.onLoad({filter:/[\\/]app[\\/]scene\.tsx$/},()=>({contents:`import {useEffect} from 'react';export default function Scene(props){globalThis.__lymphoidScene=props;useEffect(()=>{const timer=setTimeout(()=>{props.onReady();props.onSettled()},0);return()=>clearTimeout(timer)},[props.atlas]);return <canvas/>}`,loader:'tsx'}));}}]});
const api=await import(pathToFileURL(output).href);
const {createElement}=await import('react'),{flushSync}=await import('react-dom'),{createRoot}=await import('react-dom/client');
const {renderToStaticMarkup}=await import('react-dom/server'),{default:Markdown}=await import('react-markdown'),{default:remarkGfm}=await import('remark-gfm'),{default:axe}=await import('axe-core');
const root=createRoot(document.querySelector('#root'));
let revision=0;
const render=async(route='/learn/lymphoid',hash='')=>{window.history.replaceState(null,'',route+hash);flushSync(()=>root.render(createElement(api.LearnPage,{pathname:route,key:++revision})));await delay(100);};
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
  const inventory=read('docs/integration/lymphoid-source/archive-inventory.json').entries;
  const editorialHashes=new Map(read('docs/integration/editorial-consistency-source/archive-inventory.json').installedFiles.map(entry=>[entry.targetPath,entry.sha256]));
  const mappings=inventory.flatMap(entry=>{
    const name=entry.path.split('/').at(-1);
    if(/^phase-[23]-readings\/lymphoid-system-.*\.json$/.test(entry.path))return [[entry,`data/learn/${name}`]];
    if(entry.path.startsWith('phase-4-study-tools/')&&['concepts.json','multiple-choice.json','fill-in-the-blank.json','flashcards.json','manifest.json'].includes(name))return [[entry,`data/learn/lymphoid-study-tools/${name}`]];
    if(/^phase-5-gallery\/(gallery.json|images\/.*|thumbnails\/.*)$/.test(entry.path))return [[entry,`public/images/learn/lymphoid/gallery/${entry.path.split('/').slice(1).join('/')}`]];
    return [];
  });
  assert.equal(mappings.length,81);
  for(const [entry,file] of mappings)assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),editorialHashes.get(file)??entry.sha256,file);
  assert.equal(fs.readdirSync('public/images/learn/lymphoid/gallery/images').length,35);
  assert.equal(fs.readdirSync('public/images/learn/lymphoid/gallery/thumbnails').length,35);
});

test('subject registry shares eight descriptions in order and all reading sections render complete original Markdown',async()=>{
  const lymphoid=api.learnSubjects.find(s=>s.slug==='lymphoid'),digestive=api.learnSubjects.find(s=>s.slug==='digestive');
  assert.deepEqual(lymphoid.tabs.map(t=>t.title),['General Overview','Deep Dive','How It Connects','Who Cares?','Visualize','Gallery','Exam Cram','Study Tools']);
  assert.deepEqual(lymphoid.tabs.map(t=>t.description),digestive.tabs.map(t=>t.description));
  await render('/learn');assert.ok(document.querySelector('a[href="/learn/lymphoid"]'));await render();
  assert.equal(document.querySelector('h1').textContent,'Lymphoid System and Immunity');
  for(const [title,count] of [['General Overview',8],['Deep Dive',19],['How It Connects',10],['Exam Cram',18]]){
    await click(tab(title));if(title==='Exam Cram')await click(document.querySelector('.learn-exam-mode input[value="detailed-review"]'));const active=panel(),article=api.articles[lymphoid.tabs.find(t=>t.title===title).id];
    assert.equal(active.querySelectorAll('.learn-article-section').length,count);
    assert.equal(normalized(active.querySelector('header .learn-markdown').textContent),markdownText(article.introMarkdown));
    for(const section of article.sections){const heading=document.getElementById(`${article.id}-${section.id}`);assert.equal(heading.textContent,section.title);assert.equal(normalized(heading.closest('section').querySelector('.learn-markdown').textContent),markdownText(section.markdown));}
    assert.equal(active.querySelectorAll('.learn-index-desktop nav a').length,count);
    const ids=[...document.querySelectorAll('[id]')].map(node=>node.id);assert.equal(ids.length,new Set(ids).size);
  }
  await click(tab('Who Cares?'));
  const facts=api.factSections['lymphoid-system-why-is-this-cool'];
  assert.equal(facts.sections.length,3);
  for(const [i,entry] of facts.sections.entries()){
    const button=panel().querySelectorAll('.learn-more-trigger')[i];await click(button);
    const expansion=document.getElementById(button.getAttribute('aria-controls'));
    assert.ok(normalized(expansion.textContent).includes(markdownText(entry.moreInfoMarkdown)));
  }
  const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(results.violations.map(v=>v.id),[]);
});

test('subject hashes and all source references activate the correct Lymphoid section',async()=>{
  const bank=api.studyBank;
  assert.deepEqual([bank.concepts.length,bank.multipleChoice.length,bank.fillInTheBlank.length,bank.flashcards.length,bank.manifest.topics.length],[206,104,66,117,13]);
  assert.deepEqual(api.unresolvedReferences,[]);
  for(const record of [...bank.concepts,...bank.multipleChoice,...bank.fillInTheBlank,...bank.flashcards])for(const ref of record.sourceRefs){const target=api.sourceTarget(ref,api.articles,'/learn/lymphoid');assert.equal(target?.href,`/learn/lymphoid#${ref.articleId}-${ref.sectionId}`);}
  const ref=bank.concepts[0].sourceRefs[0];await render('/learn/lymphoid',`#${ref.articleId}-${ref.sectionId}`);
  assert.equal(document.querySelector('.learn-tab-trigger[aria-selected=true]').textContent,api.learnSubjects.find(subject=>subject.slug==='lymphoid').tabs.find(tab=>tab.id===ref.articleId).title);
  assert.equal(document.activeElement.id,`${ref.articleId}-${ref.sectionId}`);
  const invalid=structuredClone(bank);invalid.concepts[0].sourceRefs[0].slideReferences={'22-Lymphoid System-new.pptx':[52]};assert.throws(()=>api.validateStudyBank(invalid,api.articles),/invalid slide/);
  const foreign=structuredClone(bank);foreign.concepts[0].sourceRefs[0].articleId='digestive-system-deep-dive';assert.throws(()=>api.validateStudyBank(foreign,api.articles),/another subject/);
  for(const group of ['concepts','multipleChoice','fillInTheBlank','flashcards'])assert.equal(bank.manifest.topics.reduce((sum,t)=>sum+api.byTopic(bank[group],t.id).length,0),bank[group].length);
  let seed=23;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  const session=api.createQuizSession(bank.multipleChoice,'all',random);assert.equal(session.length,104);assert.ok(new Set(session.map(item=>item.choiceIds.indexOf(bank.multipleChoice.find(q=>q.id===item.id).correctChoiceId))).size>1);
  for(const q of bank.multipleChoice)assert.ok(api.isCorrectChoice(q,q.correctChoiceId));
  for(const q of bank.fillInTheBlank)for(const answer of [q.answer,...q.acceptedAnswers])assert.ok(api.isAcceptedAnswer(q,answer.toUpperCase()),q.id);
});

test('all 28 curriculum objectives resolve without inventing an answer to SG-10',()=>{
  const prefix='docs/integration/lymphoid-source/';
  const stage2=read(prefix+'phase-2-readings/chapter22-study-guide-coverage.json').objectives;
  const stage3=read(prefix+'phase-3-readings/chapter22-stage3-exam-coverage.json').objectives;
  const study=read(prefix+'phase-4-study-tools/chapter22-study-guide-alignment.json').objectives;
  assert.equal(stage2.length,28);assert.equal(stage3.length,28);assert.equal(study.length,28);
  for(const objective of stage2)for(const ref of objective.sections)assert.ok(api.articles[ref.article].sections.some(section=>section.id===ref.section),objective.id);
  for(const objective of stage3)for(const ref of objective.examCramSections)assert.ok(api.articles['lymphoid-system-exam-cram'].sections.some(section=>section.id===ref.id),objective.id);
  for(const objective of study){
    for(const id of objective.examCramSections)assert.ok(api.articles['lymphoid-system-exam-cram'].sections.some(section=>section.id===id),objective.id);
    for(const id of objective.relevantTopicIds)assert.ok(api.studyBank.manifest.topics.some(topic=>topic.id===id),objective.id);
  }
  const ambiguous=study.find(objective=>objective.id==='SG-10');assert.equal(ambiguous.reviewStatus,'requires-instructor-clarification');assert.match(ambiguous.note,/Do not auto-grade an invented hormone/);
  const revision=read('docs/integration/editorial-consistency-source/STUDY-TOOLS-CHANGELOG.json').lymphoid.flashcards.find(card=>card.id==='fc-025');
  const card=api.studyBank.flashcards.find(card=>card.id===revision.id);
  assert.equal(card.front,revision.afterFront);assert.equal(card.back,revision.afterBack);
  assert.ok(api.articles['lymphoid-system-exam-cram'].sections.some(section=>section.markdown.includes('Unresolved instructor question')&&section.markdown.includes('do **not** establish one corresponding binary B-cell hormone')));
});

test('study activities use Lymphoid bank; shared IDs persist independently across subjects',async()=>{
  const storage=window.localStorage;storage.clear();
  const digestive=api.createStudyProgressStore('digestive',storage),lymphoid=api.createStudyProgressStore('lymphoid',storage);
  digestive.answerMultipleChoice('mc-001',false);lymphoid.answerMultipleChoice('mc-001',true);digestive.markCard('fc-001','known');lymphoid.markCard('fc-001','needs-review');
  const respiratory=api.createStudyProgressStore('respiratory',storage);respiratory.answerMultipleChoice('mc-001',false);respiratory.markCard('fc-001','known');
  assert.equal(api.createStudyProgressStore('digestive',storage).getSnapshot().progress.multipleChoice['mc-001'].incorrect,1);
  assert.equal(api.createStudyProgressStore('lymphoid',storage).getSnapshot().progress.multipleChoice['mc-001'].correct,1);
  lymphoid.reset();assert.equal(api.createStudyProgressStore('respiratory',storage).getSnapshot().progress.flashcards['fc-001'].status,'known');assert.equal(digestive.getSnapshot().progress.flashcards['fc-001'].status,'known');
  await render();await click(tab('Study Tools'));await waitFor(()=>document.querySelector('.study-overview-count'),'Lymphoid Study Tools');
  assert.deepEqual([...document.querySelectorAll('.study-overview-count')].map(n=>n.textContent),['104 questions','66 questions','206 concepts','117 cards']);
  for(const [activity,selector] of [['Multiple Choice','.study-mc'],['Fill in the Blank','.study-fill'],['Glossary','.study-glossary']]){await click(named(document.querySelector('.study-activity-nav'),activity));assert.ok(document.querySelector(selector)||document.getElementById(`study-${activity.toLowerCase().replaceAll(' ','-')}-heading`));}
  assert.equal(document.querySelectorAll('.study-concept').length,206);
  await click(named(document.querySelector('.study-activity-nav'),'Multiple Choice'));await click(named(document.querySelector('.study-multiple-choice'),'Start session'));
  const current=api.studyBank.multipleChoice.find(question=>question.stem===document.querySelector('.study-multiple-choice legend').textContent);
  await click(document.querySelector(`.study-multiple-choice input[value="${current.correctChoiceId}"]`));await click(named(document.querySelector('.study-multiple-choice'),'Submit answer'));
  assert.equal(api.createStudyProgressStore('lymphoid',storage).getSnapshot().progress.multipleChoice[current.id].correct,1);
  assert.ok([...document.querySelectorAll('.study-multiple-choice .study-sources a')].every(link=>link.getAttribute('href').startsWith('/learn/lymphoid#lymphoid-system-')));
  await click(named(document.querySelector('.study-activity-nav'),'Flashcards'));await waitFor(()=>document.querySelector('.study-flash-dialog'),'flashcard dialog');
  assert.ok(document.querySelector('.study-flash-dialog').textContent.includes('Lymphoid System and Immunity'));
  const card=api.studyBank.flashcards.find(card=>card.front===document.querySelector('#study-flashcard-face').textContent);await click(document.querySelector('[aria-label="Mark Known"]'));
  assert.equal(api.createStudyProgressStore('lymphoid',storage).getSnapshot().progress.flashcards[card.id].status,'known');
  await click(document.querySelector('[aria-label="Close flashcard viewer"]'));
  assert.ok(!requests.some(url=>url.includes('/models/')),'reading and Study Tools never load geometry');
});

test('all 35 gallery cards use thumbnails, filters/stars/inspection work and unavailable label practice stays hidden',async()=>{
  await render();await click(tab('Gallery'));await waitFor(()=>document.querySelectorAll('.learn-gallery-card').length===35,'35 figures');
  assert.equal(document.getElementById('lymphoid-system-gallery-heading').textContent,'Lymphoid System and Immunity Gallery');
  assert.equal(document.querySelectorAll('.learn-gallery-filters button').length,5);
  assert.ok([...document.querySelectorAll('.learn-gallery-thumbnail img')].every(img=>img.getAttribute('src').includes('/lymphoid/gallery/thumbnails/')&&img.getAttribute('loading')==='lazy'));
  await click(document.querySelector('[aria-label^="Star figure:"]'));await click(document.querySelector('.learn-gallery-starred-filter'));assert.equal(document.querySelectorAll('.learn-gallery-card').length,1);
  await click(document.querySelector('.learn-gallery-starred-filter'));await click(document.querySelectorAll('.learn-gallery-filters button')[3]);assert.equal(document.querySelectorAll('.learn-gallery-card').length,5);
  await click(document.querySelector('.learn-gallery-filters button'));await click(document.querySelector('.learn-gallery-card'));
  assert.ok(document.querySelector('.learn-gallery-viewer img').getAttribute('src').includes('/lymphoid/gallery/images/'));
  assert.equal(document.querySelector('[aria-label="Label Practice"]'),null);assert.equal(document.querySelector('[aria-label="Edit label masks"]'),null);
  await click(document.querySelector('[aria-label="Next figure"]'));assert.ok(document.querySelector('.learn-gallery-page-controls').textContent.includes('2 / 35'));
  await click(document.querySelector('[aria-label="Close image viewer"]'));assert.equal(document.querySelector('.learn-gallery-viewer'),null);
  assert.ok(!requests.some(url=>url.includes('lymphoid/gallery/label-practice')));
  const manifest=read('public/images/learn/lymphoid/gallery/gallery.json'),reviewed=manifest.items.find(figure=>figure.id==='p18');
  await click([...document.querySelectorAll('.learn-gallery-card')].find(card=>card.getAttribute('aria-label')===`Open figure: ${reviewed.title}`));await click(document.querySelector('[aria-label="Figure details"]'));
  assert.ok(document.querySelector('.learn-gallery-details:not(.sr-only)').textContent.includes(reviewed.scienceReview));await click(document.querySelector('[aria-label="Close image viewer"]'));
});

test('Lymphoid highlights and personal notes persist and restore through shared annotation identities',async()=>{
  await render();await api.annotationStore.initialize();
  const block=document.querySelector('.learn-markdown[data-annotation-source$="/intro"] [data-annotation-block]');
  const walker=document.createTreeWalker(block,window.NodeFilter.SHOW_TEXT);walker.nextNode();const text=walker.currentNode;
  const range=document.createRange();range.setStart(text,0);range.setEnd(text,Math.min(20,text.textContent.length));window.getSelection().removeAllRanges();window.getSelection().addRange(range);block.dispatchEvent(new window.Event('pointerup',{bubbles:true}));
  await waitFor(()=>document.querySelector('.annotation-toolbar'),'highlight toolbar');await click(named(document.querySelector('.annotation-toolbar'),'Add Note'));await waitFor(()=>document.querySelector('textarea'),'note editor');
  await setInput(document.querySelector('textarea'),'Lymphoid review note');await click(named(document.querySelector('[role=dialog]'),'Save note'));
  const record=api.annotationStore.getSnapshot().records.find(r=>r.note==='Lymphoid review note');assert.equal(record.target.subjectId,'lymphoid');assert.ok(api.annotationTargetUrl(record).startsWith('/learn/lymphoid#annotation='));
  window.getSelection().removeAllRanges();await render('/learn/digestive');assert.equal(document.querySelector('[data-annotation-first]'),null);
  await render('/learn/lymphoid',`#annotation=${record.id}`);await waitFor(()=>document.querySelector('[data-annotation-first]'),'restored lymphoid highlight');
  assert.equal(api.annotationStore.getSnapshot().records.find(r=>r.id===record.id).note,'Lymphoid review note');
  const keys=api.annotationSources.map(s=>`${s.target.subjectId}/${s.target.sourceId}`);assert.equal(keys.length,new Set(keys).size);
});

test('Lymphoid context menu uses eight actual tabs, headings, section guide and subject switcher',async()=>{
  await render();const context=async()=>{flushSync(()=>document.querySelector('h1').dispatchEvent(new window.MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:300,clientY:200})));await delay(50);};
  const item=label=>[...document.querySelectorAll('[role=menuitem]')].find(node=>node.querySelector('span')?.textContent===label);
  await context();assert.equal(document.querySelector('[role=menuitem]').textContent,'Lymphoid Model');assert.equal(item('Lymphoid Model').getAttribute('href'),'/learn/lymphoid#lymphoid-system-visualize');await click(item('Lymphoid Model'));
  assert.equal(document.querySelector('.learn-tab-trigger[aria-selected=true]').textContent,'Visualize');await click(tab('General Overview'));await context();await click(item('Navigate'));
  assert.deepEqual([...document.querySelectorAll('[role=menu][aria-label=Navigate] .site-context-item > span:first-child')].map(n=>n.textContent),api.learnSubjects[2].tabs.map(t=>t.title));await click(item('Deep Dive'));
  assert.equal(window.location.hash,'#lymphoid-system-deep-dive');await context();await click(item('On This Page'));
  assert.equal(document.querySelectorAll('[role=menu][aria-label="On This Page"] .site-context-item').length,19);
  const heading=document.querySelectorAll('.learn-article-section h3')[3];await click(item(heading.textContent));assert.equal(document.activeElement,heading);
  await click(document.querySelector('[aria-label="About these sections"]'));assert.equal(document.querySelectorAll('.learn-section-guide dt').length,8);await click(document.querySelector('[aria-label="Close section guide"]'));
  await click(document.querySelector('.learn-subject-switcher'));assert.ok(document.querySelector('a[href="/learn/digestive"]'));
});

test('Visualize uses real Lymphoid scope and model-specific references with explicit coverage limits',async()=>{
  await render();await click(tab('Visualize'));assert.ok(panel().textContent.includes('Explore the Lymphoid System and Immunity in 3D.'));assert.ok(panel().textContent.includes('no verified shortcuts'));
  await click(named(panel(),'Load interactive model'));await waitFor(()=>globalThis.__lymphoidScene?.revealed,'CPU scene props (not WebGL)');
  assert.ok(globalThis.__lymphoidScene.atlas.parts.some(p=>p.system==='lymphatic'));assert.ok(!panel().textContent.includes('Complete digestive system'));
  const choose=async(trigger,value)=>{await click(trigger);const option=[...document.querySelectorAll('[role=option]')].find(node=>node.getAttribute('data-value')===value);await click(option);await delay(100);};
  const lesson=api.anatomyLessons.find(l=>l.subjectId==='lymphoid');
  await choose(document.querySelector('[aria-label="Focus anatomy"]'),lesson.structures[0].conceptId);await waitFor(()=>globalThis.__lymphoidScene.state.isolate,'splenic isolation');
  assert.ok(globalThis.__lymphoidScene.atlas.parts.filter(p=>globalThis.__lymphoidScene.state.isolatedPartIds?.has(p.id)).every(p=>p.conceptId==='FMA7196'));
  await choose(document.querySelector('[aria-label="Anatomy model"]'),'female-study-v3');await waitFor(()=>globalThis.__lymphoidScene.modelId==='female-study-v3'&&globalThis.__lymphoidScene.revealed,'female study model');
  assert.ok(panel().textContent.includes('Placement is experimental'));await choose(document.querySelector('[aria-label="Anatomy model"]'),'hra-female-v1.5');await waitFor(()=>globalThis.__lymphoidScene.modelId==='hra-female-v1.5'&&globalThis.__lymphoidScene.revealed,'HRA reference');
  const hra=api.lessonForModel(lesson,'hra-female-v1.5');assert.equal(hra.structures.length,4);await choose(document.querySelector('[aria-label="Focus anatomy"]'),hra.structures[0].conceptId);assert.ok(globalThis.__lymphoidScene.state.isolate);
  assert.ok(!globalThis.__lymphoidScene.atlas.parts.some(part=>part.id.startsWith('Yao_')));
  await click(document.querySelector('.learn-anatomy-context input'));assert.ok(!globalThis.__lymphoidScene.atlas.parts.some(part=>part.id.startsWith('Yao_')));
  assert.equal(named(panel(),'Open in Explore'),undefined,'HRA cannot link to a different model');
  await click(document.querySelector('[aria-label="Zoom in"]'));assert.ok(globalThis.__lymphoidScene.zoomSteps>0);await click(document.querySelector('[aria-label="Reset view"]'));
});
