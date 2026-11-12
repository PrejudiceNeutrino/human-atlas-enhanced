import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = 'docs/integration/editorial-consistency-source';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const inventory = read(`${root}/archive-inventory.json`);
const finalReviewHashes = new Map(read('docs/integration/exam-cram-final-source/archive-inventory.json').installedFiles.map(entry=>[entry.targetPath,entry.sha256]));
const changelog = read(`${root}/STUDY-TOOLS-CHANGELOG.json`);
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const output = path.resolve('work/editorial-tests/runtime.mjs');
await build({ stdin: { contents: "export * from './app/notes/annotation-content';export * from './app/notes/annotation-model';export * from './app/notes/annotation-core';export * from './app/learn/study-tools/progress';", resolveDir: process.cwd() }, outfile: output, bundle: true, packages: 'external', platform: 'node', format: 'esm' });
const api = await import(pathToFileURL(output).href);

test('all installed files match the authored package and protected content keeps its original bytes', () => {
  assert.equal(inventory.installedFiles.length, 16);
  for (const entry of inventory.installedFiles) {
    assert.equal(hash(entry.targetPath), entry.sha256, entry.targetPath);
    assert.equal(entry.sha256, inventory.entries.find(original => original.path === entry.sourcePath).sha256);
  }
  for (const entry of inventory.protectedFiles) assert.equal(hash(entry.path), finalReviewHashes.get(entry.path)??entry.sha256, entry.path);
  for (const entry of inventory.entries.filter(entry => entry.path.startsWith('review-baseline/'))) assert.equal(hash(`${root}/${entry.path}`), entry.sha256, entry.path);
});

const withoutProse = value => JSON.parse(JSON.stringify(value, (key, item) => ['introMarkdown', 'markdown', 'summary', 'moreInfoMarkdown'].includes(key) ? undefined : item));
test('all eight revised readings preserve IDs, order, headings, slide references and non-prose metadata', () => {
  for (const subject of ['respiratory', 'lymphoid']) {
    for (const page of ['general-overview', 'deep-dive', 'how-it-connects', 'why-is-this-cool']) {
      const original = read(`${root}/review-baseline/${subject}/${page}.json`), revised = read(`data/learn/${subject}-system-${page}.json`);
      assert.deepEqual(withoutProse(revised), withoutProse(original), `${subject}/${page}`);
      assert.equal(new Set(revised.sections.map(section => section.id)).size, revised.sections.length);
      assert.ok(revised.sections.every(section => (section.markdown ?? section.moreInfoMarkdown).trim()));
    }
    const detailed = read(`data/learn/${subject}-system-exam-cram.json`), quick = read(`data/learn/${subject}-system-exam-cram-quick-scan.json`);
    assert.deepEqual(withoutProse(detailed), withoutProse(read(`${root}/review-baseline/${subject}/exam-cram.json`)));
    assert.equal(quick.sections.length, 18); assert.equal(quick.variantOf, detailed.id);
    assert.deepEqual(quick.sections.map(({ id, title, slideReferences }) => ({ id, title, slideReferences })), detailed.sections.map(({ id, title, slideReferences }) => ({ id, title, slideReferences })));
  }
});

for (const [subject, questionCount, cardCount, edits] of [['digestive', 111, 101, 17], ['respiratory', 106, 114, 14], ['lymphoid', 104, 117, 22]]) {
  test(`${subject}: only the exact authored distractors and two flashcards change; correct answers and progress survive`, () => {
    const original = read(`${root}/review-baseline/${subject}/study-tools/multiple-choice.json`), revised = read(`data/learn/${subject}-study-tools/multiple-choice.json`);
    assert.equal(revised.questions.length, questionCount);
    const changed = [];
    for (let i = 0; i < original.questions.length; i++) {
      const before = original.questions[i], after = revised.questions[i], permitted = structuredClone(before);
      assert.equal(after.correctChoiceId, before.correctChoiceId);
      assert.equal(after.choices.find(choice => choice.id === after.correctChoiceId).text, before.choices.find(choice => choice.id === before.correctChoiceId).text);
      assert.deepEqual(after.choices.map(choice => choice.id), before.choices.map(choice => choice.id));
      for (const choice of permitted.choices) if (choice.id !== permitted.correctChoiceId) choice.text = after.choices.find(item => item.id === choice.id).text;
      assert.deepEqual(after, permitted, before.id);
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changed.push(before.id);
        const authored = changelog[subject]['multiple-choice'].find(item => item.id === before.id);
        assert.deepEqual(after.choices.filter(choice => choice.id !== after.correctChoiceId).map(choice => choice.text), authored.after);
      }
    }
    assert.equal(changed.length, edits); assert.deepEqual(changed, changelog[subject]['multiple-choice'].map(item => item.id));
    const oldCards = read(`${root}/review-baseline/${subject}/study-tools/flashcards.json`), cards = read(`data/learn/${subject}-study-tools/flashcards.json`), changedCards = [];
    assert.equal(cards.cards.length, cardCount);
    for (let i = 0; i < oldCards.cards.length; i++) {
      const before = oldCards.cards[i], after = cards.cards[i];
      assert.deepEqual(after, { ...before, front: after.front, back: after.back });
      if (JSON.stringify(before) !== JSON.stringify(after)) changedCards.push(before.id);
    }
    assert.deepEqual(changedCards, changelog[subject].flashcards.map(item => item.id)); assert.equal(changedCards.length, 2);
    assert.deepEqual({ ...revised, questions: [] }, { ...original, questions: [] });
    assert.deepEqual({ ...cards, cards: [] }, { ...oldCards, cards: [] });
    const saved = new Map(), storage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
    const previous = api.createStudyProgressStore(subject, storage);
    previous.answerMultipleChoice(changed[0], true); previous.markCard(changedCards[0], 'known');
    const before = storage.getItem(previous.key), next = api.createStudyProgressStore(subject, storage);
    assert.equal(next.key, `human-atlas-study-progress:v1:${subject}`);
    assert.equal(next.getSnapshot().progress.multipleChoice[changed[0]].correct, 1);
    assert.equal(next.getSnapshot().progress.flashcards[changedCards[0]].status, 'known');
    assert.equal(storage.getItem(previous.key), before, 'reading a replacement bank never resets progress');
  });
}

