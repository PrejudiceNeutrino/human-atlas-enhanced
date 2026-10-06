import type {Atlas,SceneState} from './anatomy';
import type {ModelId,RepresentationId} from './identity-contracts';
import type {IdentityIndex} from './identity-index';
import {resolveVisibility} from './visibility.ts';

/** Ephemeral presentation subject; never a Hidden, navigation or workspace scope. */
export interface ContextRevealSubject {
 mode:'context';
 modelId:ModelId;
 targetRepresentationIds:readonly RepresentationId[];
}
export const CONTEXT_REVEAL_OPACITY=.08;

export function contextRevealSubject(state:SceneState,atlas:Atlas,identity:IdentityIndex,renderState:SceneState=state):ContextRevealSubject|undefined {
 const parts=new Map(atlas.parts.map(p=>[p.id,p]));
 const selected=new Set(state.selected),systems=new Set(state.visible),hidden=new Set(state.hiddenRepresentationIds??[]);
 const targets=new Set<RepresentationId>();let displayed=false;
 for(const partId of selected){
  const part=parts.get(partId),r=identity.representationForPart(partId);
  if(!part||!r||r.modelId!==identity.modelId||!r.available||r.vertexCount<=0||r.indexCount<=0||!atlas.chunks[r.chunkIndex])continue;
  targets.add(r.id);
  if(resolveVisibility(part,renderState,{selected,systems,hidden:hidden.has(r.id)}).displayed)displayed=true;
 }
 // Keep hidden selected members in the subject: restoring one re-enters the
 // target pass through ordinary visibility, without reselecting or unhiding it.
 return displayed?{mode:'context',modelId:identity.modelId,targetRepresentationIds:[...targets]}:undefined;
}
export function enterContextReveal(state:SceneState,atlas:Atlas,identity:IdentityIndex,renderState:SceneState=state):SceneState {
 const subject=contextRevealSubject(state,atlas,identity,renderState);
 return subject?{...state,contextReveal:subject}:state;
}
export function exitContextReveal(state:SceneState):SceneState {
 return state.contextReveal?{...state,contextReveal:undefined}:state;
}
function sameMembers(a:readonly string[]=[],b:readonly string[]=[]):boolean {
 if(a===b)return true;
 const left=new Set(a),right=new Set(b);return left.size===right.size&&[...left].every(id=>right.has(id));
}
/** Apply after a complete viewer action, including persistent-member selection. */
export function reconcileContextReveal(previous:SceneState,next:SceneState):SceneState {
 if(!next.contextReveal||next.contextReveal!==previous.contextReveal)return next;
 return !sameMembers(previous.selected,next.selected)||!next.selected.length||
  previous.regionId!==next.regionId||previous.areaId!==next.areaId||previous.isolate!==next.isolate||
  !sameMembers(previous.isolatedRepresentationIds,next.isolatedRepresentationIds)
  ?exitContextReveal(next):next;
}
/** Used only with an actual ray hit or the existing exploded fallback score. */
export function revealHitWins(distance:number,target:boolean,bestDistance:number,bestTarget:boolean):boolean {
 return target!==bestTarget?target:distance<bestDistance;
}
