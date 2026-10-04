import type {Atlas,SceneState,SystemId} from './anatomy';
import {SYSTEMS} from './anatomy.ts';
import type {IdentityIndex} from './identity-index';
import {selectRepresentations,representationIdsForPartIds,hiddenPartIdsForModel} from './hide-restore.ts';

/** Freeze current-model representations separately from the active inspected member. */
export function toggleIsolation(state:SceneState,identity:IdentityIndex):SceneState {
 if(state.isolate)return {...state,isolate:false,isolatedRepresentationIds:undefined,isolatedPartIds:undefined,explode:0};
 const ids=representationIdsForPartIds(identity,state.selected);
 return ids.length?{...state,isolate:true,isolatedRepresentationIds:ids,isolatedPartIds:hiddenPartIdsForModel(identity,ids),explode:0}:state;
}
/** Direct visible-member picks and Included entries share persistent assembly semantics. */
export function selectAssemblyMember(state:SceneState,identity:IdentityIndex,partId:string):SceneState {
 const representation=identity.representationForPart(partId);
 if(!representation||representation.modelId!==identity.modelId)return state;
 const ids=state.isolatedRepresentationIds??representationIdsForPartIds(identity,state.selected);
 const scope=hiddenPartIdsForModel(identity,ids);
 const next=selectRepresentations(state,identity,[partId]);
 return state.isolate&&scope.has(partId)?{...next,isolate:true,isolatedRepresentationIds:ids,isolatedPartIds:scope}:next;
}
export function selectIncludedMember(state:SceneState,identity:IdentityIndex,partId:string):SceneState {
 const scope=state.isolate?hiddenPartIdsForModel(identity,state.isolatedRepresentationIds??representationIdsForPartIds(identity,state.selected)):new Set(state.selected);
 return scope.has(partId)?selectAssemblyMember(state,identity,partId):state;
}
/** Same model-appropriate adult inventory for the All preset and Show all systems. */
export function allSystemsForAtlas(atlas:Atlas):SystemId[] {
 const present=new Set(atlas.parts.map(part=>part.system));
 return SYSTEMS.filter(system=>system.id!=='pregnancy'&&present.has(system.id)).map(system=>system.id);
}
export function showAllSystems(state:SceneState,systems:readonly SystemId[]):SceneState {
 return {...state,visible:[...systems],selected:[],isolate:false,isolatedRepresentationIds:undefined,isolatedPartIds:undefined,breastView:'tissue'};
}
export function toggleAllSystems(state:SceneState,systems:readonly SystemId[]):SceneState {
 return systems.some(id=>state.visible.includes(id))?{...state,visible:[],selected:[],isolate:false}:showAllSystems(state,systems);
}
