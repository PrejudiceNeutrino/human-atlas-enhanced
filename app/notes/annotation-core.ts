// Adapted from Toye's annotation-core: verified offsets, unique context, bounded backups.
export const ANNOTATION_VERSION = 2;
export const ANNOTATION_EXPORT_KIND = 'human-atlas-personal-annotations';
export const MAX_BACKUP_BYTES = 5_000_000;
export const MAX_ANNOTATIONS = 5000;
export const MAX_SELECTION_CHARACTERS = 100_000;
export const MAX_SELECTION_SEGMENTS = 500;
export interface LearnTarget { kind: 'learn'; subjectId: string; tabId: string; sourceId: string }
export interface AnnotationAnchor {
  blockId: string; start: number; end: number; exact: string; prefix: string; suffix: string;
  blockText: string; contentVersion: string;
}
export interface Annotation {
  id: string; schemaVersion: 1 | 2; target: LearnTarget; anchor: AnnotationAnchor;
  segments?: AnnotationSegment[]; selectionKind?: 'text' | 'heading' | 'range';
  note: string; style: 'ochre'; status: 'anchored' | 'unresolved'; createdAt: string; modifiedAt: string;
}
export interface AnnotationSegment { target: LearnTarget; anchor: AnnotationAnchor }
export const annotationSegments = (record: Pick<Annotation, 'target' | 'anchor' | 'segments'>): AnnotationSegment[] => record.segments ?? [{target:record.target,anchor:record.anchor}];
export const annotationExcerpt = (record: Annotation) => annotationSegments(record).map(segment=>segment.anchor.exact).join('\n\n');
export interface TextBlock { id: string; text: string; order: number }
export interface ResolvedAnchor { blockId: string; start: number; end: number; method: 'offset' | 'context' }
export const targetKey = (target: LearnTarget) => `${target.subjectId}|${target.tabId}|${target.sourceId}`;
export const rangesOverlap = (a: {start:number;end:number}, b: {start:number;end:number}) => a.start < b.end && b.start < a.end;
export const fingerprint = (text: string) => {
  let a = 2166136261, b = 3335557771;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b ^ text.charCodeAt(i), 2246822519); }
  return `v1-${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
};
export function resolveAnchorText(text: string, anchor: AnnotationAnchor): Omit<ResolvedAnchor, 'blockId'> | null {
  const candidates: number[] = [];
  for (let from = 0; from <= text.length - anchor.exact.length;) {
    const start = text.indexOf(anchor.exact, from); if (start < 0 || !anchor.exact) break;
    const end = start + anchor.exact.length;
    if ((!anchor.prefix || text.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix) &&
        (!anchor.suffix || text.slice(end, end + anchor.suffix.length) === anchor.suffix)) candidates.push(start);
    from = start + 1;
  }
  // Offsets are authoritative only for an unchanged verified paragraph snapshot.
  if (text === anchor.blockText && text.slice(anchor.start, anchor.end) === anchor.exact)
    return { start: anchor.start, end: anchor.end, method: 'offset' };
  return candidates.length === 1 ? { start: candidates[0], end: candidates[0] + anchor.exact.length, method: 'context' } : null;
}
function sameParagraph(before: string, after: string) {
  if (before === after) return true;
  if (before.length < 40 || after.length / before.length < .65 || after.length / before.length > 1.5) return false;
  let prefix = 0, suffix = 0;
  while (prefix < Math.min(before.length, after.length) && before[prefix] === after[prefix]) prefix++;
  while (suffix < Math.min(before.length, after.length) && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++;
  if (Math.max(prefix, suffix) < 24) return false;
  const tokens = (value: string) => new Set(value.toLocaleLowerCase('en').match(/[\p{L}\p{N}]+/gu) ?? []);
  const a = tokens(before), b = tokens(after), common = [...a].filter(word => b.has(word)).length;
  return common / Math.max(a.size, b.size, 1) >= .8;
}
export function resolveStoredAnchor(blocks: TextBlock[], anchor: AnnotationAnchor): ResolvedAnchor | null {
  // Content IDs survive paragraph insertion/reordering. Edits require a unique, strongly
  // matching paragraph in the SAME explicit source section, then exact nearby context.
  const exact = blocks.filter(block => block.text === anchor.blockText);
  const candidates = exact.length ? exact : blocks.filter(block => sameParagraph(anchor.blockText, block.text));
  if (candidates.length !== 1) return null;
  const resolved = resolveAnchorText(candidates[0].text, anchor);
  return resolved ? { ...resolved, blockId: candidates[0].id } : null;
}
const safeId = /^[a-zA-Z0-9_-]{8,100}$/;
const safeKey = /^[a-zA-Z0-9_/:.-]{1,400}$/;
const date = (value: unknown): value is string => typeof value === 'string' && value.length <= 40 && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
function validateSegment(value:unknown, validTabs:ReadonlyMap<string,ReadonlySet<string>>, maxExcerpt:number):AnnotationSegment|null {
  if (!value || typeof value !== 'object') return null;
  const {anchor:a,target:t}=value as AnnotationSegment;
  if (!t || t.kind !== 'learn' || !validTabs.get(t.subjectId)?.has(t.tabId) || typeof t.sourceId !== 'string' || !safeKey.test(t.sourceId) ||
      !a || typeof a.blockId !== 'string' || !safeKey.test(a.blockId) ||
      !Number.isSafeInteger(a.start) || !Number.isSafeInteger(a.end) || a.start < 0 || a.end <= a.start || a.end > 30000 ||
      typeof a.exact !== 'string' || !a.exact.trim() || a.exact.length > maxExcerpt || a.end - a.start !== a.exact.length ||
      typeof a.blockText !== 'string' || a.blockText.length > 30000 || a.blockText.slice(a.start, a.end) !== a.exact ||
      typeof a.prefix !== 'string' || a.prefix.length > 64 || typeof a.suffix !== 'string' || a.suffix.length > 64 ||
      typeof a.contentVersion !== 'string' || !/^v1-[a-f0-9]{16}$/.test(a.contentVersion))return null;
  return {target:{kind:'learn',subjectId:t.subjectId,tabId:t.tabId,sourceId:t.sourceId},
    anchor:{blockId:a.blockId,start:a.start,end:a.end,exact:a.exact,prefix:a.prefix,suffix:a.suffix,blockText:a.blockText,contentVersion:a.contentVersion}};
}
export function validateAnnotation(value: unknown, validTabs: ReadonlyMap<string, ReadonlySet<string>>): Annotation | null {
  if (!value || typeof value !== 'object') return null;
  const item=value as Annotation;
  if (![1,2].includes(item.schemaVersion) || typeof item.id !== 'string' || !safeId.test(item.id) ||
      typeof item.note !== 'string' || item.note.length > 10000 || item.style !== 'ochre' ||
      !['anchored', 'unresolved'].includes(item.status) || !date(item.createdAt) || !date(item.modifiedAt) || Date.parse(item.modifiedAt) < Date.parse(item.createdAt)) return null;
  const primary=validateSegment(item,validTabs,item.schemaVersion===1?5000:30000);if(!primary)return null;
  // Explicit projection drops imported unknown fields, prototype keys and URLs.
  const projected:Annotation = { id:item.id, schemaVersion:item.schemaVersion, ...primary,
    note:item.note,style:'ochre',status:item.status,createdAt:item.createdAt,modifiedAt:item.modifiedAt };
  if(item.schemaVersion===2){
    if(!Array.isArray(item.segments)||!item.segments.length||item.segments.length>MAX_SELECTION_SEGMENTS||!['text','heading','range'].includes(item.selectionKind??''))return null;
    const segments:AnnotationSegment[]=[];
    for(const segment of item.segments){
      const next=validateSegment(segment,validTabs,30000);
      if(!next||next.target.subjectId!==primary.target.subjectId||next.target.tabId!==primary.target.tabId)return null;
      if(segments.some(prior=>targetKey(prior.target)===targetKey(next.target)&&prior.anchor.blockId===next.anchor.blockId&&rangesOverlap(prior.anchor,next.anchor)))return null;
      segments.push(next);
    }
    if(JSON.stringify(segments[0])!==JSON.stringify({target:projected.target,anchor:projected.anchor})||segments.reduce((sum,segment)=>sum+segment.anchor.exact.length,0)>MAX_SELECTION_CHARACTERS)return null;
    if((segments.length>1)!==(item.selectionKind==='range'))return null;
    projected.segments=segments;projected.selectionKind=item.selectionKind;
  }
  return projected;
}
export function parseAnnotationExport(value: unknown, validTabs: ReadonlyMap<string, ReadonlySet<string>>) {
  if (!value || typeof value !== 'object') throw new Error('Choose a Human Atlas notes backup.');
  const backup = value as {kind?:unknown;schemaVersion?:unknown;exportedAt?:unknown;annotations?:unknown};
  if (backup.kind !== ANNOTATION_EXPORT_KIND || ![1,2].includes(backup.schemaVersion as number) || !date(backup.exportedAt) || !Array.isArray(backup.annotations)) throw new Error('This is not a supported Human Atlas notes backup.');
  if (backup.annotations.length > MAX_ANNOTATIONS) throw new Error('Backups may contain at most 5,000 highlights.');
  const parsed = backup.annotations.map(item => validateAnnotation(item, validTabs));
  return { annotations: parsed.filter((item): item is Annotation => !!item), invalid: parsed.filter(item => !item).length };
}
export function annotationsOverlap(a: Annotation, b: Annotation) {
  return annotationSegments(a).some(left=>annotationSegments(b).some(right=>targetKey(left.target)===targetKey(right.target)&&left.anchor.blockId===right.anchor.blockId&&rangesOverlap(left.anchor,right.anchor)));
}
export function mergeAnnotations(existing: Annotation[], incoming: Annotation[]) {
  const records = new Map(existing.map(item => [item.id,item])); let imported=0, updated=0, skipped=0;
  for (const item of incoming) {
    const prior = records.get(item.id);
    const identity=(record:Annotation)=>JSON.stringify(annotationSegments(record).map(segment=>[targetKey(segment.target),segment.anchor.exact]));
    if (prior && (Date.parse(item.modifiedAt) <= Date.parse(prior.modifiedAt) || identity(prior)!==identity(item))) { skipped++; continue; }
    if ((!prior && records.size >= MAX_ANNOTATIONS) || [...records.values()].some(other => other.id !== item.id && annotationsOverlap(other,item))) { skipped++; continue; }
    records.set(item.id,item); if (prior) updated++; else imported++;
  }
  return {records:[...records.values()],imported,updated,skipped};
}
