import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

const source = fs.readFileSync('data/learn/digestive-system-why-is-this-cool.json');
const data = JSON.parse(source);
const revisedSources = [
  ['general-overview', '9bbdc7f72bee03f2dbdad6382fa7a07be9acb2052dd058af42df8672db6107fd', 8],
  ['deep-dive', '5b441393a464d77f312ba6ca499c2b3a3102e98990d301142927496fb293ac1a', 15],
  ['exam-cram', '92f7389c434386137e0a853a8bbbb673a78b8bf76b6a1db7455c5bbe0c8a7370', 15],
].map(([slug, hash, sectionCount]) => {
  const bytes = fs.readFileSync(`data/learn/digestive-system-${slug}.json`);
  return { bytes, hash, sectionCount, article: JSON.parse(bytes) };
});
const connections = JSON.parse(fs.readFileSync('data/learn/digestive-system-how-it-connects.json'));
const articleSources = [
  ...revisedSources.map(source => ({ article: source.article, tabTitle: source.article.title })),
  { article: connections, tabTitle: 'How It Connects' },
];
const dom = new JSDOM('<!doctype html><html lang="en"><head><title>Human Atlas</title></head><body><div id="root"></div></body></html>', {
  url: 'http://localhost/learn/digestive', pretendToBeVisual: true,
});
const { window } = dom;
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLButtonElement', 'HTMLAnchorElement', 'Element', 'Node', 'DocumentFragment', 'MutationObserver', 'Event', 'MouseEvent', 'KeyboardEvent']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? window : window[key] });
}
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
window.matchMedia = query => ({
  matches: query.includes('prefers-reduced-motion'), media: query,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
});
const resizeCallbacks = new Set();
const resizeTargets = new Map();
window.ResizeObserver = globalThis.ResizeObserver = class {
  constructor(callback) { this.callback = callback; }
  observe(element) { resizeCallbacks.add(this.callback); resizeTargets.set(this.callback, element); }
  unobserve() {}
  disconnect() { resizeCallbacks.delete(this.callback); resizeTargets.delete(this.callback); }
};
window.HTMLElement.prototype.getAnimations = () => [];
// Canvas metrics are unavailable in this DOM-only environment.
window.HTMLCanvasElement.prototype.getContext = () => null;

const { createElement } = await import('react');
const { flushSync } = await import('react-dom');
const { createRoot } = await import('react-dom/client');
const { renderToStaticMarkup } = await import('react-dom/server');
const { default: Markdown } = await import('react-markdown');
const { default: remarkGfm } = await import('remark-gfm');
const { default: axe } = await import('axe-core');
// Bundle only the page's local modules. Keep React and UI libraries external so
// tests share one React instance and never touch a running Vite server's cache.
const output = path.resolve('work/learn-tests/page.mjs');
await build({ absWorkingDir: process.cwd(), stdin: { contents: "export {default} from './app/learn/page'; export {SiteNavigation} from './app/site-navigation'; export {learnSubjects, upcomingLearningSections} from './app/learn/subjects'; export {EducationalMarkdown} from './app/learn/educational-markdown';", resolveDir: process.cwd(), sourcefile: 'learn-test-entry.ts' }, outfile: output, tsconfig: path.resolve('tsconfig.json'), bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, alias: { '@': process.cwd() } });
const { default: LearnPage, SiteNavigation, learnSubjects, upcomingLearningSections, EducationalMarkdown } = await import(pathToFileURL(output).href);
const root = createRoot(document.querySelector('#root'));
const render = async pathname => {
  flushSync(() => root.render(createElement(LearnPage, { pathname, key: pathname })));
  await delay(60);
};
const triggers = () => [...document.querySelectorAll('.learn-more-trigger')];
const panels = () => [...document.querySelectorAll('.learn-more-panel')];
const normalize = text => text.replace(/\s+/g, ' ').trim();
const standardText = markdown => {
  const html = renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [remarkGfm], children: markdown }));
  return normalize(JSDOM.fragment(html).textContent);
};
const click = async button => {
  flushSync(() => button.click());
  await delay(60);
};
const tab = title => [...document.querySelectorAll('[role="tab"]')].find(node => node.querySelector('span')?.textContent === title);
const selectTab = async title => { assert.ok(tab(title), title); await click(tab(title)); };

test('Visualize and Gallery launch badges expire at Wednesday midnight Eastern, including an open page', async () => {
  const expiry = Date.parse('2026-11-11T00:00:00-05:00');
  const originalNow = Date.now, originalTimeout = window.setTimeout;
  let now = expiry - 1000, expireOpenPage;
  Date.now = () => now;
  window.setTimeout = (callback, milliseconds, ...args) => {
    if (milliseconds === 1000) expireOpenPage = callback;
    return originalTimeout.call(window, callback, milliseconds, ...args);
  };
  try {
    await render('/learn'); await render('/learn/digestive');
    assert.deepEqual([...document.querySelectorAll('.learn-tab-new')].map(badge => badge.parentElement.querySelector('span').textContent), ['Visualize', 'Gallery']);
    assert.equal(typeof expireOpenPage, 'function');
    now = expiry;
    flushSync(() => expireOpenPage());
    assert.equal(document.querySelectorAll('.learn-tab-new').length, 0, 'an already open page expires without reloading');
    await render('/learn'); await render('/learn/digestive');
    assert.equal(document.querySelectorAll('.learn-tab-new').length, 0, 'opening at or after the cutoff does not show badges');
  } finally {
    await render('/learn');
    Date.now = originalNow;
    window.setTimeout = originalTimeout;
  }
});

