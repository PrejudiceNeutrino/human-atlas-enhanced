import { useEffect, useSyncExternalStore } from 'react';
import { learnSubjects } from '../learn/subjects';
import { annotationsOverlap, MAX_ANNOTATIONS, mergeAnnotations, parseAnnotationExport, validateAnnotation, type Annotation } from './annotation-core';
import { createAnnotationStorage } from './annotation-storage';
import { resolvedAnnotations, type AnnotationSource } from './annotation-model';

export const validAnnotationTabs=new Map(learnSubjects.map(subject=>[subject.slug,new Set(subject.tabs.filter(tab=>tab.kind!=='coming-soon').map(tab=>tab.id))]));
export function createAnnotationStore(storage=createAnnotationStorage()) {
  let state:{records:Annotation[];status:'loading'|'ready'|'error';error:string}={records:[],status:'loading',error:''};
  let load:Promise<void>|undefined,queue=Promise.resolve();
  const listeners=new Set<()=>void>();
  let channel:BroadcastChannel|undefined;
  const emit=()=>listeners.forEach(listener=>listener());
  const sanitize=(records:Annotation[])=>records.map(item=>{
    // Once-valid local records outlive retired subjects/tabs. Imports still require
    // currently known subjects; local legacy records remain visible as unresolved.
    const target=item?.target;
    const allowed=target&&typeof target.subjectId==='string'&&typeof target.tabId==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(target.subjectId)&&/^[a-zA-Z0-9_-]{1,200}$/.test(target.tabId)?new Map([[target.subjectId,new Set([target.tabId])]]):validAnnotationTabs;
    return validateAnnotation(item,allowed);
  }).filter((item):item is Annotation=>!!item);
  const refresh=async()=>{const records=sanitize(await storage.readAll());state={records,status:'ready',error:''};emit();};
  const initialize=()=>load??=(async()=>{
    try{await refresh();
      // Cross-tab notification is optional; blocked messaging must not disable working IndexedDB.
      if(typeof window!=='undefined'&&'BroadcastChannel' in window){try{channel=new window.BroadcastChannel('human-atlas-notes-changed');channel.onmessage=()=>{void refresh().catch(()=>{});};}catch{channel=undefined;}}
    }catch{state={...state,status:'error',error:'Browser storage is unavailable. Your reading is still available; notes cannot be saved. Close older tabs or allow site storage, then retry.'};emit();}
  })();
  const mutate=<T,>(plan:Parameters<typeof storage.mutate<T>>[0])=>{
    const operation=queue.then(async()=>{await initialize();if(state.status!=='ready')throw new Error(state.error);
      const output=await storage.mutate(records=>{
        const change=plan(records),next=new Map((change.clear?[]:records).map(item=>[item.id,item]));
        for(const id of change.remove??[])next.delete(id);for(const item of change.put??[])next.set(item.id,item);
        if(new TextEncoder().encode(JSON.stringify([...next.values()])).byteLength>4_800_000)throw new Error('Local notes are near the 5 MB backup limit. Export a backup, then remove older highlights before adding more.');
        return change;
      });state={records:sanitize(output.records),status:'ready',error:''};emit();try{channel?.postMessage('changed');}catch{channel=undefined;}return output.result;
    });queue=operation.then(()=>{},()=>{});return operation;
  };
  return {
    subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener);},getSnapshot:()=>state,initialize,
    retry:()=>{load=undefined;channel?.close();state={...state,status:'loading',error:''};emit();return initialize();},
    create:(record:Annotation)=>mutate(records=>{
      if(!validateAnnotation(record,validAnnotationTabs))throw new Error('This selection cannot be saved. Select the heading or passage again.');
      if(records.length>=MAX_ANNOTATIONS)throw new Error('The 5,000-highlight limit has been reached. Export a backup before removing older highlights.');
      if(records.some(item=>annotationsOverlap(item,record)))throw new Error('That text overlaps an existing highlight. Open the existing highlight to add a note.');
      return{put:[record],result:record};
    }),
    saveNote:(id:string,note:string,expectedModifiedAt:string)=>mutate(records=>{
      if(note.length>10000)throw new Error('Notes may contain at most 10,000 characters.');
      const record=records.find(item=>item.id===id);if(!record)throw new Error('This highlight was removed in another tab. Your draft has not been discarded.');
      if(record.modifiedAt!==expectedModifiedAt)throw new Error('This note changed in another tab. Copy your draft, close the editor and reopen the current note.');
      const next={...record,note,modifiedAt:new Date(Math.max(Date.now(),Date.parse(record.modifiedAt)+1)).toISOString()};return{put:[next],result:next};
    }),
    remove:(id:string)=>mutate(()=>({remove:[id],result:undefined})),
    clear:()=>mutate(()=>({clear:true,result:undefined})),
    reconcile:(sources:AnnotationSource[])=>mutate(records=>{
      const next=resolvedAnnotations(sanitize(records),sources),changed=next.filter(item=>JSON.stringify(item)!==JSON.stringify(records.find(record=>record.id===item.id)));
      return{put:changed,result:undefined};
    }),
    importBackup:(value:unknown,sources:AnnotationSource[])=>{
      const parsed=parseAnnotationExport(value,validAnnotationTabs);
      return mutate(records=>{const merged=mergeAnnotations(resolvedAnnotations(sanitize(records),sources),resolvedAnnotations(parsed.annotations,sources));
        return{put:merged.records,result:{imported:merged.imported,updated:merged.updated,skipped:merged.skipped+parsed.invalid}};
      });
    },
    async dispose(){channel?.close();await queue;await storage.close();listeners.clear();},
  };
}
export const annotationStore=createAnnotationStore();
export function useAnnotations(){const state=useSyncExternalStore(annotationStore.subscribe,annotationStore.getSnapshot);useEffect(()=>{void annotationStore.initialize();},[]);return state;}
