import type {SceneState} from './anatomy';
import type {TeachingArea,AreaId} from './area-contracts';
import type {AreaIndex} from './areas';
import type {RegionIndex} from './regions';
import {BODY_REGION,type RegionId} from './region-contracts.ts';
import {selectRegion} from './region-navigation.ts';

export function selectArea(state:SceneState,area:TeachingArea|null):SceneState {
 const regionId=area?(area.regionIds.includes(state.regionId??BODY_REGION)?state.regionId!:area.regionIds[0]):state.regionId??BODY_REGION;
 return {...selectRegion(state,regionId),areaId:area?.id??null};
}
/** Invalid IDs normalize safely; valid areas choose a declared navigation context. */
export function normalizeNavigation(regionId:RegionId,areaId:AreaId|null,regions:RegionIndex,areas:AreaIndex){
 const region=regions.region(regionId)?regionId:BODY_REGION,area=areaId?areas.area(areaId):undefined;
 return {regionId:area?(area.regionIds.includes(region)?region:area.regionIds[0]):region,areaId:area?.id??null};
}
export function parseNavigation(search:string):{regionId:RegionId;areaId:AreaId|null}{
 const params=new URLSearchParams(search);
 return {regionId:(params.get('region')??BODY_REGION) as RegionId,areaId:(params.get('area')||null) as AreaId|null};
}
/** Preserve unrelated query parameters; never serialize derived geometry state. */
export function navigationSearch(search:string,regionId:RegionId,areaId:AreaId|null):string {
 const params=new URLSearchParams(search);
 if(regionId===BODY_REGION)params.delete('region');else params.set('region',regionId);
 if(areaId)params.set('area',areaId);else params.delete('area');
 return params.size?`?${params}`:'';
}