test('anatomy learning lives in Visualize and leaves Overview free of model loading', async () => {
  await render('/learn/digestive'); await selectTab('General Overview');
  assert.equal(document.querySelector('.learn-anatomy'), null);
  assert.equal(document.querySelectorAll('.learn-article-section').length, 8);
  await selectTab('Visualize');
  assert.equal(document.getElementById('digestive-system-visualize-heading').textContent, 'Visualize');
  const model = document.querySelector('.learn-visualize');
  assert.equal(model.hasAttribute('data-annotation-excluded'), true);
  assert.equal(model.querySelector('canvas'), null);
  assert.ok(model.querySelector('button').textContent.includes('Load interactive model'));
});

test('anatomy learning opens curated references without changing reading text and supports collapse/close focus', async () => {
  await render('/learn/digestive'); await selectTab('Deep Dive');
  const text = [...document.querySelectorAll('.learn-article-section .learn-markdown')].map(node => node.textContent);
  const actions = [...document.querySelectorAll('.learn-anatomy-references button')];
  assert.equal(actions.length, 8);
  const action = actions.find(button => button.textContent === 'View Stomach in 3D');
  await click(action);
  const companion = document.querySelector('.learn-companion-aside'); assert.ok(companion); assert.equal(companion.hasAttribute('data-annotation-excluded'), true);
  assert.equal(document.activeElement, companion.querySelector('h3'));
  assert.deepEqual([...document.querySelectorAll('.learn-article-section .learn-markdown')].map(node => node.textContent), text);
  await click(companion.querySelector('[aria-label="Collapse Anatomy Companion"]')); assert.equal(companion.querySelector('.learn-anatomy'), null);
  await click(companion.querySelector('[aria-label="Expand Anatomy Companion"]')); assert.ok(companion.querySelector('.learn-anatomy'));
  await click(companion.querySelector('[aria-label="Close Anatomy Companion"]')); assert.equal(document.querySelector('.learn-companion-aside'), null); assert.equal(document.activeElement, action);
});
after(async () => {
  flushSync(() => root.unmount());
  window.close();
});

test('the supplied UTF-8 JSON is unchanged and retains entry order', () => {
  assert.equal(createHash('sha256').update(source).digest('hex'), '03404d3524c3adefb2f6595e410076f9f439eb39f61ea895d7597bae511fd578');
  assert.deepEqual(data.sections.map(entry => entry.id), ['enteric-nervous-system', 'stomach-acidity', 'fat-lymphatic-transport']);
});

test('Learn navigation, subject registry, landing page and unknown subject', { timeout: 10000 }, async () => {
  await render('/learn');
  assert.equal(document.querySelector('h1').textContent, 'Learn');
  assert.equal(document.querySelector('[aria-label="Main navigation"] [aria-current]').textContent, 'Learn');
  for (const subject of learnSubjects) {
    assert.equal(document.querySelector(`.learn-subject-card[href="${subject.href}"]`).textContent, subject.title);
  }
  await render('/learn/missing');
  assert.equal(document.querySelector('h1').textContent, 'Page not found');
  assert.equal(document.querySelectorAll('.learn-entry').length, 0);
  await render('/learn/digestive');
  assert.equal(document.title, 'Digestive System · Human Atlas');
  assert.equal(document.querySelector('h1').textContent, 'Digestive System');
  assert.equal(tab('General Overview').getAttribute('aria-selected'), 'true');
  assert.equal(document.querySelector('.learn-article-header > h2').textContent, 'General Overview');
  assert.equal(document.querySelector('.learn-subjects'), null);
  const switcher = document.querySelector('.learn-subject-switcher');
  assert.equal(switcher.querySelector('span').textContent, 'Digestive');
  assert.equal(switcher.getAttribute('aria-label'), 'Change learning subject: Digestive System');
  const href = window.location.href;
  await click(switcher);
  const chooser = document.querySelector('[role="dialog"]');
  assert.equal(chooser.querySelectorAll('.learn-menu-subject').length, learnSubjects.length);
  assert.equal(chooser.querySelector('.learn-menu-subject[aria-current="page"]').getAttribute('href'), '/learn/digestive');
  assert.equal(window.location.href, href);
  await click(chooser.querySelector('[aria-label="Close Learn menu"]'));
  assert.equal(document.activeElement, switcher);
});

