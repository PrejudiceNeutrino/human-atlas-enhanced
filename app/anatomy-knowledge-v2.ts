import pilot from '../data/anatomy/knowledge/poc-v2.json';
import type {CanonicalConceptId,ModelId,ReviewStatus} from './identity-contracts';
import type {SystemId} from './anatomy';
import type {IdentityIndex} from './identity-index';

export type KnowledgeKind='muscle'|'bone'|'nerve'|'artery'|'vein'|'organ'|'duct'|'duct-network'|'group'|'ligament'|'joint'|'other';
export type EvidenceField={text:string;sourceIds:string[];review:{status:ReviewStatus;note?:string}};
export type Terminology={preferredEnglish:{value:string;sourceIds:string[];review:{status:ReviewStatus}};latinCandidate?:{value:string;sourceIds:string[];review:{status:ReviewStatus;note?:string}};aliases:{value:string;kind:'synonym'|'abbreviation'|'legacy';review:{status:ReviewStatus}}[]};
export type KnowledgeDetails={
 origin?:EvidenceField;insertion?:EvidenceField;innervation?:EvidenceField;
 arterialSupply?:EvidenceField;roots?:EvidenceField;course?:EvidenceField;
 motorDistribution?:EvidenceField;sensoryDistribution?:EvidenceField;
 territory?:EvidenceField;articulations?:EvidenceField;drainage?:EvidenceField;
 internalOrganization?:EvidenceField;physiology?:EvidenceField;
 actions?:EvidenceField[];landmarks?:EvidenceField[];attachments?:EvidenceField[];
 branches?:EvidenceField[];members?:EvidenceField[];
};
export interface KnowledgeRecord {
 id:CanonicalConceptId;sourceConceptIds:string[];textOnly?:boolean;
 inheritsFrom?:CanonicalConceptId;laterality?:'left'|'right';
 system:SystemId;kind:KnowledgeKind;terminology:Terminology;
 summary:EvidenceField;definition:EvidenceField;development?:EvidenceField;
 details:KnowledgeDetails;review:{status:ReviewStatus;note?:string};
}
export type RelationshipPredicate='innervated-by'|'supplied-by'|'originates-from'|'inserts-on'|'part-of'|'drains-into'|'connected-via'|'joins'|'continues-as'|'adjacent-to'|'is-a-lateral-instance-of';
export interface KnowledgeRelationship {
 id:string;subjectConceptId:CanonicalConceptId;predicate:RelationshipPredicate;
 objectConceptId:CanonicalConceptId;evidence:{sourceIds:string[]};
 review:{status:ReviewStatus;note?:string};
}
export interface KnowledgeSource {id:string;title:string;url:string;kind:string;license:string;use:string}
export interface KnowledgeDataset {
 schemaVersion:2;mappingRevision:string;editorialStatus:string;
 sources:KnowledgeSource[];records:KnowledgeRecord[];relationships:KnowledgeRelationship[];
 clinicalLinks:unknown[];knowledgeOnlyConceptIds:CanonicalConceptId[];notes:string[];
}
const dataset=pilot as KnowledgeDataset;
export const KNOWLEDGE_V2=dataset;
const entries=new Map(dataset.records.map(record=>[record.id,record]));
const outgoing=new Map<CanonicalConceptId,KnowledgeRelationship[]>();
const incoming=new Map<CanonicalConceptId,KnowledgeRelationship[]>();
for(const rel of dataset.relationships){
 outgoing.set(rel.subjectConceptId,[...(outgoing.get(rel.subjectConceptId)??[]),rel]);
 incoming.set(rel.objectConceptId,[...(incoming.get(rel.objectConceptId)??[]),rel]);
}
export function knowledgeByCanonicalId(id:CanonicalConceptId):KnowledgeRecord|undefined{return entries.get(id);}
export function knowledgeForSourceConcept(sourceId:string,identity:IdentityIndex):KnowledgeRecord|undefined{
 const canonicalId=identity.sourceConceptCanonicalId(sourceId);
 return canonicalId?entries.get(canonicalId):undefined;
}
export function knowledgeRelationships(id:CanonicalConceptId):{outgoing:readonly KnowledgeRelationship[];incoming:readonly KnowledgeRelationship[]}{
 return {outgoing:outgoing.get(id)??[],incoming:incoming.get(id)??[]};
}
/** Fill missing property groups from a common anatomical record; never overwrite sided facts. */
export function resolvedKnowledge(id:CanonicalConceptId):KnowledgeRecord|undefined{
 const item=entries.get(id);
 if(!item)return;
 if(!item.inheritsFrom)return item;
 const base=entries.get(item.inheritsFrom);
 if(!base||base.inheritsFrom)return item;
 if(base.kind!==item.kind)return item;
 return {...base,...item,terminology:item.terminology,summary:item.summary,definition:item.definition,details:{...base.details,...item.details}};
}
export function knowledgeNavigationTarget(targetId:CanonicalConceptId,identity:IdentityIndex,modelId:ModelId){
 const record=entries.get(targetId);
 if(!record)return {status:'unknown' as const};
 const representations=identity.resolve(targetId,modelId).filter(item=>item.representation.available&&item.representation.vertexCount>0);
 return {status:representations.length?'modeled' as const:'text-only' as const,record,representationIds:representations.map(item=>item.representation.id)};
}
