import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { annotationSources } from './annotation-content';
import { AnnotationRecordsContext } from './annotation-context';
import { annotationStore, useAnnotations } from './annotation-store';
import { resolvedAnnotations } from './annotation-model';
import { captureAnnotationSelection, type PendingAnnotation } from './annotation-selection';
import { NoteEditor } from './note-editor';
import type { Annotation } from './annotation-core';
import { useReadingHash } from './notes-navigation';

export function AnnotationReader({children}:{children:ReactNode}) {
  const readingHash = useReadingHash(), jumpNavigation = useRef(readingHash);
  const root=useRef<HTMLDivElement>(null),returnFocus=useRef<HTMLElement|null>(null),toolbar=useRef<HTMLDivElement>(null);
  const jumped=useRef<string|null>(null);
  const state=useAnnotations(),[pending,setPending]=useState<PendingAnnotation|null>(null),[editor,setEditor]=useState<Annotation|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const records=useMemo(()=>resolvedAnnotations(state.records,annotationSources),[state.records]);
  useEffect(()=>{if(state.status==='ready')void annotationStore.reconcile(annotationSources).catch(()=>setMessage('Saved highlights could not be checked. Reading remains available.'));},[state.status]);
  useEffect(()=>{
    if(state.status!=='ready')return;
    let timer:ReturnType<typeof setTimeout>;
    const capture=()=>{if(editor)return;const selection=window.getSelection();
      if(!selection||selection.isCollapsed){if(!toolbar.current?.contains(document.activeElement)){setPending(null);setMessage('');}return;}
      const anchor=selection.anchorNode instanceof Element?selection.anchorNode:selection.anchorNode?.parentElement;
      if(anchor?.closest('[data-annotation-excluded]')){setPending(null);setMessage('');return;}
      if(!root.current?.contains(selection.anchorNode)||!root.current.contains(selection.focusNode)){setPending(null);setMessage('');return;}
      try{const selected=captureAnnotationSelection(root.current,annotationSources,selection);setPending(selected);if(selected)setMessage('');}
      catch(error){setPending(null);setMessage(error instanceof Error?error.message:'Select a heading or passage in the reading.');}
    };
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(capture,160);};
    const hide=(event:Event)=>{if(toolbar.current?.contains(event.target as Node))return;setPending(null);};
    const outside=(event:Event)=>{if(toolbar.current?.contains(event.target as Node))return;clearTimeout(timer);setPending(null);setMessage('');};
    document.addEventListener('selectionchange',schedule);root.current?.addEventListener('pointerup',schedule);root.current?.addEventListener('keyup',schedule);
    document.addEventListener('pointerdown',outside);
    const shell=root.current?.closest('.learn-shell');shell?.addEventListener('scroll',hide,{passive:true});window.addEventListener('resize',hide);
    return()=>{clearTimeout(timer);document.removeEventListener('selectionchange',schedule);document.removeEventListener('pointerdown',outside);root.current?.removeEventListener('pointerup',schedule);root.current?.removeEventListener('keyup',schedule);shell?.removeEventListener('scroll',hide);window.removeEventListener('resize',hide);};
  },[state.status,editor]);
  const create=async(withNote:boolean)=>{
    if(!pending||busy)return;setBusy(true);
    try{
      const blocks=[...root.current!.querySelectorAll<HTMLElement>('[data-annotation-block]')];
      const selected=pending.segments.map(segment=>blocks.find(block=>{
        const wrapper=block.closest<HTMLElement>('[data-annotation-source]');
        return block.dataset.annotationBlock===segment.anchor.blockId&&wrapper?.dataset.annotationSource===segment.target.sourceId&&wrapper?.dataset.annotationSubject===segment.target.subjectId&&wrapper?.dataset.annotationTab===segment.target.tabId&&!block.closest('[hidden]')&&block.textContent===segment.anchor.blockText;
      }));
      if(selected.some(block=>!block))throw new Error('This passage changed. Select it again before saving.');
      const block=selected[0]!;
      const now=new Date().toISOString(),record:Annotation={id:crypto.randomUUID(),schemaVersion:2,target:pending.target,anchor:pending.anchor,segments:pending.segments,selectionKind:pending.selectionKind,note:'',style:'ochre',status:'anchored',createdAt:now,modifiedAt:now};
      await annotationStore.create(record);setPending(null);window.getSelection()?.removeAllRanges();setMessage('Highlight saved in this browser.');
      block.tabIndex=-1;returnFocus.current=block;if(withNote)setEditor(record);
    }catch(error){setMessage(error instanceof Error?error.message:'The highlight could not be saved. Browser storage may be full.');}finally{setBusy(false);}
  };
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setPending(null);
      if(!pending||editor||!event.altKey||event.ctrlKey||event.metaKey)return;
      if(event.key.toLowerCase()==='h'||event.key.toLowerCase()==='n'){event.preventDefault();void create(event.key.toLowerCase()==='n');}
    };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  });
  useEffect(()=>{
    if(jumpNavigation.current!==readingHash){jumped.current=null;jumpNavigation.current=readingHash;}
    const id=new URLSearchParams(readingHash.hash.slice(1)).get('annotation');if(!id||state.status!=='ready'||jumped.current===id)return;
    const record=records.find(item=>item.id===id);if(!record||record.status!=='anchored'){setMessage('This saved highlight could not be safely placed. It remains available in Notes.');return;}
    let timer:ReturnType<typeof setTimeout>,frame=0;
    const jump=()=>{
      frame=0;if(jumped.current===id)return;
      const mark=[...root.current?.querySelectorAll<HTMLElement>('[data-annotation-first]')??[]].find(item=>item.dataset.annotationId===id);
      if(!mark||mark.closest('[hidden]'))return;
      jumped.current=id;mark.focus({preventScroll:true});mark.scrollIntoView?.({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      mark.classList.add('annotation-target');timer=setTimeout(()=>mark.classList.remove('annotation-target'),1800);
    };
    const observer=new MutationObserver(()=>{if(!frame)frame=requestAnimationFrame(jump);});
    if(root.current)observer.observe(root.current,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    frame=requestAnimationFrame(jump);return()=>{observer.disconnect();cancelAnimationFrame(frame);clearTimeout(timer);};
  },[records,state.status,readingHash]);
  const open=(target:EventTarget|null)=>{if((target as Element)?.closest('a'))return;const mark=(target as Element)?.closest<HTMLElement>('[data-annotation-id]');if(!mark)return;
    const record=records.find(item=>item.id===mark.dataset.annotationId);if(record){returnFocus.current=mark;setPending(null);setEditor(record);}
  };
  return <AnnotationRecordsContext value={records}>
    <div className="annotation-reader" ref={root} onClick={event=>{if(window.getSelection()?.isCollapsed!==false)open(event.target);}} onKeyDown={event=>{
      if((event.key==='Enter'||event.key===' ')&&!(event.target as Element).closest('a')&&(event.target as Element).closest('[data-annotation-id]')){event.preventDefault();open(event.target);}
    }}>
      <p className="sr-only">Select text with Shift and arrow keys, then Alt+H to highlight or Alt+N to add a note. Selections can span headings, paragraphs, lists and table cells in the current reading.</p>
      {state.status==='error'&&<p role="status" className="notes-error">{state.error} <button onClick={()=>void annotationStore.retry()}>Retry storage</button></p>}
      <p className="annotation-status" role="status" aria-live="polite">{message}</p>
      {children}
    </div>
    {pending&&createPortal(<div ref={toolbar} className="annotation-toolbar" role="toolbar" aria-label="Annotate selected text" style={{left:pending.left,top:pending.top}}
      onPointerDown={event=>{if(event.pointerType!=='touch')event.preventDefault();}}>
      <button disabled={busy} onClick={()=>void create(false)}>Highlight</button><button disabled={busy} onClick={()=>void create(true)}>Add Note</button><button aria-label="Dismiss selection tools" onClick={()=>setPending(null)}>×</button>
    </div>,document.body)}
    {editor&&<NoteEditor key={editor.id} record={editor} onClose={()=>setEditor(null)} returnFocus={returnFocus}/>}
  </AnnotationRecordsContext>;
}