test('all three entries conserve the complete Markdown text, emphasis, table and transport sequence', { timeout: 10000 }, async () => {
  await render('/learn/digestive');
  await selectTab("Who Cares?");
  assert.equal(document.querySelector('.learn-facts .learn-article-header > h2').textContent, "Who Cares?");
  assert.equal(document.querySelector('.learn-facts .learn-reading-intro').textContent, learnSubjects[0].tabs.find(tab => tab.kind === 'facts').readingIntro);
  const entries = [...document.querySelectorAll('.learn-entry')];
  assert.equal(entries.length, 3);
  entries.forEach((entry, index) => {
    const sourceEntry = data.sections[index];
    assert.equal(entry.querySelector('h3').textContent, sourceEntry.title);
    assert.equal(normalize(entry.querySelector('.learn-entry-copy > .learn-markdown').textContent), standardText(sourceEntry.summary));
    assert.equal(entry.querySelector('h4').textContent, sourceEntry.moreInfoTitle);
    assert.equal(normalize(entry.querySelector('.learn-explanation .learn-markdown').textContent), standardText(sourceEntry.moreInfoMarkdown));
    assert.equal(entry.querySelector('.learn-more-trigger').textContent, 'More Info');
  });
  assert.equal(document.querySelector('em').textContent, 'enteric nervous system');
  assert.equal(entries[0].querySelector('strong').textContent, 'no remaining nerve connections to the brain or spinal cord');
  assert.deepEqual([...document.querySelectorAll('table tr')].map(row => [...row.children].map(cell => cell.textContent)), [
    ['Approximate pH comparison', 'pH'], ['Stomach acid (very acidic)', '1'], ['Lemon juice', '2.2'], ['Black coffee', '5'], ['Pure water', '7'],
  ]);
  assert.equal(document.querySelectorAll('th[scope="col"]').length, 2);
  assert.equal(document.querySelectorAll('.learn-transport-step').length, 4);
  assert.deepEqual([...document.querySelectorAll('.learn-transport-arrow')].map(node => node.textContent), ['↓', '↓', '↓']);
  assert.match(entries[1].textContent, /pH 1–2/);
  assert.match(entries[2].textContent, /Lacteals → Lymphatic vessels/);
  assert.equal(entries[2].querySelector('h5').textContent, 'Why Did This Evolve?');
});

test('explanations start collapsed and toggle independently with accessible relationships', { timeout: 10000 }, async () => {
  await render('/learn');
  await render('/learn/digestive');
  await selectTab("Who Cares?");
  const buttons = triggers();
  assert.equal(buttons.length, 3);
  buttons.forEach((button, index) => {
    assert.equal(button.tagName, 'BUTTON');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.equal(document.getElementById(button.getAttribute('aria-controls')), panels()[index]);
    assert.ok(panels()[index].hidden);
    assert.ok(document.getElementById(button.getAttribute('aria-describedby')));
    assert.ok(document.getElementById(panels()[index].getAttribute('aria-labelledby')));
  });
  const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(new Set(ids).size, ids.length);
  buttons[0].focus();
  await click(buttons[0]);
  assert.equal(buttons[0].getAttribute('aria-expanded'), 'true');
  assert.equal(panels()[0].hidden, false);
  await click(buttons[1]);
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-expanded')), ['true', 'true', 'false']);
  await click(buttons[0]);
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-expanded')), ['false', 'true', 'false']);
  assert.equal(document.activeElement, buttons[0]);
  await click(buttons[2]);
  assert.equal(panels()[2].hidden, false);
  await click(buttons[0]);
});

test('DOM accessibility audit passes with all explanations open and with them collapsed', { timeout: 10000 }, async () => {
  // jsdom has no layout engine; contrast and real keyboard/touch behavior require a browser.
  const options = { rules: { 'color-contrast': { enabled: false } } };
  let results = await axe.run(document, options);
  assert.deepEqual(results.violations.map(({ id, description }) => ({ id, description })), []);
  for (const button of triggers()) await click(button);
  results = await axe.run(document, options);
  assert.deepEqual(results.violations.map(({ id, description }) => ({ id, description })), []);
});

test('theme switching uses the shared persisted preference', { timeout: 10000 }, async () => {
  const previous = document.documentElement.dataset.theme;
  await click(document.querySelector('[aria-label="Appearance settings"]'));
  const popup = document.querySelector('.appearance-popover');
  const choose = mode => [...popup.querySelectorAll('.appearance-mode button')].find(button => button.textContent === mode);
  await click(choose(previous === 'dark' ? 'Light' : 'Dark'));
  assert.notEqual(document.documentElement.dataset.theme, previous);
  assert.equal(window.localStorage.getItem('human-atlas-theme'), document.documentElement.dataset.theme);
  await click(choose(previous === 'dark' ? 'Dark' : 'Light'));
  assert.equal(document.documentElement.dataset.theme, previous);
  await click(document.querySelector('[aria-label="Appearance settings"]'));
});

