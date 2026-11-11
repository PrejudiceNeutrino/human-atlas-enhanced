import concepts from '../../../data/learn/respiratory-study-tools/concepts.json';
import multipleChoice from '../../../data/learn/respiratory-study-tools/multiple-choice.json';
import fillInTheBlank from '../../../data/learn/respiratory-study-tools/fill-in-the-blank.json';
import flashcards from '../../../data/learn/respiratory-study-tools/flashcards.json';
import manifest from '../../../data/learn/respiratory-study-tools/manifest.json';
import { articles } from '../content';
import { validateStudyBank } from './validation';

// Imported only by the lazy Study Tools chunk. No geometry or preview runtime.
for(const dataset of [concepts,multipleChoice,fillInTheBlank,flashcards]){
  if(dataset.schemaVersion!==manifest.schemaVersion||dataset.subjectId!==manifest.subjectId)throw new Error('Study content dataset metadata does not match its manifest.');
}
export const {bank:studyBank,unresolvedReferences}=validateStudyBank({manifest,concepts:concepts.concepts,multipleChoice:multipleChoice.questions,fillInTheBlank:fillInTheBlank.questions,flashcards:flashcards.cards},articles);
