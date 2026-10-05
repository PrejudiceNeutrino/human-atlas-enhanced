import type {DiscoveryEntry} from './anatomy-discovery';
import type {ModelId} from './identity-contracts';

/** Editorial discovery order, using existing stable source concept identities. */
export const FEATURED_ANATOMY_IDS=[
 'FMA7088', // Heart: chambers, muscle and vessels.
 'FMA50801', // Brain: central nervous anatomy.
 'FMA7197', // Liver: tissue and vascular assembly.
 'FMA7309', // Right lung: lobes and vessels.
 'FMA7310', // Left lung: complementary thoracic specimen.
 'FMA79876', // Brainstem.
 'FMA61680', // Abdomen proper: available on both public models.
 'FMA37347', // Muscle of pectoral girdle.
 'FMA9713', // Right hand: skeletal assembly.
 'FMA11343', // Right foot: skeletal assembly.
 'FMA37372', // Muscle of hand.
 'FMA37369', // Muscle of foot.
 'FMA10430', // Pelvic wall: model-specific inventory.
 'FMA71209', // Tributary of axillary vein: venous network.
] as const;

export function featuredAnatomy(entries:readonly DiscoveryEntry[],modelId:ModelId):DiscoveryEntry[] {
 const inventory=new Map(entries.filter(entry=>entry.modelId===modelId).map(entry=>[entry.id,entry]));
 const scopes=new Set<string>();
 return FEATURED_ANATOMY_IDS.flatMap(id=>{
  const entry=inventory.get(id);if(!entry)return [];
  const scope=[...entry.representationIds].sort().join('|');
  if(scopes.has(scope))return [];
  scopes.add(scope);return [entry];
 });
}
