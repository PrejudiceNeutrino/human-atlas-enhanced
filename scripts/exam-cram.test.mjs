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
const assertArticle = (subject, readingMode) => {
  const canonical = canonicalId(subject), article = readingMode === 'quick-scan' ? api.examCramVariants[canonical] : api.articles[canonical];
  const sections = [...document.querySelectorAll('.learn-exam-cram .learn-article-section')];
  assert.equal(sections.length, 18);
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
    assert.equal(index.querySelectorAll('nav a').length, 18);
    for (const link of index.querySelectorAll('nav a')) assert.ok(document.getElementById(link.hash.slice(1)));
  }
};
const makeRecord = source => {
  const block = source.blocks[1], now = '2026-11-11T12:00:00.000Z', end = Math.min(24, block.text.length);
  return { id: crypto.randomUUID(), schemaVersion: 1, target: source.target, anchor: { blockId: block.id, start: 0, end, exact: block.text.slice(0, end), prefix: '', suffix: block.text.slice(end, end + 48), blockText: block.text, contentVersion: source.version }, note: 'Preserve this personal note.', style: 'ochre', status: 'anchored', createdAt: now, modifiedAt: now };
};
await api.annotationStore.initialize();
after(async () => { flushSync(() => root.unmount()); await api.annotationStore.dispose(); globalThis.fetch = originalFetch; window.close(); });

test('authored content is imported byte-for-byte and Detailed Review and Digestive stay unchanged', () => {
  const inventory = read('docs/integration/exam-cram-source/archive-inventory.json').entries;
  for (const subject of ['respiratory', 'lymphoid']) {
    const quick = read(`data/learn/${subject}-exam-cram-quick-scan.json`), detailed = read(`data/learn/${subject}-system-exam-cram.json`);
    for (const [archiveName, file] of [[`${subject}-exam-cram-quick-scan.json`, `data/learn/${subject}-exam-cram-quick-scan.json`], [`${subject}-detailed-original.json`, `data/learn/${subject}-system-exam-cram.json`]]) assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'), inventory.find(entry => entry.path === archiveName).sha256, file);
    assert.equal(quick.variantOf, detailed.id); assert.equal(quick.id, `${detailed.id}-quick-scan`);
    assert.equal(quick.sections.length, 18); assert.deepEqual(quick.sourceFiles, detailed.sourceFiles);
    assert.deepEqual(quick.sections.map(({ id, title, slideReferences }) => ({ id, title, slideReferences })), detailed.sections.map(({ id, title, slideReferences }) => ({ id, title, slideReferences })));
    assert.ok(quick.sections.every(section => section.markdown.trim() && section.markdown.includes('**')));
    for (const section of detailed.sections) {
      const source = api.annotationSources.find(source => source.target.sourceId === `${detailed.id}/${section.id}`);
      assert.equal(source.version, api.fingerprint(`${section.title}\n${section.markdown}`));
      assert.deepEqual(source.blocks, [api.titleBlock(section.title), ...api.markdownBlocks(section.markdown)].map((block, order) => ({ ...block, order })));
    }
  }
  assert.equal(api.examCramVariants['digestive-system-exam-cram'], undefined);
  const keys = api.annotationSources.map(source => api.targetKey(source.target));
  assert.equal(keys.length, new Set(keys).size);
});

