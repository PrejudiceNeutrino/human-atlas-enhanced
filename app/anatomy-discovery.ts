import {viewerShortcut} from './viewer-shortcuts.ts';
import {featuredAnatomy} from './featured-anatomy.ts';
import type {Atlas,SystemId} from './anatomy';
import type {IdentityIndex} from './identity-index';
import type {ModelId,RepresentationId} from './identity-contracts';
import {buildSearchConcepts,matchesAnatomySearch,resolveSearchPartIds,type SearchConcept} from './anatomy-search.ts';

export interface DiscoveryEntry {
 id:string;
 name:string;
 concept:SearchConcept;
 modelId:ModelId;
 partIds:string[];
 representationIds:RepresentationId[];
 modeledPieceCount:number;
 systemIds:SystemId[];
}
export type DiscoverySort='name'|'largest'|'smallest';

/** A derived interface over Search, never a second canonical anatomy store. */
export function buildDiscoveryIndex(atlas:Atlas,identity:IdentityIndex):DiscoveryEntry[] {
 const parts=new Map(atlas.parts.map(part=>[part.id,part]));
 return buildSearchConcepts(atlas).flatMap(concept=>{
  const selected=new Map<RepresentationId,string>();
  const systems=new Set<SystemId>();
  for(const id of resolveSearchPartIds(concept,identity)){
   const part=parts.get(id),r=identity.representationForPart(id);
   if(!part||!r||r.modelId!==identity.modelId||!r.available||r.vertexCount<=0||r.indexCount<=0||!atlas.chunks[r.chunkIndex]||r.sourcePartId.value!==id)continue;
   selected.set(r.id,id);systems.add(part.system);
  }
  return selected.size?[{id:concept.id,name:concept.name,concept,modelId:identity.modelId,partIds:[...selected.values()],representationIds:[...selected.keys()],modeledPieceCount:selected.size,systemIds:[...systems]}]:[];
 });
}
const nameOrder=(a:DiscoveryEntry,b:DiscoveryEntry)=>a.name.toLowerCase().localeCompare(b.name.toLowerCase(),'en')||a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id,'en');
export function sortDiscoveryEntries(entries:readonly DiscoveryEntry[],sort:DiscoverySort):DiscoveryEntry[] {
 return [...entries].sort((a,b)=>(sort==='largest'?b.modeledPieceCount-a.modeledPieceCount:sort==='smallest'?a.modeledPieceCount-b.modeledPieceCount:0)||nameOrder(a,b));
}
export function filterDiscoveryEntries(entries:readonly DiscoveryEntry[],system:SystemId|'all'):DiscoveryEntry[] {
 return entries.filter(entry=>system==='all'||entry.systemIds.includes(system));
}
/** Editorial landing entries; mature shortest-name-first query ranking is unchanged. */
export function searchDiscoveryEntries(entries:readonly DiscoveryEntry[],query:string):DiscoveryEntry[] {
 const term=query.toLowerCase().trim();
 if(!term)return entries.length?featuredAnatomy(entries,entries[0].modelId):[];
 return entries.filter(entry=>matchesAnatomySearch(entry.concept,term)).sort((a,b)=>a.name.length-b.name.length).slice(0,80);
}
export function shouldOpenDiscovery(event:Pick<KeyboardEvent,'key'|'target'|'ctrlKey'|'metaKey'|'altKey'|'defaultPrevented'|'isComposing'|'repeat'>):boolean {return viewerShortcut(event)==='find';}

export const DISCOVERY_ROW_HEIGHT=56;
export const DISCOVERY_OVERSCAN=4;
/** Fixed-height local window; keyboard navigation scrolls to any index before focus. */
export function discoveryWindow(length:number,scrollTop:number,height:number){
 const start=Math.max(0,Math.floor(scrollTop/DISCOVERY_ROW_HEIGHT)-DISCOVERY_OVERSCAN);
 const end=Math.min(length,Math.ceil((scrollTop+height)/DISCOVERY_ROW_HEIGHT)+DISCOVERY_OVERSCAN);
 return {start,end};
}
