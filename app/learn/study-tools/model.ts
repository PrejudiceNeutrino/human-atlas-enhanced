import type { FillQuestion, MultipleChoiceQuestion, StudyConcept, StudySourceRef } from './types';

export function shuffled<T>(items:readonly T[], random:()=>number=Math.random):T[] {
  const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
}
export const byTopic=<T extends {topicId:string}>(items:readonly T[],topic:string):T[]=>items.filter(item=>topic==='all'||item.topicId===topic);
export function createQuizSession(questions:readonly MultipleChoiceQuestion[],size:number|'all',random:()=>number=Math.random){
  return shuffled(questions,random).slice(0,size==='all'?questions.length:size).map(question=>({id:question.id,choiceIds:shuffled(question.choices.map(choice=>choice.id),random)}));
}
export const isCorrectChoice=(question:MultipleChoiceQuestion,id:string)=>question.correctChoiceId===id;
// Retain word boundaries and numeric meaning: no fuzzy, substring or AI grading.
export const normalizeAnswer=(value:string)=>value.normalize('NFKC').toLocaleLowerCase('en').trim().replace(/[’']/gu,'').replace(/[^\p{L}\p{N}\s]/gu,(mark,index,all:string)=>/[.\-+/,]/u.test(mark)&&/\d/u.test(all[index+1]??'')&&(/\d/u.test(all[index-1]??'')||/[+-]/u.test(mark))?mark:' ').replace(/\s+/gu,' ').trim();
export const isAcceptedAnswer=(question:FillQuestion,value:string)=>!!normalizeAnswer(value)&&[question.answer,...question.acceptedAnswers].some(answer=>normalizeAnswer(answer)===normalizeAnswer(value));
const alphabet=new Intl.Collator('en',{sensitivity:'base'});
export function findConcepts(concepts:readonly StudyConcept[],topic:string,search:string,letter='all'){
  const query=search.trim().toLocaleLowerCase('en');return byTopic(concepts,topic).filter(concept=>(letter==='all'||concept.term[0].toLocaleUpperCase('en')===letter)&&(!query||[concept.term,concept.definition,...concept.aliases].some(text=>text.toLocaleLowerCase('en').includes(query)))).sort((a,b)=>alphabet.compare(a.term,b.term)||a.id.localeCompare(b.id));
}
export interface ArticleTarget { id:string; title:string; sections:{id:string;title:string}[] }
export function sourceTarget(ref:StudySourceRef,articles:Record<string,ArticleTarget>,route:string){
  const article=articles[ref.articleId],section=article?.sections.find(section=>section.id===ref.sectionId);
  return article&&section?{href:`${route}#${article.id}-${section.id}`,label:`${article.title}: ${section.title}`} : null;
}
