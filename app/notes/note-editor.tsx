import { useRef, useState, type RefObject } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { annotationStore } from './annotation-store';
import { annotationExcerpt, type Annotation } from './annotation-core';

export function NoteEditor({record,onClose,returnFocus}:{record:Annotation;onClose:()=>void;returnFocus:RefObject<HTMLElement|null>}) {
  const [note,setNote]=useState(record.note),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const field=useRef<HTMLTextAreaElement>(null);
  const close=()=>{if(busy)return;if(note!==record.note&&!window.confirm('Discard your unsaved note changes?'))return;onClose();};
  const save=async()=>{setBusy(true);setError('');try{await annotationStore.saveNote(record.id,note,record.modifiedAt);onClose();}catch(error){setError(error instanceof Error?error.message:'Could not save this note.');}finally{setBusy(false);}};
  const remove=async()=>{if(!window.confirm('Delete this highlight and its personal note?'))return;setBusy(true);try{await annotationStore.remove(record.id);onClose();}catch{setError('Could not delete this highlight. Your note is still available.');}finally{setBusy(false);}};
  return <Dialog open onOpenChange={open=>{if(!open)close();}}>
    <DialogContent className="notes-editor" initialFocus={field} finalFocus={()=>returnFocus.current?.isConnected?returnFocus.current:document.querySelector<HTMLElement>('.annotation-help a, #notes-content')} aria-modal="true" data-atlas-shortcuts="disabled" showCloseButton={false}>
      <DialogTitle>Personal note</DialogTitle>
      <DialogDescription>Saved in this browser. Nothing is uploaded or synced.</DialogDescription>
      <blockquote>{annotationExcerpt(record)}</blockquote>
      <form onSubmit={event=>{event.preventDefault();void save();}}>
        <label htmlFor="personal-note-text">Your note <span>(optional)</span></label>
        <textarea id="personal-note-text" ref={field} rows={6} maxLength={10000} value={note} onChange={event=>setNote(event.target.value)} disabled={busy}/>
        <p className="notes-error" role="alert">{error}</p>
        <div className="notes-editor-actions"><button className="notes-primary" type="submit" disabled={busy}>{busy?'Saving…':'Save note'}</button><button type="button" disabled={busy} onClick={close}>Cancel</button><button type="button" className="notes-danger" disabled={busy} onClick={()=>void remove()}>Delete highlight</button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
