import type {Atlas,SceneState,SystemId} from './anatomy';
import {SYSTEMS} from './anatomy.ts';
import type {IdentityIndex} from './identity-index';
import {selectRepresentations} from './hide-restore.ts';

/** Included members drill down inside the existing isolation, unlike search/direct picks. */
export function selectIncludedMember(state:SceneState,identity:IdentityIndex,partId:string):SceneState {
 if(!state.selected.includes(partId)||!identity.representationForPart(partId))return state;
 return {...selectRepresentations(state,identity,[partId]),isolate:state.isolate};
}
/** Same model-appropriate adult inventory for the All preset and Show all systems. */
export function allSystemsForAtlas(atlas:Atlas):SystemId[] {
 const present=new Set(atlas.parts.map(part=>part.system));
 return SYSTEMS.filter(system=>system.id!=='pregnancy'&&present.has(system.id)).map(system=>system.id);
}
export function showAllSystems(state:SceneState,systems:readonly SystemId[]):SceneState {
 return {...state,visible:[...systems],selected:[],isolate:false,breastView:'tissue'};
}
export function toggleAllSystems(state:SceneState,systems:readonly SystemId[]):SceneState {
 return systems.some(id=>state.visible.includes(id))?{...state,visible:[],selected:[],isolate:false}:showAllSystems(state,systems);
}