test('revised JSON retains ZIP-entry bytes apart from the two requested navigation links, order and unique section identifiers', () => {
  for (const { bytes, hash, sectionCount, article } of revisedSources) {
    const originalBytes = article.id === 'digestive-system-general-overview'
      ? Buffer.from(bytes.toString('utf8').replace('[**Deep Dive**](#digestive-system-deep-dive)', '**Deep Dive**').replace('[**Exam Cram**](#digestive-system-exam-cram)', '**Exam Cram**'))
      : bytes;
    assert.equal(createHash('sha256').update(originalBytes).digest('hex'), hash);
    assert.equal(article.sections.length, sectionCount);
    assert.equal(new Set(article.sections.map(section => section.id)).size, sectionCount);
    assert.ok(article.sections.every(section => section.title && section.markdown));
  }
  assert.deepEqual(learnSubjects.map(subject => subject.slug), ['digestive']);
  assert.deepEqual(learnSubjects[0].tabs.map(item => item.title), ['General Overview', 'Deep Dive', 'How It Connects', "Who Cares?", 'Visualize', 'Gallery', 'Exam Cram', 'Study Tools']);
});

test('Overview references open the corresponding tabs with bookmarks and destination focus', { timeout: 10000 }, async () => {
  await render('/learn'); await render('/learn/digestive');
  await selectTab('General Overview');
  for (const title of ['Deep Dive', 'Exam Cram']) {
    const id = learnSubjects[0].tabs.find(tab => tab.title === title).id;
    const link = document.querySelector(`.learn-reading a[href="#${id}"]`);
    assert.ok(link); assert.equal(link.textContent, title);
    assert.equal(link.querySelector('strong').textContent, title);
    await click(link);
    assert.equal(tab(title).getAttribute('aria-selected'), 'true');
    assert.equal(window.location.hash, `#${id}`);
    assert.equal(document.activeElement, document.getElementById(`${id}-heading`));
    await selectTab('General Overview');
  }
});

test('six ordered tabs have accessible relationships and Study Tools replaces the disabled quiz placeholder', { timeout: 10000 }, async () => {
  await render('/learn'); await render('/learn/digestive');
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  assert.equal(document.querySelector('[role="tablist"]').getAttribute('aria-label'), 'Digestive System content');
  assert.equal(tabs.length, 8);
  assert.equal(tabs.filter(node => node.getAttribute('aria-selected') === 'true').length, 1);
  assert.equal(tab('General Overview').getAttribute('tabindex'), '0');
  const quizzes = tab('Study Tools');
  assert.equal(quizzes.disabled,false);assert.notEqual(quizzes.getAttribute('aria-disabled'),'true');
  assert.doesNotMatch(quizzes.textContent, /Coming Soon/); assert.equal(quizzes.tagName, 'BUTTON');
  const location = window.location.href; await click(quizzes);
  assert.equal(tab('Study Tools').getAttribute('aria-selected'), 'true');
  assert.equal(window.location.href, location);
  for (const title of ['General Overview', 'Deep Dive', 'How It Connects', "Who Cares?", 'Exam Cram']) {
    await selectTab(title);
    const button = tab(title), panel = document.getElementById(button.getAttribute('aria-controls'));
    assert.ok(panel); assert.equal(panel.getAttribute('role'), 'tabpanel');
    assert.equal(panel.getAttribute('aria-labelledby'), button.id); assert.equal(panel.hidden, false);
    assert.equal(document.querySelectorAll('.learn-entry').length, 3, 'the existing facts appear only once');
  }
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(ids.length, new Set(ids).size);
});

test('all 48 article sections render complete wording, headings, lists, emphasis and tables without metadata paragraphs', { timeout: 15000 }, async () => {
  for (const { article, tabTitle } of articleSources) {
    await selectTab(tabTitle);
    const rendered = document.querySelector('.learn-reading');
    const header = rendered.querySelector('.learn-article-header');
    assert.equal(header.querySelector('h2').textContent, article.title);
    assert.equal(normalize(header.querySelector('.learn-markdown').textContent), standardText(article.introMarkdown));
    const readingIntro = learnSubjects[0].tabs.find(tab => tab.id === article.id).readingIntro;
    assert.equal(header.querySelector('.learn-reading-intro')?.textContent, readingIntro);
    const sections = [...rendered.querySelectorAll('.learn-article-section')];
    assert.equal(sections.length, article.sections.length);
    sections.forEach((section, index) => {
      const original = article.sections[index], markdown = section.querySelector('.learn-markdown');
      assert.equal(section.querySelector('h3').textContent, original.title);
      assert.equal(section.querySelector('h3').id, `${article.id}-${original.id}`);
      assert.equal(normalize(markdown.textContent), standardText(original.markdown), original.id);
      const expected = JSDOM.fragment(renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [remarkGfm], children: original.markdown })));
      for (const selector of ['p', 'li', 'strong', 'em', 'table', 'tr', 'th', 'td']) {
        assert.equal(markdown.querySelectorAll(selector).length, expected.querySelectorAll(selector).length, `${original.id} ${selector}`);
      }
      assert.deepEqual([...markdown.querySelectorAll('th, td')].map(cell => cell.textContent), [...expected.querySelectorAll('th, td')].map(cell => cell.textContent));
      markdown.querySelectorAll('th').forEach(cell => assert.equal(cell.getAttribute('scope'), 'col'));
      markdown.querySelectorAll('.learn-table').forEach(table => {
        assert.equal(table.getAttribute('tabindex'), '0'); assert.equal(table.getAttribute('aria-label'), `${original.title} table`);
      });
    });
    assert.equal(normalize(rendered.querySelector('.learn-article-header > .learn-markdown').textContent), standardText(article.introMarkdown));
    assert.doesNotMatch(rendered.textContent, /slideReferences|sourceFiles|introMarkdown/);
  }
  await selectTab('Exam Cram');
  assert.ok(document.getElementById('digestive-system-exam-cram-visual-labels'));
  assert.ok(document.getElementById('digestive-system-exam-cram-rapid-recall'));
});

