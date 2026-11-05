// Adapted from the supplied contracts; educational IDs remain independent of mesh IDs.
export interface StudySourceRef { articleId:string; sectionId:string; slideReferences:Record<string,number[]> }
export interface StudyRecord { id:string; topicId:string; sourceRefs:StudySourceRef[] }
export interface StudyConcept extends StudyRecord { term:string; definition:string; aliases:string[]; relatedConceptIds:string[] }
export interface StudyChoice { id:string; text:string }
export interface MultipleChoiceQuestion extends StudyRecord {
  type:'multiple-choice'; stem:string; choices:StudyChoice[]; correctChoiceId:string;
  explanation:string; conceptIds:string[]; cognitiveLevel:'application'|'recall';
}
export interface FillQuestion extends StudyRecord {
  type:'fill-in-blank'; prompt:string; answer:string; acceptedAnswers:string[]; hint:string;
  explanation:string; conceptIds:string[]; answerNormalization:'case-whitespace-punctuation';
}
export interface Flashcard extends StudyRecord { front:string; back:string; conceptIds:string[] }
export interface StudyManifest {
  kind:'human-atlas-study-tools'; schemaVersion:1; subjectId:string; title:string; curriculum:string;
  topics:{id:string;label:string;sortOrder:number}[];
  counts:{concepts:number;multipleChoice:number;fillInTheBlank:number;flashcards:number};
}
export interface StudyBank { manifest:StudyManifest; concepts:StudyConcept[]; multipleChoice:MultipleChoiceQuestion[]; fillInTheBlank:FillQuestion[]; flashcards:Flashcard[] }
export type Activity = 'multiple-choice'|'fill-in-the-blank'|'glossary'|'flashcards';
