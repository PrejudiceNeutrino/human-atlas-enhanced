import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';

const dom = new JSDOM('<!doctype html><html lang="en"><head><title>Human Atlas</title></head><body><div id="root"></div></body></html>', { url: 'http://localhost/learn/respiratory', pretendToBeVisual: true });
const { window } = dom;
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLButtonElement', 'HTMLAnchorElement', 'Element', 'Node', 'NodeFilter', 'DocumentFragment', 'MutationObserver', 'Event', 'MouseEvent', 'KeyboardEvent']) Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? window : window[key] });
window.indexedDB = globalThis.indexedDB = new IDBFactory();
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
window.matchMedia = query => ({ matches: query.includes('reduced-motion'), media: query, addEventListener() {}, removeEventListener() {} });
window.ResizeObserver = globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLElement.prototype.getAnimations = () => [];
window.HTMLElement.prototype.scrollIntoView = function () { this.dataset.scrolled = 'true'; };
window.HTMLElement.prototype.scrollTo = function ({ top }) { this.scrollTop = top; };
window.HTMLCanvasElement.prototype.getContext = () => null;
window.Range.prototype.getBoundingClientRect = () => ({ left: 150, top: 200, width: 200, height: 20 });
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => { const file = path.join('public', String(url)); return fs.existsSync(file) ? new Response(fs.readFileSync(file)) : new Response('', { status: 404 }); };
const output = path.resolve('work/exam-cram-tests/runtime.mjs');
await build({ stdin: { contents: "export {default as LearnPage} from './app/learn/page';export * from './app/learn/content';export * from './app/learn/exam-cram-content';export * from './app/learn/exam-cram-mode';export * from './app/notes/annotation-store';export * from './app/notes/annotation-content';export * from './app/notes/annotation-model';export * from './app/notes/annotation-core';export * from './app/notes/notes-navigation';export {SourceLinks} from './app/learn/study-tools/shared';", resolveDir: process.cwd() }, outfile: output, tsconfig: 'tsconfig.json', bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': process.cwd() } });
const api = await import(pathToFileURL(output).href);
const { createElement } = await import('react'), { flushSync } = await import('react-dom'), { createRoot } = await import('react-dom/client');
const { renderToStaticMarkup } = await import('react-dom/server'), { default: Markdown } = await import('react-markdown'), { default: remarkGfm } = await import('remark-gfm'), { default: axe } = await import('axe-core');
const root = createRoot(document.querySelector('#root'));
let revision = 0;
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const normalize = text => text.replace(/\s+/g, ' ').trim();
const markdownText = markdown => normalize(JSDOM.fragment(renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [remarkGfm], children: markdown }))).textContent);
const render = async (subject, hash = '') => { window.getSelection().removeAllRanges(); window.history.replaceState(null, '', `/learn/${subject}${hash}`); flushSync(() => root.render(createElement(api.LearnPage, { pathname: `/learn/${subject}`, key: ++revision }))); await delay(100); };
const waitFor = async (predicate, message) => { for (let i = 0; i < 100; i++) { if (predicate()) return; await delay(25); } assert.ok(predicate(), message); };
const click = async element => { assert.ok(element, 'control exists'); flushSync(() => element.click()); await delay(60); };
const tab = title => [...document.querySelectorAll('.learn-tab-trigger')].find(element => element.querySelector('span')?.textContent === title);
const choose = async mode => click(document.querySelector(`.learn-exam-mode input[value="${mode}"]`));
const mode = () => document.querySelector('.learn-exam-cram')?.dataset.readingMode;
const canonicalId = subject => `${subject}-system-exam-cram`;
const sectionCount = subject => subject === 'digestive' ? 15 : 18;
const articleFor = (subject, mode) => { const id=canonicalId(subject),variant=api.examCramVariants[id];return variant.readingMode===mode?variant:api.articles[id]; };
const assertArticle = (subject, readingMode) => {
  const canonical = canonicalId(subject), article = articleFor(subject, readingMode);
  const sections = [...document.querySelectorAll('.learn-exam-cram .learn-article-section')];
  assert.equal(sections.length, sectionCount(subject));
  assert.equal(normalize(document.querySelector('.learn-exam-cram .learn-article-header > .learn-markdown').textContent), markdownText(article.introMarkdown));
  for (let i = 0; i < sections.length; i++) {
    assert.equal(sections[i].querySelector('h3').id, `${canonical}-${article.sections[i].id}`);
    assert.equal(sections[i].querySelector('h3').textContent, article.sections[i].title);
    assert.equal(normalize(sections[i].querySelector('.learn-markdown').textContent), markdownText(article.sections[i].markdown));
    assert.equal(sections[i].querySelector('.learn-markdown').dataset.annotationSource, `${article.id}/${article.sections[i].id}`);
  }
  const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(ids.length, new Set(ids).size, 'one mounted article and no duplicate IDs');
  for (const index of document.querySelectorAll('.learn-exam-cram .learn-index-desktop, .learn-exam-cram .learn-index-mobile')) {
    assert.equal(index.querySelectorAll('nav a').length, sectionCount(subject));
    for (const link of index.querySelectorAll('nav a')) assert.ok(document.getElementById(link.hash.slice(1)));
  }
};
const makeRecord = source => {
  const block = source.blocks[1], now = '2026-11-11T12:00:00.000Z', end = Math.min(24, block.text.length);
  return { id: crypto.randomUUID(), schemaVersion: 1, target: source.target, anchor: { blockId: block.id, start: 0, end, exact: block.text.slice(0, end), prefix: '', suffix: block.text.slice(end, end + 48), blockText: block.text, contentVersion: source.version }, note: 'Preserve this personal note.', style: 'ochre', status: 'anchored', createdAt: now, modifiedAt: now };
};
await api.annotationStore.initialize();
after(async () => { flushSync(() => root.unmount()); await api.annotationStore.dispose(); globalThis.fetch = originalFetch; window.close(); });

