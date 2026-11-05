import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Upload, StickyNote } from 'lucide-react';
import { SiteNavigation } from '../site-navigation';
import { AppearanceControls } from '../appearance-controls';
import { learnSubjects } from '../learn/subjects';
import { annotationStore, useAnnotations } from './annotation-store';
import { annotationSources, annotationTargetUrl, sourceFor, sortAnnotations } from './annotation-content';
import { annotationExcerpt, ANNOTATION_EXPORT_KIND, ANNOTATION_VERSION, MAX_BACKUP_BYTES, type Annotation } from './annotation-core';
import { resolvedAnnotations } from './annotation-model';
import { NoteEditor } from './note-editor';
import '../learn/learn.css';
import './notes.css';

export default function NotesPage() {
  const state=useAnnotations(),[subject,setSubject]=useState(''),[tab,setTab]=useState(''),[onlyNotes,setOnlyNotes]=useState(false),[onlyUnresolved,setOnlyUnresolved]=useState(false);
  const [editor,setEditor]=useState<Annotation|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const input=useRef<HTMLInputElement>(null),returnFocus=useRef<HTMLElement|null>(null);
  const records=useMemo(()=>sortAnnotations(resolvedAnnotations(state.records,annotationSources)),[state.records]);
  const availableTabs=learnSubjects.filter(item=>!subject||item.slug===subject).flatMap(item=>item.tabs.filter(section=>section.kind!=='coming-soon'));
  const visible=records.filter(item=>(!subject||item.target.subjectId===subject)&&(!tab||item.target.tabId===tab)&&(!onlyNotes||!!item.note.trim())&&(!onlyUnresolved||item.status==='unresolved'));
  const groups=new Map<string,Annotation[]>();for(const record of visible){const key=`${record.target.subjectId}|${record.target.tabId}`;groups.set(key,[...groups.get(key)??[],record]);}
  useEffect(()=>{document.title='Notes · Human Atlas';},[]);
  useEffect(()=>{if(state.status==='ready')void annotationStore.reconcile(annotationSources).catch(()=>setMessage('Some highlight positions could not be checked. Your records are retained.'));},[state.status]);
  const run=async(task:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await task();}catch(error){setMessage(error instanceof Error?error.message:'Browser storage is unavailable. Your changes were not saved.');}finally{setBusy(false);}};
  const exportBackup=()=>run(async()=>{
    const backup={kind:ANNOTATION_EXPORT_KIND,schemaVersion:ANNOTATION_VERSION,exportedAt:new Date().toISOString(),annotations:records};
    const url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'})),link=document.createElement('a');
    link.href=url;link.download=`human-atlas-notes-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage(`Exported ${records.length} highlights and their notes.`);
  });
  const importBackup=(file:File)=>run(async()=>{
    if(file.size>MAX_BACKUP_BYTES)throw new Error('Choose a Human Atlas JSON backup smaller than 5 MB.');
    let value:unknown;try{value=JSON.parse(await file.text());}catch{throw new Error('This file is not valid JSON. No notes were changed.');}
    const result=await annotationStore.importBackup(value,annotationSources);setMessage(`Imported ${result.imported}; updated ${result.updated}; skipped ${result.skipped}. Existing notes were merged safely.`);
  });
  const remove=(record:Annotation)=>{if(!window.confirm('Delete this highlight and its personal note?'))return;void run(async()=>{await annotationStore.remove(record.id);setMessage('Highlight deleted.');});};
  return <div className="learn-shell notes-shell">
    <a className="learn-skip-link" href="#notes-content">Skip to notes</a>
    <header className="learn-header"><a className="learn-wordmark" href="/" aria-label="Human Atlas home">Human Atlas</a><SiteNavigation section="notes"/><AppearanceControls/>
    </header>
    <main id="notes-content" className="notes-content" tabIndex={-1}>
      <header className="notes-heading"><div className="notes-eyebrow"><StickyNote size={15} aria-hidden="true"/> Personal study space</div><h1>Notes</h1><p>Your highlights, with your thinking alongside them.</p></header>
      <aside className="notes-privacy"><strong>Private to this browser.</strong> Highlights and notes are saved on this device and site address. Nothing is uploaded or synced automatically. Export a backup before clearing site data or moving to another browser.</aside>
      <div className="notes-tools"><div><button disabled={state.status!=='ready'||busy} onClick={()=>void exportBackup()}><Download size={15} aria-hidden="true"/>Export backup</button><button disabled={state.status!=='ready'||busy} onClick={()=>input.current?.click()}><Upload size={15} aria-hidden="true"/>Import backup</button><input ref={input} className="sr-only" aria-label="Import Human Atlas notes backup" type="file" accept="application/json,.json" disabled={state.status!=='ready'||busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void importBackup(file);}}/></div><span>{records.length} highlights · {records.filter(item=>!!item.note.trim()).length} notes</span></div>
      {state.status==='loading'&&<p role="status">Opening your local notes…</p>}
      {state.status==='error'&&<p role="alert" className="notes-error">{state.error} <button onClick={()=>void annotationStore.retry()}>Retry storage</button></p>}
      <p role="status" className="notes-status" aria-live="polite">{message}</p>
      <form className="notes-filters" onSubmit={event=>event.preventDefault()} aria-label="Filter notes">
        <label>Subject<select value={subject} onChange={event=>{setSubject(event.target.value);setTab('');}}><option value="">All subjects</option>{learnSubjects.map(item=><option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
        <label>Section<select value={tab} onChange={event=>setTab(event.target.value)}><option value="">All sections</option>{availableTabs.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label className="notes-check"><input type="checkbox" checked={onlyNotes} onChange={event=>setOnlyNotes(event.target.checked)}/>With notes only</label>
        <label className="notes-check"><input type="checkbox" checked={onlyUnresolved} onChange={event=>setOnlyUnresolved(event.target.checked)}/>Unresolved only</label>
      </form>
      {state.status==='ready'&&!visible.length&&<section className="notes-empty"><StickyNote size={28} aria-hidden="true"/><h2>{records.length?'No notes match these filters.':'A good question is worth keeping.'}</h2><p>{records.length?'Try another subject or section, or clear the filters.':'Select a passage in Learn to save a highlight or add a personal note. Your collection will appear here.'}</p><a href="/learn/digestive">Open Digestive System <span aria-hidden="true">↗</span></a></section>}
      {[...groups].map(([key,items])=>{
        const first=items[0],meta=sourceFor(first),subjectTitle=meta?.subjectTitle??learnSubjects.find(item=>item.slug===first.target.subjectId)?.title??first.target.subjectId;
        const tabTitle=meta?.tabTitle??learnSubjects.flatMap(item=>item.tabs).find(item=>item.id===first.target.tabId)?.title??first.target.tabId;
        return <section key={key} className="notes-group" aria-label={`${subjectTitle}: ${tabTitle}`}><header><span>{subjectTitle}</span><h2>{tabTitle}</h2></header>
          {items.map(record=><article key={record.id} className="notes-entry" data-note-id={record.id}>
            <div className="notes-entry-meta"><span>{sourceFor(record)?.title??'Original section unavailable'}</span><time dateTime={record.modifiedAt}>{new Date(record.modifiedAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}</time></div>
            {record.selectionKind&&<span className="notes-selection-kind">{record.selectionKind==='range'?'Extended passage':record.selectionKind==='heading'?'Heading':'Passage'}</span>}
            <blockquote>{annotationExcerpt(record)}</blockquote>{record.note&&<p className="notes-personal-text">{record.note}</p>}
            {record.status==='unresolved'&&<p className="notes-unresolved"><strong>Unresolved highlight.</strong> The passage changed or could not be matched safely. Your excerpt and note are retained.</p>}
            <div className="notes-entry-actions"><a href={annotationTargetUrl(record)}>{record.status==='anchored'?'Revisit highlight':'Open original reading'} <span aria-hidden="true">↗</span></a><button disabled={busy} onClick={event=>{returnFocus.current=event.currentTarget;setEditor(record);}}>{record.note?'Edit note':'Add note'}</button><button disabled={busy} className="notes-danger" onClick={()=>remove(record)}>Delete</button></div>
          </article>)}
        </section>;
      })}
      <footer className="notes-backup-footer"><p>Backups stay on your device. Import accepts Human Atlas backups only and merges newer records without duplicating overlapping highlights.</p><button className="notes-danger" disabled={state.status!=='ready'||busy||!records.length} onClick={()=>{if(window.confirm('Clear ALL highlights and notes in this browser? This cannot be undone without an exported backup.'))void run(async()=>{await annotationStore.clear();setMessage('All local highlights and notes were cleared.');});}}>Clear all highlights and notes</button></footer>
    </main>
    {editor&&<NoteEditor key={editor.id} record={editor} onClose={()=>setEditor(null)} returnFocus={returnFocus}/>}
  </div>;
}
