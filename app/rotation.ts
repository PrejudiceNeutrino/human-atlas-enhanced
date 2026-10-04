export const ROTATION_KEY='human-atlas-rotation-speed';
export const ROTATION_DEFAULT=1;
export const ROTATION_LIMITS=[.25,3] as const;
/** 1x is a restrained 40-second inspection turn at raw OrbitControls speed 1.5. */
export function normalizeRotation(value:unknown):number {
 return typeof value==='number'&&Number.isFinite(value)?Math.max(ROTATION_LIMITS[0],Math.min(ROTATION_LIMITS[1],value)):ROTATION_DEFAULT;
}
export function orbitRotationSpeed(multiplier:unknown):number {return 1.5*normalizeRotation(multiplier);}
export function createRotationController(storage:Pick<Storage,'getItem'|'setItem'>){
 let snapshot=ROTATION_DEFAULT;try{snapshot=normalizeRotation(JSON.parse(storage.getItem(ROTATION_KEY)??'null'));}catch{/* Defaults survive malformed or denied storage. */}
 const listeners=new Set<()=>void>();
 return {getSnapshot:()=>snapshot,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},set:(value:number)=>{
  const next=normalizeRotation(value);try{storage.setItem(ROTATION_KEY,JSON.stringify(next));}catch{/* Session controls remain usable. */}
  if(next===snapshot)return;snapshot=next;listeners.forEach(listener=>listener());
 }};
}
