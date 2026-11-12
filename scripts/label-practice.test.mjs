import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { parseGallery } from '../app/learn/gallery/model.ts';
import { parsePracticeDataset, practiceForFigure, answerMatches, regionBounds } from '../app/learn/gallery/label-practice-model.ts';

const root = 'public/images/learn/digestive/gallery';
const gallery = parseGallery(JSON.parse(fs.readFileSync(`${root}/gallery.json`, 'utf8')));
const annotations = JSON.parse(fs.readFileSync(`${root}/label-practice.json`, 'utf8'));
const parse = value => parsePracticeDataset(value, 'digestive', gallery);
const mutate = update => { const copy = structuredClone(annotations); update(copy); return copy; };
const entry = value => value.figures.find(figure => figure.figureId === 'a02');
const label = value => entry(value).labels[0];

test('all source figures have valid coverage decisions and 272 reviewed answers', () => {
  const data = parse(annotations);
  assert.equal(data.figures.length, 30);
  assert.equal(data.figures.filter(figure => figure.reviewStatus === 'verified').length, 24);
  assert.equal(data.figures.flatMap(figure => figure.labels).length, 272);
  assert.equal(practiceForFigure(data, gallery.items[0]).labels.length, 0);
  assert.equal(practiceForFigure(null, gallery.items[1]).labels.length, 0);
  assert.equal(practiceForFigure(data, gallery.items[1]).labels.length, 11);
  for (const [id, name, count] of [['a05', 'Sublingual salivary gland', 2], ['a12', 'Round ligament', 4], ['a13', 'Cystic duct', 5]]) {
    const figure = data.figures.find(figure => figure.figureId === id);
    assert.equal(figure.coverage, 'complete');
    assert.equal(figure.labels.length, count);
    assert.ok(figure.labels.some(label => label.label === name));
  }
});

test('schema rejects unsupported versions, subjects, unknown figures and duplicate IDs', () => {
  for (const update of [data => { data.schemaVersion = 2; }, data => { data.subjectId = 'other'; }, data => { data.figures.push(data.figures[0]); }, data => { entry(data).labels.push(label(data)); }, data => { entry(data).figureId = 'missing'; }, data => { entry(data).sourceImageSha256 = 'not-a-hash'; }]) assert.throws(() => parse(mutate(update)));
});

test('only bounded, opaque normalized masks can be published', () => {
  for (const region of [
    { shape: 'rect', x: -.01, y: 0, width: .1, height: .1, fill: '#ffffff' },
    { shape: 'rect', x: .95, y: 0, width: .1, height: .1, fill: '#ffffff' },
    { shape: 'rect', x: 0, y: 0, width: 0, height: .1, fill: '#ffffff' },
    { shape: 'rect', x: 0, y: NaN, width: .1, height: .1, fill: '#ffffff' },
    { shape: 'rect', x: 0, y: 0, width: .1, height: .1, fill: '#ffffff80' },
    { shape: 'ellipse', fill: '#ffffff' },
    { shape: 'polygon', points: [[0, 0], [.1, .1], [.2, .2]], fill: '#ffffff' },
    { shape: 'polygon', points: [[0, 0], [1.1, .1], [.2, .2]], fill: '#ffffff' },
  ]) assert.throws(() => parse(mutate(data => { label(data).regions = [region]; })));
  const polygon = { shape: 'polygon', points: [[.1, .2], [.3, .2], [.2, .4]], fill: '#abcdef' };
  parse(mutate(data => { label(data).regions.push(polygon); }));
  assert.deepEqual(regionBounds(polygon), { x: .1, y: .2, width: .3 - .1, height: .4 - .2 });
});

test('hash changes and unfinished annotations never publish stale or misleading covers', () => {
  assert.equal(practiceForFigure(parse(annotations), { ...gallery.items[1], sha256: '0'.repeat(64) }).stale, true);
  assert.equal(practiceForFigure(parse(annotations), { ...gallery.items[1], sha256: '0'.repeat(64) }).labels.length, 0);
  assert.throws(() => parse(mutate(data => { label(data).issue = 'overlaps-anatomy'; })));
  assert.throws(() => parse(mutate(data => { label(data).reviewStatus = 'needs-review'; })));
  const data = parse(mutate(data => { entry(data).coverage = 'partial'; label(data).reviewStatus = 'needs-review'; label(data).issue = 'inadequate-mask'; }));
  assert.equal(practiceForFigure(data, gallery.items[1]).labels.length, 10);
});

test('typed identification accepts curated names and whitespace, never partial terms', () => {
  const answer = { ...label(annotations), label: 'Upper lip', acceptedAnswers: ['Superior labium'] };
  assert.equal(answerMatches(answer, '  UPPER   lip  '), true);
  assert.equal(answerMatches(answer, 'superior labium'), true);
  for (const value of ['', 'lip', 'upper lips', 'Upper lip and tongue', 'inferior labium']) assert.equal(answerMatches(answer, value), false);
});

for (const [subjectId, figures, playable, answers, regions] of [
  ['respiratory', 29, 24, 230, 262], ['lymphoid', 35, 31, 263, 331],
]) {
  const root = `public/images/learn/${subjectId}/gallery`;
  const gallery = parseGallery(JSON.parse(fs.readFileSync(`${root}/gallery.json`, 'utf8')));
  const annotations = JSON.parse(fs.readFileSync(`${root}/label-practice.json`, 'utf8'));
  test(`${subjectId}: every figure has a source-bound review and playable masks pass the shared schema`, () => {
    const data = parsePracticeDataset(annotations, subjectId, gallery);
    assert.equal(data.figures.length, figures);
    assert.equal(data.figures.filter(figure => figure.reviewStatus === 'verified').length, playable);
    assert.equal(data.figures.flatMap(figure => figure.labels).length, answers);
    assert.equal(data.figures.flatMap(figure => figure.labels.flatMap(label => label.regions)).length, regions);
    for (const figure of gallery.items) {
      const { entry, stale, labels } = practiceForFigure(data, figure);
      assert.ok(entry && !stale, figure.id);
      assert.equal(createHash('sha256').update(fs.readFileSync(`${root}/${figure.image}`)).digest('hex'), entry.sourceImageSha256, figure.id);
      assert.ok(entry.reviewNotes.trim(), figure.id);
      assert.equal(new Set(labels.map(label => label.label.toLowerCase())).size, labels.length, 'repeated callouts share one answer');
      for (const label of labels) {
        assert.equal(label.reviewStatus, 'verified');
        assert.equal(label.issue, undefined);
        for (const answer of [label.label, ...label.acceptedAnswers]) assert.ok(answerMatches(label, `  ${answer.toUpperCase()}  `));
      }
      if (entry.reviewStatus === 'not-applicable') assert.equal(labels.length, 0);
    }
  });
  test(`${subjectId}: missing individual annotations and changed sources cannot break other practice figures`, () => {
    const copy = structuredClone(annotations);
    copy.figures = copy.figures.filter(figure => figure.figureId !== 'a01');
    const data = parsePracticeDataset(copy, subjectId, gallery);
    assert.equal(practiceForFigure(data, gallery.items[0]).labels.length, 0);
    assert.ok(practiceForFigure(data, gallery.items[1]).labels.length > 0);
    assert.equal(practiceForFigure(data, { ...gallery.items[1], sha256: '0'.repeat(64) }).labels.length, 0);
    assert.throws(() => parsePracticeDataset(annotations, subjectId === 'respiratory' ? 'lymphoid' : 'respiratory', gallery));
  });
}
