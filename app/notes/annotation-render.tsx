import { Children, cloneElement, createElement, isValidElement, useContext, type HTMLAttributes, type ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';
import type { Annotation } from './annotation-core';
import { annotationSegments } from './annotation-core';
import { titleBlock } from './annotation-model';
import { AnnotationDocumentContext, AnnotationRecordsContext, AnnotationSourceContext } from './annotation-context';

type BlockProps=HTMLAttributes<HTMLElement>&ExtraProps;
export function AnnotatedBlock({tag,node:_node,children,...props}:BlockProps&{tag:string}) {
  const scope=useContext(AnnotationDocumentContext),source=useContext(AnnotationSourceContext),records=useContext(AnnotationRecordsContext);
  const blockId=(props as Record<string,unknown>)['data-annotation-block'];
  const selected=records.filter(record=>record.status==='anchored').flatMap(record=>annotationSegments(record).filter(segment=>segment.target.subjectId===scope?.subjectId&&segment.target.tabId===scope?.tabId&&segment.target.sourceId===source&&segment.anchor.blockId===blockId).map(segment=>({...record,...segment})));
  return createElement(tag,{...props,...(tag==='th'?{scope:'col'}:{})},selected.length?highlightedChildren(children,selected):children);
}
// Stable component types preserve DOM selection/focus when annotation records change.
export const AnnotationParagraph=(props:BlockProps)=><AnnotatedBlock tag="p" {...props}/>;
export const AnnotationListItem=(props:BlockProps)=><AnnotatedBlock tag="li" {...props}/>;
export const AnnotationTableHeader=(props:BlockProps)=><AnnotatedBlock tag="th" {...props}/>;
export const AnnotationTableCell=(props:BlockProps)=><AnnotatedBlock tag="td" {...props}/>;

export function AnnotationHeading({as,sourceId,children,...props}:HTMLAttributes<HTMLElement>&{as:'h2'|'h3'|'h4';sourceId:string;children:string}) {
  const scope=useContext(AnnotationDocumentContext);
  return <AnnotationSourceContext value={sourceId}><AnnotatedBlock tag={as} {...props}
    data-annotation-block={titleBlock(children).id} data-annotation-source={sourceId}
    data-annotation-subject={scope?.subjectId} data-annotation-tab={scope?.tabId}>{children}</AnnotatedBlock></AnnotationSourceContext>;
}

/** Render mark fragments without moving React-owned DOM or losing inline emphasis. */
export function highlightedChildren(children:ReactNode,records:Annotation[]) {
  let offset=0;
  const walk=(value:ReactNode,insideLink=false):ReactNode=>{
    if(typeof value==='string'||typeof value==='number'){
      const text=String(value),start=offset;offset+=text.length;
      const cuts=new Set([0,text.length]);
      for(const record of records)for(const point of [record.anchor.start,record.anchor.end])if(point>start&&point<offset)cuts.add(point-start);
      const points=[...cuts].sort((a,b)=>a-b);
      return points.slice(0,-1).map((point,index)=>{
        const end=points[index+1],record=records.find(item=>item.anchor.start<=start+point&&item.anchor.end>=start+end);
        const content=text.slice(point,end);if(!record)return content;
        const first=start+point===record.anchor.start;
        return <mark key={`${start+point}-${record.id}`} data-annotation-id={record.id} data-annotation-first={first||undefined}
          data-has-note={!!record.note||undefined} className="annotation-highlight" role={first&&!insideLink?'button':undefined}
          tabIndex={first&&!insideLink?0:undefined} aria-haspopup={first&&!insideLink?'dialog':undefined} title={record.note?'Open personal note':'Open highlight'}>{content}</mark>;
      });
    }
    if(isValidElement<{children?:ReactNode;href?:string}>(value))return cloneElement(value,{},walk(value.props.children,insideLink||typeof value.props.href==='string'));
    if(Array.isArray(value))return Children.map(value,child=>walk(child,insideLink));
    return value;
  };
  return walk(children);
}
