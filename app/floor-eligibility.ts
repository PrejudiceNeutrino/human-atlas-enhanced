import type {SceneState} from './anatomy';
import {BODY_REGION} from './region-contracts.ts';

/** A grounding stage belongs to assembled figures, not navigation/specimen scopes. */
export function sceneFloorEligible(state:SceneState):boolean {
 return state.explode===0&&!state.isolate&&!state.areaId&&
  (state.regionId??BODY_REGION)===BODY_REGION&&
  (state.visible.includes('skeletal')||state.visible.includes('muscular'));
}
