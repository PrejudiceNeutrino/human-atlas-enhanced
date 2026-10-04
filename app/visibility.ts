import type {BreastView, Part, SceneState, SystemId} from './anatomy';

/** Future filters are neutral until populated. Loaded state is renderer-specific. */
export interface VisibilityContext {
 selected: ReadonlySet<string>;
 systems: ReadonlySet<SystemId>;
 loaded?: boolean;
 regionMember?: boolean;
 areaMember?: boolean;
 depthMember?: boolean;
 hidden?: boolean;
 contextGeometry?: boolean;
 hasSolid?: boolean;
}
export interface VisibilityResult {displayed:boolean; pickable:boolean; packingEligible:boolean}
export type VisibilityState = Pick<SceneState,'isolate'|'isolatedPartIds'|'breastView'|'regionPartIds'|'areaId'|'areaPartIds'|'hiddenPartIds'>;

export function isBodySurface(part:Pick<Part,'system'|'id'>):boolean {
 return part.system==='integumentary'&&!(part.id.startsWith('VH_F_')&&part.id!=='VH_F_skin');
}

export function resolveVisibility(part:Part,state:VisibilityState,context:VisibilityContext):VisibilityResult {
 const selected=context.selected.has(part.id);
 if(context.loaded===false||context.hidden||state.hiddenPartIds?.has(part.id))return {displayed:false,pickable:false,packingEligible:false};
 if(state.isolate&&!(state.isolatedPartIds?.has(part.id)??selected))return {displayed:false,pickable:false,packingEligible:false};
 if(!state.isolate&&!selected){
  // Active teaching stations supersede incomplete broad-region evidence.
  const navigationMember=state.areaId?(context.areaMember??state.areaPartIds?.has(part.id)??false):(context.regionMember??state.regionPartIds?.has(part.id));
  if(!context.systems.has(part.system)||navigationMember===false||(!state.areaId&&context.areaMember===false)||context.depthMember===false)return {displayed:false,pickable:false,packingEligible:false};
  const breast=part.system==='mammary'||(part.system==='integumentary'&&part.id.startsWith('VH_F_')&&part.id!=='VH_F_skin');
  if(breast&&state.breastView==='muscle')return {displayed:false,pickable:false,packingEligible:false};
  if(state.breastView==='cutaway'&&/^VH_F_fat_[LR]$/.test(part.id))return {displayed:false,pickable:false,packingEligible:false};
 }
 const contextual=!!context.contextGeometry;
 return {displayed:true,pickable:!contextual&&(!context.hasSolid||!isBodySurface(part)),packingEligible:!contextual};
}

export function currentVisibilityContext(state:SceneState):VisibilityContext {
 return {selected:new Set(state.selected),systems:new Set(state.visible)};
}

/** Compatibility entry point for code and tests that already call partIsVisible. */
export function partIsVisible(part:Part,state:SceneState,lookups?:{selected:Set<string>;visible:Set<SystemId>}):boolean {
 return resolveVisibility(part,state,{selected:lookups?.selected??new Set(state.selected),systems:lookups?.visible??new Set(state.visible)}).displayed;
}
