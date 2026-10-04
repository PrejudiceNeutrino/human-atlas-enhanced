import type {Part} from './anatomy';
import type {ModelId,RepresentationId} from './identity-contracts';
import type {SystemId} from './anatomy';

/** Presentation families only: these do not assert canonical anatomical membership. */
export type ExplodeFamilyId='support'|'muscular'|'visceral'|'vascular'|'neural-sensory'|'surface';
export const EXPLODE_FAMILY_ORDER:readonly ExplodeFamilyId[]=['support','muscular','visceral','vascular','neural-sensory','surface'];
export const EXPLODE_FAMILY_BY_SYSTEM:Record<SystemId,ExplodeFamilyId>={
 skeletal:'support',connective:'support',muscular:'muscular',
 cardiac:'visceral',respiratory:'visceral',digestive:'visceral',urinary:'visceral',endocrine:'visceral',reproductive:'visceral',lymphatic:'visceral',mammary:'visceral',pregnancy:'visceral',
 arterial:'vascular',venous:'vascular',nervous:'neural-sensory',sensory:'neural-sensory',integumentary:'surface',
};
export const SYSTEM_SEPARATION_END=.30;
export type ExplosionVector=[number,number,number];
export type ExplosionBounds=[ExplosionVector,ExplosionVector];
export interface ExplosionTarget {
 representationId:RepresentationId;family:ExplodeFamilyId;order:number;cell:LayoutCell;
 center:ExplosionVector;bounds:ExplosionBounds;familyTranslation:ExplosionVector;pieceTranslation:ExplosionVector;
}
export interface ExplosionLane {family:ExplodeFamilyId;bounds:ExplosionBounds;midpoint:[number,number];final:[number,number];translation:number}
export interface StableExplosionLayout {key:string;modelId:ModelId;center:ExplosionVector;targets:ReadonlyMap<string,ExplosionTarget>;lanes:readonly ExplosionLane[]}
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
const smoothstep=(t:number)=>t*t*(3-2*t);
const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
function safeBounds(part:Part):ExplosionBounds {
 return [0,1].map(side=>[0,1,2].map(axis=>{
  const a=part.bounds?.[0]?.[axis],b=part.bounds?.[1]?.[axis];
  return Number.isFinite(a)&&Number.isFinite(b)?(side?Math.max(a,b):Math.min(a,b)):0;
 })) as ExplosionBounds;
}
function union(boxes:ExplosionBounds[]):ExplosionBounds {
 if(!boxes.length)return [[0,0,0],[0,0,0]];
 return [0,1].map(side=>[0,1,2].map(axis=>boxes.reduce((n,b)=>side?Math.max(n,b[side][axis]):Math.min(n,b[side][axis]),side?-Infinity:Infinity))) as ExplosionBounds;
}
const centerOf=(b:ExplosionBounds):ExplosionVector=>b[0].map((n,a)=>(n+b[1][a])/2) as ExplosionVector;
const boundWidth=(b:ExplosionBounds)=>Math.max(.001,b[1][0]-b[0][0]);
const repId=(modelId:ModelId,id:string):RepresentationId=>`atlas:representation:${modelId}:${encodeURIComponent(id)}`;

/** Model, immutable representation identities and focus are the complete layout inputs.
 * No slider, viewport, pointer, orbit or clock input participates in this key. */
export function explosionLayoutKey(parts:readonly Part[],modelId:ModelId,focus?:number[]|null):string {
 return JSON.stringify([modelId,focus??null,parts.map(p=>repId(modelId,p.id)).sort(compare)]);
}

