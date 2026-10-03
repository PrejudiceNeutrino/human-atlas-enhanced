import type {SceneState,SystemId} from './anatomy';
import {BODY_REGION,type RegionId} from './region-contracts.ts';

/** Region navigation preserves layers; a model switch preserves only canonical navigation. */
export function selectRegion(state:SceneState,regionId:RegionId):SceneState {
 return {...state,regionId,regionPartIds:undefined,regionFocus:undefined,areaId:null,areaPartIds:undefined,areaFocus:undefined,selected:[],isolate:false,explode:0,rotate:false,reset:state.reset+1};
}
export function resetViewer(state:SceneState,visible:SystemId[]):SceneState {
 return {breastView:'tissue',visible,regionId:BODY_REGION,selected:[],isolate:false,explode:0,rotate:false,view:'three-quarter',reset:state.reset+1};
}
export function switchRegionModel(state:SceneState,visible:SystemId[]):SceneState {
 return {...resetViewer(state,visible),regionId:state.regionId??BODY_REGION,areaId:state.areaId??null};
}
