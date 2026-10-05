/** Phase 5.71 diagnostic only. Intercepts a dev-module response in this Chrome
 * process; never writes production source or ships a Reveal implementation.
 * Run: ATLAS_URL=http://127.0.0.1:3071 node scripts/reveal-architecture-browser.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const base=process.env.ATLAS_URL??'http://127.0.0.1:3071';
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base),'Local dev server required');
const out=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.71/browser');
fs.mkdirSync(out,{recursive:true});
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
assert.ok(chrome,'Installed Chromium required');
const profile=fs.mkdtempSync(path.join(out,'chrome-'));
const child=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
child.stderr.on('data',d=>fs.appendFileSync(path.join(out,'chrome.log'),d));
let ws;
const errors=[],consoleErrors=[],records=[],interceptionErrors=[];
try{
 let port;
 for(let i=0;i<150;i++){const file=path.join(profile,'DevToolsActivePort');if(fs.existsSync(file)){port=Number(fs.readFileSync(file,'utf8').split('\n')[0]);break;}if(child.exitCode!==null)break;await delay(100);}
 assert.ok(port,'Chrome debugging endpoint started');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let serial=0;const pending=new Map();
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error(`CDP timeout: ${method}`));},30000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push(m.params.args.map(a=>a.value??a.description));else if(m.method==='Fetch.requestPaused')void(async()=>{
  const p=m.params;
  try{
   const body=await send('Fetch.getResponseBody',{requestId:p.requestId});
   let code=body.base64Encoded?Buffer.from(body.body,'base64').toString('utf8'):body.body;
   const anchor='let loaded = 0, readyReported = false;';
   assert.equal(code.split(anchor).length,2,'Exact current Vite module instrumentation anchor');
   code=code.replace(anchor,'window.__revealAudit={T,atlas,modelId,renderer,scene,camera,controls,anatomyGroup,mats,partTexture,selectionTexture,latest,bounds,pickers,groundOffset,contrastUniform};\n'+anchor);
   await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:p.responseStatusCode,responseHeaders:p.responseHeaders.filter(h=>!['content-length','content-encoding'].includes(h.name.toLowerCase())),body:Buffer.from(code).toString('base64')});
  }catch(e){interceptionErrors.push(String(e));await send('Fetch.continueRequest',{requestId:p.requestId});}
 })();};
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=async(expression,label)=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw Error('Timeout: '+label);};
 const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));};
 await send('Runtime.enable');await send('Page.enable');
 await send('Fetch.enable',{patterns:[{urlPattern:'*app/scene.tsx*',requestStage:'Response'}]});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"document.modelContext={registerTool:tool=>{window.__atlasTools??={};window.__atlasTools[tool.name]=tool;}};"});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base+'/male'});
 await wait("document.querySelector('.studio')?.dataset.entrance==='settled'&&!!window.__revealAudit&&!document.querySelector('.loading')",'settled anatomy');
 const gut=await evaluate("({title:document.title,content:document.body.innerText.length,overlay:!!document.querySelector('vite-error-overlay'),canvas:!!document.querySelector('canvas'),buttons:document.querySelectorAll('button').length})");
 assert.equal(gut.title,'Human Atlas');assert.ok(gut.content>100&&gut.canvas&&gut.buttons>10&&!gut.overlay);
 assert.equal(errors.length,0);assert.equal(interceptionErrors.length,0);
 await shot('dev-check');console.log('Dev server verified',JSON.stringify(gut));

 const setup=function(){
  const a=window.__revealAudit,{T}=a;
  a.original=[...a.anatomyGroup.children];a.originalMaterials=a.original.map(m=>m.material);
  a.batchParts=a.original.map(m=>[...new Set(m.geometry.attributes.partIndex.array)]);
  a.maskData=new Uint8Array(a.selectionTexture.image.data.length);
  a.mask=new T.DataTexture(a.maskData,a.selectionTexture.image.width,1);a.mask.magFilter=T.NearestFilter;a.mask.minFilter=T.NearestFilter;a.mask.generateMipmaps=false;a.mask.needsUpdate=true;
  a.alpha={value:.1};a.variants=new Map();a.ghosts=[];
  a.variant=(base,mode)=>{
   const key=base.uuid+mode;if(a.variants.has(key))return a.variants.get(key);
   const m=base.clone();m.transparent=mode!=='target';m.opacity=1;m.depthWrite=mode==='target';m.depthTest=true;m.side=T.DoubleSide;m.forceSinglePass=mode!=='target';
   m.customProgramCacheKey=()=>base.customProgramCacheKey()+'-audit-'+mode;
   m.onBeforeCompile=shader=>{
    base.onBeforeCompile(shader);shader.uniforms.auditMask={value:a.mask};shader.uniforms.auditAlpha=a.alpha;
    shader.vertexShader='uniform sampler2D auditMask; varying float auditTarget;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('partSelected = texture2D(selectionState, stateUv).r;','partSelected = texture2D(selectionState, stateUv).r; auditTarget = texture2D(auditMask, stateUv).r;');
    shader.fragmentShader='uniform float auditAlpha; varying float auditTarget;\n'+shader.fragmentShader;
    const discard=mode==='target'?'if (auditTarget < 0.5) discard;':mode==='ghost'?'if (auditTarget > 0.5) discard;':'';
    shader.fragmentShader=shader.fragmentShader.replace('if (partVisible < 0.5) discard;','if (partVisible < 0.5) discard; '+discard);
    shader.fragmentShader=shader.fragmentShader.replace('diffuseColor.a = mix(diffuseColor.a, 1.0, partSelected);',mode==='target'?'diffuseColor.a = 1.0;':mode==='ghost'?'diffuseColor.a = auditAlpha;':'diffuseColor.a = mix(auditAlpha, 1.0, step(0.5, auditTarget));');
   };a.variants.set(key,m);return m;
  };
  a.original.forEach((mesh,i)=>{const ghost=new T.Mesh(mesh.geometry,a.variant(a.originalMaterials[i],'ghost'));ghost.frustumCulled=false;ghost.visible=false;a.anatomyGroup.add(ghost);a.ghosts.push(ghost);});
  a.mode=(mode,alpha=.1)=>{a.alpha.value=alpha;a.maskData.fill(0);for(const id of a.latest.current.selected){const index=a.atlas.parts.findIndex(p=>p.id===id);if(index>=0)a.maskData[index*4]=255;}a.mask.needsUpdate=true;
   const two=mode.startsWith('two-pass');
   a.original.forEach((mesh,i)=>{mesh.material=mode==='normal'?a.originalMaterials[i]:a.variant(a.originalMaterials[i],two?'target':'single');mesh.visible=mode!=='two-pass-pruned'||a.batchParts[i].some(index=>a.maskData[index*4]&&a.partTexture.image.data[index*4+3]>.5);a.ghosts[i].visible=two;});a.renderer.render(a.scene,a.camera);
  };
  a.measure=()=>{const submit=[],completed=[];const gl=a.renderer.getContext();for(let i=0;i<5;i++){a.renderer.render(a.scene,a.camera);gl.finish();}for(let i=0;i<15;i++){let start=performance.now();a.renderer.render(a.scene,a.camera);submit.push(performance.now()-start);gl.finish();completed.push(performance.now()-start);}const median=v=>[...v].sort((x,y)=>x-y)[Math.floor(v.length/2)];const sorted=completed.slice().sort((x,y)=>x-y);return{submitMedianMs:median(submit),completedMedianMs:median(completed),completedP95Ms:sorted.at(-1),calls:a.renderer.info.render.calls,triangles:a.renderer.info.render.triangles,geometries:a.renderer.info.memory.geometries,programs:a.renderer.info.programs.length,materials:a.variants.size};};
  a.invariants=()=>({visible:Array.from(a.partTexture.image.data).filter((_,i)=>i%4===3),offsets:Array.from(a.partTexture.image.data).filter((_,i)=>i%4!==3),hidden:a.latest.current.hiddenRepresentationIds??[],scope:a.latest.current.isolatedRepresentationIds??[],systems:a.latest.current.visible,selected:a.latest.current.selected,camera:a.camera.matrixWorld.toArray(),projection:a.camera.projectionMatrix.toArray()});
  a.frameTarget=()=>{const box=new T.Box3();for(const id of a.latest.current.selected){const i=a.atlas.parts.findIndex(p=>p.id===id);if(i>=0)box.union(a.bounds[i]);}if(box.isEmpty())throw Error('No target');const center=box.getCenter(new T.Vector3());center.y+=a.groundOffset;const size=box.getSize(new T.Vector3());const distance=Math.max(.32,Math.max(size.x,size.y,size.z)*3.7);a.camera.clearViewOffset();a.controls.target.copy(center);a.camera.position.copy(center).add(new T.Vector3(0,.03,distance));a.controls.update();a.renderer.render(a.scene,a.camera);};
  const gl=a.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
  return{model:a.modelId,parts:a.atlas.parts.length,chunks:a.atlas.chunks.length,renderMeshes:a.original.length,usedMaterials:new Set(a.originalMaterials).size,allocatedMaterials:a.mats.size,triangles:a.atlas.triangles,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),three:T.REVISION};
 };
 const inventory=await evaluate('('+setup.toString()+')()');console.log('Inventory',JSON.stringify(inventory));
 const concepts=await evaluate("window.__revealAudit.atlas.concepts.filter(c=>['liver','heart','brain','left kidney','right kidney','abdominal aorta','scaphoid'].includes(c.name.toLowerCase())).map(c=>({id:c.id,name:c.name,pieces:c.elements.length}))");
 console.log('Concept candidates',JSON.stringify(concepts));
 const names=['liver','heart','brain','left kidney','abdominal aorta','scaphoid'];
 for(const name of names){
  const concept=concepts.find(c=>c.name.toLowerCase()===name);assert.ok(concept,'Exact fixture: '+name);
  await evaluate(`window.__revealAudit.mode('normal');window.__atlasTools.inspect_anatomical_structure.execute({id:${JSON.stringify(concept.id)}})`);
  await delay(250);await evaluate('window.__revealAudit.frameTarget()');await delay(150);
  const slug=name.replaceAll(' ','-');await shot(slug+'-normal');
  const invariant=await evaluate('window.__revealAudit.invariants()');
  const modes=[['normal',1],['single',.1],['two-pass',.1],['two-pass',.2],['two-pass',.3],['two-pass-pruned',.1]];
  for(const [mode,alpha] of modes){
   await evaluate(`window.__revealAudit.mode(${JSON.stringify(mode)},${alpha})`);await delay(150);
   assert.deepEqual(await evaluate('window.__revealAudit.invariants()'),invariant,'Presentation preserves state, offsets and camera');
   const stats=await evaluate('window.__revealAudit.measure()');
   const file=slug+'-'+mode+'-'+alpha;await shot(file);
   records.push({structure:name,concept,mode,alpha,file:file+'.png',...stats});console.log(JSON.stringify(records.at(-1)));
  }
 }
 // Dense two-sided ghost comparison and theme check on the last fixture.
 await evaluate("window.__revealAudit.mode('two-pass',.1);for(const m of window.__revealAudit.variants.values())if(m.transparent)m.forceSinglePass=false");
 records.push({structure:'scaphoid',mode:'two-pass-double-sided',alpha:.1,...await evaluate('window.__revealAudit.measure()')});await shot('scaphoid-double-sided');
 await evaluate("document.querySelector('.theme-trigger').click()");
 await wait("document.documentElement.dataset.theme==='dark'",'actual Dark theme');
 await delay(300);await shot('scaphoid-dark-diagnostic');
 // One tiny wrist representation through the actual Included member callback.
 await evaluate("document.querySelector('.member-list button').click()");
 await wait("window.__revealAudit.latest.current.selected.length===1",'single wrist member');
 await delay(180);await evaluate("window.__revealAudit.frameTarget();window.__revealAudit.mode('two-pass-pruned',.1)");
 await shot('wrist-single-dark');
 records.push({structure:'single scaphoid member',mode:'two-pass-pruned-dark-double-sided',alpha:.1,partIds:await evaluate('window.__revealAudit.latest.current.selected'),...await evaluate('window.__revealAudit.measure()')});
 await evaluate("window.__revealAudit.mode('normal')");
 assert.equal(errors.length,0);assert.equal(consoleErrors.length,0);assert.equal(interceptionErrors.length,0);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,viewport:[1440,900],inventory,gut,records,errors,consoleErrors,interceptionErrors,scope:'Diagnostic rendering; not final UI/picking/device acceptance'},null,2));
 console.log('Diagnostic complete; zero runtime/console/interception errors');
}catch(e){fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(e),errors,consoleErrors,interceptionErrors,records},null,2));throw e;}
finally{ws?.close();child.kill();}