test('final reviews match the authored package and every original Quick Scan is byte-for-byte unchanged', () => {
  const inventory = read('docs/integration/exam-cram-final-source/archive-inventory.json');
  for (const entry of [...inventory.installedFiles,...inventory.protectedFiles]) assert.equal(createHash('sha256').update(fs.readFileSync(entry.targetPath??entry.path)).digest('hex'),entry.sha256);
  for (const subject of ['digestive','respiratory','lymphoid']) {
    const quick=articleFor(subject,'quick-scan'),detailed=articleFor(subject,'detailed-review');
    assert.equal(quick.sections.length,sectionCount(subject));assert.equal(detailed.sections.length,sectionCount(subject));
    if(subject==='digestive')assert.deepEqual(detailed.sourceFiles,read('docs/integration/exam-cram-final-source/reference/digestive-prior-detailed-review.json').sourceFiles);
    else assert.deepEqual(quick.sourceFiles,detailed.sourceFiles);
    assert.deepEqual(quick.sections.map(({id,title,slideReferences})=>({id,title,slideReferences})),detailed.sections.map(({id,title,slideReferences})=>({id,title,slideReferences})));
    for(const article of [quick,detailed])for(const section of article.sections){
      const source=api.annotationSources.find(source=>source.target.sourceId===`${article.id}/${section.id}`);
      assert.equal(source.version,api.fingerprint(`${section.title}\n${section.markdown}`));
      assert.deepEqual(source.blocks,[api.titleBlock(section.title),...api.markdownBlocks(section.markdown)].map((block,order)=>({...block,order})));
    }
  }
  const keys=api.annotationSources.map(source=>api.targetKey(source.target));assert.equal(keys.length,new Set(keys).size);
});

