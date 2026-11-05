import { useSyncExternalStore } from 'react';
export const studyProgressKey=(subjectId:string)=>`human-atlas-study-progress:v1:${subjectId}`;
export interface QuestionProgress { attempts:number; correct:number; incorrect:number; lastAttemptedAt:string|null; lastOutcome:'correct'|'incorrect'|'assisted'|'revealed'|null }
export interface FillProgress extends QuestionProgress { hints:number; reveals:number; assisted:number }
export interface CardProgress { status:'known'|'needs-review'; reviews:number; lastReviewedAt:string }
export interface StudyProgress { version:1; subjectId:string; multipleChoice:Record<string,QuestionProgress>; fillInTheBlank:Record<string,FillProgress>; flashcards:Record<string,CardProgress> }
const empty=(subjectId:string):StudyProgress=>({version:1,subjectId,multipleChoice:{},fillInTheBlank:{},flashcards:{}});
const blankQuestion=():QuestionProgress=>({attempts:0,correct:0,incorrect:0,lastAttemptedAt:null,lastOutcome:null});
const safeId=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const count=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>=0;
function loadProgress(raw:string|null,subjectId:string):StudyProgress {
  if(!raw)return empty(subjectId);const value=JSON.parse(raw) as StudyProgress;
  if(value.version!==1||value.subjectId!==subjectId)throw new Error('Unsupported study progress.');
  for(const kind of ['multipleChoice','fillInTheBlank','flashcards'] as const){
    const entries=value[kind];if(!entries||typeof entries!=='object'||Array.isArray(entries))throw new Error('Invalid study progress.');
    for(const [id,record] of Object.entries(entries)){
      if(!safeId.test(id)||!record||typeof record!=='object')throw new Error('Invalid study progress record.');
      if(kind==='flashcards'){const card=record as CardProgress;if(!['known','needs-review'].includes(card.status)||!count(card.reviews)||!Number.isFinite(Date.parse(card.lastReviewedAt)))throw new Error('Invalid card progress.');}
      else{const question=record as FillProgress;if(!count(question.attempts)||!count(question.correct)||!count(question.incorrect)||(question.lastAttemptedAt!==null&&!Number.isFinite(Date.parse(question.lastAttemptedAt)))||![null,'correct','incorrect','assisted','revealed'].includes(question.lastOutcome))throw new Error('Invalid answer progress.');
        if(kind==='fillInTheBlank'&&(!count(question.hints)||!count(question.reveals)||!count(question.assisted)))throw new Error('Invalid recall progress.');
      }
    }
  }
  return value;
}
export function createStudyProgressStore(subjectId:string,storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>|undefined){
  const key=studyProgressKey(subjectId),listeners=new Set<()=>void>();
  let snapshot:{progress:StudyProgress;error:string}={progress:empty(subjectId),error:''};
  const read=()=>{try{snapshot={progress:loadProgress(storage?.getItem(key)??null,subjectId),error:storage?'':'Browser storage is unavailable. Progress lasts only for this session.'};}catch{snapshot={...snapshot,error:'Stored study progress could not be read. Progress lasts only for this session until storage is available or you reset it.'};}};
  read();const emit=()=>listeners.forEach(listener=>listener());
  const update=(change:(progress:StudyProgress)=>void)=>{
    // Merge the latest same-origin snapshot before changing this subject's key.
    let progress=snapshot.progress;try{if(storage&&!snapshot.error)progress=loadProgress(storage.getItem(key),subjectId);}catch{/* Preserve the current session if storage is blocked. */}
    const next=structuredClone(progress);change(next);let error='';
    try{if(!storage)throw new Error('unavailable');storage.setItem(key,JSON.stringify(next));}catch{error='Study progress could not be saved. This session still works; changes may be lost on refresh.';}
    snapshot={progress:next,error};emit();
  };
  return{
    key,getSnapshot:()=>snapshot,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
    refresh:()=>{read();emit();},
    answerMultipleChoice:(id:string,correct:boolean)=>update(progress=>{const before=progress.multipleChoice[id]??blankQuestion();progress.multipleChoice[id]={...before,attempts:before.attempts+1,correct:before.correct+Number(correct),incorrect:before.incorrect+Number(!correct),lastOutcome:correct?'correct':'incorrect',lastAttemptedAt:new Date().toISOString()};}),
    fillEvent:(id:string,event:'correct'|'incorrect'|'assisted'|'hint'|'revealed')=>update(progress=>{
      const before=progress.fillInTheBlank[id]??{...blankQuestion(),hints:0,reveals:0,assisted:0};
      progress.fillInTheBlank[id]={...before,attempts:before.attempts+Number(!['hint','revealed'].includes(event)),correct:before.correct+Number(event==='correct'),incorrect:before.incorrect+Number(event==='incorrect'),hints:before.hints+Number(event==='hint'),reveals:before.reveals+Number(event==='revealed'),assisted:before.assisted+Number(event==='assisted'),lastOutcome:event==='hint'?before.lastOutcome:event,lastAttemptedAt:event==='hint'?before.lastAttemptedAt:new Date().toISOString()};
    }),
    markCard:(id:string,status:CardProgress['status'])=>update(progress=>{progress.flashcards[id]={status,reviews:(progress.flashcards[id]?.reviews??0)+1,lastReviewedAt:new Date().toISOString()};}),
    reset:()=>{try{if(!storage)throw new Error('unavailable');storage.removeItem(key);snapshot={progress:empty(subjectId),error:''};}catch{snapshot={...snapshot,error:'Study progress could not be reset because browser storage is unavailable.'};}emit();},
  };
}
export type StudyProgressStore=ReturnType<typeof createStudyProgressStore>;
export function useStudyProgress(store:StudyProgressStore){return useSyncExternalStore(store.subscribe,store.getSnapshot);}