test('How It Connects preserves the entire pasted journey and supports section bookmarks', { timeout: 10000 }, async () => {
  assert.equal(connections.title, 'The Journey of Digestion');
  assert.equal(connections.sections.length, 10);
  const reconstructed = `# ${connections.title}\n\n${connections.introMarkdown}\n\n` + connections.sections.map(section => `## ${section.title}\n\n${section.markdown}`).join('\n\n');
  // Full supplied text with CRLF normalized to LF and only terminal newlines removed.
  assert.equal(createHash('sha256').update(reconstructed).digest('hex'), 'fd3fc71facdcd9520e277744b798452877e987f2d8e9de2435ef6a10c4b3c1bf');
  await selectTab('How It Connects');
  assert.equal(document.querySelector('.learn-article-header h2').textContent, connections.title);
  assert.equal(document.querySelector('.learn-article-header em').textContent, 'How your body turns a meal into the materials that keep you alive.');
  const links = document.querySelectorAll('[aria-label="The Journey of Digestion contents"] a');
  assert.equal(links.length, 20, 'ten topics in each desktop/mobile index');
  await click(links[6]); await delay(30);
  const hash = window.location.hash;
  assert.equal(hash, links[6].getAttribute('href'));
  await render('/learn'); await render('/learn/digestive');
  assert.equal(tab('How It Connects').getAttribute('aria-selected'), 'true');
  assert.ok(document.getElementById(hash.slice(1)));
  await selectTab('General Overview'); assert.equal(window.location.hash, '');
});

test('Deep Dive indexes every topic with existing-page anchors and keyboard-focusable destinations', { timeout: 10000 }, async () => {
  await selectTab('Deep Dive');
  const article = revisedSources[1].article;
  for (const index of document.querySelectorAll('[aria-label="Deep Dive contents"]')) {
    const links = [...index.querySelectorAll('a')]; assert.equal(links.length, article.sections.length);
    links.forEach((link, i) => {
      assert.equal(link.textContent, article.sections[i].title);
      const heading = document.getElementById(link.getAttribute('href').slice(1));
      assert.equal(heading.textContent, article.sections[i].title); assert.equal(heading.getAttribute('tabindex'), '-1');
    });
  }
  const link = document.querySelector('[aria-label="Deep Dive contents"] a'); await click(link);
  assert.equal(document.activeElement.id, link.getAttribute('href').slice(1));
  await delay(30);
  const hash = window.location.hash; assert.equal(hash, link.getAttribute('href'));
  await render('/learn'); await render('/learn/digestive');
  assert.equal(tab('Deep Dive').getAttribute('aria-selected'), 'true', 'a bookmarked topic opens its tab');
  await selectTab('General Overview'); assert.equal(window.location.hash, '');
  assert.equal(document.querySelectorAll('[aria-label="General Overview contents"]').length, 2);
});

test('keyboard tab navigation uses roving focus and manual activation; Coming Soon is discoverable but cannot activate', { timeout: 10000 }, async () => {
  await selectTab('General Overview'); tab('General Overview').focus();
  const press = async (key, code = key) => {
    flushSync(() => document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true })));
    await delay(60);
    // jsdom does not synthesize a native button's default Enter/Space click.
    // Emulate that browser default; arrow/Home/End focus above runs the real tab handlers.
    if (key === 'Enter' || key === ' ') {
      assert.equal(document.activeElement.tagName, 'BUTTON');
      await click(document.activeElement);
    }
  };
  await press('ArrowRight'); assert.equal(document.activeElement, tab('Deep Dive'));
  assert.equal(tab('General Overview').getAttribute('aria-selected'), 'true');
  await press('Enter'); assert.equal(tab('Deep Dive').getAttribute('aria-selected'), 'true');
  await press('ArrowRight'); assert.equal(document.activeElement, tab('How It Connects'));
  await press('Enter'); assert.equal(tab('How It Connects').getAttribute('aria-selected'), 'true');
  await press('End'); assert.equal(document.activeElement.textContent, tab('Study Tools').textContent);
  await press('Enter'); assert.equal(tab('Study Tools').getAttribute('aria-selected'), 'true');
  await press('ArrowLeft'); assert.equal(document.activeElement.textContent, tab('Exam Cram').textContent);
  await press('ArrowLeft'); assert.equal(document.activeElement.textContent, tab('Gallery').textContent);
  await press('ArrowLeft'); assert.equal(document.activeElement.textContent, tab('Visualize').textContent);
  await press('ArrowLeft'); assert.equal(document.activeElement.textContent, tab("Who Cares?").textContent);
  await press(' ', 'Space'); assert.equal(tab("Who Cares?").getAttribute('aria-selected'), 'true');
  await press('ArrowRight'); assert.equal(document.activeElement.textContent, tab('Visualize').textContent);
  await press('ArrowRight'); assert.equal(document.activeElement.textContent, tab('Gallery').textContent);
  await press('ArrowRight'); assert.equal(document.activeElement.textContent, tab('Exam Cram').textContent);
  await press('ArrowRight'); assert.equal(document.activeElement.textContent, tab('Study Tools').textContent);
  await press('ArrowRight'); assert.equal(document.activeElement.textContent, tab('General Overview').textContent);
  await press('Home'); assert.equal(document.activeElement.textContent, tab('General Overview').textContent);
});

