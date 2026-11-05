import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { isAcceptedAnswer, shuffled } from './model';
import type { FillQuestion } from './types';
import type { StudyProgressStore } from './progress';
import { EmptyStudy, SessionNavigation, SourceLinks } from './shared';
import { AnswerKey, useAnswerKey } from './answer-key';

interface Recall { value:string;status:'correct'|'incorrect'|'revealed'|null;hint:boolean;hintLogged:boolean;revealed:boolean }
const blank=():Recall=>({value:'',status:null,hint:false,hintLogged:false,revealed:false});
export function FillInTheBlank({questions,store,route}:{questions:FillQuestion[];store:StudyProgressStore;route:string}){
  const key=useAnswerKey();
  const [ids,setIds]=useState(()=>shuffled(questions.map(question=>question.id))),[index,setIndex]=useState(0),[responses,setResponses]=useState<Record<string,Recall>>({}),[finished,setFinished]=useState(false),input=useRef<HTMLInputElement>(null);
  const map=useMemo(()=>new Map(questions.map(question=>[question.id,question])),[questions]);
  const root=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{if(root.current?.closest('[hidden]'))return;const target=finished?root.current?.querySelector<HTMLElement>('h3'):input.current;target?.focus({preventScroll:true});},[index,finished]);
  const start=(pool=questions)=>{setIds(shuffled(pool.map(question=>question.id)));setIndex(0);setResponses({});setFinished(false);};
  if(!ids.length)return <EmptyStudy>No fill-in-the-blank questions are available for this topic.</EmptyStudy>;
  const keyControls=<div className="study-key-tools"><button type="button" ref={key.trigger} aria-expanded={key.isOpen} aria-controls="study-fill-in-the-blank-answer-key" onClick={key.toggle}>{key.isOpen?'Hide full key':'Reveal full key'}</button></div>;
  if(key.isOpen)return <div>{keyControls}<AnswerKey kind="fill-in-the-blank" questions={questions} route={route} onClose={key.close}/></div>;
  const recalled=ids.filter(id=>responses[id]?.status==='correct'&&!responses[id]?.revealed).length,attempted=ids.filter(id=>responses[id]?.status).length,reveals=ids.filter(id=>responses[id]?.revealed).length;
  if(finished){const missed=ids.filter(id=>responses[id]?.status!=='correct'||responses[id]?.revealed).map(id=>map.get(id)!);
    return <div>{keyControls}<div ref={root} className="study-panel" role="region" aria-label="Fill in the blank results"><h3 id="study-fill-in-the-blank-heading" tabIndex={-1}>Recall results</h3><p className="study-score">{recalled} / {ids.length} recalled without revealing</p><p>{reveals} revealed · {ids.length-attempted} unanswered</p><div className="study-actions"><button className="study-primary" type="button" disabled={!missed.length} onClick={()=>start(missed)}>Review missed or unanswered ({missed.length})</button><button type="button" onClick={()=>start()}>New recall session</button></div></div></div>;
  }
  const question=map.get(ids[index])!,response=responses[question.id]??blank(),[before,after]=question.prompt.split('_____');
  const update=(patch:Partial<Recall>)=>setResponses(previous=>({...previous,[question.id]:{...(previous[question.id]??blank()),...patch}}));
  const check=()=>{if(!response.value.trim()||response.status)return;const correct=isAcceptedAnswer(question,response.value);update({status:correct?'correct':'incorrect'});store.fillEvent(question.id,correct?(response.revealed?'assisted':'correct'):'incorrect');};
  const hint=()=>{if(!response.hint&&!response.hintLogged)store.fillEvent(question.id,'hint');update({hint:!response.hint,hintLogged:true});};
  const reveal=()=>{if(response.status==='revealed')return;update({status:'revealed',revealed:true});store.fillEvent(question.id,'revealed');};
  const move=(next:number)=>{setIndex(next);input.current?.focus({preventScroll:true});};
  return <div>{keyControls}<div ref={root} className="study-panel"><div className="study-session-heading"><h3 id="study-fill-in-the-blank-heading" tabIndex={-1}>Fill in the Blank</h3><span>{recalled} recalled · {attempted}/{ids.length} attempted</span></div><progress aria-label="Recall session progress" value={attempted} max={ids.length}/>
    <form onSubmit={event=>{event.preventDefault();check();}}><label className="study-fill-prompt"><span>{before}</span><input ref={input} aria-label="Missing word or phrase" value={response.value} onChange={event=>update({value:event.target.value})} disabled={!!response.status} autoComplete="off" spellCheck={false}/><span>{after}</span></label>
      <div className="study-actions"><button className="study-primary" type="submit" disabled={!response.value.trim()||!!response.status}>Check Answer</button>{response.status&&<button type="button" onClick={()=>{update({value:'',status:null,hint:false,hintLogged:false});requestAnimationFrame(()=>input.current?.focus());}}>Retry</button>}<button type="button" aria-pressed={response.hint} onClick={hint}>{response.hint?'Hide Hint':'Hint'}</button><button type="button" disabled={response.status==='revealed'||response.status==='correct'} onClick={reveal}>Reveal Answer</button><button type="button" onClick={()=>setFinished(true)}>Review session</button></div>
    </form>
    {response.hint&&<aside className="study-hint"><strong>Hint</strong><p>{question.hint}</p></aside>}
    {response.status&&<div className="study-feedback" role="status" data-outcome={response.status==='correct'&&!response.revealed?'correct':'incorrect'}><strong>{response.status==='revealed'?'Answer revealed':response.status==='correct'?(response.revealed?'Correct after revealing — not counted as independent recall.':'Correct.'):'Not quite. Retry or reveal the answer.'}</strong>{response.status==='revealed'&&<p className="study-revealed-answer">{question.answer}</p>}<p>{question.explanation}</p><SourceLinks refs={question.sourceRefs} route={route}/></div>}
    <SessionNavigation index={index} total={ids.length} lastLabel="View recall results" onPrevious={()=>move(index-1)} onNext={()=>{if(index===ids.length-1)setFinished(true);else move(index+1);}}/>
  </div></div>;
}
