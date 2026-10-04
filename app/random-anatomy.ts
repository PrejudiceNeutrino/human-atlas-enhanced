import type {DiscoveryEntry} from './anatomy-discovery';
import type {IdentityIndex} from './identity-index';
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