test('switching from a scrolled article starts the next tab at its top without smooth motion', { timeout: 10000 }, async () => {
  const tabs = document.querySelector('.learn-reading-tabs');
  const rect = tabs.getBoundingClientRect, scroll = tabs.scrollIntoView;
  let options;
  tabs.getBoundingClientRect = () => ({ top: -800 }); tabs.scrollIntoView = value => { options = value; };
  try {
    await selectTab('Exam Cram');
    assert.deepEqual(options, { block: 'start', behavior: 'instant' });
    assert.equal(tab('Exam Cram').getAttribute('aria-selected'), 'true');
  } finally { tabs.getBoundingClientRect = rect; tabs.scrollIntoView = scroll; }
});

test('reading arrows follow tab order, stop at the ends, and focus the destination heading', { timeout: 10000 }, async () => {
  await selectTab('General Overview');
  const activePanel = () => document.getElementById(document.querySelector('[role="tab"][aria-selected="true"]').getAttribute('aria-controls'));
  const arrows = location => activePanel().querySelectorAll(`.learn-index-${location} .learn-page-arrows button`);
  assert.equal(arrows('desktop').length, 2);
  assert.equal(arrows('desktop')[0].disabled, true);
  const tabs = document.querySelector('.learn-reading-tabs'), originalScroll = tabs.scrollIntoView;
  let options;
  tabs.scrollIntoView = value => { options = value; };
  try {
    assert.equal(arrows('desktop')[1].getAttribute('aria-label'), 'Next page: Deep Dive');
    await click(arrows('desktop')[1]);assert.equal(tab('Deep Dive').getAttribute('aria-selected'),'true');
    assert.equal(document.activeElement,document.getElementById('digestive-system-deep-dive-heading'));
    await selectTab('Deep Dive');
    for (const title of ['How It Connects', "Who Cares?"]) {
      const next = arrows('desktop')[1];
      assert.equal(next.getAttribute('aria-label'), `Next page: ${title}`);
      next.focus(); await click(next);
      assert.equal(tab(title).getAttribute('aria-selected'), 'true');
      const id = learnSubjects[0].tabs.find(tab => tab.title === title).id;
      assert.equal(window.location.hash, `#${id}`);
      assert.equal(document.activeElement, document.getElementById(`${id}-heading`));
      assert.deepEqual(options, { block: 'start', behavior: 'instant' });
    }
    assert.equal(arrows('desktop')[1].getAttribute('aria-label'), 'Next page: Visualize');
    assert.equal(arrows('mobile')[1].disabled, false);
    activePanel().querySelector('.learn-index-mobile').open = true;
    await click(arrows('mobile')[0]);
    assert.equal(tab('How It Connects').getAttribute('aria-selected'), 'true');
    assert.equal(arrows('desktop')[0].getAttribute('aria-label'), 'Previous page: Deep Dive');
    assert.equal(arrows('mobile')[1].getAttribute('aria-label'), 'Next page: Who Cares?');
    assert.equal(tab('Study Tools').getAttribute('aria-selected'), 'false');
  } finally { tabs.scrollIntoView = originalScroll; }
});

test('the mobile Deep Dive index starts collapsed and can expose its complete section list', { timeout: 10000 }, async () => {
  await selectTab('Deep Dive');
  const index = document.querySelector('.learn-index-mobile'); assert.equal(index.tagName, 'DETAILS');
  assert.equal(index.open, false); await click(index.querySelector('summary')); assert.equal(index.open, true);
  assert.equal(index.querySelectorAll('a').length, 15);
  await click(index.querySelector('summary')); assert.equal(index.open, false);
});

test('all five content tabs have compact shared indexes with working, unique section targets', { timeout: 10000 }, async () => {
  for (const [title, count, indexTitle = title] of [['General Overview', 8], ['How It Connects', 10, 'The Journey of Digestion'], ['Deep Dive', 15], ['Exam Cram', 15], ["Who Cares?", 3]]) {
    await selectTab(title);
    const panel = document.getElementById(tab(title).getAttribute('aria-controls'));
    const indexes = panel.querySelectorAll(`nav[aria-label="${indexTitle} contents"]`);
    assert.equal(indexes.length, 2, title);
    indexes.forEach(index => {
      const links = [...index.querySelectorAll('a')]; assert.equal(links.length, count);
      links.forEach(link => assert.equal(document.getElementById(link.getAttribute('href').slice(1))?.textContent, link.textContent));
    });
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
    assert.equal(ids.length, new Set(ids).size);
  }
});

