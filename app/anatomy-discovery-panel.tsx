import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState,type RefObject} from 'react';
import {Search,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover,PopoverTrigger,PopoverContent,PopoverTitle} from '@/components/ui/popover';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import type {SystemId} from './anatomy';
import type {SearchConcept} from './anatomy-search';
import {DISCOVERY_ROW_HEIGHT,discoveryWindow,filterDiscoveryEntries,searchDiscoveryEntries,sortDiscoveryEntries,type DiscoveryEntry,type DiscoverySort} from './anatomy-discovery';

export type DiscoveryMode='search'|'browse';
interface Props {
 open:boolean;
 mode:DiscoveryMode;
 focusRequest:number;
 onModeChange:(mode:DiscoveryMode)=>void;
 onOpenChange:(open:boolean)=>void;
 entries:DiscoveryEntry[];
 systems:{id:SystemId;name:string}[];
 pieceCount:number;
 onChoose:(concept:SearchConcept)=>void;
}

function DiscoveryList({entries,onChoose,inputRef}:{entries:DiscoveryEntry[];onChoose:Props['onChoose'];inputRef?:RefObject<HTMLInputElement|null>}){
 const id=useId(),scroll=useRef<HTMLDivElement>(null),pendingFocus=useRef<number|null>(null),[top,setTop]=useState(0),[height,setHeight]=useState(336),[active,setActive]=useState(0);
 const {start,end}=discoveryWindow(entries.length,top,height);
 useLayoutEffect(()=>{
  if(pendingFocus.current===null)return;
  const row=document.getElementById(`${id}-${pendingFocus.current}`);
  if(row){row.focus({preventScroll:true});pendingFocus.current=null;}
 });
 useEffect(()=>{
  const element=scroll.current!;
  const observer=new ResizeObserver(()=>setHeight(element.clientHeight));observer.observe(element);
  return()=>observer.disconnect();
 },[]);
 useEffect(()=>{scroll.current!.scrollTop=0;setTop(0);setActive(0);},[entries]);
 const move=(index:number,focus:boolean)=>{
  const next=Math.max(0,Math.min(entries.length-1,index)),element=scroll.current!;
  if(focus)pendingFocus.current=next;
  setActive(next);
  if(next*DISCOVERY_ROW_HEIGHT<element.scrollTop)element.scrollTop=next*DISCOVERY_ROW_HEIGHT;
  else if((next+1)*DISCOVERY_ROW_HEIGHT>element.scrollTop+element.clientHeight)element.scrollTop=(next+1)*DISCOVERY_ROW_HEIGHT-element.clientHeight;
  setTop(element.scrollTop);
  if(focus&&next===active&&element.scrollTop===top)document.getElementById(`${id}-${next}`)?.focus({preventScroll:true});
 };
 const key=(event:Pick<globalThis.KeyboardEvent,'key'|'target'|'preventDefault'>)=>{
  if(!entries.length)return;
  const fromInput=event.target===inputRef?.current;
  let next:number|undefined;
  if(event.key==='ArrowDown')next=fromInput?active:active+1;
  if(event.key==='ArrowUp')next=active-1;
  if(!fromInput&&event.key==='Home')next=0;
  if(!fromInput&&event.key==='End')next=entries.length-1;
  if(event.key==='PageDown')next=active+Math.max(1,Math.floor(height/DISCOVERY_ROW_HEIGHT));
  if(event.key==='PageUp')next=active-Math.max(1,Math.floor(height/DISCOVERY_ROW_HEIGHT));
  if(next!==undefined){event.preventDefault();move(next,true);}
  else if(event.key==='Enter'||(!fromInput&&event.key===' ')){event.preventDefault();onChoose(entries[active].concept);}
 };
 useEffect(()=>{
  const element=inputRef?.current;if(!element)return;
  const handler=(event:globalThis.KeyboardEvent)=>key(event);
  element.addEventListener('keydown',handler);return()=>element.removeEventListener('keydown',handler);
 });
 return <div ref={scroll} className="discovery-scroll" onScroll={event=>{
  const nextTop=event.currentTarget.scrollTop,window=discoveryWindow(entries.length,nextTop,height);
  setTop(nextTop);
  // Keep a tab stop in the mounted window after pointer/touch scrolling.
  if(active<window.start||active>=window.end)setActive(Math.min(entries.length-1,Math.floor(nextTop/DISCOVERY_ROW_HEIGHT)));
 }} onKeyDown={key}>
  {entries.length?<div role="listbox" aria-label="Selectable structures" className="discovery-list" style={{height:entries.length*DISCOVERY_ROW_HEIGHT}} data-total-entries={entries.length}>
   {entries.slice(start,end).map((entry,offset)=>{const index=start+offset;return <button key={entry.id} id={`${id}-${index}`} type="button" role="option" aria-selected={index===active} aria-posinset={index+1} aria-setsize={entries.length} tabIndex={index===active?0:-1} className="discovery-row" style={{top:index*DISCOVERY_ROW_HEIGHT}} data-discovery-id={entry.id} data-piece-count={entry.modeledPieceCount} onFocus={()=>setActive(index)} onClick={()=>onChoose(entry.concept)}>
    <span className="search-result-name" title={entry.name}>{entry.name}</span><span className="discovery-piece-count">{entry.modeledPieceCount.toLocaleString()} modeled {entry.modeledPieceCount===1?'piece':'pieces'}</span>
   </button>;})}
  </div>:<p className="discovery-empty">No matching selectable structures.</p>}
 </div>;
}

