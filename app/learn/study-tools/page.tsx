import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Layers3, ListChecks, TextCursorInput, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studyBank, unresolvedReferences } from './data';
import { byTopic } from './model';
import { createStudyProgressStore, useStudyProgress } from './progress';
import { MultipleChoice } from './multiple-choice';
import { FillInTheBlank } from './fill-in-the-blank';
import { Glossary } from './glossary';
import { Flashcards } from './flashcards';
import type { Activity, StudyBank } from './types';
import { createStudyReviewExport } from './review-export';
import './study-tools.css';
import '../subject-menu.css';

const activities=[
  {id:'multiple-choice' as const,title:'Multiple Choice',unit:'questions',Icon:ListChecks,description:'Choose an answer, check your understanding, and review the explanation.'},
  {id:'fill-in-the-blank' as const,title:'Fill in the Blank',unit:'questions',Icon:TextCursorInput,description:'Recall the missing term, with hints and explanations when you need them.'},
  {id:'glossary' as const,title:'Glossary',unit:'concepts',Icon:BookOpen,description:'Find terms, definitions, related concepts, and supporting reading.'},
  {id:'flashcards' as const,title:'Flashcards',unit:'cards',Icon:Layers3,description:'Practice recall and keep track of what you know or want to review.'},
];
export function StudyToolsWorkspace({subjectTitle,route,tabId,bank:studyBank,unresolvedReferences=[]}:{subjectTitle:string;route:string;tabId:string;bank:StudyBank;unresolvedReferences?:string[]}){
  const topicControlId=useId();
  const [activity,setActivity]=useState<Activity|'overview'>('overview'),[topic,setTopic]=useState('all'),[focusedId,setFocusedId]=useState<string|null>(null),root=useRef<HTMLElement>(null),previousActivity=useRef(activity);
  const [store]=useState(()=>{let storage:Storage|undefined;try{storage=window.localStorage;}catch{/* Progress errors are visible below. */}return createStudyProgressStore(studyBank.manifest.subjectId,storage);});
  const state=useStudyProgress(store);
  const [resetVersion,setResetVersion]=useState(0);
  const [exportMessage,setExportMessage]=useState('');
  const [flashOpen,setFlashOpen]=useState(false),[flashOpened,setFlashOpened]=useState(false);
  const flashTrigger=useRef<HTMLButtonElement|null>(null);
  const visibleActivity=flashOpen?'flashcards':activity;
  const openActivity=(next:Activity|'overview',trigger:HTMLButtonElement)=>{
    if(next==='flashcards'){flashTrigger.current=trigger;setFlashOpened(true);setFlashOpen(true);}
    else setActivity(next);
  };
  useLayoutEffect(()=>{if(document.activeElement===document.body)root.current?.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});},[]);
  useEffect(()=>{const changed=(event:StorageEvent)=>{if(event.key===store.key||event.key===null)store.refresh();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[store]);
  useLayoutEffect(()=>{if(previousActivity.current===activity)return;previousActivity.current=activity;
    root.current?.querySelector<HTMLElement>(activity==='overview'?'h2':`#study-${activity}-heading`)?.focus();
  },[activity]);
  const questions=useMemo(()=>byTopic(studyBank.multipleChoice,topic),[topic]),recall=useMemo(()=>byTopic(studyBank.fillInTheBlank,topic),[topic]),cards=useMemo(()=>byTopic(studyBank.flashcards,topic),[topic]);
  const counts={'multiple-choice':questions.length,'fill-in-the-blank':recall.length,glossary:byTopic(studyBank.concepts,topic).length,flashcards:cards.length};
  const totals={'multiple-choice':studyBank.multipleChoice.length,'fill-in-the-blank':studyBank.fillInTheBlank.length,glossary:studyBank.concepts.length,flashcards:studyBank.flashcards.length};
  const topics=[...studyBank.manifest.topics].sort((a,b)=>a.sortOrder-b.sortOrder);
  const topicOptions=[{value:'all',label:'All Topics'},...topics.map(item=>({value:item.id,label:item.label}))];
  const related=(id:string)=>{setTopic('all');setFocusedId(id);setActivity('glossary');};
  const exportReview=()=>{
    const report=createStudyReviewExport(studyBank,state.progress,topic),url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),link=document.createElement('a');
    link.href=url;link.download=`${studyBank.manifest.subjectId}-study-review-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setExportMessage('Study results and review list exported. Personal Notes are not included.');
  };
  return <section className="study-tools" ref={root} data-annotation-excluded data-atlas-shortcuts="disabled" aria-labelledby={`${tabId}-heading`}>
    <header className="learn-article-header"><h2 id={`${tabId}-heading`} tabIndex={-1}>Study Tools</h2><p className="learn-reading-intro">{subjectTitle} · {studyBank.manifest.curriculum.split(' · ')[0]}</p></header>
    <div className="study-topbar"><div className="study-topic-control"><label htmlFor={topicControlId}>Topic</label><Select modal={false} items={topicOptions} value={topic} onValueChange={value=>{if(typeof value!=='string')return;setTopic(value);setFocusedId(null);setExportMessage('');}}><SelectTrigger id={topicControlId} className="study-topic-trigger" aria-label="Study topic"><SelectValue/></SelectTrigger><SelectContent className="anatomy-choice-menu study-topic-menu" data-atlas-shortcuts="disabled">{topicOptions.map(item=><SelectItem key={item.value} value={item.value} data-value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div className="study-export-control"><button type="button" onClick={exportReview} title="Download study results and a review list. Personal Notes are not included.">Export review notes</button></div><span className="study-storage-note">Progress stays in this browser, separate from your Notes.</span></div>
    <p className="study-export-status" role="status">{exportMessage}</p>
    {state.error&&<p className="study-storage-error" role="status">{state.error}</p>}
    {unresolvedReferences.length>0&&<details className="study-storage-error"><summary>{unresolvedReferences.length} source references could not be resolved</summary><ul>{unresolvedReferences.map(ref=><li key={ref}>{ref}</li>)}</ul></details>}
    <nav className="study-activity-nav" aria-label="Study activities"><button type="button" aria-current={visibleActivity==='overview'?'page':undefined} onClick={event=>openActivity('overview',event.currentTarget)}>Overview</button>{activities.map(item=><button type="button" key={item.id} aria-current={visibleActivity===item.id?'page':undefined} aria-haspopup={item.id==='flashcards'?'dialog':undefined} onClick={event=>openActivity(item.id,event.currentTarget)}>{item.title}<span>{counts[item.id]}</span></button>)}</nav>
    <div hidden={activity!=='overview'} className="study-overview-grid">{activities.map(({id,title,unit,Icon,description})=><button type="button" className="study-overview-card" key={id} aria-haspopup={id==='flashcards'?'dialog':undefined} onClick={event=>openActivity(id,event.currentTarget)}><Icon size={22} strokeWidth={1.5} aria-hidden="true"/><span className="study-overview-count">{topic==='all'?totals[id]:counts[id]} {unit}</span><strong>{title}</strong><span>{description}</span><span className="study-card-open">Open {title} <span aria-hidden="true">↗</span></span></button>)}</div>
    <div hidden={activity!=='multiple-choice'}><MultipleChoice key={`mc-${topic}-${resetVersion}`} questions={questions} store={store} route={route}/></div>
    <div hidden={activity!=='fill-in-the-blank'}><FillInTheBlank key={`fill-${topic}-${resetVersion}`} questions={recall} store={store} route={route}/></div>
    <div hidden={activity!=='glossary'}><Glossary key={`glossary-${topic}-${resetVersion}`} concepts={studyBank.concepts} topic={topic} route={route} focusedId={focusedId} onConcept={related} onClearFocus={()=>setFocusedId(null)}/></div>
    <Dialog open={flashOpen} onOpenChange={setFlashOpen}>
      <DialogContent className="learn-menu-surface study-tools study-flash-dialog" overlayClassName="learn-menu-backdrop study-flash-backdrop" showCloseButton={false} keepMounted aria-modal="true" data-annotation-excluded data-atlas-shortcuts="disabled"
        initialFocus={()=>document.querySelector<HTMLElement>('.study-flash-dialog .study-flashcard')??document.querySelector<HTMLElement>('.study-flash-dialog .study-flash-filter button')}
        finalFocus={()=>flashTrigger.current?.isConnected?flashTrigger.current:root.current?.querySelector<HTMLElement>('.study-activity-nav button')??null}
        onClick={event=>{const target=event.target as Element;const link=target.closest('a[href]');if(link&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0)setFlashOpen(false);}}>
        <DialogClose className="learn-menu-close" aria-label="Close flashcard viewer"><X size={18} aria-hidden="true"/></DialogClose>
        <div className="study-flash-dialog-header"><div className="learn-menu-eyebrow"><Layers3 size={15} aria-hidden="true"/><span>Human Atlas</span></div><DialogDescription className="study-flash-dialog-description">{subjectTitle} · {topic==='all'?'All Topics':topics.find(item=>item.id===topic)?.label}</DialogDescription></div>
        {flashOpened&&<Flashcards key={`cards-${topic}-${resetVersion}`} cards={cards} store={store} route={route} active={flashOpen} inDialog/>}
      </DialogContent>
    </Dialog>
    <footer className="study-progress-footer"><p>Saved progress is private to this browser and site address. No account or automatic sync.</p><button type="button" onClick={()=>{if(window.confirm('Reset all Study Tools progress for this subject? Your personal notes and highlights will be kept.')){store.reset();if(!store.getSnapshot().error)setResetVersion(value=>value+1);}}}>Reset Study Progress</button></footer>
  </section>;
}

export default function DigestiveStudyTools(props:{subjectTitle:string;route:string;tabId:string}){
  return <StudyToolsWorkspace {...props} bank={studyBank} unresolvedReferences={unresolvedReferences}/>;
}
