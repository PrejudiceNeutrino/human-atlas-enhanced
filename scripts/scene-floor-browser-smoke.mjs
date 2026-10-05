/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import * as T from 'three';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3039';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.4/browser');fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'chrome-'));
const processHandle=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions',...(process.env.CHROME_ANGLE?[`--use-angle=${process.env.CHROME_ANGLE}`,'--enable-unsafe-swiftshader']:[]),'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
processHandle.stderr.on('data',d=>fs.appendFileSync(path.join(output,'chrome.log'),d));
processHandle.on('exit',(code,signal)=>console.log('Chrome exit',code,signal));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const dataset=read('public/areas/canonical-areas-v1.json'),regions=read('public/regions/canonical-regions-v1.json'),sidecar=read('public/identity/core-crosswalk-v1.json');
let ws,failureCapture;
try{
 let port;for(let i=0;i<200;i++){const p=path.join(profile,'DevToolsActivePort');if(fs.existsSync(p)){port=Number(fs.readFileSync(p,'utf8').split('\n')[0]);break;}await delay(100);}assert.ok(port,'Chrome debugging endpoint started');
 const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let held=[];let holdGeometry=false,failManifest=false;
 let serial=0;const pending=new Map(),errors=[],network=[];
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Network.responseReceived')network.push(m.params.response.url);else if(m.method==='Fetch.requestPaused'){if(failManifest)send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'});else if(holdGeometry)held.push(m.params.requestId);else send('Fetch.continueRequest',{requestId:m.params.requestId});}};
 ws.onclose=()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Chrome target disconnected'));}pending.clear();};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout ${method}`));},30000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const waitFor=async(expression,label)=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error(`Timeout: ${label}`);};
 const mouse=async(x,y)=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});};
 const click=async selector=>{const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Missing '+${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await mouse(p.x,p.y);await delay(150);};
 const buttonText=async(text,scope='document')=>{await evaluate(`(()=>{const e=[...${scope}.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)}||(${JSON.stringify(scope)}.includes('system-list')&&e.textContent.trim().startsWith(${JSON.stringify(text)})));if(!e)throw new Error('Missing button '+${JSON.stringify(text)});e.click();})()`);await delay(150);};
 const {select:selectMenu,options:menuOptions}=selectBrowserHelpers({evaluate,click,waitFor,delay});
 const region=slug=>selectMenu('#region-choice',`atlas:region:${slug}`);
 const count=async()=>Number((await evaluate("document.querySelector('.panel-foot span').textContent")).replace(/[^0-9]/g,''));
 const settled=async()=>{let previous;for(let i=0;i<100;i++){const pixels=await evaluate('window.__atlasTestRender?.pixels');if(pixels&&JSON.stringify(pixels)===previous)return;previous=JSON.stringify(pixels);await delay(100);}throw new Error('Explosion offsets did not settle');};
 const assembled=async()=>{const expected=await count();await waitFor(`window.__atlasTestRender?.maxOffset<0.0005&&window.__atlasTestRender.displayed===${expected}`,'rendered anatomy assembled');};
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
 failureCapture=async()=>{await screenshot('failure');fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify(await evaluate("({url:location.href,text:document.body.innerText,options:[...document.querySelectorAll('[role=option]')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))})"),null,2));};
 const ready=async()=>{await delay(400);await waitFor("!!document.querySelector('.scene canvas')&&!document.querySelector('.loading')&&!!document.querySelector('#region-choice')&&document.querySelector('.studio').dataset.shellSettled==='true'",'model geometry and visible shell loaded');};
 const tab=async name=>{await evaluate(`(()=>{[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent.trim().startsWith(${JSON.stringify(name)})).click()})()`);await delay(150);};
 const layers=async mobile=>{if(mobile)await click('[aria-label="Open system layers"]');await tab('Systems');};
 const closeLayers=async mobile=>{if(mobile)await click('[aria-label="Close systems"]');};
 const search=async(name='heart')=>{
  if(await evaluate("!!document.querySelector('.detail-sheet')&&getComputedStyle(document.querySelector('.top-actions')).visibility==='hidden'"))await closeInspector();
  await click('[aria-label="Search anatomy"]');
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Search named anatomical structures"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(name)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor(`[...document.querySelectorAll('[role=option]')].some(e=>e.querySelector('.search-result-name')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())})`,'search result');
  const pos=await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.querySelector('.search-result-name')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await mouse(pos.x,pos.y);
  await waitFor(`document.querySelector('.detail-sheet .structure-title')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())}`,'search selected');
 };
 const area=slug=>selectMenu('#area-choice',slug?`atlas:area:${slug}`:'');
 const noOverlap=async()=>{
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'No horizontal overflow');
  assert.equal(await evaluate("(()=>{const a=document.querySelector('.anatomy-choice').getBoundingClientRect(),b=document.querySelector('.view-controls').getBoundingClientRect();return a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top})()"),true,'Navigation and camera controls do not overlap');
 };
 const explode=async()=>{await evaluate("document.querySelector('.explode-control input[type=range]').focus()");await send('Input.dispatchKeyEvent',{type:'keyDown',key:'End',code:'End',windowsVirtualKeyCode:35});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'End',code:'End',windowsVirtualKeyCode:35});await waitFor("document.querySelector('.explode-control output').textContent==='100%'",'explode reached 100%');await delay(500);await settled();};
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 // Test-only capture of the real GPU visibility/offset texture; production code is untouched.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  let previous;
  for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type)for(const method of ['texImage2D','texSubImage2D']){
   const original=type.prototype[method];type.prototype[method]=function(...args){
    const pixels=args.at(-1);if(pixels instanceof Float32Array&&pixels.length===16384&&(method==='texImage2D'?args[4]:args[5])===1){
     let maxOffset=0,maxChange=0,displayed=0;for(let i=0;i<pixels.length;i+=4){for(let a=0;a<3;a++){maxOffset=Math.max(maxOffset,Math.abs(pixels[i+a]));if(previous)maxChange=Math.max(maxChange,Math.abs(pixels[i+a]-previous[i+a]));}if(pixels[i+3]>.5)displayed++;}
     window.__atlasTestRender={maxOffset,maxChange,displayed,pixels:Array.from(pixels)};previous=pixels.slice();
    }else if(pixels instanceof Uint8Array&&pixels.length===16384&&(method==='texImage2D'?args[4]:args[5])===1){window.__atlasTestSelection=Array.from(pixels);}
    return original.apply(this,args);
   };
  }
 })()`});
 // Capture camera uniforms in the test process, without production hooks or new camera math.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  const names=new WeakMap();window.__atlasTestCamera={};
  for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type){
   const locate=type.prototype.getUniformLocation;type.prototype.getUniformLocation=function(program,name){const location=locate.call(this,program,name);if(location)names.set(location,name);return location;};
   const matrix=type.prototype.uniformMatrix4fv;type.prototype.uniformMatrix4fv=function(location,transpose,value,...rest){const name=names.get(location);if(name==='viewMatrix'||name==='projectionMatrix')window.__atlasTestCamera[name]=Array.from(value);return matrix.call(this,location,transpose,value,...rest);};
  }
 })()`});
 const report=[];
 const hiddenCount=async()=>Number(await evaluate("document.querySelector('.hidden-count')?.textContent??'0'"));
 const gpu=()=>evaluate('window.__atlasTestRender.pixels');
 const camera=()=>evaluate('window.__atlasTestCamera');
 const assertCamera=async before=>{const after=await camera();for(const key of ['viewMatrix','projectionMatrix'])for(let i=0;i<16;i++)assert.ok(Math.abs(before[key][i]-after[key][i])<0.00001,`Hide/restore preserves ${key}[${i}]`);};
 const checkCount=async expected=>{assert.equal(await count(),expected,'UI visible count');await waitFor(`window.__atlasTestRender?.displayed===${expected}`,'GPU matches visible count');};
 const hide=async()=>{assert.ok(await evaluate("document.querySelector('.hide-structure').getBoundingClientRect().height>=44"),'Hide touch target');await click('.hide-structure');await waitFor("!document.querySelector('.detail-sheet')",'hide closes inspector');assert.equal(await evaluate('window.__atlasTestSelection?.some(x=>x!==0)'),false,'No stale GPU highlight');assert.equal(await evaluate("document.querySelector('.part-hover').hidden"),true,'No stale hover');};
 const restore=async()=>{await tab('Hidden');await click('.restore-hidden');await waitFor("document.querySelector('.restore-hidden').disabled",'hidden state cleared');await tab('Systems');};
 const reset=async()=>{await click('[aria-label="Assemble and reset"]');await waitFor("document.querySelector('.restore-hidden').disabled&&!document.querySelector('.detail-sheet')&&document.querySelector('#region-choice').value==='atlas:region:body'&&document.querySelector('#area-choice').value===''",'full reset');await assembled();};
 const switchModel=async target=>{await click('[aria-label="Choose male or female anatomy"]');await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.trim()===${JSON.stringify(target==='male'?'Male anatomy':'Female anatomy')});if(!e)throw new Error('Missing model');e.click()})()`);await waitFor(`location.pathname===${JSON.stringify('/'+target)}`,'model switch');await ready();};
 const pressKey=async(key,text)=>{const code=key==='/'?'Slash':'KeyH',windowsVirtualKeyCode=key==='/'?191:72,modifiers=key==='H'?8:0;await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,modifiers,...(text?{text}:{} )});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode,modifiers});await delay(150);};
 // Setup only: use the existing Close button action without racing its moving pointer target.
 const closeInspector=async()=>{await evaluate("document.querySelector('.detail-sheet [data-slot=\"sheet-close\"]').click()");await waitFor("!document.querySelector('.detail-sheet')",'inspector close transition completed');};
 const hideByKey=async letter=>{await pressKey(letter);await waitFor("!document.querySelector('.detail-sheet')&&!window.__atlasTestSelection.some(x=>x!==0)",'shortcut hides and clears GPU selection');};
 const hiddenOrder=async()=>{await tab('Hidden');return evaluate("[...document.querySelectorAll('.hidden-list li')].map(e=>e.dataset.representationId)");};
 const restoreOne=async id=>{await tab('Hidden');await click(`.hidden-list li[data-representation-id="${id}"] button`);await delay(150);};
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  window.__presentation={uniforms:{},shaderCompiles:0,framebuffers:0,entrances:[],canvasStates:[]};
  document.addEventListener('animationstart',e=>{if(e.animationName.startsWith('atlas-enter'))window.__presentation.entrances.push({name:e.animationName,time:performance.now()});});
  const names=new WeakMap();
  for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type){
   const locate=type.prototype.getUniformLocation;type.prototype.getUniformLocation=function(program,name){const loc=locate.call(this,program,name);if(loc)names.set(loc,name);return loc;};
   const uniform=type.prototype.uniform1f;type.prototype.uniform1f=function(loc,value){const name=names.get(loc);if(name==='displayContrast'||name==='toneMappingExposure')window.__presentation.uniforms[name]=value;return uniform.call(this,loc,value);};
   const compile=type.prototype.compileShader;type.prototype.compileShader=function(...args){window.__presentation.shaderCompiles++;return compile.apply(this,args);};
   const framebuffer=type.prototype.createFramebuffer;type.prototype.createFramebuffer=function(...args){window.__presentation.framebuffers++;return framebuffer.apply(this,args);};
  }
 })()`});
 const snapshot=()=>evaluate("({gpu:window.__atlasTestRender.pixels,selection:window.__atlasTestSelection,camera:window.__atlasTestCamera,url:location.href,explode:document.querySelector('.explode-control output').textContent,hidden:document.querySelector('.hidden-count').textContent,isolate:!!document.querySelector('.detail-sheet.is-isolated'),reference:document.querySelector('.structure-meta strong')?.textContent})");
 const assertSnapshot=async before=>{const after=await snapshot();const {camera:ignoredBefore,...previous}=before,{camera:ignoredAfter,...current}=after;assert.deepEqual(current,previous);await assertCamera(before.camera);};
 const key=async name=>{const codes={Home:36,End:35,Escape:27,Enter:13};await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:codes[name],...(name==='Enter'?{text:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:codes[name]});};
 const chooseTheme=async mode=>{if(await evaluate('document.documentElement.dataset.theme')!==mode)await click('.theme-trigger');await delay(220);};
 const displaySlider=async(index,end)=>{await evaluate(`document.querySelectorAll('.display-setting input[type=range]')[${index}].focus()`);await key(end?'End':'Home');await delay(200);};
 // Observe real GPU work in the test process; no runtime diagnostics added to the product.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  window.__floor={uniforms:{},compiles:0,buffers:0,textures:0,framebuffers:0,draws:0,frames:[],shaderErrors:[]};
  const names=new WeakMap();
  const proto=WebGL2RenderingContext.prototype;
  const locate=proto.getUniformLocation;proto.getUniformLocation=function(program,name){const loc=locate.call(this,program,name);if(loc)names.set(loc,name);return loc;};
  const uniform=proto.uniform1f;proto.uniform1f=function(loc,value){const name=names.get(loc);if(name?.startsWith('uFloor'))window.__floor.uniforms[name]=value;return uniform.call(this,loc,value);};
  for(const [create,remove,key] of [['createBuffer','deleteBuffer','buffers'],['createTexture','deleteTexture','textures'],['createFramebuffer','deleteFramebuffer','framebuffers']]){
   const make=proto[create],dispose=proto[remove];proto[create]=function(...args){window.__floor[key]++;return make.apply(this,args);};proto[remove]=function(...args){if(args[0])window.__floor[key]--;return dispose.apply(this,args);};
  }
  const compile=proto.compileShader;proto.compileShader=function(...args){window.__floor.compiles++;return compile.apply(this,args);};
  const shaderLog=proto.getShaderInfoLog;proto.getShaderInfoLog=function(...args){const log=shaderLog.apply(this,args);if(log)window.__floor.shaderErrors.push(log);return log;};
  const clear=proto.clear;proto.clear=function(...args){window.__floor.draws=0;return clear.apply(this,args);};
  for(const method of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const draw=proto[method];proto[method]=function(...args){window.__floor.draws++;return draw.apply(this,args);};}
  let previous;function sample(now){if(previous&&window.__floor.record)window.__floor.frames.push(now-previous);previous=now;requestAnimationFrame(sample);}requestAnimationFrame(sample);
 })()`});
 const floorValue=()=>evaluate("document.querySelector('#scene-floor-choice')?.value");
 const openDisplay=async()=>{if(!await evaluate("!!document.querySelector('.display-popover')"))await click('[aria-label="Display settings"]');};
 const closeDisplay=async()=>{if(await evaluate("!!document.querySelector('.display-popover')")){await key('Escape');await waitFor("!document.querySelector('.display-popover')",'Display closed');}};
 const chooseFloor=async id=>{await openDisplay();await selectMenu('#scene-floor-choice',id);assert.equal(await floorValue(),id);await closeDisplay();await delay(220);};
 const storedFloor=()=>evaluate("JSON.parse(localStorage.getItem('human-atlas-display')??'{}').sceneFloor??'classic'");
 const resources=()=>evaluate("({buffers:window.__floor.buffers,textures:window.__floor.textures,framebuffers:window.__floor.framebuffers,compiles:window.__floor.compiles})");
 const finish=()=>waitFor("document.querySelector('.studio')?.dataset.entrance==='settled'",'entrance settled');
 const presets=['classic','minimal','grid','scanner','orbital','event-horizon','void'],shaders={minimal:1,grid:2,scanner:3,orbital:4,'event-horizon':5};
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:baseUrl+'/male'});await ready();await finish();
 assert.equal(await storedFloor(),'classic');await screenshot('initial-classic');
 console.log('PASS initial production page, Classic default and operable controls');
 if(process.env.FLOOR_PROBE==='1'){
  const report=[];
  const stable=await snapshot();
  for(const preset of presets){
   await evaluate('window.__floor.frames=[];window.__floor.record=true');
   const before=await resources();await chooseFloor(preset);await delay(500);await evaluate('window.__floor.record=false');
   const intervals=await evaluate('window.__floor.frames'),sorted=[...intervals].sort((a,b)=>a-b);
   const matrices=await camera(),point=new T.Vector3(.435,-.0049,0).applyMatrix4(new T.Matrix4().fromArray(matrices.viewMatrix)).applyMatrix4(new T.Matrix4().fromArray(matrices.projectionMatrix));
   const x=(point.x+1)*1440/2,y=(1-point.y)*900/2;
   assert.ok(x>285&&x<1300&&y>400&&y<730,'Floor test point lies outside UI and feet');
   await mouse(x,y);await delay(200);await assertSnapshot(stable);
   report.push({preset,draws:await evaluate('window.__floor.draws'),compileDelta:(await resources()).compiles-before.compiles,switchFrames:{count:intervals.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:Math.max(...intervals)},floorClickUnchanged:true});
  }
  await openDisplay();await screenshot('display-desktop');await closeDisplay();
  await chooseFloor('scanner');await delay(200);const phase=await evaluate('window.__floor.uniforms.uFloorTime');
  await send('Page.setWebLifecycleState',{state:'frozen'});await delay(1500);await send('Page.setWebLifecycleState',{state:'active'});await send('Page.bringToFront');const resumed=await evaluate('window.__floor.uniforms.uFloorTime');assert.ok(resumed-phase<=.2,'Frozen tab does not catch up decorative phase');
  assert.deepEqual(await evaluate('window.__floor.shaderErrors'),[]);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'probe-report.json'),JSON.stringify({passed:true,report,frozenTab:{before:phase,after:resumed},exceptions:errors},null,2));console.log('PASS first-use switches, floor background clicks and frozen-tab phase');
 }else{
 const visuals=[],frames=[];
 for(const theme of ['light','dark']){
  await chooseTheme(theme);await reset();await delay(500);
  const baseline=await snapshot(),requests=network.filter(u=>/\/(models|identity|regions|areas)\//.test(u)).length;
  for(const preset of presets){
   await chooseFloor(preset);await assertSnapshot(baseline);
   assert.equal(network.filter(u=>/\/(models|identity|regions|areas)\//.test(u)).length,requests,'No assets reloaded');
   if(shaders[preset])assert.equal(await evaluate('window.__floor.uniforms.uFloorPreset'),shaders[preset]);
   await screenshot(theme+'-'+preset);const draws=await evaluate('window.__floor.draws');visuals.push({theme,preset,draws});
   if(['classic','scanner','orbital','event-horizon'].includes(preset)){
    await evaluate('window.__floor.frames=[];window.__floor.record=true');await delay(2500);await evaluate('window.__floor.record=false');
    const intervals=await evaluate('window.__floor.frames');const sorted=[...intervals].sort((a,b)=>a-b);frames.push({theme,preset,count:intervals.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:Math.max(...intervals)});
   }
  }
 }
 // A complete slow sweep in both palettes, with intermediate visual captures.
 for(const theme of ['light','dark']){await chooseTheme(theme);await chooseFloor('scanner');const start=await evaluate('window.__floor.uniforms.uFloorTime');for(let i=0;i<4;i++){await delay(6200);await screenshot(theme+'-scanner-cycle-'+i);}const end=await evaluate('window.__floor.uniforms.uFloorTime');assert.ok(end-start>=24,'Full 24-second sweep observed');}
 // Every stored preset restores through a real reload; invalid values migrate safely.
 for(const preset of presets){await chooseFloor(preset);await send('Page.reload');await ready();await finish();await openDisplay();assert.equal(await floorValue(),preset);await closeDisplay();}
 await evaluate("localStorage.setItem('human-atlas-display',JSON.stringify({brightness:1,contrast:1,sceneFloor:'removed'}))");await send('Page.reload');await ready();await finish();await openDisplay();assert.equal(await floorValue(),'classic');await closeDisplay();
 // Live reduced-motion retains each procedural style and freezes GPU phase.
 for(const preset of ['scanner','orbital','event-horizon']){
  await chooseFloor(preset);await delay(250);assert.ok(await evaluate('window.__floor.uniforms.uFloorTime')>0);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(300);
  assert.equal(await evaluate('window.__floor.uniforms.uFloorTime'),0);await delay(400);assert.equal(await evaluate('window.__floor.uniforms.uFloorTime'),0);assert.equal(await storedFloor(),preset);await screenshot('reduced-'+preset);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 }
 // Repeated switches reuse GPU objects and program, including Classic/void round trips.
 await chooseFloor('grid');const warm=await resources();
 for(let cycle=0;cycle<4;cycle++)for(const preset of presets)await chooseFloor(preset);
 await chooseFloor('grid');assert.deepEqual(await resources(),warm);const memory={before:warm,after:await resources(),cycles:4};
 // Floor + Reset display preserve hidden history, navigation, isolate, explode, camera and textures.
 await reset();await search('right clavicle');await hide();await region('shoulder');await area('axilla');await search('right pectoral girdle');await buttonText('Isolate structure');await closeInspector();await explode();await delay(500);
 const composed=await snapshot();
 for(const preset of presets){await chooseFloor(preset);await assertSnapshot(composed);}
 await openDisplay();await displaySlider(0,true);await displaySlider(1,false);await buttonText('Reset display');assert.deepEqual(await evaluate("JSON.parse(localStorage.getItem('human-atlas-display'))"),{brightness:1,contrast:1,sceneFloor:'classic'});assert.equal(await floorValue(),'classic');await closeDisplay();await assertSnapshot(composed);await screenshot('composed-reset');
 const scopes=[];
 for(const route of ['male','female']){
  await send('Page.navigate',{url:baseUrl+'/'+route});await ready();await finish();
  for(const preset of ['classic','grid','event-horizon']){
   await reset();await chooseFloor(preset);
   for(const slug of ['head-jaw','thoracic','ankle-foot']){await region(slug);await delay(300);const before=await snapshot();await chooseFloor(preset==='classic'?'grid':'classic');await assertSnapshot(before);await chooseFloor(preset);await screenshot(route+'-'+preset+'-region-'+slug);scopes.push({route,preset,region:slug});}
   await reset();
   for(const slug of ['heart','brachial-plexus']){await area(slug);await delay(300);await screenshot(route+'-'+preset+'-area-'+slug);assert.equal(await storedFloor(),preset);}
   for(const name of [route==='female'?'abdomen proper':'abdomen','right pectoral girdle','right clavicle']){await reset();await search(name);await buttonText('Isolate structure');await closeInspector();await delay(300);const before=await snapshot();await chooseFloor(preset==='classic'?'grid':'classic');await assertSnapshot(before);await chooseFloor(preset);await screenshot(route+'-'+preset+'-isolate-'+name.replaceAll(' ','-'));}
   await reset();
   for(const amount of [0,50,100]){
    await evaluate("document.querySelector('.explode-control input[type=range]').focus()");await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Home',code:'Home',windowsVirtualKeyCode:36});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Home',code:'Home',windowsVirtualKeyCode:36});
    for(let i=0;i<amount;i++){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});}
    await waitFor(`document.querySelector('.explode-control output').textContent==='${amount}%'`,'explode percent');await settled();await delay(250);const before=await snapshot();await chooseFloor(preset==='classic'?'grid':'classic');await assertSnapshot(before);await chooseFloor(preset);await screenshot(route+'-'+preset+'-explode-'+amount);
   }
  }
  for(const preset of ['classic','event-horizon']){await reset();await chooseFloor(preset);await click('[aria-label="Random anatomy"]');await waitFor("!!document.querySelector('.detail-sheet.is-isolated')",'Random isolation');assert.equal(await storedFloor(),preset);await screenshot(route+'-'+preset+'-random');await closeInspector();}
  await reset();await chooseFloor('event-horizon');await switchModel(route==='male'?'female':'male');await finish();assert.equal(await storedFloor(),'event-horizon');await screenshot(route+'-model-switch');
 }
 // Responsive review is optional when the user narrows acceptance to desktop.
 for(const [width,height] of (process.env.SMOKE_DESKTOP?[]:[[390,844],[740,420]])){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await reset();await chooseFloor('event-horizon');await openDisplay();await screenshot('display-'+width);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await closeDisplay();}
 assert.deepEqual(errors,[]);assert.deepEqual(await evaluate('window.__floor.shaderErrors'),[]);
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:!!process.env.SMOKE_DESKTOP,visuals,frames,memory,scopes,persistence:true,reset:true,modelSwitch:true,reducedMotion:true,random:true,noReload:true,noSemanticChange:true,exceptions:errors},null,2));
 console.log('PASS seven floor presets, both palettes/models, GPU independence, persistence, reduced motion and resource switching');
 }
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
