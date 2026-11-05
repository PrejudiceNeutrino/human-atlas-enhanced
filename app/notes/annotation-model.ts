import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { annotationSegments, fingerprint, resolveAnchorText, resolveStoredAnchor, rangesOverlap, targetKey, type Annotation, type AnnotationSegment, type LearnTarget, type TextBlock } from './annotation-core';

interface MarkdownNode { type:string; value?:string; children?:MarkdownNode[]; data?:{hProperties?:Record<string,unknown>} }
const plainText=(node:MarkdownNode):string=>node.type==='html'?'':node.type==='break'?'\n':node.value??node.children?.map(plainText).join('')??'';
const containsList=(node:MarkdownNode):boolean=>node.children?.some(child=>child.type==='list'||containsList(child))??false;
export function collectBlocks(tree: Root, decorate=false):TextBlock[] {
  const blocks:TextBlock[]=[],duplicates=new Map<string,number>();
  const visit=(node:MarkdownNode,insideList=false)=>{
    const eligible=node.type==='heading'||(node.type==='paragraph'&&!insideList)||node.type==='tableCell'||(node.type==='listItem'&&!containsList(node));
    if(eligible){const text=plainText(node);if(text.trim()&&text.length<=30000){
      const base=`b-${fingerprint(node.type+'|'+text).slice(3)}`,n=duplicates.get(base)??0;duplicates.set(base,n+1);
      const id=`${base}-${n}`;blocks.push({id,text,order:blocks.length});
      if(decorate)node.data={...node.data,hProperties:{...node.data?.hProperties,'data-annotation-block':id}};
    }return;}
    node.children?.forEach(child=>visit(child,insideList||node.type==='listItem'));
  };visit(tree as unknown as MarkdownNode);return blocks;
}
const parser=unified().use(remarkParse).use(remarkGfm);
const cache=new Map<string,TextBlock[]>();
export function markdownBlocks(markdown:string){let blocks=cache.get(markdown);if(!blocks){blocks=collectBlocks(parser.parse(markdown));cache.set(markdown,blocks);}return blocks;}
export const annotationBlocksPlugin:Plugin<[],Root>=()=>tree=>{collectBlocks(tree,true);};
export const titleBlock=(text:string):TextBlock=>({id:`h-${fingerprint(text).slice(3)}`,text,order:0});
export interface AnnotationSource {
  target:LearnTarget;subjectTitle:string;tabTitle:string;title:string;headingId:string;disclosureId?:string;
  blocks:TextBlock[];version:string;order:number;route:string;
}
export function resolvedAnnotations(records:Annotation[],sources:AnnotationSource[]) {
  const bySource=new Map(sources.map(source=>[targetKey(source.target),source])),occupied=new Map<string,{start:number;end:number}[]>();
  return [...records].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id)).map(record=>{
    const segments:AnnotationSegment[]=[];
    for(const segment of annotationSegments(record)){
      const source=bySource.get(targetKey(segment.target));if(!source)return{...record,status:'unresolved' as const};
      const unchanged=source.version===segment.anchor.contentVersion?source.blocks.find(block=>block.id===segment.anchor.blockId&&block.text===segment.anchor.blockText):undefined;
      const verified=unchanged?resolveAnchorText(unchanged.text,segment.anchor):null;
      const resolved=verified&&unchanged?{...verified,blockId:unchanged.id}:resolveStoredAnchor(source.blocks,segment.anchor);
      const key=resolved?`${targetKey(source.target)}|${resolved.blockId}`:'';
      if(!resolved||(occupied.get(key)??[]).some(range=>rangesOverlap(range,resolved)))return{...record,status:'unresolved' as const};
      const text=source.blocks.find(block=>block.id===resolved.blockId)!.text;
      segments.push({target:segment.target,anchor:{...segment.anchor,blockId:resolved.blockId,start:resolved.start,end:resolved.end,
        blockText:text,prefix:text.slice(Math.max(0,resolved.start-48),resolved.start),suffix:text.slice(resolved.end,resolved.end+48),contentVersion:source.version}});
    }
    for(const segment of segments){const key=`${targetKey(segment.target)}|${segment.anchor.blockId}`;occupied.set(key,[...occupied.get(key)??[],segment.anchor]);}
    return {...record,status:'anchored' as const,target:segments[0].target,anchor:segments[0].anchor,...(record.schemaVersion===2?{segments}: {})};
  });
}
