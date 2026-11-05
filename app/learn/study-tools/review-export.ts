import type { StudyBank } from './types';
import type { StudyProgress } from './progress';
import { byTopic } from './model';

/** Student review report; excludes personal annotations and editorial authoring state. */
export function createStudyReviewExport(bank:StudyBank,progress:StudyProgress,topic:string,exportedAt=new Date().toISOString()){
  const multipleChoice=byTopic(bank.multipleChoice,topic).filter(question=>progress.multipleChoice[question.id]).map(question=>({questionId:question.id,stem:question.stem,topicId:question.topicId,...progress.multipleChoice[question.id],sourceRefs:question.sourceRefs}));
  const fillInTheBlank=byTopic(bank.fillInTheBlank,topic).filter(question=>progress.fillInTheBlank[question.id]).map(question=>({questionId:question.id,prompt:question.prompt,topicId:question.topicId,...progress.fillInTheBlank[question.id],sourceRefs:question.sourceRefs}));
  const flashcards=byTopic(bank.flashcards,topic).filter(card=>progress.flashcards[card.id]).map(card=>({cardId:card.id,front:card.front,topicId:card.topicId,...progress.flashcards[card.id],sourceRefs:card.sourceRefs}));
  return{kind:'human-atlas-study-review',schemaVersion:1,subjectId:bank.manifest.subjectId,topicId:topic,exportedAt,multipleChoice,fillInTheBlank,flashcards,
    reviewList:{multipleChoice:multipleChoice.filter(item=>item.lastOutcome==='incorrect').map(item=>item.questionId),fillInTheBlank:fillInTheBlank.filter(item=>item.lastOutcome!==null&&item.lastOutcome!=='correct').map(item=>item.questionId),flashcards:flashcards.filter(item=>item.status==='needs-review').map(item=>item.cardId)}};
}
