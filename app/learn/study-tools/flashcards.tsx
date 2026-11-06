import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, List, RotateCcw, Shuffle } from 'lucide-react';
import { DialogTitle } from '@/components/ui/dialog';
import { shuffled } from './model';
import type { Flashcard } from './types';
import { useStudyProgress, type StudyProgressStore } from './progress';
import { SessionNavigation, SourceLinks } from './shared';

export function Flashcards({cards,store,route,active=true,inDialog=false}:{cards:Flashcard[];store:StudyProgressStore;route:string;active?:boolean;inDialog?:boolean}){
  const {progress}=useStudyProgress(store),[deck,setDeck]=useState(()=>shuffled(cards.map(card=>card.id))),[index,setIndex]=useState(0),[flipped,setFlipped]=useState(false),[reviewOnly,setReviewOnly]=useState(false),[finished,setFinished]=useState(false),[rated,setRated]=useState<string[]>([]);
  const viewer=useRef<HTMLDivElement>(null),[autoAdvance,setAutoAdvance]=useState(false),[message,setMessage]=useState('');
  const focusNavigation=useRef(false);
  const [listOpen,setListOpen]=useState(false),listHeading=useRef<HTMLHeadingElement>(null),listToggle=useRef<HTMLButtonElement>(null),previousList=useRef(false);
  const [listFilter,setListFilter]=useState<'all'|'needs-review'>('all');
  const reviewCards=cards.filter(card=>progress.flashcards[card.id]?.status==='needs-review');
  const listedCards=listFilter==='all'?cards:reviewCards;
  useLayoutEffect(()=>{if(!active)return;if(listOpen)listHeading.current?.focus({preventScroll:true});else if(previousList.current)listToggle.current?.focus();previousList.current=listOpen;},[active,listOpen]);
  const map=useMemo(()=>new Map(cards.map(card=>[card.id,card])),[cards]);
  const start=(only=reviewOnly)=>{setListOpen(false);focusNavigation.current=true;setReviewOnly(only);setDeck(shuffled(cards.filter(card=>!only||progress.flashcards[card.id]?.status==='needs-review').map(card=>card.id)));setIndex(0);setFlipped(false);setFinished(false);setRated([]);setMessage('');};
  const restart=()=>{focusNavigation.current=true;setDeck(previous=>[...previous]);setIndex(0);setFlipped(false);setFinished(false);setRated([]);setMessage('');};
  const move=(next:number)=>{focusNavigation.current=true;setIndex(next);setFlipped(false);setMessage('');};
  const card=map.get(deck[index]);
  const advance=()=>{focusNavigation.current=true;if(index===deck.length-1)setFinished(true);else move(index+1);};
  const flip=()=>{focusNavigation.current=true;setFlipped(value=>!value);};
  const mark=(status:'known'|'needs-review')=>{if(!card||finished)return;store.markCard(card.id,status);setRated(previous=>previous.includes(card.id)?previous:[...previous,card.id]);if(autoAdvance)advance();setMessage(`Marked ${status==='known'?'Known':'Needs Review'}.${autoAdvance?' Moving to the next card.':''}`);};
  useLayoutEffect(()=>{if(!active||!focusNavigation.current||viewer.current?.closest('[hidden]'))return;focusNavigation.current=false;const target=finished?viewer.current?.querySelector<HTMLElement>('.study-empty h4'):viewer.current?.querySelector<HTMLElement>('.study-flashcard')??viewer.current?.querySelector<HTMLElement>('h3');if(target?.classList.contains('study-flashcard'))target.scrollTop=0;target?.focus({preventScroll:true});},[active,deck,index,finished,flipped]);
  const shortcut=(event:KeyboardEvent)=>{
    if(!active||listOpen||event.defaultPrevented||event.repeat||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||viewer.current?.closest('[hidden]'))return;
    if(event.shiftKey&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(event.key))return;
    const target=event.target instanceof Element?event.target:null;
    if(target?.closest('input:not([type="checkbox"]):not([type="radio"]),textarea,select,a,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"]'))return;
    const dialog=target?.closest('[role="dialog"]');
    if(dialog&&!dialog.classList.contains('study-flash-dialog'))return;
    const key=event.key.toLowerCase();
    if(key==='s'){event.preventDefault();start();return;}if(key==='r'){event.preventDefault();restart();return;}
    if(!card||finished)return;
    if(key==='arrowleft'){event.preventDefault();if(index>0)move(index-1);}
    else if(key==='arrowright'){event.preventDefault();advance();}
    else if(key==='arrowup'||key==='arrowdown'){event.preventDefault();flip();}
    else if(key==='k'){event.preventDefault();mark('known');}
    else if(key==='u'){event.preventDefault();mark('needs-review');}
    else if(event.key===' '&&!target?.closest('input')&&(!target?.closest('button')||target.closest('.study-flashcard'))){event.preventDefault();flip();}
  };
  useLayoutEffect(()=>{
    if(!active||!inDialog)return;
    // Base UI stops arrow events at the dialog popup. Capture them before that boundary.
    window.addEventListener('keydown',shortcut,true);
    return()=>window.removeEventListener('keydown',shortcut,true);
  },[active,inDialog,shortcut]);
  const status=card?progress.flashcards[card.id]?.status:undefined;
  return <div ref={viewer} className="study-panel study-flashcards" onKeyDown={inDialog?undefined:event=>shortcut(event.nativeEvent)} aria-labelledby="study-flashcards-heading" role="region"><div className="study-session-heading">{inDialog?<DialogTitle render={<h3/>} id="study-flashcards-heading" tabIndex={-1}>Flashcards</DialogTitle>:<h3 id="study-flashcards-heading" tabIndex={-1}>Flashcards</h3>}<span>{cards.filter(card=>progress.flashcards[card.id]?.status==='known').length} known · {cards.filter(card=>progress.flashcards[card.id]?.status==='needs-review').length} need review</span></div>
    <div className="study-flash-toolbar"><div className="study-flash-filter" role="group" aria-label={listOpen?'Flashcard list filter':'Flashcard deck'}><button type="button" aria-pressed={listOpen?listFilter==='all':!reviewOnly} onClick={()=>listOpen?setListFilter('all'):start(false)}>All cards ({cards.length})</button><button type="button" aria-pressed={listOpen?listFilter==='needs-review':reviewOnly} onClick={()=>listOpen?setListFilter('needs-review'):start(true)}>{listOpen?`Needs Review (${reviewCards.length})`:'Needs Review only'}</button><button ref={listToggle} type="button" aria-pressed={listOpen} aria-controls={listOpen?'study-flash-review-list':undefined} onClick={()=>{focusNavigation.current=false;if(!listOpen)setListFilter(reviewOnly?'needs-review':'all');setListOpen(value=>!value);}}><List size={15} aria-hidden="true"/>List view</button></div><div className="study-flash-deck-actions">{listOpen?<button type="button" onClick={()=>setListOpen(false)}>Back to cards</button>:<><button type="button" aria-label="Shuffle deck" aria-keyshortcuts="S" onClick={()=>start()}><Shuffle size={15} aria-hidden="true"/>Shuffle deck</button><button type="button" aria-label="Restart review" aria-keyshortcuts="R" onClick={restart}><RotateCcw size={15} aria-hidden="true"/>Restart review</button></>}</div></div>
    {listOpen?<section className="study-flash-review-list" id="study-flash-review-list" aria-labelledby="study-flash-review-heading">
      <header><h4 ref={listHeading} id="study-flash-review-heading" tabIndex={-1}>{listFilter==='all'?'All cards list':'Needs Review list'}</h4><p role="status">{listedCards.length} {listedCards.length===1?'card':'cards'}{listFilter==='needs-review'?' marked for review':''} in the selected topic. Questions and answers are shown together.</p></header>
      {listedCards.length?<ol>{listedCards.map((item,index)=><li key={item.id}><article aria-labelledby={`study-flash-review-${item.id}`}><h5 id={`study-flash-review-${item.id}`}><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span>{item.front}</h5><p className="study-flash-review-answer">{item.back}</p><SourceLinks refs={item.sourceRefs} route={route}/></article></li>)}</ol>:<p className="study-empty">{listFilter==='needs-review'?'No cards are marked Needs Review for this topic. Mark cards Needs Review in the card viewer to collect them here.':'No flashcards are available for this topic.'}</p>}
      {listedCards.length>0&&<div className="study-flash-deck-actions"><button type="button" onClick={()=>setListOpen(false)}>Back to cards</button></div>}
    </section>:!deck.length?<p className="study-empty">{reviewOnly?'No cards are marked Needs Review for this topic.':'No flashcards are available for this topic.'}</p>:finished?<div className="study-empty" role="status"><h4 tabIndex={-1}>Review complete</h4><p>{rated.length} of {deck.length} cards marked in this session.</p><button type="button" onClick={()=>start()}>Start another review</button></div>:card&&<>
      <div className="study-flash-progress"><span>Card {index+1} of {deck.length}</span><span>{rated.length} marked this session</span></div><progress aria-label="Flashcard review progress" value={rated.length} max={deck.length}/>
      <div className="study-flash-card-meta"><span className="study-flash-status" data-status={status??'unmarked'}>{status==='known'?'Known':status==='needs-review'?'Needs Review':'Not marked'}</span><span>{reviewOnly?'Review deck':'Full deck'}</span></div>
      <button type="button" className="study-flashcard" aria-label={flipped?'Show flashcard front':'Flip flashcard to reveal answer'} aria-labelledby="study-flashcard-face" aria-describedby="study-flashcard-side study-flashcard-flip-hint" aria-keyshortcuts="Space Enter ArrowUp ArrowDown" aria-pressed={flipped} onClick={flip}><span className="study-card-side" id="study-flashcard-side">{flipped?'Back · Answer':'Front · Recall'}</span><span className="study-card-text" id="study-flashcard-face">{flipped?card.back:card.front}</span><span className="study-card-hint" id="study-flashcard-flip-hint">{flipped?'Show question':'Reveal answer'}</span></button>
      <div className="study-flash-ratingbar"><div className="study-actions study-card-ratings"><button className="study-rating-known" type="button" aria-label="Mark Known" aria-keyshortcuts="K" aria-pressed={status==='known'} onClick={()=>mark('known')}><Check size={17} aria-hidden="true"/>Mark Known</button><button className="study-rating-review" type="button" aria-label="Mark Needs Review" aria-keyshortcuts="U" aria-pressed={status==='needs-review'} onClick={()=>mark('needs-review')}><RotateCcw size={17} aria-hidden="true"/>Mark Needs Review</button></div>
      <label className="study-flash-auto"><input type="checkbox" checked={autoAdvance} onChange={event=>setAutoAdvance(event.target.checked)}/>Next card after marking</label></div><p className="sr-only" role="status" aria-live="polite">{message}</p>
      <SessionNavigation index={index} total={deck.length} lastLabel="Finish review" keyboardNavigation onPrevious={()=>move(index-1)} onNext={advance}/>
    </>}
    <div className="study-flash-shortcut-guide" hidden={listOpen}><dl aria-label="Flashcard keyboard shortcuts"><div><dt><kbd>←</kbd><kbd>→</kbd></dt><dd>Previous / next</dd></div><div><dt><kbd>Space</kbd><kbd>↑</kbd><kbd>↓</kbd></dt><dd>Flip card</dd></div><div><dt><kbd>K</kbd></dt><dd>Mark Known</dd></div><div><dt><kbd>U</kbd></dt><dd>Needs Review</dd></div><div><dt><kbd>S</kbd></dt><dd>Shuffle</dd></div><div><dt><kbd>R</kbd></dt><dd>Restart</dd></div>{inDialog&&<div><dt><kbd>Esc</kbd></dt><dd>Close viewer</dd></div>}</dl><p>Shortcuts are active anywhere while this viewer is open. Enter also flips a focused card.</p></div>
  </div>;
}