for (const subject of ['digestive', 'respiratory', 'lymphoid']) {
  test(`${subject}: both full authored modes share all existing anchors and one top-level tab`, async () => {
    window.localStorage.clear(); await render(subject); await click(tab('Exam Cram'));
    assert.equal(document.querySelectorAll('.learn-tab-trigger').length, 8);
    assert.equal(mode(), 'quick-scan'); assertArticle(subject, 'quick-scan');
    await choose('detailed-review'); assertArticle(subject, 'detailed-review');
    assert.equal(document.querySelector('.learn-exam-mode legend').textContent, 'Exam Cram reading mode');
    await choose('quick-scan'); assert.equal(mode(), 'quick-scan'); assertArticle(subject, 'quick-scan');
    await click(document.querySelectorAll('.learn-exam-cram .learn-index-desktop nav a')[4]);
    assert.equal(mode(), 'quick-scan', 'an internal TOC jump keeps the selected mode');
    assert.equal(document.activeElement.id, `${canonicalId(subject)}-${api.articles[canonicalId(subject)].sections[4].id}`);
    await choose('detailed-review'); assertArticle(subject, 'detailed-review');
    const shell = document.querySelector('.learn-shell'), headings = [...document.querySelectorAll('.learn-exam-cram .learn-article-section > h3')];
    shell.scrollTop = 300;
    headings.forEach((heading, index) => { heading.getBoundingClientRect = () => ({ top: index ? 600 + index * 100 : mode() === 'quick-scan' ? 140 : 20 }); });
    await choose('quick-scan');
    assert.equal(shell.scrollTop, 420, 'the same visible section keeps its viewport offset after reflow');
  });

  test(`${subject}: per-subject preferences persist and cannot overwrite notes, stars or progress`, async () => {
    window.localStorage.clear();
    const sentinels = { 'human-atlas-study-progress:sentinel': 'preserve', [`human-atlas-gallery:v1:${subject}`]: 'preserve' };
    for (const [key, value] of Object.entries(sentinels)) window.localStorage.setItem(key, value);
    await render(subject); await click(tab('Exam Cram')); await choose('detailed-review');
    await render(subject); await click(tab('Exam Cram')); assert.equal(mode(),'detailed-review'); await choose('quick-scan');
    assert.deepEqual(JSON.parse(window.localStorage.getItem(api.examCramPreferenceKey(subject))), { version: 1, mode: 'quick-scan' });
    await render(subject); await click(tab('Exam Cram')); assert.equal(mode(), 'quick-scan');
    const other = subject === 'respiratory' ? 'lymphoid' : 'respiratory';
    await render(other); await click(tab('Exam Cram')); assert.equal(mode(), 'quick-scan');
    for (const [key, value] of Object.entries(sentinels)) assert.equal(window.localStorage.getItem(key), value);
  });

  test(`${subject}: Study Tools and canonical bookmarks open the referenced edition despite an alternate preference`, async () => {
    const canonicalMode=api.canonicalExamCramMode(canonicalId(subject)),alternateMode=api.examCramVariants[canonicalId(subject)].readingMode;
    window.localStorage.clear(); await render(subject); await click(tab('Exam Cram')); await choose(canonicalMode); await choose(alternateMode);
    await click(tab('Study Tools')); await waitFor(() => document.querySelector('.study-activity-nav'), 'study tools');
    // Use the real Study Tools link renderer with a supplied canonical Exam Cram reference.
    const bank = read(`data/learn/${subject}-study-tools/multiple-choice.json`);
    const questions = Array.isArray(bank) ? bank : bank.questions;
    const ref = questions.flatMap(question => question.sourceRefs).find(ref => ref.articleId === canonicalId(subject));
    assert.ok(ref, 'the supplied study bank references this Exam Cram');
    const host = document.createElement('div'); document.body.append(host); const links = createRoot(host);
    flushSync(() => links.render(createElement(api.SourceLinks, { refs: [ref], route: `/learn/${subject}` })));
    try {
      await click(host.querySelector('a')); await waitFor(() => mode() === canonicalMode, 'canonical reference selects original text');
      assert.equal(document.activeElement.id, `${ref.articleId}-${ref.sectionId}`);
      assertArticle(subject, canonicalMode);
    } finally { flushSync(() => links.unmount()); host.remove(); }
    assert.equal(JSON.parse(window.localStorage.getItem(api.examCramPreferenceKey(subject))).mode, alternateMode, 'a reference jump does not overwrite the preference');
    await render(subject, `#${ref.articleId}-${ref.sectionId}`); assert.equal(mode(), canonicalMode);
  });

  test(`${subject}: canonical notes and alternate-mode highlights remain isolated and reopen the correct mode`, async () => {
    window.localStorage.clear(); await api.annotationStore.clear(); await render(subject); await click(tab('Exam Cram'));
    const canonicalMode=api.canonicalExamCramMode(canonicalId(subject)),alternateMode=api.examCramVariants[canonicalId(subject)].readingMode;
    await choose(canonicalMode);
    const canonical = canonicalId(subject), sectionId = api.articles[canonical].sections[0].id;
    const source = api.annotationSources.find(source => source.target.sourceId === `${canonical}/${sectionId}`), old = makeRecord(source);
    await api.annotationStore.create(old); await waitFor(() => document.querySelector('[data-annotation-first]'), 'old detailed highlight');
    const original = JSON.stringify(api.annotationStore.getSnapshot().records.find(record => record.id === old.id));
    await choose(alternateMode); assert.equal(document.querySelector(`[data-annotation-id="${old.id}"]`), null);
    const block = document.querySelector('.learn-exam-cram .learn-article-section .learn-markdown [data-annotation-block]');
    const walker = document.createTreeWalker(block, window.NodeFilter.SHOW_TEXT); walker.nextNode();
    const range = document.createRange(); range.setStart(walker.currentNode, 0); range.setEnd(walker.currentNode, Math.min(8, walker.currentNode.textContent.length));
    window.getSelection().removeAllRanges(); window.getSelection().addRange(range); block.dispatchEvent(new window.Event('pointerup', { bubbles: true }));
    await waitFor(() => document.querySelector('.annotation-toolbar'), 'Quick Scan highlight authoring');
    await click([...document.querySelectorAll('.annotation-toolbar button')].find(button => button.textContent === 'Highlight'));
    await waitFor(() => api.annotationStore.getSnapshot().records.length === 2, 'Quick Scan saved');
    const quick = api.annotationStore.getSnapshot().records.find(record => record.id !== old.id);
    assert.equal(quick.target.tabId, canonical); assert.equal(quick.target.sourceId, `${api.examCramVariants[canonical].id}/${sectionId}`);
    assert.equal(JSON.stringify(api.annotationStore.getSnapshot().records.find(record => record.id === old.id)), original);
    await choose(canonicalMode); assert.ok(document.querySelector(`[data-annotation-id="${old.id}"]`)); assert.equal(document.querySelector(`[data-annotation-id="${quick.id}"]`), null);
    await render(subject, `#annotation=${quick.id}`); await waitFor(() => document.querySelector(`[data-annotation-id="${quick.id}"]`), 'Quick Scan note reopen');
    assert.equal(mode(), alternateMode);
    assert.ok(api.annotationTargetUrl(quick).endsWith(`#annotation=${quick.id}`));
    await render(subject, `#annotation=${old.id}`); await waitFor(() => document.querySelector(`[data-annotation-id="${old.id}"]`), 'Detailed Review note reopen'); assert.equal(mode(), canonicalMode);
    flushSync(() => api.revisitReading(api.annotationTargetUrl(quick)));
    await waitFor(() => document.querySelector(`[data-annotation-id="${quick.id}"]`), 'in-place Quick Scan revisit'); assert.equal(mode(), alternateMode);
    flushSync(() => api.revisitReading(api.annotationTargetUrl(old)));
    await waitFor(() => document.querySelector(`[data-annotation-id="${old.id}"]`), 'in-place Detailed Review revisit'); assert.equal(mode(), canonicalMode);
  });
}

