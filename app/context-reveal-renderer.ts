import * as T from 'three';
import type {Atlas,SceneState} from './anatomy';
import type {ModelId,RepresentationId} from './identity-contracts';
import {representationId} from './identity-index.ts';
import {CONTEXT_REVEAL_OPACITY,type ContextRevealSubject} from './context-reveal.ts';

type Batch={mesh:T.Mesh;normal:T.Material;context:T.Mesh;indices:readonly number[];targetMaterial:T.Material};
/** Two render queues in one scene render, with original merged buffers shared. */
export function createContextRevealRenderer(atlas:Atlas,modelId:ModelId,group:T.Group){
 const width=T.MathUtils.ceilPowerOfTwo(Math.max(1,atlas.parts.length));
 const bytes=new Uint8Array(width*4),texture=new T.DataTexture(bytes,width,1);
 texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;
 const contextOpacity={value:CONTEXT_REVEAL_OPACITY};
 const index=new Map<RepresentationId,number>(atlas.parts.map((p,i)=>[representationId(modelId,p.id),i]));
 const variants=new Map<T.Material,{target:T.Material;context:T.Material}>(),batches:Batch[]=[];
 let subject:ContextRevealSubject|undefined,lastRevision=-1,active=false,disposed=false;
 let targetIndices=new Set<number>();
 const variant=(base:T.Material,pass:'target'|'context')=>{
  const material=base.clone();material.transparent=pass==='context';material.opacity=1;material.depthTest=true;material.depthWrite=pass==='target';material.side=T.DoubleSide;material.forceSinglePass=pass==='context';material.blending=T.NormalBlending;
  material.customProgramCacheKey=()=>base.customProgramCacheKey()+'-context-reveal-v1-'+pass;
  material.onBeforeCompile=(shader,renderer)=>{
   base.onBeforeCompile(shader,renderer);
   shader.uniforms.revealTargetMask={value:texture};shader.uniforms.revealContextOpacity=contextOpacity;
   shader.vertexShader='uniform sampler2D revealTargetMask; varying float revealTarget;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('partSelected = texture2D(selectionState, stateUv).r;','partSelected = texture2D(selectionState, stateUv).r; revealTarget = texture2D(revealTargetMask, stateUv).r;');
   shader.fragmentShader='uniform float revealContextOpacity; varying float revealTarget;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('if (partVisible < 0.5) discard;','if (partVisible < 0.5) discard;\n'+(pass==='target'?'if (revealTarget < 0.5) discard;':'if (revealTarget > 0.5) discard;'));
   if(pass==='context')shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.008, 0.42, 0.32), partSelected);','');
   shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.a = mix(diffuseColor.a, 1.0, partSelected);',pass==='target'?'diffuseColor.a = 1.0;':'diffuseColor.a = revealContextOpacity;');
  };return material;
 };
 return {
  texture,contextOpacity,
  registerBatch(mesh:T.Mesh,indices:readonly number[]){
   if(disposed)throw new Error('Context Reveal renderer is disposed.');
   const normal=mesh.material as T.Material;
   let materials=variants.get(normal);if(!materials){materials={target:variant(normal,'target'),context:variant(normal,'context')};variants.set(normal,materials);}
   const context=new T.Mesh(mesh.geometry,materials.context);context.name='Anatomy reveal context';context.frustumCulled=false;context.visible=false;context.renderOrder=mesh.renderOrder;group.add(context);
   batches.push({mesh,normal,context,indices,targetMaterial:materials.target});lastRevision=-1;
  },
  /** Visibility revision comes from the existing CPU state-buffer update, not time. */
  sync(state:SceneState,visibility:Float32Array,revision:number){
   if(disposed)return false;
   const next=state.contextReveal;
   if(subject===next&&lastRevision===revision)return false;
   subject=next;lastRevision=revision;
   const targets=new Set<number>();
   if(next?.mode==='context'&&next.modelId===modelId)for(const id of next.targetRepresentationIds){const i=index.get(id);if(i!==undefined&&visibility[i*4+3]>.5)targets.add(i);}
   const enabled=targets.size>0;
   let changed=active!==enabled;
   if(targets.size!==targetIndices.size||[...targets].some(i=>!targetIndices.has(i))){
    for(const i of targetIndices)bytes[i*4]=0;
    for(const i of targets)bytes[i*4]=255;
    texture.needsUpdate=true;targetIndices=targets;changed=true;
   }
   active=enabled;
   for(const batch of batches){
    let hasTarget=false,hasContext=false;
    if(enabled)for(const i of batch.indices){if(visibility[i*4+3]<.5)continue;if(targets.has(i))hasTarget=true;else hasContext=true;if(hasTarget&&hasContext)break;}
    const material=enabled?batch.targetMaterial:batch.normal,visible=enabled?hasTarget:true;
    if(batch.mesh.material!==material||batch.mesh.visible!==visible||batch.context.visible!==hasContext)changed=true;
    batch.mesh.material=material;batch.mesh.visible=visible;batch.context.visible=hasContext;
   }
   return changed;
  },
  isTarget:(i:number)=>active&&bytes[i*4]===255,
  dispose(){
   if(disposed)return;disposed=true;
   for(const b of batches){group.remove(b.context);b.mesh.material=b.normal;b.mesh.visible=true;}
   for(const pair of variants.values()){pair.target.dispose();pair.context.dispose();}
   texture.dispose();variants.clear();batches.length=0;targetIndices.clear();bytes.fill(0);
  },
 };
}
