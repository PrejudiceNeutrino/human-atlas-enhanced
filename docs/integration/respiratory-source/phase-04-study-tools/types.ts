// Respiratory System Study Tools – schemaVersion 1
export interface SourceRef {
  articleId: string;
  sectionId: string;
  /** Contextual slide references inherited from the lesson section, not quote-level citations. */
  slideReferences?: Record<string, number[]>;
}
export interface Concept {
  id: string; term: string; definition: string; aliases: string[];
  topicId: string; sourceRefs: SourceRef[]; relatedConceptIds: string[];
  scopeNote?: string;
}
export interface Choice { id: string; text: string; }
export interface MultipleChoiceQuestion {
  id: string; type: 'multiple-choice'; topicId: string; stem: string;
  choices: Choice[]; correctChoiceId: string; explanation: string;
  conceptIds: string[]; sourceRefs: SourceRef[]; cognitiveLevel: string;
}
export interface FillInBlankQuestion {
  id: string; type: 'fill-in-blank'; topicId: string; prompt: string;
  answer: string; acceptedAnswers: string[]; hint: string; explanation: string;
  conceptIds: string[]; sourceRefs: SourceRef[]; answerNormalization: string;
}
export interface Flashcard {
  id: string; topicId: string; front: string; back: string;
  conceptIds: string[]; sourceRefs: SourceRef[];
}
export interface StudyTopic { id: string; label: string; sortOrder: number; }
export interface StudyToolsManifest {
  kind: 'human-atlas-study-tools'; schemaVersion: 1;
  subjectId: string; title: string; curriculum: string;
  topics: StudyTopic[];
  counts: { concepts: number; multipleChoice: number; fillInTheBlank: number; flashcards: number; topics: number };
}
