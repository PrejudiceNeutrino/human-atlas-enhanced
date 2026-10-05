import type {Atlas,SceneState,SystemId} from './anatomy';
import {SYSTEMS} from './anatomy.ts';
import type {IdentityIndex} from './identity-index';
import {selectRepresentations,representationIdsForPartIds,hiddenPartIdsForModel} from './hide-restore.ts';

/** Explicit entry or narrowing: freeze the current-model selection as a new workspace. */
export function isolateSelection(state:SceneState,identity:IdentityIndex):SceneState {
 const ids=representationIdsForPartIds(identity,state.selected);
 return ids.length?{...state,workspaceInspector:undefined,isolate:true,isolatedRepresentationIds:ids,isolatedPartIds:hiddenPartIdsForModel(identity,ids),explode:0}:state;
}
/** Explicit exit retains selection and independent dissection/navigation state. */
export function exitIsolation(state:SceneState):SceneState {
 return {...state,workspaceInspector:undefined,isolate:false,isolatedRepresentationIds:undefined,isolatedPartIds:undefined,explode:0};
}
/** Compatibility for existing callers; UI entry/narrowing and exit use separate actions. */
export function toggleIsolation(state:SceneState,identity:IdentityIndex):SceneState {
 return state.isolate?exitIsolation(state):isolateSelection(state,identity);
}
export function clearActiveSelection(state:SceneState):SceneState {
 return {...state,selected:[],inspectorOpen:!!state.workspaceInspector&&state.isolate};
}
/** Only workspace/view transitions may refit; inspection, panel closure and dissection do not. */
export function isolationCameraKey(state:SceneState,aspect:number):string {
 return state.isolate?JSON.stringify([[...(state.isolatedPartIds??state.selected)],state.reset,aspect]):'';
}
/** Direct visible-member picks and Included entries share persistent assembly semantics. */
export function selectAssemblyMember(state:SceneState,identity:IdentityIndex,partId:string):SceneState {
 const representation=identity.representationForPart(partId);
 if(!representation||representation.modelId!==identity.modelId)return state;
 const ids=state.isolatedRepresentationIds??representationIdsForPartIds(identity,state.selected);
 const scope=hiddenPartIdsForModel(identity,ids);
 const next=selectRepresentations(state,identity,[partId]);
 return state.isolate&&scope.has(partId)?{...next,workspaceInspector:state.workspaceInspector,isolate:true,isolatedRepresentationIds:ids,isolatedPartIds:scope}:next;
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