const record = (source, block) => {
  const now = '2026-11-11T12:00:00.000Z';
  return { id: crypto.randomUUID(), schemaVersion: 1, target: source.target, anchor: { blockId: block.id, start: 0, end: block.text.length, exact: block.text, prefix: '', suffix: '', blockText: block.text, contentVersion: source.version }, note: 'Keep my personal note and original excerpt.', style: 'ochre', status: 'anchored', createdAt: now, modifiedAt: now };
};
test('old reading highlights reanchor only to safe matches; revised passages retain unresolved excerpts and notes', () => {
  let retained = 0, unresolved = 0;
  for (const subject of ['respiratory', 'lymphoid']) for (const page of ['general-overview', 'deep-dive', 'how-it-connects', 'why-is-this-cool']) {
    const original = read(`${root}/review-baseline/${subject}/${page}.json`);
    for (const section of original.sections) {
      const facts = page === 'why-is-this-cool', sourceId = `${original.id}/${section.id}${facts ? '/more' : ''}`;
      const current = api.annotationSources.find(source => source.target.sourceId === sourceId), title = facts ? section.moreInfoTitle : section.title, markdown = facts ? section.moreInfoMarkdown : section.markdown;
      const old = { ...current, blocks: [api.titleBlock(title), ...api.markdownBlocks(markdown)], version: api.fingerprint(`${title}\n${markdown}`) };
      if (old.version === current.version) continue;
      const savedHeading = record(old, old.blocks[0]), [heading] = api.resolvedAnnotations([savedHeading], api.annotationSources);
      assert.equal(heading.status, 'anchored'); assert.equal(heading.note, savedHeading.note); assert.equal(heading.anchor.contentVersion, current.version); retained++;
      const removed = old.blocks.find(block => block.text.length > 40 && block.text.length < 4500 && !current.blocks.some(item => item.text === block.text));
      if (removed) {
        const saved = record(old, removed), [result] = api.resolvedAnnotations([saved], api.annotationSources);
        assert.equal(result.status, 'unresolved'); assert.equal(result.note, saved.note); assert.equal(result.anchor.exact, saved.anchor.exact); unresolved++;
      }
    }
  }
  assert.ok(retained >= 8); assert.ok(unresolved > 0);
});

test('final Detailed Reviews preserve legacy source identities and retain safely unresolved notes', () => {
  let headings = 0, unresolved = 0;
  for (const subject of ['digestive', 'respiratory', 'lymphoid']) {
    const original = read(`docs/integration/exam-cram-final-source/${subject === 'digestive' ? 'reference/digestive-prior-detailed-review.json' : `baseline/${subject}-system-exam-cram.json`}`);
    for (const section of original.sections) {
      const current = api.annotationSources.find(source => source.target.sourceId === `${original.id}/${section.id}`);
      assert.ok(current, `${original.id}/${section.id}`);
      const old = { ...current, blocks: [api.titleBlock(section.title), ...api.markdownBlocks(section.markdown)], version: api.fingerprint(`${section.title}\n${section.markdown}`) };
      const savedHeading = record(old, old.blocks[0]), [heading] = api.resolvedAnnotations([savedHeading], api.annotationSources);
      assert.equal(heading.status, 'anchored'); assert.equal(heading.target.sourceId, savedHeading.target.sourceId); assert.equal(heading.note, savedHeading.note); headings++;
      const removed = old.blocks.find(block => block.text.length > 40 && block.text.length < 4500 && !current.blocks.some(item => item.text === block.text));
      if (removed) {
        const saved = record(old, removed), [result] = api.resolvedAnnotations([saved], api.annotationSources);
        assert.equal(result.status, 'unresolved'); assert.equal(result.note, saved.note); assert.equal(result.anchor.exact, saved.anchor.exact); unresolved++;
      }
    }
  }
  assert.equal(headings, 51); assert.ok(unresolved > 0);
});
