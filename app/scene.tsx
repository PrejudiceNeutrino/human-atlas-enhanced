import {motionDuration,motionProgress} from './motion';
import {useEffect,useRef} from 'react';
import {isolationCameraKey} from './viewer-interaction';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createStableExplosionLayout,explosionLayoutKey,evaluateExplosionOffset,evaluateExplosionBounds,explosionFitDistance,explosionProgress,type StableExplosionLayout} from './explosion-layout';
import type {ModelId} from './identity-contracts';
import {decodeModelResponse} from './model-download';
import {PointerTap} from './pointer-tap';
import {SYSTEMS,partIsVisible,type Atlas,type Part,type SceneState} from './anatomy';
import {isBodySurface,resolveVisibility} from './visibility';
import {fitRegionCamera} from './region-camera';
import {DISPLAY_CONTRAST_SHADER,type DisplaySettings} from './display';
import {createSceneFloor} from './scene-floor';
import {sceneFloorEligible} from './floor-eligibility';
import {orbitRotationSpeed} from './rotation';
import {SCENE_THEMES,type ResolvedTheme} from './theme';
interface Props {viewLocked:boolean;rotationSpeed:number;modelId:ModelId;display:DisplaySettings;revealed:boolean;onReady:()=>void;onSettled:()=>void;theme:ResolvedTheme;atlas:Atlas;state:SceneState;onSelect:(id:string)=>void;onProgress:(n:number)=>void;onError:(s:string)=>void}
export default function AnatomyScene({atlas,modelId,state,viewLocked,theme,rotationSpeed,display,revealed,onReady,onSettled,onSelect,onProgress,onError}:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(state),select=useRef(onSelect);
 const latestLock=useRef(viewLocked);latestLock.current=viewLocked;
 const latestRotation=useRef(rotationSpeed);latestRotation.current=rotationSpeed;
 const latestDisplay=useRef(display);latestDisplay.current=display;
 const latestReady=useRef(onReady);latestReady.current=onReady;
 const latestRevealed=useRef(revealed);latestRevealed.current=revealed;
 const latestSettled=useRef(onSettled);latestSettled.current=onSettled;
 const latestTheme=useRef(theme);latestTheme.current=theme;
 latest.current=state;select.current=onSelect;
 useEffect(()=>{
  const el=host.current!;let disposed=false,frame=0,dirty=true,ready=false,lastView='',lastReset=-1,lastIsolate='',layoutKey='',amount=0;
  let lastState:SceneState|null=null;
  const abort=new AbortController();
  let renderer:T.WebGLRenderer;
  T.ColorManagement.enabled=true;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onError('This browser could not start the 3D viewer. Please try a browser with WebGL enabled.');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<768?1.5:2));renderer.setClearColor('#e4e8eb');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.005,100),controls=new OrbitControls(camera,renderer.domElement);
  camera.position.set(1.4,1.05,3.6);controls.target.set(0,.85,0);controls.enableDamping=true;controls.dampingFactor=.085;controls.minDistance=.07;controls.maxDistance=40;controls.maxPolarAngle=Math.PI*.96;controls.addEventListener('change',()=>{dirty=true;});
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.55;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0xffffff,0xa7acb2,.45));
  const key=new T.DirectionalLight(0xfffaf4,2.65);key.position.set(-3,4,4);scene.add(key);
  const rim=new T.DirectionalLight(0xe9f0ff,.85);rim.position.set(2,2,-3);scene.add(rim);
  const floor=createSceneFloor(latestTheme.current,latestDisplay.current.sceneFloor);scene.add(floor.group);floor.setReveal(0);floor.prewarm(renderer,camera,scene);
  let appliedFloorEligible=sceneFloorEligible(latest.current);floor.setEligible(appliedFloorEligible);
  const motionMedia=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sceneDuration=motionDuration('--motion-slow'),selectionDuration=motionDuration('--motion-fast');
  let revealStart:number|null=null,floorSettled=false,floorReveal=0;
  const highlights=new Map<number,{from:number;to:number;start:number}>();
  let rotationTime=performance.now();
  let appliedTheme:ResolvedTheme|null=null;
  const applyTheme=()=>{const mode=latestTheme.current;if(mode===appliedTheme)return;const colors=SCENE_THEMES[mode];renderer.setClearColor(colors.background);floor.setTheme(mode);markerMaterial.color.set(colors.marker);appliedTheme=mode;dirty=true;};
  const configureDataTexture=(texture:T.DataTexture)=>{texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;return texture;};
  const width=T.MathUtils.ceilPowerOfTwo(atlas.parts.length),data=new Float32Array(width*4),partTexture=configureDataTexture(new T.DataTexture(data,width,1,T.RGBAFormat,T.FloatType));
  const selectedData=new Uint8Array(width*4),selectionTexture=configureDataTexture(new T.DataTexture(selectedData,width,1));
  const materials:T.Material[]=[],geometries:T.BufferGeometry[]=[],pickers:(T.Mesh|undefined)[]=[],centers=atlas.parts.map(p=>new T.Vector3().fromArray(p.bounds[0]).add(new T.Vector3().fromArray(p.bounds[1])).multiplyScalar(.5));
  const bounds=atlas.parts.map(p=>new T.Box3(new T.Vector3().fromArray(p.bounds[0]),new T.Vector3().fromArray(p.bounds[1])));
  let explosionLayout:StableExplosionLayout|null=null,sliderLayoutChanged=false;
  let sliderFrame:{target:number[];direction:number[];distance:number;scale:number}|null=null;
  const markerPositions=new Float32Array(atlas.parts.length*3),markerGeometry=new T.BufferGeometry();markerGeometry.setAttribute('position',new T.BufferAttribute(markerPositions,3));
  const markerMaterial=new T.PointsMaterial({color:0x64748b,size:5,sizeAttenuation:false,transparent:true,opacity:.72,depthTest:false});
  markerMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;');
  };
  const markers=new T.Points(markerGeometry,markerMaterial);markers.frustumCulled=false;markers.renderOrder=10;markers.visible=false;scene.add(markers);
  const hover=document.createElement('div');hover.className='part-hover';hover.setAttribute('role','tooltip');hover.hidden=true;el.appendChild(hover);
  type Target={index:number;x:number;y:number;left:number;right:number;top:number;bottom:number};let targets:Target[]=[];
  const projected=new T.Vector3();
  const findTarget=(x:number,y:number,radius:number)=>{
   let best=-1,score=Infinity;const state=latest.current,context={systems:new Set(state.visible),selected:new Set(state.selected),hasSolid:atlas.parts.some((p,i)=>!isBodySurface(p)&&data[i*4+3]>.5)};
   for(const t of targets){if(!resolveVisibility(atlas.parts[t.index],state,context).pickable)continue;const dx=Math.max(t.left-x,0,x-t.right),dy=Math.max(t.top-y,0,y-t.bottom),distance=Math.hypot(dx,dy);if(distance>radius)continue;const candidate=distance+Math.hypot(t.x-x,t.y-y)*.025;if(candidate<score){score=candidate;best=t.index;}}
   return best;
  };
  const isBreastTissue=(p:Part)=>p.system==='integumentary'&&p.id.startsWith('VH_F_')&&p.id!=='VH_F_skin';
  const contrastUniform={value:latestDisplay.current.contrast};
  let appliedFloor=latestDisplay.current.sceneFloor;
  const applyDisplay=()=>{const settings=latestDisplay.current;if(settings.sceneFloor!==appliedFloor){floor.setPreset(settings.sceneFloor,motionDuration('--motion-fast'));appliedFloor=settings.sceneFloor;dirty=true;}if(renderer.toneMappingExposure!==settings.brightness||contrastUniform.value!==settings.contrast){renderer.toneMappingExposure=settings.brightness;contrastUniform.value=settings.contrast;dirty=true;}};
  const materialFor=(system:string,surface=system==='integumentary')=>{
   const m=new T.MeshStandardMaterial({color:SYSTEMS.find(s=>s.id===system)?.color??'#aebbb8',metalness:.08,roughness:.53,side:T.DoubleSide,transparent:surface,opacity:surface?.1:1,depthWrite:!surface});
   m.customProgramCacheKey=()=>'atlas-standard-display-v4';
   m.onBeforeCompile=shader=>{
    shader.uniforms.displayContrast=contrastUniform;shader.uniforms.partState={value:partTexture};shader.uniforms.selectionState={value:selectionTexture};shader.uniforms.stateWidth={value:width};
    shader.vertexShader='attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform float stateWidth; varying float partVisible; varying float partSelected;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r;');
    shader.fragmentShader='uniform float displayContrast; varying float partVisible; varying float partSelected;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.008, 0.42, 0.32), partSelected);\ndiffuseColor.a = mix(diffuseColor.a, 1.0, partSelected);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',DISPLAY_CONTRAST_SHADER+'\n#include <dithering_fragment>');
   };materials.push(m);return m;
  };
  const mats=new Map<string,T.Material>(SYSTEMS.map(s=>[s.id,materialFor(s.id)]));
  // Source-derived HRA breast tissues use a plain material; source IDs retain their layer controls.
  mats.set('hra-breast',materialFor('reproductive',false));
  let loaded=0,readyReported=false;
  const loadChunk=async(ci:number)=>{
   const chunk=atlas.chunks[ci],compressed=!!chunk.gzip&&typeof DecompressionStream!=='undefined';const response=await fetch(compressed?chunk.gzip!:chunk.url,{signal:abort.signal});const buffer=await decodeModelResponse(response,chunk.bytes,compressed);if(disposed)return;
   const groups=new Map<string,T.BufferGeometry[]>();
   atlas.parts.forEach((p,i)=>{
    if(p.chunk!==ci)return;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3),3));
    // GPU normalized signed-short normals keep the complete atlas compact in memory.
    g.setAttribute('normal',new T.BufferAttribute(new Int16Array(buffer,p.normals,p.vertexCount*3),3,true));g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount),1));
    g.boundingBox=bounds[i].clone();g.computeBoundingSphere();const pick=new T.Mesh(g);pick.matrixAutoUpdate=false;pickers[i]=pick;geometries.push(g);
    g.setAttribute('partIndex',new T.BufferAttribute(new Float32Array(p.vertexCount).fill(i),1));
    const category=p.system==='mammary'||isBreastTissue(p)?'hra-breast':p.system;const list=groups.get(category)??[];list.push(g);groups.set(category,list);
   });
   groups.forEach((gs,system)=>{const geometry=mergeGeometries(gs,false);if(!geometry)throw new Error('Could not assemble anatomy geometry.');geometries.push(geometry);const mesh=new T.Mesh(geometry,mats.get(system));mesh.frustumCulled=false;scene.add(mesh);});
   lastState=null;loaded++;onProgress(Math.round(loaded/atlas.chunks.length*100));dirty=true;
  };
  (async()=>{try{let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<atlas.chunks.length){const i=cursor++;await loadChunk(i);}}));if(!disposed){ready=true;dirty=true;}}catch(e){if(!disposed)onError(e instanceof Error?e.message:'Could not load the anatomy.');}})();
  const fit=(view:SceneState['view'],_extent=0)=>{
   const focus=latest.current.areaId?latest.current.areaFocus:latest.current.regionFocus;
   if(focus&&!latest.current.isolate){
    const w=el.clientWidth,h=el.clientHeight,mobile=w<768,landscape=h<600&&w>h;
    const framing=fitRegionCamera(focus,view,camera.fov,w,h,{left:mobile?20:w>1100?285:245,right:w-(mobile?62:90),top:landscape?130:mobile?320:130,bottom:h-(mobile?175:200)});
    camera.setViewOffset(w,h,framing.offsetX,framing.offsetY,w,h);controls.target.copy(framing.center);camera.position.copy(framing.center).addScaledVector(framing.direction,framing.distance);controls.update();dirty=true;return;
   }
   const aspect=camera.aspect,mobile=el.clientWidth<768,portrait=mobile&&el.clientHeight>=el.clientWidth,normalDistance=mobile?Math.max(4.5,1.8*el.clientHeight/Math.max(160,el.clientHeight-(portrait?500:350))/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))):4;
   if(portrait&&!latest.current.isolate)camera.setViewOffset(el.clientWidth,el.clientHeight,0,-70,el.clientWidth,el.clientHeight);else if(!latest.current.isolate)camera.clearViewOffset();
   const distance=normalDistance;
   const direction=view==='front'?new T.Vector3(0,.02,1):view==='back'?new T.Vector3(0,.02,-1):view==='side'?new T.Vector3(1,.02,0):new T.Vector3(.35,.06,1).normalize();
   controls.target.set(0,mobile?.85:.68,0);camera.position.copy(controls.target).addScaledVector(direction,distance);controls.update();dirty=true;
  };
  const fitExplosion=(previousAmount:number)=>{
   if(!explosionLayout?.targets.size)return;
   const w=el.clientWidth,h=el.clientHeight,availableWidth=w-(w<768?40:600),availableHeight=h-(w<768?350:270);
   if(!sliderFrame){
    const direction=camera.position.clone().sub(controls.target).normalize().toArray(),target=controls.target.toArray();
    const required=explosionFitDistance(evaluateExplosionBounds(explosionLayout,previousAmount),target,direction,camera.fov,w,h,availableWidth,availableHeight);
    const distance=camera.position.distanceTo(controls.target),progress=explosionProgress(previousAmount,explosionLayout.lanes.length),weight=explosionLayout.lanes.length<2?progress.piece:progress.family;
    sliderFrame={target,direction,distance,scale:T.MathUtils.lerp(distance,Math.max(distance,required),weight)/distance};
   }
   if(sliderLayoutChanged){
    const previousRequired=explosionFitDistance(evaluateExplosionBounds(explosionLayout,previousAmount),sliderFrame.target,sliderFrame.direction,camera.fov,w,h,availableWidth,availableHeight);
    const previousProgress=explosionProgress(previousAmount,explosionLayout.lanes.length),previousWeight=explosionLayout.lanes.length<2?previousProgress.piece:previousProgress.family;
    sliderFrame.scale=T.MathUtils.lerp(sliderFrame.distance,Math.max(sliderFrame.distance,previousRequired),previousWeight)/sliderFrame.distance;sliderLayoutChanged=false;
   }
   const required=explosionFitDistance(evaluateExplosionBounds(explosionLayout,amount),sliderFrame.target,sliderFrame.direction,camera.fov,w,h,availableWidth,availableHeight);
   const progress=explosionProgress(amount,explosionLayout.lanes.length),weight=explosionLayout.lanes.length<2?progress.piece:progress.family;
   const scale=T.MathUtils.lerp(sliderFrame.distance,Math.max(sliderFrame.distance,required),weight)/sliderFrame.distance,ratio=scale/sliderFrame.scale;
   camera.position.sub(controls.target).multiplyScalar(ratio).add(controls.target);
   controls.maxDistance=Math.max(40,camera.position.distanceTo(controls.target)*2);sliderFrame.scale=scale;dirty=true;
  };
  const resize=()=>{lastState=null;sliderFrame=null;renderer.setPixelRatio(Math.min(devicePixelRatio,el.clientWidth<768||el.clientHeight<600?1.5:2));camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);fit(latest.current.view);if(amount>0)fitExplosion(0);};const observer=new ResizeObserver(resize);observer.observe(el);
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),tap=new PointerTap(),worldBox=new T.Box3(),hitPoint=new T.Vector3();
  const down=(e:PointerEvent)=>{hover.hidden=true;tap.down(e.pointerId,e.clientX,e.clientY,e.pointerType==='touch'?12:5);};
  const move=(e:PointerEvent)=>{tap.move(e.pointerId,e.clientX,e.clientY);if(e.buttons||amount<.5||e.pointerType==='touch'){hover.hidden=true;return;}const rect=el.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,index=findTarget(x,y,12);hover.hidden=index<0;renderer.domElement.style.cursor=index<0?'grab':'pointer';if(index>=0){hover.textContent=atlas.parts[index].name;hover.style.left=`${Math.max(8,Math.min(x+14,el.clientWidth-260))}px`;hover.style.top=`${Math.max(8,Math.min(y+18,el.clientHeight-55))}px`;}};
  const cancel=(e:PointerEvent)=>tap.cancel(e.pointerId);
  const up=(e:PointerEvent)=>{
   const validTap=tap.up(e.pointerId,e.clientX,e.clientY);if(!validTap||!ready)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
   let nearest=Infinity,found=-1;const hasSolid=atlas.parts.some((p,i)=>!isBodySurface(p)&&data[i*4+3]>.5);
   const pickState=latest.current,pickContext={systems:new Set(pickState.visible),selected:new Set(pickState.selected),hasSolid};
   pickers.forEach((mesh,i)=>{if(!mesh||data[i*4+3]<.5||!resolveVisibility(atlas.parts[i],pickState,pickContext).pickable)return;worldBox.copy(bounds[i]).translate(mesh.position);if(!raycaster.ray.intersectBox(worldBox,hitPoint))return;const hits=raycaster.intersectObject(mesh,false);if(hits[0]&&hits[0].distance<nearest){nearest=hits[0].distance;found=i;}});
   if(found<0&&amount>.45)found=findTarget(e.clientX-rect.left,e.clientY-rect.top,e.pointerType==='touch'?24:16);if(found>=0){hover.hidden=true;select.current(atlas.parts[found].id);}
  };
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
  // Keep the anatomy beneath the cursor fixed while dollying, including view offsets.
  // Capture replaces OrbitControls' wheel handler; its touch/pinch controls stay intact.
  const wheelPlane=new T.Plane(),wheelDirection=new T.Vector3(),wheelAnchor=new T.Vector3(),wheelProjection=new T.Vector3();
  const wheelRaycaster=new T.Raycaster(),wheelPointer=new T.Vector2();
  const wheel=(e:WheelEvent)=>{
   if(!controls.enabled||!controls.enableZoom)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(!ready||!Number.isFinite(e.deltaY)||e.deltaY===0)return;
   const rect=renderer.domElement.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return;
   const unit=e.deltaMode===WheelEvent.DOM_DELTA_LINE?16:e.deltaMode===WheelEvent.DOM_DELTA_PAGE?rect.height:1;
   const delta=T.MathUtils.clamp(e.deltaY*unit*(e.ctrlKey?2.5:1),-300,300);
   const distance=camera.position.distanceTo(controls.target);if(!Number.isFinite(distance)||distance<=0)return;
   const nextDistance=T.MathUtils.clamp(distance*Math.exp(delta*.0018*controls.zoomSpeed),controls.minDistance,controls.maxDistance);
   const factor=nextDistance/distance;if(!Number.isFinite(factor)||Math.abs(factor-1)<1e-10)return;
   camera.updateMatrixWorld();
   wheelPointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
   wheelRaycaster.setFromCamera(wheelPointer,camera);
   const s=latest.current,lookups={visible:new Set(s.visible),selected:new Set(s.selected)};
   // Check both the rendered visibility texture and current state during layer transitions.
   const visible=atlas.parts.map((p,i)=>!!pickers[i]&&data[i*4+3]>.5&&partIsVisible(p,s,lookups));
   const hasSolid=atlas.parts.some((p,i)=>visible[i]&&!isBodySurface(p));
   let nearest=Infinity,found=false;
   pickers.forEach((mesh,i)=>{
    if(!mesh||!visible[i]||(hasSolid&&isBodySurface(atlas.parts[i])))return;
    worldBox.copy(bounds[i]).translate(mesh.position);if(!wheelRaycaster.ray.intersectBox(worldBox,hitPoint))return;
    const hit=wheelRaycaster.intersectObject(mesh,false)[0];if(!hit||hit.distance>=nearest)return;
    wheelProjection.copy(hit.point).project(camera);if(wheelProjection.z< -1||wheelProjection.z>1)return;
    nearest=hit.distance;wheelAnchor.copy(hit.point);found=true;
   });
   if(!found){
    camera.getWorldDirection(wheelDirection);wheelPlane.setFromNormalAndCoplanarPoint(wheelDirection,controls.target);
    if(!wheelRaycaster.ray.intersectPlane(wheelPlane,wheelAnchor))return;
   }
   camera.position.sub(wheelAnchor).multiplyScalar(factor).add(wheelAnchor);
   controls.target.sub(wheelAnchor).multiplyScalar(factor).add(wheelAnchor);
   camera.updateMatrixWorld();hover.hidden=true;dirty=true;
   // The animation loop updates OrbitControls once, avoiding extra damping/auto-rotation per event.
  };
  renderer.domElement.addEventListener('wheel',wheel,{passive:false,capture:true});
  let lastExtent=-1,lastLocked=false;
  const animate=()=>{
   if(disposed)return;frame=requestAnimationFrame(animate);const s=latest.current;
   applyTheme();applyDisplay();
   const locked=latestLock.current;
   if(locked&&!lastLocked){
    // Drain residual damping without moving the orientation captured at lock time.
    const position=camera.position.clone(),target=controls.target.clone();
    controls.autoRotate=false;controls.enableDamping=false;controls.update();
    camera.position.copy(position);controls.target.copy(target);controls.update();controls.enableDamping=true;dirty=true;
   }
   lastLocked=locked;controls.enableRotate=!locked;
   const hiddenChanged=lastState?.hiddenPartIds!==s.hiddenPartIds;
   const changed=hiddenChanged||lastState?.visible!==s.visible||lastState?.selected!==s.selected||lastState?.isolate!==s.isolate||lastState?.isolatedPartIds!==s.isolatedPartIds||lastState?.breastView!==s.breastView||lastState?.regionPartIds!==s.regionPartIds||lastState?.areaPartIds!==s.areaPartIds||lastState?.areaId!==s.areaId;
   const previousAmount=amount,moving=amount!==s.explode;
   if(moving){amount=s.explode;dirty=true;}
   if(changed||moving||lastExtent<0){
    if(changed){hover.hidden=true;renderer.domElement.style.cursor='grab';}
    const visible=new Set(s.visible),selection=new Set(s.selected),visibilityContext={systems:visible,selected:selection};
    if(changed||!explosionLayout){
     const visibleParts=atlas.parts.filter((p,i)=>resolveVisibility(p,s,{...visibilityContext,loaded:!!pickers[i]}).packingEligible);
     const scopeFocus=s.isolate?null:s.areaId?s.areaFocus:s.regionFocus;
     const focus=scopeFocus?.[0].map((n,a)=>(n+scopeFocus[1][a])/2);
     const nextLayoutKey=explosionLayoutKey(visibleParts,modelId,focus);
     if(nextLayoutKey!==layoutKey){explosionLayout=createStableExplosionLayout(visibleParts,modelId,focus);layoutKey=nextLayoutKey;sliderLayoutChanged=true;}
    }
    atlas.parts.forEach((p,i)=>{
     const c=centers[i],target=explosionLayout?.targets.get(p.id);
     let [dx,dy,dz]=target?evaluateExplosionOffset(target,amount,explosionLayout!.lanes.length):[0,0,0];
     const visibility=resolveVisibility(p,s,visibilityContext);if(!visibility.packingEligible)dx=dy=dz=0;
     const selected=selection.has(p.id)&&visibility.displayed;data.set([dx,dy,dz,visibility.displayed?1:0],i*4);const to=selected?255:0,activeHighlight=highlights.get(i);
     if((activeHighlight?.to??selectedData[i*4])!==to){
      if(motionMedia.matches||!ready){selectedData[i*4]=selected?255:0;highlights.delete(i);}
      else highlights.set(i,{from:selectedData[i*4],to,start:performance.now()});
     }
     markerPositions.set(data[i*4+3]>.5?[c.x+dx,c.y+dy,c.z+dz]:[10000,10000,10000],i*3);const mesh=pickers[i];if(mesh){mesh.position.set(dx,dy,dz);mesh.updateMatrix();mesh.updateMatrixWorld(true);}
    });partTexture.needsUpdate=true;selectionTexture.needsUpdate=true;markerGeometry.attributes.position.needsUpdate=true;lastState=s;lastExtent=amount;dirty=true;
   }
   // Sparse selection interpolation shares the existing frame loop and GPU texture.
   if(highlights.size){const now=performance.now();for(const [i,h] of highlights){const t=motionProgress(now-h.start,motionMedia.matches?0:selectionDuration);selectedData[i*4]=Math.round(h.from+(h.to-h.from)*t);if(t===1)highlights.delete(i);}selectionTexture.needsUpdate=true;dirty=true;}
   // Follow the rendered readiness gate, then establish the fixed body-origin stage.
   if(latestRevealed.current&&!floorSettled){
    revealStart??=performance.now();const t=motionProgress(performance.now()-revealStart-(motionMedia.matches?0:sceneDuration),motionMedia.matches?0:sceneDuration);
    if(t!==floorReveal){floor.setReveal(t);floorReveal=t;dirty=true;}
    if(t===1){floorSettled=true;latestSettled.current();}
   }
   if(s.view!==lastView||s.reset!==lastReset){sliderFrame=null;fit(s.view);if(amount>0)fitExplosion(0);lastView=s.view;lastReset=s.reset;}
   else if(moving)fitExplosion(previousAmount);
   const isolateKey=isolationCameraKey(s,camera.aspect);
   if(isolateKey!==lastIsolate){
    if(s.isolate){const box=new T.Box3();atlas.parts.forEach((p,i)=>{if(s.isolatedPartIds?.has(p.id)??s.selected.includes(p.id))box.union(bounds[i].clone().translate(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])));});
     if(!box.isEmpty()){const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());const w=el.clientWidth,h=el.clientHeight,mobile=w<768,landscape=w>h&&h<=600;let left=20,right=w-20,top=mobile?250:110,bottom=h-170;if(s.inspectorOpen){if(landscape){right=w-335;top=100;bottom=h-125;}else if(mobile){const sheet=document.querySelector('.detail-sheet')?.getBoundingClientRect(),header=document.querySelector('.identity')?.getBoundingClientRect();top=(header?.bottom??94)+16;bottom=(sheet?.top??h*.58-139)-16;}else{right=w-370;left=w>1100?285:25;}}const availableWidth=Math.max(150,right-left),availableHeight=Math.max(40,bottom-top);camera.setViewOffset(w,h,w/2-(left+right)/2,h/2-(top+bottom)/2,w,h);const distance=Math.max(.07,Math.max(size.y*h/availableHeight,size.x*w/availableWidth/camera.aspect,size.z)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.35);controls.maxDistance=Math.max(40,distance*2);sliderFrame=null;controls.target.copy(center);camera.position.copy(center).add((s.view==='front'?new T.Vector3(0,.02,1):s.view==='back'?new T.Vector3(0,.02,-1):s.view==='side'?new T.Vector3(1,.02,0):new T.Vector3(.2,.1,1)).normalize().multiplyScalar(distance));controls.update();dirty=true;}
    }else if(lastIsolate){sliderFrame=null;camera.clearViewOffset();fit(s.view);}
    lastIsolate=isolateKey;
   }
   controls.enableRotate=!locked;controls.mouseButtons.LEFT=T.MOUSE.ROTATE;controls.touches.ONE=T.TOUCH.ROTATE;markers.visible=amount>.75;controls.autoRotate=s.rotate&&!locked&&!s.isolate&&amount<.4;controls.autoRotateSpeed=orbitRotationSpeed(latestRotation.current);const now=performance.now(),delta=Math.min(.1,(now-rotationTime)/1000);rotationTime=now;controls.update(controls.autoRotate?delta:undefined);if(controls.autoRotate)dirty=true;
   const floorEligible=sceneFloorEligible(s);
   if(floorEligible!==appliedFloorEligible){floor.setEligible(floorEligible,motionDuration('--motion-medium'));appliedFloorEligible=floorEligible;dirty=true;}
   if(floor.update(delta,motionMedia.matches,!document.hidden))dirty=true;
   if(dirty){renderer.render(scene,camera);targets=[];if(amount>.45){const hasSolid=atlas.parts.some((p,i)=>!isBodySurface(p)&&data[i*4+3]>.5),targetContext={systems:new Set(s.visible),selected:new Set(s.selected),hasSolid};atlas.parts.forEach((p,i)=>{if(data[i*4+3]<.5||!resolveVisibility(p,s,targetContext).pickable)return;let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(let corner=0;corner<8;corner++){projected.set(p.bounds[(corner&1)?1:0][0]+data[i*4],p.bounds[(corner&2)?1:0][1]+data[i*4+1],p.bounds[(corner&4)?1:0][2]+data[i*4+2]).project(camera);const x=(projected.x+1)*el.clientWidth/2,y=(1-projected.y)*el.clientHeight/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}projected.copy(centers[i]).add(new T.Vector3(data[i*4],data[i*4+1],data[i*4+2])).project(camera);if(projected.z< -1||projected.z>1)return;targets.push({index:i,x:(projected.x+1)*el.clientWidth/2,y:(1-projected.y)*el.clientHeight/2,left,right,top,bottom});});}dirty=false;if(ready&&!readyReported){readyReported=true;latestReady.current();}}

  };animate();
  const contextLost=(e:Event)=>{e.preventDefault();onError('The 3D session was paused by your device. Reload to continue.');};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('wheel',wheel,true);controls.dispose();floor.dispose();scene.remove(floor.group);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.traverse(o=>{if(o instanceof T.Mesh&&!geometries.includes(o.geometry)){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});env.dispose();partTexture.dispose();selectionTexture.dispose();markerGeometry.dispose();markerMaterial.dispose();hover.remove();renderer.dispose();renderer.domElement.remove();};
 },[atlas,modelId]);
 return <div className="scene" data-revealed={revealed} ref={host}/>;
}
