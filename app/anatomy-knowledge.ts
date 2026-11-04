import pilot from '../data/anatomy/knowledge/pilot-v1.json';
import type {SystemId} from './anatomy';

export interface KnowledgeRecord {
 sourceConceptId:string; name:string; latin:string; aliases:string[];
 system:SystemId; kind:string; summary:string; definition:string; hierarchy:string[];
 function:string; origin?:string; insertion?:string; innervation?:string;
 bloodSupply?:string; relationships:string[]; development?:string; clinical?:string;
 reviewStatus:string; sourceIds:string[]; note:string;
}
export const KNOWLEDGE_SOURCES=pilot.sources;
export const KNOWLEDGE_RECORDS:readonly KnowledgeRecord[]=pilot.records as KnowledgeRecord[];
const byFma=new Map(KNOWLEDGE_RECORDS.filter(record=>record.sourceConceptId.startsWith('FMA')).map(record=>[record.sourceConceptId,record]));
const byExactLabel=new Map(KNOWLEDGE_RECORDS.filter(record=>record.sourceConceptId.startsWith('ATLAS:label:')).map(record=>[record.name.toLowerCase(),record]));
/** Name-independent lookup by the originating anatomical source concept.
 * A grouped source concept must not inherit an arbitrary member's record. */
export function anatomyKnowledge(sourceConceptId:string,system:SystemId,selectedName?:string):KnowledgeRecord|undefined {
 const record=byFma.get(sourceConceptId.replace(/^FMA:/,'FMA'))??(selectedName?byExactLabel.get(selectedName.toLowerCase()):undefined);
 return record?.system===system?record:undefined;
}
export function anatomyDisplayName(sourceConceptId:string,system:SystemId,fallback:string):string {
 return anatomyKnowledge(sourceConceptId,system)?.name??fallback;
}