for (const subject of ['respiratory', 'lymphoid']) {
  test(`${subject}: both full authored modes share the existing 18 anchors and one top-level tab`, async () => {
    window.localStorage.clear(); await render(subject); await click(tab('Exam Cram'));
    assert.equal(document.querySelectorAll('.learn-tab-trigger').length, 8);
    assert.equal(mode(), 'detailed-review'); assertArticle(subject, 'detailed-review');
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
    await render(subject); await click(tab('Exam Cram')); await choose('quick-scan');
    assert.deepEqual(JSON.parse(window.localStorage.getItem(api.examCramPreferenceKey(subject))), { version: 1, mode: 'quick-scan' });
    await render(subject); await click(tab('Exam Cram')); assert.equal(mode(), 'quick-scan');
    const other = subject === 'respiratory' ? 'lymphoid' : 'respiratory';
    await render(other); await click(tab('Exam Cram')); assert.equal(mode(), 'detailed-review');
    for (const [key, value] of Object.entries(sentinels)) assert.equal(window.localStorage.getItem(key), value);
  });

  test(`${subject}: Study Tools and canonical bookmarks open Detailed Review despite a Quick Scan preference`, async () => {
    window.localStorage.clear(); await render(subject); await click(tab('Exam Cram')); await choose('quick-scan');
    await click(tab('Study Tools')); await waitFor(() => document.querySelector('.study-activity-nav'), 'study tools');
    // Use the real Study Tools link renderer with a supplied canonical Exam Cram reference.
    const bank = read(`data/learn/${subject}-study-tools/multiple-choice.json`);
    const questions = Array.isArray(bank) ? bank : bank.questions;
    const ref = questions.flatMap(question => question.sourceRefs).find(ref => ref.articleId === canonicalId(subject));
    assert.ok(ref, 'the supplied study bank references this Exam Cram');
    const host = document.createElement('div'); document.body.append(host); const links = createRoot(host);
    flushSync(() => links.render(createElement(api.SourceLinks, { refs: [ref], route: `/learn/${subject}` })));
    try {
      await click(host.querySelector('a')); await waitFor(() => mode() === 'detailed-review', 'canonical reference selects original text');
      assert.equal(document.activeElement.id, `${ref.articleId}-${ref.sectionId}`);
      assertArticle(subject, 'detailed-review');
    } finally { flushSync(() => links.unmount()); host.remove(); }
    assert.equal(JSON.parse(window.localStorage.getItem(api.examCramPreferenceKey(subject))).mode, 'quick-scan', 'a reference jump does not overwrite the preference');
    await render(subject, `#${ref.articleId}-${ref.sectionId}`); assert.equal(mode(), 'detailed-review');
  });

  test(`${subject}: old detailed notes and new Quick Scan highlights remain isolated and reopen the correct mode`, async () => {
    window.localStorage.clear(); await api.annotationStore.clear(); await render(subject); await click(tab('Exam Cram'));
    const canonical = canonicalId(subject), sectionId = api.articles[canonical].sections[0].id;
    const source = api.annotationSources.find(source => source.target.sourceId === `${canonical}/${sectionId}`), old = makeRecord(source);
    await api.annotationStore.create(old); await waitFor(() => document.querySelector('[data-annotation-first]'), 'old detailed highlight');
    const original = JSON.stringify(api.annotationStore.getSnapshot().records.find(record => record.id === old.id));
    await choose('quick-scan'); assert.equal(document.querySelector(`[data-annotation-id="${old.id}"]`), null);
    const block = document.querySelector('.learn-exam-cram .learn-article-section .learn-markdown [data-annotation-block]');
    const walker = document.createTreeWalker(block, window.NodeFilter.SHOW_TEXT); walker.nextNode();
    const range = document.createRange(); range.setStart(walker.currentNode, 0); range.setEnd(walker.currentNode, Math.min(8, walker.currentNode.textContent.length));
    window.getSelection().removeAllRanges(); window.getSelection().addRange(range); block.dispatchEvent(new window.Event('pointerup', { bubbles: true }));
    await waitFor(() => document.querySelector('.annotation-toolbar'), 'Quick Scan highlight authoring');
    await click([...document.querySelectorAll('.annotation-toolbar button')].find(button => button.textContent === 'Highlight'));
    await waitFor(() => api.annotationStore.getSnapshot().records.length === 2, 'Quick Scan saved');
    const quick = api.annotationStore.getSnapshot().records.find(record => record.id !== old.id);
    assert.equal(quick.target.tabId, canonical); assert.equal(quick.target.sourceId, `${canonical}-quick-scan/${sectionId}`);
    assert.equal(JSON.stringify(api.annotationStore.getSnapshot().records.find(record => record.id === old.id)), original);
    await choose('detailed-review'); assert.ok(document.querySelector(`[data-annotation-id="${old.id}"]`)); assert.equal(document.querySelector(`[data-annotation-id="${quick.id}"]`), null);
    await render(subject, `#annotation=${quick.id}`); await waitFor(() => document.querySelector(`[data-annotation-id="${quick.id}"]`), 'Quick Scan note reopen');
    assert.equal(mode(), 'quick-scan');
    assert.ok(api.annotationTargetUrl(quick).endsWith(`#annotation=${quick.id}`));
    await render(subject, `#annotation=${old.id}`); await waitFor(() => document.querySelector(`[data-annotation-id="${old.id}"]`), 'Detailed Review note reopen'); assert.equal(mode(), 'detailed-review');
    flushSync(() => api.revisitReading(api.annotationTargetUrl(quick)));
    await waitFor(() => document.querySelector(`[data-annotation-id="${quick.id}"]`), 'in-place Quick Scan revisit'); assert.equal(mode(), 'quick-scan');
    flushSync(() => api.revisitReading(api.annotationTargetUrl(old)));
    await waitFor(() => document.querySelector(`[data-annotation-id="${old.id}"]`), 'in-place Detailed Review revisit'); assert.equal(mode(), 'detailed-review');
  });
}

