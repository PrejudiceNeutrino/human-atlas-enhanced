import type {Part,SceneState} from './anatomy';

export const STAGE_CONTACT_Y=-.005;
export const GROUND_CLEARANCE=.0002;
export const ORGAN_SYSTEM_IDS=['cardiac','respiratory','digestive','urinary','endocrine','reproductive'] as const;

/** A fixed model transform from its own supporting foot geometry, independent of visibility. */
export function modelGrounding(parts:readonly Part[]):number {
 const support=parts.filter(p=>p.system==='skeletal'&&p.vertexCount>0);
 if(!support.length)return 0;
 return STAGE_CONTACT_Y+GROUND_CLEARANCE-Math.min(...support.map(p=>p.bounds[0][1]));
}
export function isOrgansPresentation(state:SceneState):boolean {
 return !state.isolate&&!state.areaId&&!state.regionFocus&&state.visible.length>0&&state.visible.every(id=>(ORGAN_SYSTEM_IDS as readonly string[]).includes(id));
}
/** Keep the established fit budget, composed on the shared canvas/caption/dock axis. */
export function focusedViewport(width:number,height:number){
 const mobile=width<768,landscape=height<600&&width>height;
 const left=mobile?20:width>1100?285:245,right=width-(mobile?62:90);
 const inset=(left+width-right)/2;
 return {left:mobile?left:inset,right:mobile?right:width-inset,top:landscape?130:mobile?320:130,bottom:height-(mobile?175:200)};
}
