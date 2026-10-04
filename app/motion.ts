/** Presentation timing is owned by CSS, including portals. Read once per transition. */
export function motionMilliseconds(value:string):number {
 const amount=parseFloat(value);
 return Number.isFinite(amount)&&amount>=0?amount*(value.trim().endsWith('ms')?1:1000):0;
}
export function motionDuration(token:string):number {
 return window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:
  motionMilliseconds(getComputedStyle(document.documentElement).getPropertyValue(token));
}
/** Finite ease-out with exact endpoints; a late frame settles instead of extending motion. */
export function motionProgress(elapsed:number,duration:number):number {
 const t=duration<=0?1:Math.max(0,Math.min(1,elapsed/duration));
 return 1-(1-t)**3;
}
/** Static CSS coefficients: brisk first letters, progressively slower final letters. */
export function typewriterRamp(length:number){
 let precedingWeight=0;
 return Array.from({length},(_,index)=>{
  const weight=length>1?(index/(length-1))**2:0;
  const timing={index,weight,precedingWeight};precedingWeight+=weight;
  return timing;
 });
}