test('scroll-aware highlighting follows the reading position in every tab, including upward scroll, resize and article end', { timeout: 12000 }, async () => {
  const shell = document.querySelector('.learn-shell');
  Object.defineProperty(shell, 'clientHeight', { configurable: true, value: 800 });
  Object.defineProperty(shell, 'scrollHeight', { configurable: true, value: 10000 });
  for (const title of ['General Overview', 'How It Connects', 'Deep Dive', 'Exam Cram', "Who Cares?"]) {
    shell.scrollTop = 0; await selectTab(title);
    const panel = document.getElementById(tab(title).getAttribute('aria-controls'));
    const links = [...panel.querySelector('.learn-index-desktop nav').querySelectorAll('a')];
    const headings = links.map(link => document.getElementById(link.getAttribute('href').slice(1)));
    const originals = headings.map(heading => heading.getBoundingClientRect);
    const bar = document.querySelector('.learn-tab-bar'), barRect = bar.getBoundingClientRect;
    bar.getBoundingClientRect = () => ({ bottom: 80 });
    headings.forEach((heading, i) => { heading.getBoundingClientRect = () => ({ top: 200 + i * 400 - shell.scrollTop }); });
    const expectCurrent = i => {
      const current = [...panel.querySelectorAll('a[aria-current="location"]')];
      assert.equal(current.length, 2, `${title}: both indexes highlight one item`);
      assert.ok(current.every(link => link.getAttribute('href') === `#${headings[i].id}`), `${title}: section ${i}`);
    };
    const scroll = async top => { shell.scrollTop = top; shell.dispatchEvent(new window.Event('scroll')); await delay(60); };
    try {
      window.dispatchEvent(new window.Event('resize')); await delay(60); expectCurrent(0);
      await scroll(550); expectCurrent(1);
      await scroll(0); expectCurrent(0);
      shell.scrollTop = 950; resizeCallbacks.forEach(callback => callback()); await delay(60); expectCurrent(2);
      await scroll(9200); expectCurrent(headings.length - 1);
    } finally {
      headings.forEach((heading, i) => { heading.getBoundingClientRect = originals[i]; });
      bar.getBoundingClientRect = barRect; shell.scrollTop = 0;
    }
  }
  assert.equal([...resizeTargets.values()].filter(element => element.matches('.learn-article-layout')).length, 1, 'only the visible reading layout observes scroll-related reflow; Base UI has its own panel observers');
});

test('facts accordions retain independent open state across article tab changes', { timeout: 10000 }, async () => {
  await render('/learn'); await render('/learn/digestive'); await selectTab("Who Cares?");
  assert.deepEqual(triggers().map(button => button.getAttribute('aria-expanded')), ['false', 'false', 'false']);
  await click(triggers()[0]); await click(triggers()[2]);
  await selectTab('Exam Cram'); assert.ok(triggers()[0].closest('[role="tabpanel"]').hidden);
  await selectTab("Who Cares?");
  assert.deepEqual(triggers().map(button => button.getAttribute('aria-expanded')), ['true', 'false', 'true']);
});

test('every article tab passes the DOM accessibility audit', { timeout: 15000 }, async () => {
  for (const { article, tabTitle } of articleSources) {
    await selectTab(tabTitle);
    const results = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
    assert.deepEqual(results.violations.map(({ id, description }) => ({ id, description })), [], article.title);
  }
});

test('shared Markdown rendering does not execute raw HTML or unsafe link schemes', () => {
  const html = renderToStaticMarkup(createElement(EducationalMarkdown, { children: '<script>alert(1)</script>\n\n[Unsafe](javascript:alert%281%29)\n\n**Retained emphasis**' }));
  const fragment = JSDOM.fragment(html);
  assert.equal(fragment.querySelector('script'), null);
  assert.notEqual(fragment.querySelector('a').getAttribute('href')?.startsWith('javascript:'), true);
  assert.equal(fragment.querySelector('strong').textContent, 'Retained emphasis');
});

