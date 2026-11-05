import type { Annotation } from './annotation-core';
export const ANNOTATION_DB_NAME = 'human-atlas-personal-notes';
export const ANNOTATION_DB_VERSION = 1;
export interface AnnotationMutation<T> { put?: Annotation[]; remove?: string[]; clear?: boolean; result: T }
export function openAnnotationDatabase(factory: IDBFactory = indexedDB) {
  return new Promise<IDBDatabase>((resolve,reject) => {
    const request = factory.open(ANNOTATION_DB_NAME, ANNOTATION_DB_VERSION); let blocked=false;
    request.onupgradeneeded = () => {
      const db=request.result;
      if (!db.objectStoreNames.contains('annotations')) {
        const store=db.createObjectStore('annotations',{keyPath:'id'});
        store.createIndex('subjectId','target.subjectId'); store.createIndex('tabId','target.tabId');
      }
    };
    request.onsuccess=()=>{if(blocked){request.result.close();return;}request.result.onversionchange=()=>request.result.close();resolve(request.result);};
    request.onerror=()=>reject(request.error ?? new Error('Notes storage is unavailable.'));
    request.onblocked=()=>{blocked=true;reject(new Error('Notes storage is blocked by another open tab. Close older tabs and retry.'));};
  });
}
export function createAnnotationStorage(factory?: IDBFactory) {
  let connection: Promise<IDBDatabase> | undefined;
  const database=()=>connection ??= openAnnotationDatabase(factory).then(db=>{db.onversionchange=()=>{db.close();connection=undefined;};return db;}).catch(error=>{connection=undefined;throw error;});
  return {
    async readAll(): Promise<Annotation[]> {
      const db=await database();
      return new Promise((resolve,reject)=>{const tx=db.transaction('annotations','readonly'),request=tx.objectStore('annotations').getAll();
        tx.oncomplete=()=>resolve(request.result);tx.onabort=()=>reject(tx.error ?? new Error('Could not read notes.'));tx.onerror=()=>{};});
    },
    async mutate<T>(plan:(records:Annotation[])=>AnnotationMutation<T>):Promise<{records:Annotation[];result:T}> {
      const db=await database();
      return new Promise((resolve,reject)=>{
        const tx=db.transaction('annotations','readwrite'),store=tx.objectStore('annotations'),request=store.getAll();
        let output:{records:Annotation[];result:T},failure:unknown;
        request.onsuccess=()=>{try{const change=plan(request.result),records=new Map((change.clear?[]:request.result).map(item=>[item.id,item]));
          if(change.clear)store.clear();for(const id of change.remove??[]){store.delete(id);records.delete(id);}
          for(const item of change.put??[]){store.put(item);records.set(item.id,item);}output={records:[...records.values()],result:change.result};
        }catch(error){failure=error;tx.abort();}};
        // A successful request is NOT a successful write until the transaction commits.
        tx.oncomplete=()=>resolve(output);tx.onabort=()=>reject(failure??tx.error??new Error('Notes could not be saved.'));tx.onerror=()=>{};
      });
    },
    async close(){(await connection)?.close();connection=undefined;},
  };
}