test('invalid or blocked storage remains readable, and cross-tab preference updates are scoped', async () => {
  for (const value of [null, '{bad', 'null', '[]', '{"version":2,"mode":"quick-scan"}', '{"version":1,"mode":"other"}']) assert.equal(api.readExamCramMode(value), 'quick-scan');
  window.localStorage.clear(); await render('respiratory'); await click(tab('Exam Cram'));
  const storage = window.localStorage;
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw Error('blocked'); } });
  try { await render('respiratory'); await click(tab('Exam Cram')); assert.equal(mode(), 'quick-scan'); await choose('detailed-review'); assert.equal(mode(), 'detailed-review'); assert.ok(document.querySelector('.learn-exam-mode-error')); }
  finally { Object.defineProperty(window, 'localStorage', { configurable: true, value: storage }); }
  await render('respiratory'); await click(tab('Exam Cram')); await choose('detailed-review');
  flushSync(() => window.dispatchEvent(new window.StorageEvent('storage', { key: api.examCramPreferenceKey('lymphoid'), newValue: '{"version":1,"mode":"quick-scan"}' }))); assert.equal(mode(), 'detailed-review');
  flushSync(() => window.dispatchEvent(new window.StorageEvent('storage', { key: api.examCramPreferenceKey('respiratory'), newValue: '{"version":1,"mode":"quick-scan"}' }))); assert.equal(mode(), 'quick-scan');
});

test('all three mode controls keep native keyboard semantics, mobile indices and accessible names', async () => {
  for (const subject of ['digestive', 'respiratory', 'lymphoid']) {
    await render(subject); await click(tab('Exam Cram'));
    const radios = [...document.querySelectorAll('.learn-exam-mode input')];
    assert.equal(radios.length, 2); assert.ok(radios.every(input => input.type === 'radio' && !input.disabled)); assert.equal(radios[0].name, radios[1].name);
    radios[0].focus(); assert.equal(document.activeElement, radios[0]);
    const results = await axe.run(document.querySelector('.learn-exam-cram'), { rules: { 'color-contrast': { enabled: false } } }); assert.deepEqual(results.violations.map(item => item.id), []);
    assert.equal(document.querySelectorAll('.learn-exam-cram .learn-index-mobile nav a').length, sectionCount(subject));
  }
});
