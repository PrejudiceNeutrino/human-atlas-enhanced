import { MAX_SELECTION_CHARACTERS, MAX_SELECTION_SEGMENTS, type AnnotationAnchor, type AnnotationSegment, type LearnTarget } from './annotation-core';
import type { AnnotationSource } from './annotation-model';
export interface PendingAnnotation {target:LearnTarget;anchor:AnnotationAnchor;segments:AnnotationSegment[];selectionKind:'text'|'heading'|'range';left:number;top:number}
export function captureAnnotationSelection(root:HTMLElement,sources:AnnotationSource[],selection:Selection|null):PendingAnnotation|null {
  if(!selection||selection.isCollapsed||selection.rangeCount!==1)return null;
  const range=selection.getRangeAt(0);
  if(!root.contains(range.startContainer)||!root.contains(range.endContainer))throw new Error('Select text within the current reading.');
  const segments:AnnotationSegment[]=[];let characters=0,firstBlock:HTMLElement|undefined;
  for(const block of root.querySelectorAll<HTMLElement>('[data-annotation-block]')){
    if(block.closest('[hidden],[aria-hidden="true"]')||!range.intersectsNode(block))continue;
    const blockRange=document.createRange();blockRange.selectNodeContents(block);
    const part=blockRange.cloneRange();
    if(range.compareBoundaryPoints(0,blockRange)>0)part.setStart(range.startContainer,range.startOffset);
    if(range.compareBoundaryPoints(2,blockRange)<0)part.setEnd(range.endContainer,range.endOffset);
    const exact=part.toString();if(!exact.trim())continue;
    const wrapper=block.closest<HTMLElement>('[data-annotation-source]');
    const source=sources.find(item=>item.target.sourceId===wrapper?.dataset.annotationSource&&item.target.subjectId===wrapper?.dataset.annotationSubject&&item.target.tabId===wrapper?.dataset.annotationTab);
    const text=block.textContent??'';
    if(!source||!source.blocks.some(item=>item.id===block.dataset.annotationBlock&&item.text===text))throw new Error('This passage changed. Select it again before saving.');
    if(segments.length&&(source.target.subjectId!==segments[0].target.subjectId||source.target.tabId!==segments[0].target.tabId))throw new Error('Select text within one reading tab.');
    const prefixRange=document.createRange();prefixRange.selectNodeContents(block);prefixRange.setEnd(part.startContainer,part.startOffset);
    const from=prefixRange.toString().length,to=from+exact.length;
    if(text.slice(from,to)!==exact)throw new Error('The selection changed. Please select the passage again.');
    characters+=exact.length;
    if(characters>MAX_SELECTION_CHARACTERS||segments.length>=MAX_SELECTION_SEGMENTS)throw new Error('Choose up to 100,000 characters or 500 text blocks at a time.');
    firstBlock??=block;
    segments.push({target:source.target,anchor:{blockId:block.dataset.annotationBlock!,start:from,end:to,exact,
      prefix:text.slice(Math.max(0,from-48),from),suffix:text.slice(to,to+48),blockText:text,contentVersion:source.version}});
  }
  if(!segments.length)throw new Error('Select a heading or passage in the reading.');
  const rect=range.getBoundingClientRect();
  return{...segments[0],segments,selectionKind:segments.length>1?'range':/^H[1-6]$/.test(firstBlock!.tagName)?'heading':'text',
    left:Math.max(12,Math.min(window.innerWidth-248,rect.left+rect.width/2-118)),top:Math.max(12,Math.min(window.innerHeight-68,rect.top-58))};
}
