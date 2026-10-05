import * as T from 'three';
import {createClassicFloor,CLASSIC_FLOOR_RADIUS} from './classic-floor.ts';
import {motionProgress} from './motion.ts';
import {sceneFloorDefinition,type SceneFloorPreset} from './scene-floor-presets.ts';
import type {ResolvedTheme} from './theme';

const palettes={
 light:{line:'#718697',accent:'#547c91',center:'#647583',intensity:.52,centerOpacity:.09},
 dark:{line:'#839baa',accent:'#a3bdcf',center:'#121b24',intensity:.65,centerOpacity:.22},
} as const;
/** All five procedural styles share one program: switching changes uniforms, not shaders. */
const fragmentShader=`
uniform float uFloorPreset;
uniform float uFloorTime;
uniform float uFloorOpacity;
uniform float uFloorIntensity;
uniform float uFloorCenterOpacity;
uniform vec3 uFloorLine;
uniform vec3 uFloorAccent;
uniform vec3 uFloorCenter;
varying vec2 floorUv;
const float TAU=6.28318530718;
float line(float value,float target,float width){
 float aa=max(fwidth(value),0.001);
 return 1.0-smoothstep(width,width+aa,abs(value-target));
}
vec2 turn(vec2 p,float angle){float c=cos(angle),s=sin(angle);return mat2(c,-s,s,c)*p;}
void main(){
 vec2 p=floorUv*2.0-1.0;
 float r=length(p),theta=atan(p.y,p.x);
 float edge=1.0-smoothstep(0.96,1.0,r);
 float ink=0.0,accent=0.0,center=0.0;
 if(uFloorPreset<1.5){
  ink=line(r,0.87,0.0025)*0.42;
 }else if(uFloorPreset<2.5){
  ink=(line(r,0.30,0.0015)+line(r,0.58,0.0015)+line(r,0.87,0.002))*0.42;
  float spokes=line(sin(theta*12.0),0.0,0.006)*smoothstep(0.25,0.4,r);
  float ticks=line(sin(theta*36.0),0.0,0.018)*smoothstep(0.82,0.86,r)*(1.0-smoothstep(0.90,0.92,r));
  ink+=spokes*0.13+ticks*0.38;
 }else if(uFloorPreset<3.5){
  ink=(line(r,0.87,0.002)+line(r,0.58,0.0015))*0.42;
  float angle=mod(theta-uFloorTime*TAU/24.0+TAU,TAU);
  float trail=(1.0-smoothstep(0.0,0.70,angle))*smoothstep(0.1,0.25,r)*(1.0-smoothstep(0.82,0.90,r));
  accent=trail*0.20+line(angle,0.012,0.006)*smoothstep(0.20,0.35,r)*(1.0-smoothstep(0.85,0.9,r))*0.33;
 }else if(uFloorPreset<4.5){
  ink=line(r,0.87,0.002)*0.30;
  vec2 a=turn(p,uFloorTime*0.035+0.4),b=turn(p,-uFloorTime*0.025-0.6),c=turn(p,uFloorTime*0.018+1.4);
  ink+=(line(length(a*vec2(1.0,1.55)),0.78,0.002)+line(length(b*vec2(1.0,1.7)),0.83,0.002)+line(length(c*vec2(1.0,1.4)),0.68,0.002))*0.42;
 }else{
  float phase=theta-uFloorTime*0.075;
  float wave=sin(phase*3.0+r*18.0)*0.011+sin(phase*5.0-r*12.0)*0.005;
  float annulus=exp(-pow((r-(0.64+wave))/0.042,2.0));
  float strands=0.75+0.25*sin(phase*4.0+r*36.0);
  accent=annulus*strands*0.66;
  ink=line(r,0.84,0.002)*0.18+exp(-pow((r-0.64)/0.115,2.0))*0.08;
  center=(1.0-smoothstep(0.20,0.62,r))*uFloorCenterOpacity;
 }
 float alpha=(ink+accent)*uFloorIntensity+center;
 vec3 color=(uFloorLine*ink*uFloorIntensity+uFloorAccent*accent*uFloorIntensity+uFloorCenter*center)/max(alpha,0.0001);
 alpha*=edge*uFloorOpacity;
 if(alpha<0.001)discard;
 gl_FragColor=vec4(color,alpha);
 #include <colorspace_fragment>
}
`;

