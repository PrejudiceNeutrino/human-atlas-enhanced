/** Suggested TypeScript contracts for integrating the supplied study data. */
export type StudyTopicId =
  | 'foundations' | 'gut-wall' | 'oral' | 'swallowing' | 'stomach'
  | 'gastric-regulation' | 'hormones' | 'small-intestine' | 'pancreas'
  | 'hepatobiliary' | 'colon' | 'conditions';

export interface StudySourceRef {
  articleId: string;
  sectionId: string;
  /** Slide numbers inherited from the existing course article's metadata. */
  slideReferences: Record<string, number[]>;
}
export interface StudyConcept {
  id: string;
  term: string;
  definition: string;
  aliases: string[];
  topicId: StudyTopicId;
  sourceRefs: StudySourceRef[];
  relatedConceptIds: string[];
}
export interface StudyChoice {
  id: string;
  text: string;
}
export interface StudyMultipleChoiceQuestion {
  id: string;
  type: 'multiple-choice';
  topicId: StudyTopicId;
  stem: string;
  choices: StudyChoice[];
  correctChoiceId: string;
  explanation: string;
  conceptIds: string[];
  sourceRefs: StudySourceRef[];
  cognitiveLevel: 'application' | 'recall';
}
export interface StudyFillInBlankQuestion {
  id: string;
  type: 'fill-in-blank';
  topicId: StudyTopicId;
  prompt: string; // Exactly one _____ token, replaced by input in the UI.
  answer: string;
  acceptedAnswers: string[];
  hint: string;
  explanation: string;
  conceptIds: string[];
  sourceRefs: StudySourceRef[];
  answerNormalization: 'case-whitespace-punctuation';
}
export interface StudyFlashcard {
  id: string;
  topicId: StudyTopicId;
  front: string;
  back: string;
  conceptIds: string[];
  sourceRefs: StudySourceRef[];
}
export interface StudyFile<T> {
  schemaVersion: 1;
  subjectId: 'digestive';
  [key: string]: unknown; // contents live under 'concepts', 'questions', or 'cards'
}
