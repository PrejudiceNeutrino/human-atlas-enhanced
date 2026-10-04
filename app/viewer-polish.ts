import {DEFAULT_VISIBLE,SYSTEMS,type Atlas,type SystemId} from './anatomy.ts';
import type {IdentityIndex} from './identity-index';
import type {ModelId,MeshRepresentation} from './identity-contracts';
import type {RegionIndex} from './regions';
import {BODY_REGION,type RegionId} from './region-contracts.ts';
import type {AreaIndex} from './areas';
import type {TeachingArea,AreaId} from './area-contracts';
import type {ViewerModel} from './model-registry';

/** Presentation groups use the canonical preferred affiliation, then canonical order. */
export function teachingAreaMenuGroups(regions:RegionIndex,areas:AreaIndex) {
 return regions.regions().filter(region=>region.id!==BODY_REGION).map(region=>({
  region,areas:areas.areas().filter(area=>area.regionIds[0]===region.id),
 })).filter(group=>group.areas.length>0);
}
export function isAreaRelevantToRegion(area:TeachingArea,regionId:RegionId):boolean {
 return regionId!==BODY_REGION&&area.regionIds.includes(regionId);
}

/** Inventory ignores visibility, hidden state and selection; an area supersedes its context. */
export function scopeRepresentations(atlas:Atlas,identity:IdentityIndex,regions:RegionIndex,areas:AreaIndex,regionId:RegionId,areaId:AreaId|null):MeshRepresentation[] {
 if(areaId)return areas.representationsForArea(areaId,identity.modelId).map(r=>r.representation);
 if(regionId!==BODY_REGION)return regions.representationsForRegion(regionId,identity.modelId).map(r=>r.representation);
 return atlas.parts.map(part=>identity.representationForPart(part.id)).filter((r):r is MeshRepresentation=>!!r);
}
export function systemCountsForScope(representations:readonly MeshRepresentation[],atlas:Atlas,modelId:ModelId):Record<SystemId,number> {
 const counts=Object.fromEntries(SYSTEMS.map(system=>[system.id,0])) as Record<SystemId,number>;
 const parts=new Map(atlas.parts.map(part=>[part.id,part])),seen=new Set<string>();
 for(const representation of representations){
  if(representation.modelId!==modelId||seen.has(representation.id))continue;
  const part=parts.get(representation.sourcePartId.value);
  if(part){seen.add(representation.id);counts[part.system]++;}
 }
 return counts;
}
export function defaultVisibleForModel(model:ViewerModel):SystemId[] {
 if(model==='male')return DEFAULT_VISIBLE.filter(system=>system!=='reproductive');
 return model==='female-reference'?[...DEFAULT_VISIBLE,'integumentary']:[...DEFAULT_VISIBLE];
}