function DiscoveryContent({mode,focusRequest,onModeChange,onOpenChange,entries,systems,pieceCount,onChoose}:Props){
 const input=useRef<HTMLInputElement>(null),[query,setQuery]=useState(''),[sort,setSort]=useState<DiscoverySort>('name'),[system,setSystem]=useState<SystemId|'all'>('all');
 const results=useMemo(()=>searchDiscoveryEntries(entries,query),[entries,query]);
 const browse=useMemo(()=>sortDiscoveryEntries(filterDiscoveryEntries(entries,system),sort),[entries,system,sort]);
 // Explicit shortcut requests focus the input; arrow navigation between tabs keeps tab focus.
 useEffect(()=>{input.current?.focus();},[focusRequest]);
 return <PopoverContent align="end" sideOffset={8} className="discovery-panel glass" aria-label="Find anatomy" initialFocus={input}>
  <div className="discovery-heading"><PopoverTitle>Find anatomy</PopoverTitle><Button variant="ghost" className="icon-button" aria-label="Close search" onClick={()=>onOpenChange(false)}><X size={18}/></Button></div>
  <Tabs value={mode} onValueChange={value=>onModeChange(value as DiscoveryMode)} className="discovery-tabs">
   <TabsList aria-label="Anatomy discovery" className="discovery-tab-list"><TabsTrigger value="search">Search</TabsTrigger><TabsTrigger value="browse">Browse</TabsTrigger></TabsList>
   <TabsContent value="search" className="discovery-content">
    <label className="sr-only" htmlFor="anatomy-query">Search named anatomical structures</label>
    <input ref={input} id="anatomy-query" className="discovery-input" aria-label="Search named anatomical structures" placeholder="Heart, femur, cranial nerve…" value={query} onChange={event=>setQuery(event.target.value)}/>
    <p className="discovery-summary">{query?'Up to 80 matches · refine your search for smaller structures.':'Common structures · discover the full inventory in Browse.'}</p>
    <DiscoveryList entries={results} onChoose={onChoose} inputRef={input}/>
   </TabsContent>
   <TabsContent value="browse" className="discovery-content">
    <div className="discovery-filters"><label>Sort<select aria-label="Sort structures" value={sort} onChange={event=>setSort(event.target.value as DiscoverySort)}><option value="name">A–Z</option><option value="largest">Modeled pieces: largest first</option><option value="smallest">Modeled pieces: smallest first</option></select></label><label>System<select aria-label="Filter structures by system" value={system} onChange={event=>setSystem(event.target.value as SystemId|'all')}><option value="all">All systems</option>{systems.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
    <p className="discovery-summary" role="status">{browse.length.toLocaleString()} selectable structures{system!=='all'?` of ${entries.length.toLocaleString()}`:''} · {pieceCount.toLocaleString()} model pieces</p>
    <DiscoveryList entries={browse} onChoose={onChoose}/>
   </TabsContent>
  </Tabs>
 </PopoverContent>;
}

export function AnatomyDiscovery(props:Props){
 return <Popover open={props.open} onOpenChange={props.onOpenChange}>
  <PopoverTrigger render={<Button variant="ghost" className={props.open?'active':''} aria-label="Search anatomy" aria-keyshortcuts="/"/>} onClick={()=>props.onModeChange('search')}><Search size={18}/><span>Find a structure</span><kbd>/</kbd></PopoverTrigger>
  {props.open&&<DiscoveryContent {...props}/>}
 </Popover>;
}
