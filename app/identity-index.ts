import type {Atlas, Part} from './anatomy';
import type {AnatomicalConcept, CanonicalConceptId, ConceptRepresentationLink, ExternalId, ExternalNamespace, MeshRepresentation, Model, ModelId, RepresentationId, ResolvedRepresentation, ReviewStatus} from './identity-contracts';

export interface SourceConceptMapping {
 sourceConceptId: string;
 canonicalId: CanonicalConceptId;
 relation: 'exact'|'candidate';
 reviewStatus: ReviewStatus;
}
export interface IdentitySidecar {
 schemaVersion: 1;
 mappingRevision: string;
 concepts: {id:CanonicalConceptId; externalId:{namespace:ExternalNamespace; value:string; relation:'exact'|'candidate'}; sourceModelId:ModelId; reviewStatus:ReviewStatus}[];
 mappings: Record<ModelId,SourceConceptMapping[]>;
 candidates: {left:CanonicalConceptId; right:CanonicalConceptId; sourceConceptId:string; reason:string}[];
}

export function namespaceForConceptId(id:string):ExternalNamespace {
 if(/^FMA:?\d+$/.test(id))return 'FMA';
 if(/^UBERON:\d+$/.test(id))return 'UBERON';
 if(id.startsWith('HRA:'))return 'HRA-node';
 return 'other';
}
export function namespaceForPartId(id:string):ExternalNamespace {
 if(/^FJ\d+M?$/.test(id))return 'BP3D-part';
 if(/^(VH_|Allen|Yale)/.test(id))return 'HRA-node';
 return 'other';
}
export function representationId(modelId:ModelId,partId:string):RepresentationId {
 return `atlas:representation:${modelId}:${encodeURIComponent(partId)}`;
}
export function partLaterality(part:Pick<Part,'id'|'name'>):{side:MeshRepresentation['laterality'];basis:MeshRepresentation['lateralityBasis']} {
 if(/(?:_L|\.L|-L)$/.test(part.id))return {side:'left',basis:'source-id'};
 if(/(?:_R|\.R|-R)$/.test(part.id))return {side:'right',basis:'source-id'};
 const left=/\bleft\b/i.test(part.name),right=/\bright\b/i.test(part.name);
 if(left!==right)return {side:left?'left':'right',basis:'source-name'};
 if(left&&right)return {side:'bilateral',basis:'source-name'};
 return {side:'unknown',basis:'unresolved'};
}

export interface IdentityIndex {
 modelId: ModelId;
 sourceConceptCanonicalId(sourceConceptId:string):CanonicalConceptId|undefined;
 representationForPart(sourcePartId:string):MeshRepresentation|undefined;
 representation(id:RepresentationId):MeshRepresentation|undefined;
 resolve(conceptId:CanonicalConceptId,modelId:ModelId):ResolvedRepresentation[];
 concept(id:CanonicalConceptId):AnatomicalConcept|undefined;
 representationCount:number;
 linkCount:number;
}

/** Builds only lightweight identity records; vertex buffers remain owned by the existing manifest/scene. */
export function createIdentityIndex(model:Model,atlas:Atlas,sidecar:IdentitySidecar):IdentityIndex {
 if(sidecar.schemaVersion!==1||sidecar.mappingRevision!==model.mappingRevision)throw new Error(`Identity mapping revision mismatch for ${model.id}`);
 const mappings=sidecar.mappings[model.id];
 if(!Array.isArray(mappings))throw new Error(`Missing identity mappings for ${model.id}`);
 const sourceToCanonical=new Map<string,CanonicalConceptId>();
 for(const item of mappings){if(sourceToCanonical.has(item.sourceConceptId))throw new Error(`Duplicate source concept mapping ${item.sourceConceptId}`);sourceToCanonical.set(item.sourceConceptId,item.canonicalId);}
 const manifestConcepts=new Map(atlas.concepts.map(concept=>[concept.id,concept]));
 if(manifestConcepts.size!==atlas.concepts.length||mappings.length!==manifestConcepts.size)throw new Error(`Identity coverage mismatch for ${model.id}`);
 for(const item of mappings)if(!manifestConcepts.has(item.sourceConceptId))throw new Error(`Identity mapping references missing source concept ${item.sourceConceptId}`);
 const concepts=new Map<CanonicalConceptId,AnatomicalConcept>();
 for(const seed of sidecar.concepts){
  const externalId:ExternalId={namespace:seed.externalId.namespace,value:seed.externalId.value,relation:seed.externalId.relation,evidence:{sourceId:seed.sourceModelId},review:{status:seed.reviewStatus}};
  concepts.set(seed.id,{id:seed.id,externalIds:[externalId],review:{status:seed.reviewStatus}});
 }
 const parts=new Map(atlas.parts.map(part=>[part.id,part]));
 if(parts.size!==atlas.parts.length)throw new Error(`Duplicate part IDs in ${model.id}`);
 const representations=new Map<string,MeshRepresentation>();
 const setId=model.geometrySetIds[0];
 if(!setId)throw new Error(`No geometry set for ${model.id}`);
 for(const part of atlas.parts){
  if(!atlas.chunks[part.chunk])throw new Error(`Missing chunk for ${part.id}`);
  const side=partLaterality(part);
  representations.set(part.id,{id:representationId(model.id,part.id),modelId:model.id,geometrySetId:setId,frameId:model.frameId,sourcePartId:{namespace:namespaceForPartId(part.id),value:part.id,relation:'exact',evidence:{sourceId:model.id,sourcePath:model.manifestUrl},review:{status:'source-derived'}},chunkIndex:part.chunk,offsets:{positions:part.positions,normals:part.normals,indices:part.indices},vertexCount:part.vertexCount,indexCount:part.indexCount,bounds:part.bounds,laterality:side.side,lateralityBasis:side.basis,available:true});
 }
 const byRepresentationId=new Map([...representations.values()].map(r=>[r.id,r]));
 const byCanonical=new Map<CanonicalConceptId,ResolvedRepresentation[]>();
 let linkCount=0;
 for(const mapping of mappings){
  const source=manifestConcepts.get(mapping.sourceConceptId)!;
  const list=byCanonical.get(mapping.canonicalId)??[];
  const seen=new Set(list.map(item=>item.representation.id));
  for(const partId of source.elements){
   const part=parts.get(partId),representation=representations.get(partId);
   if(!part||!representation)throw new Error(`Dangling source element ${partId} in ${source.id}`);
   if(seen.has(representation.id))continue;
   const direct=part.conceptId===source.id||source.id===`PART_${part.id}`||source.id===`HRA:${part.id}`;
   const link:ConceptRepresentationLink={conceptId:mapping.canonicalId,representationId:representation.id,relation:mapping.relation==='candidate'?'candidate':direct?'exact':'part-of',evidence:{sourceId:source.id,sourcePath:model.manifestUrl},review:{status:mapping.reviewStatus}};
   list.push({representation,link,sourcePart:part});seen.add(representation.id);linkCount++;
  }
  byCanonical.set(mapping.canonicalId,list);
 }
 return {
  modelId:model.id,
  sourceConceptCanonicalId:id=>sourceToCanonical.get(id),
  representationForPart:id=>representations.get(id),
  representation:id=>byRepresentationId.get(id),
  resolve:(id,requestedModel)=>requestedModel===model.id?[...(byCanonical.get(id)??[])]:[],
  concept:id=>concepts.get(id),
  representationCount:representations.size,
  linkCount,
 };
}
