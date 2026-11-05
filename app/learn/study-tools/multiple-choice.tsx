import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createQuizSession, isCorrectChoice } from './model';
import type { MultipleChoiceQuestion } from './types';
import { useStudyProgress, type StudyProgressStore } from './progress';
import { EmptyStudy, SessionNavigation, SourceLinks } from './shared';
import { AnswerKey, useAnswerKey } from './answer-key';

export function MultipleChoice({questions,store,route}:{questions:MultipleChoiceQuestion[];store:StudyProgressStore;route:string}){
  const key=useAnswerKey();
  const [size,setSize]=useState<number|'all'>(10),[session,setSession]=useState<ReturnType<typeof createQuizSession>|null>(null),[index,setIndex]=useState(0),[selected,setSelected]=useState(''),[answers,setAnswers]=useState<Record<string,{choiceId:string;correct:boolean}>>({}),[finished,setFinished]=useState(false);
  const map=useMemo(()=>new Map(questions.map(question=>[question.id,question])),[questions]),heading=useRef<HTMLHeadingElement>(null);
  const {progress}=useStudyProgress(store),submitted=useRef(new Set<string>());
  const continueButton=useRef<HTMLButtonElement>(null);
  const currentAnswer=session?answers[session[index]?.id]:undefined;
  const missedBefore=questions.filter(question=>progress.multipleChoice[question.id]?.lastOutcome==='incorrect');
  useLayoutEffect(()=>{if(!heading.current?.closest('[hidden]'))heading.current?.focus({preventScroll:true});},[session,finished]);
  useLayoutEffect(()=>{
    if(!currentAnswer||finished||continueButton.current?.closest('[hidden]'))return;
    continueButton.current?.focus({preventScroll:true});
  },[currentAnswer,finished]);
  useLayoutEffect(()=>{if(!heading.current?.closest('[hidden]')&&session&&!currentAnswer)heading.current?.scrollIntoView?.({block:'start',behavior:'instant'});},[index,session,currentAnswer]);
  const start=(pool=questions,limit:number|'all'=size)=>{key.close();submitted.current.clear();setSession(createQuizSession(pool,limit));setIndex(0);setSelected('');setAnswers({});setFinished(false);};
  const move=(next:number)=>{setIndex(next);setSelected('');heading.current?.focus({preventScroll:true});};
  if(!questions.length)return <EmptyStudy>No multiple-choice questions are available for this topic.</EmptyStudy>;
  const controls=<div className="study-mc-controls"><select aria-label="Questions per session" value={size} onChange={event=>setSize(event.target.value==='all'?'all':Number(event.target.value))}><option value="10">10 questions</option><option value="20">20 questions</option><option value="all">All {questions.length} questions</option></select><button type="button" onClick={()=>start()}>New randomized session</button><button type="button" disabled={!missedBefore.length} onClick={()=>start(missedBefore,'all')}>Review missed ({missedBefore.length})</button><button type="button" ref={key.trigger} aria-expanded={key.isOpen} aria-controls="study-multiple-choice-answer-key" onClick={key.toggle}>{key.isOpen?'Hide key':'View key'}</button></div>;
  if(key.isOpen)return <div className="study-multiple-choice">{controls}<AnswerKey kind="multiple-choice" questions={questions} route={route} onClose={key.close}/></div>;
  if(!session)return <div className="study-multiple-choice">{controls}<div className="study-panel study-mc-start-panel"><div><h3 ref={heading} id="study-multiple-choice-heading" tabIndex={-1}>Multiple Choice</h3><p>{questions.length} questions available. Start a randomized session or revisit questions you previously missed.</p></div><button className="study-primary" type="button" onClick={()=>start()}>Start session</button></div></div>;
  const correct=session.filter(item=>answers[item.id]?.correct).length,answered=session.filter(item=>answers[item.id]).length;
  if(finished){const missed=session.filter(item=>!answers[item.id]?.correct).map(item=>map.get(item.id)!);
    return <div className="study-multiple-choice">{controls}<div className="study-panel" role="region" aria-label="Multiple choice results"><h3 ref={heading} id="study-multiple-choice-heading" tabIndex={-1}>Session results</h3><p className="study-score">{correct} / {session.length} correct</p><p>{answered} answered · {session.length-answered} unanswered</p><div className="study-actions"><button className="study-primary" type="button" disabled={!missed.length} onClick={()=>start(missed,'all')}>Review missed questions ({missed.length})</button><button type="button" onClick={()=>{setSession(null);setFinished(false);}}>New session</button></div></div></div>;
  }
  const item=session[index],question=map.get(item.id)!,answer=answers[item.id];
  const advance=()=>{if(index===session.length-1)setFinished(true);else move(index+1);};
  const submit=()=>{if(answer||!selected||submitted.current.has(question.id))return;submitted.current.add(question.id);const correct=isCorrectChoice(question,selected);setAnswers(previous=>({...previous,[question.id]:{choiceId:selected,correct}}));store.answerMultipleChoice(question.id,correct);};
  return <div className="study-multiple-choice">{controls}<div className="study-panel"><div className="study-session-heading"><h3 ref={heading} id="study-multiple-choice-heading" tabIndex={-1}>Multiple Choice</h3><span>{correct} correct · {answered}/{session.length} answered</span></div><progress aria-label="Multiple choice session progress" value={answered} max={session.length}/>
    <form onSubmit={event=>{event.preventDefault();submit();}}><fieldset className="study-choices"><legend>{question.stem}</legend>{item.choiceIds.map((id,position)=>{const choice=question.choices.find(choice=>choice.id===id)!;return <label key={id} className="study-choice" data-correct={answer&&id===question.correctChoiceId||undefined} data-incorrect={answer&&id===answer.choiceId&&!answer.correct||undefined}><input type="radio" name="study-mc-answer" value={id} checked={(answer?.choiceId??selected)===id} disabled={!!answer} onChange={()=>setSelected(id)}/><span className="study-choice-letter" aria-hidden="true">{String.fromCharCode(65+position)}</span><span>{choice.text}{answer&&id===question.correctChoiceId&&<strong className="study-answer-label">Correct answer</strong>}</span></label>;})}</fieldset>
      <div className="study-actions">{answer?<button ref={continueButton} className="study-primary" type="button" onClick={advance}>{index===session.length-1?'View results':'Next question'}</button>:<button className="study-primary" type="submit" disabled={!selected}>Submit answer</button>}<button type="button" onClick={()=>setFinished(true)}>Finish session</button></div>
    </form>
    <div className="study-answer-followup">{answer&&<div className="study-feedback" role="status" data-outcome={answer.correct?'correct':'incorrect'}><strong>{answer.correct?'Correct.':'Not quite.'}</strong><p>{question.explanation}</p><SourceLinks refs={question.sourceRefs} route={route}/></div>}
    <SessionNavigation index={index} total={session.length} onPrevious={()=>move(index-1)} onNext={advance}/></div>
  </div></div>;
}