/** Fixed, presentation-only stage. No atlas, picker, bounds, camera or layout inputs. */
export function createSceneFloor(theme:ResolvedTheme,preset:SceneFloorPreset='classic'){
 const group=new T.Group();group.name='Scene floor';group.userData.presentationOnly=true;
 const classic=createClassicFloor(theme);
 const palette=palettes[theme];
 const uniforms={uFloorPreset:{value:1},uFloorTime:{value:0},uFloorOpacity:{value:1},uFloorIntensity:{value:palette.intensity as number},uFloorCenterOpacity:{value:palette.centerOpacity as number},uFloorLine:{value:new T.Color(palette.line)},uFloorAccent:{value:new T.Color(palette.accent)},uFloorCenter:{value:new T.Color(palette.center)}};
 const material=new T.ShaderMaterial({uniforms,vertexShader:'varying vec2 floorUv; void main(){floorUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader,transparent:true,depthTest:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const mesh=new T.Mesh(new T.PlaneGeometry(CLASSIC_FLOOR_RADIUS*2,CLASSIC_FLOOR_RADIUS*2),material);
 mesh.name='Procedural scene floor';mesh.rotation.x=-Math.PI/2;mesh.position.y=-.0049;mesh.renderOrder=-1;mesh.raycast=()=>{};mesh.userData.presentationOnly=true;
 group.add(classic.group,mesh);
 let current=preset,requested=preset,reveal=1,opacity=1,time=0;
 let transition:{elapsed:number;duration:number;from:number;switched:boolean}|null=null;
 const present=()=>{
  const definition=sceneFloorDefinition(current);
  uniforms.uFloorPreset.value=definition.shader;uniforms.uFloorOpacity.value=reveal*opacity;
  classic.setReveal(current==='classic'?reveal*opacity:0);
  mesh.visible=definition.shader>0&&reveal*opacity>0;
  group.visible=current!=='void'&&reveal*opacity>0;
 };
 const setTheme=(mode:ResolvedTheme)=>{const colors=palettes[mode];classic.setTheme(mode);uniforms.uFloorLine.value.set(colors.line);uniforms.uFloorAccent.value.set(colors.accent);uniforms.uFloorCenter.value.set(colors.center);uniforms.uFloorIntensity.value=colors.intensity;uniforms.uFloorCenterOpacity.value=colors.centerOpacity;};
 present();
 return {
  group,
  // Compile the shared procedural program during the hidden loading stage; no draw or extra pass.
  prewarm:(renderer:T.WebGLRenderer,camera:T.Camera,scene:T.Scene)=>{renderer.compile(mesh,camera,scene);},
  setTheme,
  setReveal:(value:number)=>{reveal=value;present();},
  setPreset:(value:SceneFloorPreset,duration=0)=>{
   if(value===requested)return false;
   requested=value;
   if(duration<=0||reveal===0){current=value;opacity=1;transition=null;time=0;uniforms.uFloorTime.value=0;present();}
   else transition={elapsed:0,duration,from:opacity,switched:false};
   return true;
  },
  /** Visible elapsed time only. Static/hidden/reduced-motion floors never advance phase. */
  update:(delta:number,reducedMotion:boolean,visible:boolean)=>{
   if(!visible)return false;
   let changed=false;
   if(transition){
    transition.elapsed+=Math.max(0,delta)*1000;
    const t=reducedMotion?1:Math.min(1,transition.elapsed/transition.duration);
    if(t>=.5&&!transition.switched){current=requested;time=0;uniforms.uFloorTime.value=0;transition.switched=true;}
    opacity=t<.5?transition.from*(1-motionProgress(t*2,1)):motionProgress((t-.5)*2,1);
    if(t===1){opacity=1;transition=null;}present();changed=true;
   }
   if(reducedMotion){if(uniforms.uFloorTime.value!==0){time=0;uniforms.uFloorTime.value=0;changed=true;}}
   else if(sceneFloorDefinition(current).animated&&group.visible){time+=Math.max(0,Math.min(.1,delta));uniforms.uFloorTime.value=time;changed=true;}
   return changed;
  },
  dispose:()=>{group.traverse(object=>{if(object instanceof T.Mesh){object.geometry.dispose();for(const m of Array.isArray(object.material)?new Set(object.material):[object.material])m.dispose();}});group.clear();},
 };
}
