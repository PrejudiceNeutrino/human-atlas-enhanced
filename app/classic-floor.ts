import * as T from 'three';
import type {ResolvedTheme} from './theme';

export const CLASSIC_FLOOR_RADIUS=.5;
const colors={light:{surface:'#d0d7dc',edge:'#bcc7ce',rim:'#aebdc7'},dark:{surface:'#33424e',edge:'#293743',rim:'#556b7b'}} as const;
/** Presentation only. Never register in anatomy pickers, bounds, inventories or layouts. */
export function createClassicFloor(theme:ResolvedTheme){
 const group=new T.Group();group.name='Classic floor';
 const surface=new T.MeshBasicMaterial({color:colors[theme].surface,toneMapped:false});
 const edge=new T.MeshBasicMaterial({color:colors[theme].edge,toneMapped:false});
 const stage=new T.Mesh(new T.CylinderGeometry(CLASSIC_FLOOR_RADIUS,CLASSIC_FLOOR_RADIUS+.008,.018,128),[edge,surface,edge]);
 stage.position.y=-.014;
 const rimMaterial=new T.MeshBasicMaterial({color:colors[theme].rim,side:T.DoubleSide,toneMapped:false});
 const rim=new T.Mesh(new T.RingGeometry(CLASSIC_FLOOR_RADIUS-.003,CLASSIC_FLOOR_RADIUS,128),rimMaterial);rim.rotation.x=-Math.PI/2;rim.position.y=-.0049;
 for(const mesh of [stage,rim]){mesh.raycast=()=>{};mesh.userData.presentationOnly=true;group.add(mesh);}
 return {group,setTheme:(mode:ResolvedTheme)=>{surface.color.set(colors[mode].surface);edge.color.set(colors[mode].edge);rimMaterial.color.set(colors[mode].rim);}};
}
