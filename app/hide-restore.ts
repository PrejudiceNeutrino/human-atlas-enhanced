import type {SceneState} from './anatomy';
import type {MeshRepresentation,RepresentationId} from './identity-contracts';
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
 return {...state,hiddenRepresentationIds:[...new Set([...(state.hiddenRepresentationIds??[]),...representationIdsForPartIds(identity,state.selected)])],selected:[],rotate:false,inspectorOpen:false};
}

/** Search and direct selection restore only their own current-model representations, atomically. */
export function selectRepresentations(state:SceneState,identity:IdentityIndex,partIds:readonly string[]):SceneState {
 const ids=new Set(representationIdsForPartIds(identity,partIds));
 const selected=[...new Set(partIds)].filter(id=>{const r=identity.representationForPart(id);return !!r&&ids.has(r.id);});
 const hidden=state.hiddenRepresentationIds??[],remaining=hidden.filter(id=>!ids.has(id));
 return {...state,hiddenRepresentationIds:remaining.length===hidden.length?hidden:remaining,selected,isolate:false,isolatedRepresentationIds:undefined,isolatedPartIds:undefined,rotate:false};
}

export function restoreHiddenRepresentations(state:SceneState):SceneState {
 return {...state,hiddenRepresentationIds:[]};
}

/** Presentation order only: persistent IDs retain insertion order and duplicate hides never move a row. */
export function hiddenRepresentationsForModel(identity:IdentityIndex,ids:readonly RepresentationId[]=[]):MeshRepresentation[] {
 return [...new Set(ids)].reverse().map(id=>identity.representation(id)).filter((r):r is MeshRepresentation=>!!r&&r.modelId===identity.modelId);
}

export function restoreHiddenRepresentation(state:SceneState,id:RepresentationId):SceneState {
 return {...state,hiddenRepresentationIds:(state.hiddenRepresentationIds??[]).filter(hidden=>hidden!==id)};
}

/** Use the Hidden tab's authoritative newest-first current-model order. */
export function restoreNewestHidden(state:SceneState,identity:IdentityIndex):SceneState {
 const newest=hiddenRepresentationsForModel(identity,state.hiddenRepresentationIds)[0];
 return newest?restoreHiddenRepresentation(state,newest.id):state;
}
export function shouldRestoreNewest(event:HideKeyEvent):boolean {
 if(event.key.toLowerCase()!=='j'||event.ctrlKey||event.metaKey||event.altKey||event.defaultPrevented||event.isComposing||event.repeat)return false;
 const target=event.target as Element|null;
 return !target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="combobox"],[role="textbox"],[role="searchbox"],[role="slider"],[role="spinbutton"]');
}

type HideKeyEvent=Pick<KeyboardEvent,'key'|'target'|'ctrlKey'|'metaKey'|'altKey'|'defaultPrevented'|'isComposing'|'repeat'>;
/** Guard the shared hide action; names and canonical concepts never establish selection validity. */
export function shouldHideSelection(event:HideKeyEvent,identity:IdentityIndex|null,selected:readonly string[]):boolean {
 if(event.key.toLowerCase()!=='h'||event.ctrlKey||event.metaKey||event.altKey||event.defaultPrevented||event.isComposing||event.repeat||!identity)return false;
 const target=event.target as Element|null;
 if(target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="combobox"],[role="textbox"],[role="searchbox"]'))return false;
 return representationIdsForPartIds(identity,selected).length>0;
}