test('invalid or blocked storage remains readable, and cross-tab preference updates are scoped', async () => {
  for (const value of [null, '{bad', 'null', '[]', '{"version":2,"mode":"quick-scan"}', '{"version":1,"mode":"other"}']) assert.equal(api.readExamCramMode(value), 'detailed-review');
  window.localStorage.clear(); await render('respiratory'); await click(tab('Exam Cram'));
  const storage = window.localStorage;
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw Error('blocked'); } });
  try { await render('respiratory'); await click(tab('Exam Cram')); assert.equal(mode(), 'detailed-review'); await choose('quick-scan'); assert.equal(mode(), 'quick-scan'); assert.ok(document.querySelector('.learn-exam-mode-error')); }
  finally { Object.defineProperty(window, 'localStorage', { configurable: true, value: storage }); }
  await render('respiratory'); await click(tab('Exam Cram'));
  flushSync(() => window.dispatchEvent(new window.StorageEvent('storage', { key: api.examCramPreferenceKey('lymphoid'), newValue: '{"version":1,"mode":"quick-scan"}' }))); assert.equal(mode(), 'detailed-review');
  flushSync(() => window.dispatchEvent(new window.StorageEvent('storage', { key: api.examCramPreferenceKey('respiratory'), newValue: '{"version":1,"mode":"quick-scan"}' }))); assert.equal(mode(), 'quick-scan');
});

test('mode controls keep native keyboard semantics, mobile indices and accessible names; Digestive stays single-mode', async () => {
  for (const subject of ['respiratory', 'lymphoid']) {
    await render(subject); await click(tab('Exam Cram'));
    const radios = [...document.querySelectorAll('.learn-exam-mode input')];
    assert.equal(radios.length, 2); assert.ok(radios.every(input => input.type === 'radio' && !input.disabled)); assert.equal(radios[0].name, radios[1].name);
    radios[0].focus(); assert.equal(document.activeElement, radios[0]);
    const results = await axe.run(document.querySelector('.learn-exam-cram'), { rules: { 'color-contrast': { enabled: false } } }); assert.deepEqual(results.violations.map(item => item.id), []);
    assert.equal(document.querySelectorAll('.learn-exam-cram .learn-index-mobile nav a').length, 18);
  }
  await render('digestive'); await click(tab('Exam Cram')); assert.equal(document.querySelector('.learn-exam-mode'), null);
  assert.equal(document.querySelectorAll('.learn-article-section').length, api.articles['digestive-system-exam-cram'].sections.length);
});
