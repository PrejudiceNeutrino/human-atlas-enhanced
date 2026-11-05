import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { FillQuestion, MultipleChoiceQuestion } from './types';
import { SourceLinks } from './shared';

export function useAnswerKey(){
  const [isOpen,setIsOpen]=useState(false),trigger=useRef<HTMLButtonElement>(null),previous=useRef(false);
  useLayoutEffect(()=>{if(previous.current&&!isOpen)trigger.current?.focus();previous.current=isOpen;},[isOpen]);
  return{isOpen,trigger,toggle:()=>setIsOpen(value=>!value),close:()=>setIsOpen(false)};
}

export function AnswerKey({kind,questions,route,onClose}:{kind:'multiple-choice'|'fill-in-the-blank';questions:readonly (MultipleChoiceQuestion|FillQuestion)[];route:string;onClose:()=>void}){
  const heading=useRef<HTMLHeadingElement>(null),title=kind==='multiple-choice'?'Multiple Choice':'Fill in the Blank';
  useLayoutEffect(()=>{if(heading.current?.closest('[hidden]'))return;heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView?.({block:'start',behavior:'instant'});},[]);
  return <section className="study-panel study-answer-key" id={`study-${kind}-answer-key`} aria-labelledby={`study-${kind}-heading`}>
    <header className="study-key-header"><div><h3 ref={heading} id={`study-${kind}-heading`} tabIndex={-1}>{title} — Answer Key</h3><p>{questions.length} questions · All questions for the selected topic</p></div><button type="button" onClick={onClose}><ArrowLeft size={16} aria-hidden="true"/>Back to practice</button></header>
    <p className="study-key-description">Review the full key without changing your score or saved progress.{kind==='multiple-choice'?' Correct answers are marked; answer positions are shuffled in practice sessions.':''}</p>
    <ol className="study-key-list">{questions.map((question,index)=><li key={question.id} data-question-id={question.id}>
      <article aria-labelledby={`study-key-${question.id}`}>
        <h4 id={`study-key-${question.id}`}><span className="study-key-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><span className="study-key-question">{question.type==='multiple-choice'?question.stem:<>{question.prompt.split('_____')[0]}<mark>{question.answer}</mark>{question.prompt.split('_____')[1]}</>}</span></h4>
        {question.type==='multiple-choice'?<ul className="study-key-choices">{question.choices.map(choice=><li key={choice.id} data-choice-id={choice.id} data-correct={choice.id===question.correctChoiceId||undefined}><span className="study-key-choice-text">{choice.text}</span>{choice.id===question.correctChoiceId&&<strong className="study-key-correct"><Check size={14} aria-hidden="true"/>Correct answer</strong>}</li>)}</ul>:<>
          {question.acceptedAnswers.length>0&&<p className="study-key-alternatives"><strong>Also accepted:</strong> {question.acceptedAnswers.map((answer,index)=><span key={answer}>{index>0?' · ':''}{answer}</span>)}</p>}
        </>}
        <p className="study-key-explanation">{question.explanation}</p><SourceLinks refs={question.sourceRefs} route={route}/>
      </article>
    </li>)}</ol>
    <div className="study-key-footer"><span>End of key · {questions.length} questions</span><button type="button" onClick={onClose}>Back to practice</button></div>
  </section>;
}
