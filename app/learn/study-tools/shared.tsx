import { articles } from '../content';
import { sourceTarget } from './model';
import type { StudySourceRef } from './types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function SourceLinks({refs,route}:{refs:StudySourceRef[];route:string}){
  return <div className="study-sources" aria-label="Related reading">{refs.map(ref=>{
    const target=sourceTarget(ref,articles,route);return target?<a key={`${ref.articleId}/${ref.sectionId}`} href={target.href}>{target.label}</a>:<span key={`${ref.articleId}/${ref.sectionId}`}>Reading reference unavailable: {ref.articleId}/{ref.sectionId}</span>;
  })}</div>;
}
export function SessionNavigation({index,total,onPrevious,onNext,lastLabel='View results',keyboardNavigation=false}:{index:number;total:number;onPrevious:()=>void;onNext:()=>void;lastLabel?:string;keyboardNavigation?:boolean}){
  return <div className="study-session-navigation"><button type="button" disabled={index===0} aria-keyshortcuts={keyboardNavigation?'ArrowLeft':undefined} onClick={onPrevious}><ArrowLeft size={16} aria-hidden="true"/>Previous</button><span>{index+1} of {total}</span><button type="button" aria-keyshortcuts={keyboardNavigation?'ArrowRight':undefined} onClick={onNext}>{index===total-1?lastLabel:'Next'}<ArrowRight size={16} aria-hidden="true"/></button></div>;
}
export function EmptyStudy({children}:{children:string}){return <p className="study-empty" role="status">{children}</p>;}
