import * as T from 'three';
import type {View} from './anatomy';

/** Fit every bound corner in the unobstructed viewport using this model's bounds. */
export function fitRegionCamera(bounds:[number[],number[]],view:View,fov:number,width:number,height:number,area:{left:number;right:number;top:number;bottom:number}) {
 const center=new T.Vector3().fromArray(bounds[0]).add(new T.Vector3().fromArray(bounds[1])).multiplyScalar(.5);
 const direction=view==='front'?new T.Vector3(0,.02,1):view==='back'?new T.Vector3(0,.02,-1):view==='side'?new T.Vector3(1,.02,0):new T.Vector3(.35,.06,1).normalize();direction.normalize();
 const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right);
 const vertical=Math.tan(T.MathUtils.degToRad(fov/2))*Math.max(40,area.bottom-area.top)/height;
 const horizontal=Math.tan(T.MathUtils.degToRad(fov/2))*Math.max(100,area.right-area.left)/height;
 let distance=.07;
 for(let corner=0;corner<8;corner++){
  const p=new T.Vector3(bounds[corner&1?1:0][0],bounds[corner&2?1:0][1],bounds[corner&4?1:0][2]).sub(center);
  distance=Math.max(distance,p.dot(direction)+Math.max(Math.abs(p.dot(right))/horizontal,Math.abs(p.dot(up))/vertical)*1.15);
 }
 return {center,direction,distance,offsetX:width/2-(area.left+area.right)/2,offsetY:height/2-(area.top+area.bottom)/2};
}
