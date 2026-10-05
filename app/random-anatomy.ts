import type {DiscoveryEntry} from './anatomy-discovery';
import type {IdentityIndex} from './identity-index';
import type {SceneState} from './anatomy';
import {selectRepresentations} from './hide-restore.ts';
import {resolveSearchPartIds} from './anatomy-search.ts';
import {isolateSelection,clearActiveSelection} from './viewer-interaction.ts';

/** Freeze the random workspace, then clear only transient inspection/highlight. */
export function randomAnatomyWorkspace(state:SceneState,entry:DiscoveryEntry,identity:IdentityIndex):SceneState {
 if(entry.modelId!==identity.modelId)return state;
 const next=selectRepresentations(state,identity,resolveSearchPartIds(entry.concept,identity));
 return next.selected.length?clearActiveSelection(isolateSelection(next,identity)):state;
}
/** Exploration heuristic only: this count is not scientific/educational importance. */
export function randomAnatomyCandidates(entries:readonly DiscoveryEntry[],identity:IdentityIndex):DiscoveryEntry[]{
 return entries.filter(entry=>entry.modelId===identity.modelId&&entry.modeledPieceCount>=5&&entry.modeledPieceCount<=200&&entry.partIds.length===entry.modeledPieceCount&&entry.representationIds.length===entry.modeledPieceCount&&entry.representationIds.every((id,i)=>{
  const r=identity.representation(id);return r?.modelId===identity.modelId&&r.available&&r.vertexCount>0&&r.indexCount>0&&r.sourcePartId.value===entry.partIds[i];
 }));
}
export function chooseRandomAnatomy(candidates:readonly DiscoveryEntry[],lastId:string|null,rng:()=>number=Math.random):DiscoveryEntry|null {
 const pool=candidates.length>1?candidates.filter(entry=>entry.id!==lastId):candidates;
 if(!pool.length)return null;
 const value=rng(),index=Number.isFinite(value)?Math.floor(Math.max(0,Math.min(1-Number.EPSILON,value))*pool.length):0;
 return pool[index];
}
