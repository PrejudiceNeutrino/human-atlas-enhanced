import type {SceneState} from './anatomy';
import type {RepresentationId} from './identity-contracts';
import type {IdentityIndex} from './identity-index';

/** Only known representations from this model's identity index may enter hidden state. */
export function representationIdsForPartIds(identity:IdentityIndex,partIds:readonly string[]):RepresentationId[] {
 const ids=new Set<RepresentationId>();
 for(const partId of partIds){const r=identity.representationForPart(partId);if(r?.modelId===identity.modelId)ids.add(r.id);}
 return [...ids];
}

/** Transient renderer input. Exact lookup ignores raw, malformed, unknown and foreign IDs. */
export function hiddenPartIdsForModel(identity:IdentityIndex,ids:readonly RepresentationId[]=[]):ReadonlySet<string> {
 const parts=new Set<string>();
 for(const id of ids){const r=identity.representation(id);if(r?.modelId===identity.modelId)parts.add(r.sourcePartId.value);}
 return parts;
}

export function hideSelectedRepresentations(state:SceneState,identity:IdentityIndex):SceneState {
 return {...state,hiddenRepresentationIds:[...new Set([...(state.hiddenRepresentationIds??[]),...representationIdsForPartIds(identity,state.selected)])],selected:[],isolate:false,rotate:false,inspectorOpen:false};
}

/** Search and direct selection restore only their own current-model representations, atomically. */
export function selectRepresentations(state:SceneState,identity:IdentityIndex,partIds:readonly string[]):SceneState {
 const ids=new Set(representationIdsForPartIds(identity,partIds));
 const selected=[...new Set(partIds)].filter(id=>{const r=identity.representationForPart(id);return !!r&&ids.has(r.id);});
 const hidden=state.hiddenRepresentationIds??[],remaining=hidden.filter(id=>!ids.has(id));
 return {...state,hiddenRepresentationIds:remaining.length===hidden.length?hidden:remaining,selected,isolate:false,rotate:false};
}

export function restoreHiddenRepresentations(state:SceneState):SceneState {
 return {...state,hiddenRepresentationIds:[]};
}
