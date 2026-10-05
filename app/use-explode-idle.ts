import {useEffect,useRef,useState} from 'react';

const adjustmentKeys=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown']);
export const EXPLODE_IDLE_DELAY=1000;
/** Event-driven idle cue. No frame work; held input wins over the idle timer. */
export function useExplodeIdle(amount:number,entranceSettled:boolean){
 const [active,setActive]=useState(false),[idle,setIdle]=useState(false),[activity,setActivity]=useState(0);
 const pointer=useRef(false),keys=useRef(new Set<string>());
 const pause=()=>{setIdle(false);setActive(true);};
 const settle=()=>{setActive(pointer.current||keys.current.size>0);setActivity(n=>n+1);};
 useEffect(()=>{
  const releasePointer=()=>{if(pointer.current){pointer.current=false;settle();}};
  const releaseKey=(event:KeyboardEvent)=>{if(keys.current.delete(event.key))settle();};
  const releaseAll=()=>{pointer.current=false;keys.current.clear();setIdle(false);settle();};
  window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',releasePointer);
  window.addEventListener('keyup',releaseKey);window.addEventListener('blur',releaseAll);
  return()=>{window.removeEventListener('pointerup',releasePointer);window.removeEventListener('pointercancel',releasePointer);window.removeEventListener('keyup',releaseKey);window.removeEventListener('blur',releaseAll);};
 },[]);
 useEffect(()=>{
  setIdle(false);
  if(amount!==0||active||!entranceSettled)return;
  const timer=setTimeout(()=>setIdle(true),EXPLODE_IDLE_DELAY);
  return()=>clearTimeout(timer);
 },[amount,active,entranceSettled,activity]);
 return {
  pulse:amount===0&&!active&&entranceSettled&&idle,
  onPointerDownCapture:()=>{pointer.current=true;pause();},
  onKeyDownCapture:(event:{key:string})=>{if(adjustmentKeys.has(event.key)){keys.current.add(event.key);pause();}},
  onValueChange:()=>{setIdle(false);setActivity(n=>n+1);},
 };
}
