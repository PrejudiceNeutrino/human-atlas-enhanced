import type { ArticleTarget } from './model';
import type { StudyBank } from './types';

const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown):value is string=>typeof value==='string'&&!!value.trim();
const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(text);
const id=(value:unknown):value is string=>typeof value==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
function requireValue(condition:unknown,message:string):asserts condition {if(!condition)throw new Error(`Study content validation: ${message}`);}

/** Fail visibly on malformed records; report unresolved teaching references separately. */
export function validateStudyBank(value:unknown,articles:Record<string,ArticleTarget>):{bank:StudyBank;unresolvedReferences:string[]} {
  requireValue(object(value),'missing bank');const m=value.manifest;
  requireValue(object(m)&&m.kind==='human-atlas-study-tools'&&m.schemaVersion===1&&id(m.subjectId)&&text(m.title)&&text(m.curriculum),'invalid manifest');
  requireValue(Array.isArray(m.topics)&&m.topics.length>0&&m.topics.every(topic=>object(topic)&&id(topic.id)&&text(topic.label)&&Number.isSafeInteger(topic.sortOrder)),'invalid topics');
  requireValue(Array.isArray(m.sources), 'missing source metadata');
  const presentations = new Map<string, number>();
  const articleIds = new Set<string>();
  for (const source of m.sources) {
    requireValue(object(source) && text(source.file) && text(source.kind), 'invalid source declaration');
    if (source.kind === 'presentation') {
      requireValue(Number.isSafeInteger(source.slideCount) && Number(source.slideCount) > 0 && !presentations.has(source.file), 'invalid presentation declaration');
      presentations.set(source.file, Number(source.slideCount));
    } else if (source.kind === 'learn-article') {
      articleIds.add(source.file.split('/').pop()!.replace(/\.json$/, ''));
    }
  }
  requireValue(presentations.size > 0 && articleIds.size > 0, 'missing presentation/article declarations');
  const topics=new Set(m.topics.map(topic=>topic.id));requireValue(topics.size===m.topics.length,'duplicate topic IDs');
  requireValue(object(m.counts),'missing counts');
  const groups=['concepts','multipleChoice','fillInTheBlank','flashcards'] as const;
  for(const key of groups)requireValue(Array.isArray(value[key])&&value[key].length===m.counts[key]&&Number.isSafeInteger(m.counts[key]),`invalid ${key} count`);
  const records=groups.flatMap(key=>value[key] as unknown[]),allIds=new Set<string>();
  for(const record of records){requireValue(object(record)&&id(record.id)&&!allIds.has(record.id),'missing/duplicate record ID');allIds.add(record.id);}
  const concepts=new Set((value.concepts as Record<string,unknown>[]).map(record=>record.id));
  const unresolved=new Set<string>();
  for(const raw of records){const record=raw as Record<string,unknown>;requireValue(topics.has(record.topicId),`${record.id}: unknown topic`);
    const refs=record.sourceRefs;requireValue(Array.isArray(refs)&&refs.length>0,`${record.id}: missing sources`);
    for(const ref of refs){requireValue(object(ref)&&id(ref.articleId)&&id(ref.sectionId)&&object(ref.slideReferences),`${record.id}: malformed source`);
      for(const [filename,slides] of Object.entries(ref.slideReferences)){const max=presentations.get(filename);requireValue(max&&Array.isArray(slides)&&slides.every(slide=>Number.isSafeInteger(slide)&&slide>=1&&slide<=max),`${record.id}: invalid slide metadata`);}
      requireValue(articleIds.has(ref.articleId) && ref.articleId.startsWith(`${m.subjectId}-system-`), `${record.id}: source belongs to another subject or is undeclared`);
      if(!articles[ref.articleId]?.sections.some(section=>section.id===ref.sectionId))unresolved.add(`${ref.articleId}/${ref.sectionId}`);
    }
    const links=record.relatedConceptIds??record.conceptIds;requireValue(strings(links)&&links.every(link=>concepts.has(link)),`${record.id}: unknown concept reference`);
  }
  for(const raw of value.concepts as Record<string,unknown>[])requireValue(text(raw.term)&&text(raw.definition)&&strings(raw.aliases),`${raw.id}: invalid concept`);
  for(const raw of value.multipleChoice as Record<string,unknown>[]){requireValue(raw.type==='multiple-choice'&&text(raw.stem)&&text(raw.explanation)&&['recall','knowledge','application'].includes(String(raw.cognitiveLevel)),`${raw.id}: invalid question`);
    const choices=raw.choices;requireValue(Array.isArray(choices)&&choices.length===4&&choices.every(choice=>object(choice)&&id(choice.id)&&text(choice.text)),`${raw.id}: invalid choices`);
    requireValue(new Set(choices.map(choice=>choice.id)).size===4&&new Set(choices.map(choice=>choice.text.trim().toLowerCase())).size===4&&choices.some(choice=>choice.id===raw.correctChoiceId),`${raw.id}: invalid answer`);
  }
  for(const raw of value.fillInTheBlank as Record<string,unknown>[])requireValue(raw.type==='fill-in-blank'&&text(raw.prompt)&&raw.prompt.split('_____').length===2&&text(raw.answer)&&strings(raw.acceptedAnswers)&&text(raw.hint)&&text(raw.explanation)&&raw.answerNormalization==='case-whitespace-punctuation',`${raw.id}: invalid fill-in-the-blank`);
  for(const raw of value.flashcards as Record<string,unknown>[])requireValue(text(raw.front)&&text(raw.back),`${raw.id}: invalid flashcard`);
  return{bank:value as unknown as StudyBank,unresolvedReferences:[...unresolved]};
}
