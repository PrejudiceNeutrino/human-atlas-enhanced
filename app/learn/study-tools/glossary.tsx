import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { findConcepts } from './model';
import type { StudyConcept } from './types';
import { SourceLinks } from './shared';

export function Glossary({concepts,topic,route,focusedId,onConcept,onClearFocus}:{concepts:StudyConcept[];topic:string;route:string;focusedId:string|null;onConcept:(id:string)=>void;onClearFocus:()=>void}){
  const [search,setSearch]=useState(''),[letter,setLetter]=useState('all'),root=useRef<HTMLDivElement>(null);
  const focused=concepts.find(concept=>concept.id===focusedId),map=useMemo(()=>new Map(concepts.map(concept=>[concept.id,concept])),[concepts]);
  const filtered=useMemo(()=>focused?[focused]:findConcepts(concepts,topic,search,letter),[concepts,topic,search,letter,focused]);
  const letters=useMemo(()=>[...new Set(findConcepts(concepts,topic,'').map(concept=>concept.term[0].toLocaleUpperCase('en')))].sort(),[concepts,topic]);
  useLayoutEffect(()=>{if(focusedId)root.current?.querySelector<HTMLElement>(`[data-concept-id="${focusedId}"] h4`)?.focus();},[focusedId]);
  return <div className="study-glossary" ref={root}><h3 id="study-glossary-heading" tabIndex={-1}>Glossary</h3><div className="study-glossary-controls"><label>Search terms, aliases or definitions<input type="search" value={focused?.term??search} onChange={event=>{onClearFocus();setSearch(event.target.value);}} placeholder="Search glossary"/></label><label>Starting letter<select value={focused?'all':letter} onChange={event=>{onClearFocus();setLetter(event.target.value);}}><option value="all">All letters</option>{letters.map(letter=><option key={letter}>{letter}</option>)}</select></label>{focused&&<button type="button" onClick={()=>{onClearFocus();setSearch('');setLetter('all');}}>Show all concepts</button>}</div>
    <p className="study-count" role="status">{filtered.length} concepts</p>
    <div className="study-concept-list">{filtered.map(concept=><article key={concept.id} data-concept-id={concept.id} className="study-concept"><h4 tabIndex={-1}>{concept.term}</h4><p>{concept.definition}</p>{concept.aliases.length>0&&<p className="study-aliases"><strong>Also called:</strong> {concept.aliases.join(', ')}</p>}<details open={focused?.id===concept.id||undefined}><summary>Related concepts and reading</summary>{concept.relatedConceptIds.length>0&&<div className="study-related-concepts">{concept.relatedConceptIds.map(id=><button type="button" key={id} onClick={()=>onConcept(id)}>{map.get(id)!.term}</button>)}</div>}<SourceLinks refs={concept.sourceRefs} route={route}/></details></article>)}</div>
    {!filtered.length&&<p className="study-empty">No concepts match your search.</p>}
  </div>;
}