test('the far-right info control opens a modal guide with general descriptions and two noninteractive future previews', { timeout: 10000 }, async () => {
  await render('/learn'); await render('/learn/digestive');
  const trigger=document.querySelector('[aria-label="About these sections"]'),list=document.querySelector('[role="tablist"]');
  assert.ok(trigger);assert.equal(list.contains(trigger),false,'info is a separate control, outside tab keyboard navigation');
  assert.ok(list.compareDocumentPosition(trigger)&window.Node.DOCUMENT_POSITION_FOLLOWING);
  const location=window.location.href,reading=document.querySelector('.learn-reading'),shell=document.querySelector('.learn-shell');shell.scrollTop=600;
  trigger.focus();await click(trigger);
  const guide=document.querySelector('.learn-section-guide');assert.ok(guide);
  assert.equal(guide.getAttribute('role'),'dialog');assert.equal(guide.getAttribute('aria-modal'),'true');
  assert.ok(document.querySelector('.learn-menu-backdrop'));assert.equal(document.activeElement,guide.querySelector('[aria-label="Close section guide"]'));
  assert.equal(document.getElementById(guide.getAttribute('aria-labelledby')).textContent,'Section guide');
  assert.equal(document.getElementById(guide.getAttribute('aria-describedby')).textContent,'Choose the learning approach that best fits what you want to understand, explore, or review.');
  const available=learnSubjects[0].tabs.filter(tab=>tab.kind!=='coming-soon'),entries=[...available,...upcomingLearningSections];
  assert.deepEqual([...guide.querySelectorAll('dt')].map(node=>node.childNodes[0].textContent),['General Overview','Deep Dive','How It Connects','Who Cares?','Visualize','Gallery','Exam Cram','Study Tools']);
  assert.deepEqual([...guide.querySelectorAll('dd')].map(node=>node.textContent),entries.map(tab=>tab.description));
  assert.ok(entries.every(tab=>tab.description.length>80));
  assert.equal(guide.querySelector('.learn-section-guide-planned'),null);
  assert.equal(tab('General Overview').getAttribute('aria-selected'),'true');assert.equal(window.location.href,location);
  const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});
  assert.deepEqual(results.violations.map(item=>item.id),[]);
  document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true,cancelable:true}));await delay(80);
  assert.equal(document.querySelector('.learn-section-guide'),null);assert.equal(document.activeElement,trigger);
  assert.equal(document.querySelector('.learn-reading'),reading);assert.equal(shell.scrollTop,600);
  await click(trigger);await click(document.querySelector('[aria-label="Close section guide"]'));
  assert.equal(document.querySelector('.learn-section-guide'),null);assert.equal(document.activeElement,trigger);
});

test('Learn opens an accessible subject chooser without navigating or replacing the explorer', { timeout: 10000 }, async () => {
  window.history.replaceState(null, '', '/male?region=atlas%3Aregion%3Athoracic');
  flushSync(() => root.render(createElement('main', { id: 'explorer-fixture', 'data-camera-pose': 'preserved' }, createElement(SiteNavigation, { section: 'explore' }))));
  await delay(60);
  const explorer = document.querySelector('#explorer-fixture'), trigger = document.querySelector('.learn-menu-trigger');
  const href = window.location.href;
  assert.equal(trigger.tagName, 'BUTTON'); assert.equal(trigger.textContent, 'Learn');
  assert.equal(document.querySelector('.site-navigation a[href="/learn"]'), null);
  trigger.focus(); await click(trigger);
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog); assert.equal(dialog.getAttribute('aria-modal'), 'true');
  assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent, 'Learn');
  assert.equal(document.getElementById(dialog.getAttribute('aria-describedby')).textContent, 'Choose a system to explore.');
  assert.ok(document.querySelector('.learn-menu-backdrop')); assert.equal(dialog.dataset.atlasShortcuts, 'disabled');
  assert.equal(window.location.href, href); assert.equal(document.querySelector('#explorer-fixture'), explorer);
  const links = [...dialog.querySelectorAll('.learn-menu-subject')]; assert.equal(links.length, learnSubjects.length);
  links.forEach((link, index) => {
    assert.equal(link.getAttribute('href'), learnSubjects[index].href);
    assert.equal(link.querySelector('.learn-menu-subject-title').textContent, learnSubjects[index].title);
    const preview = link.querySelector('.learn-menu-subject-preview');
    assert.equal(preview.getAttribute('role'), 'list');
    assert.equal(preview.getAttribute('aria-label'), `${learnSubjects[index].title} sections`);
    assert.deepEqual([...preview.querySelectorAll('.learn-menu-preview-item > span:first-child')].map(item => item.textContent), learnSubjects[index].tabs.map(item => item.title));
    assert.equal(preview.querySelector('.learn-menu-preview-status'), null);
    assert.equal(link.querySelector('.learn-menu-subject-count').textContent, '8 sections');
  });
  assert.equal(document.activeElement, links[0]);
  const results = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
  assert.deepEqual(results.violations.map(({ id, description }) => ({ id, description })), []);
  await click(dialog.querySelector('[aria-label="Close Learn menu"]'));
  assert.equal(document.querySelector('[role="dialog"]'), null); assert.equal(document.activeElement, trigger);
  assert.equal(window.location.href, href); assert.equal(document.querySelector('#explorer-fixture'), explorer);
});

test('Escape dismisses the Learn chooser and returns focus to Learn', { timeout: 10000 }, async () => {
  const trigger = document.querySelector('.learn-menu-trigger'); trigger.focus(); await click(trigger);
  assert.ok(document.querySelector('[role="dialog"]'));
  document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
  await delay(80);
  assert.equal(document.querySelector('[role="dialog"]'), null); assert.equal(document.activeElement, trigger);
});