/** Adapt the proven shelf packer within deterministic, ordered family zones. */
export function createStableExplosionLayout(parts:readonly Part[],modelId:ModelId,focus?:number[]|null):StableExplosionLayout {
 const ordered=[...parts].sort((a,b)=>compare(repId(modelId,a.id),repId(modelId,b.id)));
 const assembled=union(ordered.map(safeBounds)),center=centerOf(assembled);
 if(focus)for(let a=0;a<3;a++)if(Number.isFinite(focus[a]))center[a]=focus[a];
 const families=EXPLODE_FAMILY_ORDER.filter(family=>ordered.some(p=>EXPLODE_FAMILY_BY_SYSTEM[p.system]===family));
 const groups=families.map(family=>{
  const members=ordered.filter(p=>EXPLODE_FAMILY_BY_SYSTEM[p.system]===family),bounds=union(members.map(safeBounds));
  const packed=createExplosionLayout(members.map(p=>({...p,bounds:safeBounds(p)})),.65);
  return {family,members,bounds,packed,midWidth:boundWidth(bounds),finalWidth:Math.max(boundWidth(bounds),packed.width)};
 });
 const span=Math.max(...assembled[1].map((n,a)=>n-assembled[0][a]),.001);
 const gap=span*.07;
 const midWidth=groups.reduce((n,g)=>n+g.midWidth,0)+gap*Math.max(0,groups.length-1);
 const finalWidth=groups.reduce((n,g)=>n+g.finalWidth,0)+gap*Math.max(0,groups.length-1);
 let midX=center[0]-midWidth/2,finalX=center[0]-finalWidth/2;
 const lanes:ExplosionLane[]=[],targets=new Map<string,ExplosionTarget>();
 for(const g of groups){
  const midpoint:[number,number]=[midX,midX+g.midWidth],final:[number,number]=[finalX,finalX+g.finalWidth];
  const midCenter=midX+g.midWidth/2,finalCenter=finalX+g.finalWidth/2;
  // One family stays exactly where assembled; no artificial family translation.
  const translation=groups.length<2?0:midCenter-centerOf(g.bounds)[0];
  lanes.push({family:g.family,bounds:g.bounds,midpoint,final,translation});
  const packingOrder=new Map([...g.packed.cells.keys()].map((id,order)=>[id,order]));
  g.members.forEach(p=>{
   const order=packingOrder.get(p.id)!;
   const bounds=safeBounds(p),partCenter=centerOf(bounds),localCell=g.packed.cells.get(p.id)!;
   const cell={...localCell,x:localCell.x+finalCenter,y:localCell.y+center[1]};
   const familyTranslation:ExplosionVector=[translation,0,0];
   const pieceTranslation:ExplosionVector=ordered.length===1?[0,0,0]:[cell.x-partCenter[0]-translation,cell.y-partCenter[1],center[2]-partCenter[2]];
   targets.set(p.id,{representationId:repId(modelId,p.id),family:g.family,order,cell,center:partCenter,bounds,familyTranslation,pieceTranslation});
  });
  midX+=g.midWidth+gap;finalX+=g.finalWidth+gap;
 }
 return {key:explosionLayoutKey(parts,modelId,focus),modelId,center,targets,lanes};
}
export function explosionProgress(amount:number,familyCount:number){
 const t=clamp(amount);
 return familyCount<2?{family:0,piece:smoothstep(t)}:{family:smoothstep(Math.min(1,t/SYSTEM_SEPARATION_END)),piece:smoothstep(Math.max(0,(t-SYSTEM_SEPARATION_END)/(1-SYSTEM_SEPARATION_END)))};
}
export function evaluateExplosionOffset(target:ExplosionTarget,amount:number,familyCount:number):ExplosionVector {
 if(clamp(amount)===0)return [0,0,0];
 const progress=explosionProgress(amount,familyCount);
 return target.familyTranslation.map((n,a)=>n*progress.family+target.pieceTranslation[a]*progress.piece) as ExplosionVector;
}
export function evaluateExplosionBounds(layout:StableExplosionLayout,amount:number):ExplosionBounds {
 return union([...layout.targets.values()].map(t=>{
  const offset=evaluateExplosionOffset(t,amount,layout.lanes.length);
  return t.bounds.map(side=>side.map((n,a)=>n+offset[a])) as ExplosionBounds;
 }));
}
/** Conservative perspective fit about a fixed orbit target, valid at every stage and view. */
export function explosionFitDistance(bounds:ExplosionBounds,target:readonly number[],direction:readonly number[],fov:number,width:number,height:number,availableWidth:number,availableHeight:number):number {
 const length=Math.hypot(...direction)||1,d=direction.map(n=>n/length),rightLength=Math.hypot(d[2],d[0])||1;
 const right=[d[2]/rightLength,0,-d[0]/rightLength],up=[d[1]*right[2],d[2]*right[0]-d[0]*right[2],-d[1]*right[0]];
 const tan=Math.tan(fov*Math.PI/360),aspect=Math.max(.01,width/Math.max(1,height));let distance=.07;
 for(let corner=0;corner<8;corner++){
  const v=target.map((n,a)=>bounds[(corner>>a)&1][a]-n),dot=(axis:number[])=>v.reduce((n,x,a)=>n+x*axis[a],0);
  distance=Math.max(distance,dot(d)+Math.max(Math.abs(dot(up))*height/Math.max(40,availableHeight),Math.abs(dot(right))*width/Math.max(150,availableWidth)/aspect)/tan*1.08);
 }
 return Number.isFinite(distance)?distance:.07;
}
export function explosionValueText(amount:number,familyCount:number):string {
 const percent=Math.round(clamp(amount)*100);
 if(percent===0)return 'Assembled';if(percent===100)return 'Every piece';
 if(familyCount>=2&&percent===SYSTEM_SEPARATION_END*100)return 'Systems apart';
 return `${familyCount>=2&&amount<SYSTEM_SEPARATION_END?'Separating system families':'Separating individual structures'}, ${percent} percent`;
}
export function explosionStageText(amount:number,familyCount:number):string|null {
 if(amount===0)return null;if(amount===1)return 'EVERY PIECE';
 if(familyCount>=2&&Math.abs(amount-SYSTEM_SEPARATION_END)<.00001)return 'SYSTEMS APART';
 return familyCount>=2&&amount<SYSTEM_SEPARATION_END?'SEPARATING SYSTEMS':'SEPARATED STRUCTURES';
}
export interface LayoutCell {x:number;y:number;width:number;height:number}
/** Pack only visible source meshes. Every projected bounding box gets its own cell. */
export function createExplosionLayout(parts:Part[],aspect=1){
 const cards=parts.map(p=>({id:p.id,system:p.system,width:Math.max(.035,p.bounds[1][0]-p.bounds[0][0])+.04,height:Math.max(.035,p.bounds[1][1]-p.bounds[0][1])+.04}));
 const area=cards.reduce((n,c)=>n+c.width*c.height,0),maxWidth=Math.max(.3,...cards.map(c=>c.width));
 const targetWidth=Math.max(maxWidth,Math.sqrt(area*Math.max(.5,Math.min(1.5,aspect)))*1.18);
 cards.sort((a,b)=>b.height-a.height||compare(encodeURIComponent(a.id),encodeURIComponent(b.id)));
 const cells=new Map<string,LayoutCell>();let x=0,y=0,row=0,usedWidth=0;
 for(const c of cards){if(x>0&&x+c.width>targetWidth){x=0;y+=row;row=0;}cells.set(c.id,{x:x+c.width/2,y:-y-c.height/2,width:c.width,height:c.height});x+=c.width;usedWidth=Math.max(usedWidth,x);row=Math.max(row,c.height);}
 const height=y+row;
 cells.forEach(c=>{c.x-=usedWidth/2;c.y+=height/2;});
 return {cells,width:usedWidth,height};
}
