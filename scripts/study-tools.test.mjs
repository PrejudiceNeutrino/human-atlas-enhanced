import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const output=path.resolve('work/study-tools-tests/model.mjs');
await build({stdin:{contents:"export * from './app/learn/study-tools/data';export * from './app/learn/study-tools/model';export * from './app/learn/study-tools/validation';export * from './app/learn/study-tools/progress';export {articles} from './app/learn/content';",resolveDir:process.cwd()},outfile:output,bundle:true,platform:'node',format:'esm',packages:'external'});
const {studyBank:bank,unresolvedReferences,validateStudyBank,articles,sourceTarget,byTopic,createQuizSession,isCorrectChoice,isAcceptedAnswer,normalizeAnswer,findConcepts,createStudyProgressStore}=await import(pathToFileURL(output).href);
const hashes={
 'concepts.json':'33aa58eee5a30286fe2e481f69ad410875d17524eda542c8c3ba2cb0e5b70baf',
 'multiple-choice.json':'2a957fd51429ab7373122f3dfa93852f47d688fa815a8778925340e8e4c49bd3',
 'fill-in-the-blank.json':'1dfeecebe8dcfede51a507a196c95396ba2d04a516ab830c4615bcfd6b4871b5',
 'flashcards.json':'1f1daf9f71015463e8873f4f411d042145d99a383a994458855971164ed8f022',
 'manifest.json':'092b4b41a574d031d2d6b92841978ae92d099b1e7af8aa7fc8f86ddb9b257039',
};
test('all five JSON files retain the latest authored bytes and stable records/topics',()=>{
 const editorialHashes=new Map(JSON.parse(fs.readFileSync('docs/integration/editorial-consistency-source/archive-inventory.json','utf8')).installedFiles.map(entry=>[entry.targetPath,entry.sha256]));
 for(const [file,hash] of Object.entries(hashes)){const target=`data/learn/digestive-study-tools/${file}`;assert.equal(createHash('sha256').update(fs.readFileSync(target)).digest('hex'),editorialHashes.get(target)??hash,file);}
 assert.deepEqual([bank.concepts.length,bank.multipleChoice.length,bank.fillInTheBlank.length,bank.flashcards.length,bank.manifest.topics.length],[194,111,55,101,12]);
 const records=[...bank.concepts,...bank.multipleChoice,...bank.fillInTheBlank,...bank.flashcards];assert.equal(new Set(records.map(record=>record.id)).size,461);
 assert.deepEqual(unresolvedReferences,[]);const refs=new Set();for(const record of records)for(const ref of record.sourceRefs){const target=sourceTarget(ref,articles,'/learn/digestive');assert.ok(target);assert.equal(target.href,`/learn/digestive#${ref.articleId}-${ref.sectionId}`);refs.add(target.href);}assert.equal(refs.size,29);
});
test('schema and referential checks fail explicitly without filtering records or inventing sources',()=>{
 const altered=patch=>{const value=structuredClone(bank);patch(value);return value;};
 for(const mutate of [b=>b.concepts.push(b.concepts[0]),b=>b.concepts[0].id=b.concepts[1].id,b=>b.multipleChoice[0].correctChoiceId='missing',b=>b.flashcards[0].conceptIds=['missing'],b=>b.fillInTheBlank[0].prompt='No blank',b=>b.fillInTheBlank[0].hint='',b=>b.concepts[0].topicId='missing',b=>b.multipleChoice[0].choices[0].text=b.multipleChoice[0].choices[1].text,b=>b.concepts[0].sourceRefs[0].slideReferences={'unknown.pptx':[1]}])assert.throws(()=>validateStudyBank(altered(mutate),articles),/Study content validation/);
 const unresolved=validateStudyBank(altered(b=>{b.concepts[0].sourceRefs[0].sectionId='missing-section';}),articles);assert.equal(unresolved.bank.concepts.length,194);assert.deepEqual(unresolved.unresolvedReferences,['digestive-system-deep-dive/missing-section']);
 assert.equal(sourceTarget({articleId:'missing',sectionId:'missing'},articles,'/learn/digestive'),null);
});
test('all twelve exact topics filter every activity with accurate counts and full coverage',()=>{
 for(const key of ['concepts','multipleChoice','fillInTheBlank','flashcards']){
  assert.equal(byTopic(bank[key],'all').length,bank[key].length);let count=0;
  for(const topic of bank.manifest.topics){const rows=byTopic(bank[key],topic.id);assert.ok(rows.length);assert.ok(rows.every(row=>row.topicId===topic.id));count+=rows.length;}assert.equal(count,bank[key].length);
 }
});
test('quiz sessions shuffle questions and answer IDs once, preserve source records and score by ID',()=>{
 let seed=91;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const before=JSON.stringify(bank.multipleChoice);
 const session=createQuizSession(bank.multipleChoice,20,random),snapshot=JSON.stringify(session);assert.equal(session.length,20);assert.equal(new Set(session.map(item=>item.id)).size,20);
 const positions=new Set();for(const item of session){const question=bank.multipleChoice.find(q=>q.id===item.id);positions.add(item.choiceIds.indexOf(question.correctChoiceId));assert.equal(isCorrectChoice(question,question.correctChoiceId),true);assert.equal(isCorrectChoice(question,'c4'),false);assert.deepEqual([...item.choiceIds].sort(),question.choices.map(c=>c.id).sort());}
 assert.ok(positions.size>1);assert.equal(JSON.stringify(session),snapshot);assert.equal(JSON.stringify(bank.multipleChoice),before);
 assert.equal(createQuizSession(bank.multipleChoice,10,random).length,10);assert.equal(createQuizSession(bank.multipleChoice,'all',random).length,111);assert.equal(createQuizSession(bank.multipleChoice.slice(0,3),20,random).length,3);
});
test('fill grading accepts only authored alternatives after conservative normalization',()=>{
 for(const question of bank.fillInTheBlank){assert.equal(question.prompt.split('_____').length,2);for(const answer of [question.answer,...question.acceptedAnswers])assert.ok(isAcceptedAnswer(question,`  ${answer.toUpperCase()}  `),question.id);assert.equal(isAcceptedAnswer(question,'vaguely similar digestive answer'),false);assert.equal(isAcceptedAnswer(question,''),false);}
 assert.equal(normalizeAnswer('  Peyer’s!  '),'peyers');assert.equal(normalizeAnswer(' portal   vein. '),'portal vein');assert.notEqual(normalizeAnswer('1.5'),normalizeAnswer('1-5'));assert.notEqual(normalizeAnswer('1.5'),normalizeAnswer('15'));
 const q=bank.fillInTheBlank.find(q=>q.id==='fib-011');assert.ok(isAcceptedAnswer(q,'Wharton'));assert.equal(isAcceptedAnswer(q,'Wharton like gland'),false);
});
test('glossary searches aliases and definition text and browses alphabetically within topics',()=>{
 const all=findConcepts(bank.concepts,'all','');assert.equal(all.length,194);assert.ok(all[0].term.localeCompare(all.at(-1).term,'en',{sensitivity:'base'})<0);
 const concept=bank.concepts.find(c=>c.aliases.includes('GI tract'));assert.ok(findConcepts(bank.concepts,'all','gi tract').some(c=>c.id===concept.id));assert.ok(findConcepts(bank.concepts,'all','continuous alimentary canal').some(c=>c.id===concept.id));
 assert.ok(findConcepts(bank.concepts,'all','','A').every(c=>c.term.toUpperCase().startsWith('A')));assert.ok(findConcepts(bank.concepts,'oral','').every(c=>c.topicId==='oral'));
});
const memoryStorage=()=>{const records=new Map([['human-atlas-theme','dark'],['notes-sentinel','keep']]);return{records,getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)};};
test('separate persistent progress counts outcomes, hints, reveals, assisted answers and card reviews across reopen',()=>{
 const storage=memoryStorage(),store=createStudyProgressStore('digestive',storage);
 store.answerMultipleChoice('mc-001',true);store.answerMultipleChoice('mc-001',false);store.fillEvent('fib-001','hint');store.fillEvent('fib-001','incorrect');store.fillEvent('fib-001','revealed');store.fillEvent('fib-001','assisted');store.markCard('fc-001','needs-review');store.markCard('fc-001','known');
 const next=createStudyProgressStore('digestive',storage).getSnapshot().progress;
 assert.deepEqual([next.multipleChoice['mc-001'].attempts,next.multipleChoice['mc-001'].correct,next.multipleChoice['mc-001'].incorrect],[2,1,1]);assert.ok(Date.parse(next.multipleChoice['mc-001'].lastAttemptedAt));
 assert.deepEqual([next.fillInTheBlank['fib-001'].correct,next.fillInTheBlank['fib-001'].reveals,next.fillInTheBlank['fib-001'].hints,next.fillInTheBlank['fib-001'].assisted],[0,1,1,1]);assert.equal(next.flashcards['fc-001'].status,'known');assert.equal(next.flashcards['fc-001'].reviews,2);
 store.reset();assert.equal(storage.getItem(store.key),null);assert.equal(storage.getItem('notes-sentinel'),'keep');assert.equal(storage.getItem('human-atlas-theme'),'dark');
});
test('blocked or malformed storage reports errors while preserving usable session progress',()=>{
 const storage={getItem:()=>null,setItem:()=>{throw Error('quota');},removeItem:()=>{throw Error('blocked');}},store=createStudyProgressStore('digestive',storage);
 store.answerMultipleChoice('mc-001',true);store.answerMultipleChoice('mc-001',false);assert.equal(store.getSnapshot().progress.multipleChoice['mc-001'].attempts,2);assert.match(store.getSnapshot().error,/could not be saved/);store.reset();assert.match(store.getSnapshot().error,/could not be reset/);
 const malformed=createStudyProgressStore('digestive',{...storage,getItem:()=>'{broken'});assert.match(malformed.getSnapshot().error,/could not be read/);
});
