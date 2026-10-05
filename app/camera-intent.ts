/** Interaction semantics, never inferred from similarity to the default quaternion. */
export function createCameraIntent(){
 let customized=false;
 return {
  reset:()=>{customized=false;},
  orbit:()=>{customized=true;},
  preset:()=>{customized=true;},
  customized:()=>customized,
  assist:(previous:number,next:number,locked:boolean)=>previous===0&&next>0&&!customized&&!locked,
 };
}
