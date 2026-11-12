import { articles, factSections } from '../learn/content';
import { learnSubjects } from '../learn/subjects';
import { examCramVariants } from '../learn/exam-cram-content';
import { fingerprint, targetKey, type Annotation } from './annotation-core';
import { markdownBlocks, titleBlock, type AnnotationSource } from './annotation-model';

export const annotationSources:AnnotationSource[]=[];
for(const subject of learnSubjects)for(const tab of subject.tabs){
  const add=(sourceId:string,title:string,markdown:string,headingId:string,disclosureId?:string,includeTitle=true)=>annotationSources.push({
    target:{kind:'learn',subjectId:subject.slug,tabId:tab.id,sourceId},subjectTitle:subject.title,tabTitle:tab.title,title,
    blocks:[...(includeTitle?[titleBlock(title)]:[]),...markdownBlocks(markdown)].map((block,order)=>({...block,order})),version:fingerprint(`${includeTitle?title:''}\n${markdown}`),headingId,disclosureId,order:annotationSources.length,route:subject.href,
  });
  if(tab.kind==='article'){
    const article=articles[tab.id];add(`${tab.id}/intro`,article.title,article.introMarkdown,`${tab.id}-heading`);
    if(tab.readingIntro)add(`${tab.id}/reading-intro`,article.title,tab.readingIntro,`${tab.id}-heading`,undefined,false);
    for(const section of article.sections)add(`${tab.id}/${section.id}`,section.title,section.markdown,`${tab.id}-${section.id}`);
    const quickScan=examCramVariants[tab.id];
    if(quickScan){
      const start=annotationSources.length;
      add(`${quickScan.id}/intro`,quickScan.title,quickScan.introMarkdown,`${tab.id}-heading`);
      for(const section of quickScan.sections)add(`${quickScan.id}/${section.id}`,section.title,section.markdown,`${tab.id}-${section.id}`);
      for(const source of annotationSources.slice(start)){source.readingMode='quick-scan';source.tabTitle=`${tab.title} · Quick Scan`;}
    }
  }else if(tab.kind==='facts'){
    add(`${tab.id}/intro`,tab.title,tab.readingIntro??'',`${tab.id}-heading`);
    for(const entry of factSections[tab.id].sections){
    const id=`${tab.id}-${entry.id}`;
    add(`${tab.id}/${entry.id}/summary`,entry.title,entry.summary,`${id}-title`);
    add(`${tab.id}/${entry.id}/more`,entry.moreInfoTitle,entry.moreInfoMarkdown,`${id}-explanation-title`,id);
    }
  }
}
export const sourceByKey=new Map(annotationSources.map(source=>[targetKey(source.target),source]));
export const sourceFor=(record:Annotation)=>sourceByKey.get(targetKey(record.target));
export const annotationTargetUrl=(record:Annotation)=>{
  const subject=learnSubjects.find(item=>item.slug===record.target.subjectId);
  // A fragment is never sent to a server. Notes/reading routes also disable analytics.
  return subject?record.status==='anchored'?`${subject.href}#annotation=${encodeURIComponent(record.id)}`:`${subject.href}#${record.target.tabId}`:'/learn';
};
export function sortAnnotations(records:Annotation[]){
  return [...records].sort((a,b)=>(sourceFor(a)?.order??1e9)-(sourceFor(b)?.order??1e9)||
    (sourceFor(a)?.blocks.find(block=>block.id===a.anchor.blockId)?.order??1e9)-(sourceFor(b)?.blocks.find(block=>block.id===b.anchor.blockId)?.order??1e9)||
    a.anchor.start-b.anchor.start||a.id.localeCompare(b.id));
}
