/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {createAreaIndex} from '../app/areas.ts';
import {DEFAULT_VISIBLE} from '../app/anatomy.ts';
import * as T from 'three';
import {createExplosionLayout} from '../app/explosion-layout.ts';
import {gunzipSync} from 'node:zlib';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';
import {defaultVisibleForModel} from '../app/viewer-polish.ts';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3039';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-4.9/browser');fs.mkdirSync(output,{recursive:true});
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
 const settled=()=>waitFor("window.__atlasTestRender?.maxChange<0.0001",'rendered explosion offsets settled');
 const assembled=async()=>{const expected=await count();await waitFor(`window.__atlasTestRender?.maxOffset<0.0005&&window.__atlasTestRender.displayed===${expected}`,'rendered anatomy assembled');};
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
 failureCapture=async()=>{await screenshot('failure');fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify(await evaluate("({url:location.href,text:document.body.innerText,options:[...document.querySelectorAll('[role=option]')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))})"),null,2));};
 const ready=async()=>{await delay(400);await waitFor("!!document.querySelector('.scene canvas')&&!document.querySelector('.loading')&&!!document.querySelector('#region-choice')",'all model geometry loaded');};
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
 const restore=async()=>{await tab('Hidden');await click('.restore-hidden');await waitFor("!document.querySelector('.restore-hidden')",'hidden state cleared');await tab('Systems');};
 const reset=async()=>{await click('[aria-label="Assemble and reset"]');await waitFor("!document.querySelector('.restore-hidden')&&!document.querySelector('.detail-sheet')&&document.querySelector('#region-choice').value==='atlas:region:body'&&document.querySelector('#area-choice').value===''",'full reset');await assembled();};
 const switchModel=async target=>{await click('[aria-label="Choose male or female anatomy"]');await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.trim()===${JSON.stringify(target==='male'?'Male anatomy':'Female anatomy')});if(!e)throw new Error('Missing model');e.click()})()`);await waitFor(`location.pathname===${JSON.stringify('/'+target)}`,'model switch');await ready();};
 const pressKey=async(key,text)=>{const code=key==='/'?'Slash':'KeyH',windowsVirtualKeyCode=key==='/'?191:72,modifiers=key==='H'?8:0;await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,modifiers,...(text?{text}:{} )});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode,modifiers});await delay(150);};
 // Setup only: use the existing Close button action without racing its moving pointer target.
 const closeInspector=async()=>{await evaluate("document.querySelector('.detail-sheet [data-slot=\"sheet-close\"]').click()");await waitFor("!document.querySelector('.detail-sheet')",'inspector close transition completed');};
 const hideByKey=async letter=>{await pressKey(letter);await waitFor("!document.querySelector('.detail-sheet')&&!window.__atlasTestSelection.some(x=>x!==0)",'shortcut hides and clears GPU selection');};
 const hiddenOrder=async()=>{await tab('Hidden');return evaluate("[...document.querySelectorAll('.hidden-list li')].map(e=>e.dataset.representationId)");};
 const restoreOne=async id=>{await tab('Hidden');await click(`.hidden-list li[data-representation-id="${id}"] button`);await delay(150);};
 // Inspect actual screenshot pixels in a temporary 2D canvas; no production rendering changes.
 const selectionPixels=async(name,width,height)=>{
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(shot.data,'base64'));
  const left=width<768?0:285,top=height<600?90:width<768?320:130,right=width-(width<768?62:90),bottom=height-(height<600?110:width<768?175:200);
  return evaluate(`new Promise((resolve,reject)=>{const img=new Image();img.onerror=reject;img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(${left},${top},${right-left},${bottom-top}).data,colors=new Set();let teal=0;for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(g>100&&b>60&&r<g*.78&&b>r*1.15&&g>b*1.04){teal++;colors.add(r+','+g+','+b);}}resolve({tealPixels:teal,shadedColors:colors.size});};img.src=${JSON.stringify('data:image/png;base64,'+shot.data)};})`);
 };



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
 for(const route of ['male','female']){
 const width=1440,height=900,mobile=false,model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'];
 const atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),partIndex=new Map(atlas.parts.map((p,i)=>[p.id,i])),buffers=new Map();
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 // Hold actual chunk requests to prove the readiness gate, without slowing production.
 holdGeometry=true;held=[];await send('Fetch.enable',{patterns:[{urlPattern:'*models/*.bin*'}]});
 await send('Page.navigate',{url:baseUrl+'/'+route});
 for(let i=0;i<100&&!held.length;i++)await delay(100);assert.ok(held.length);
 await waitFor("!!document.querySelector('.identity')",'startup header');await screenshot(route+'-entrance-start');await delay(120);await screenshot(route+'-entrance-middle');await waitFor("!!document.querySelector('.scene canvas')&&!!window.__atlasTestCamera.projectionMatrix",'loading scene shell');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.scene canvas')).opacity"),'0');
 assert.equal(await evaluate("document.querySelector('.studio').dataset.sceneReady"),'false');
 assert.ok(await evaluate("!!document.querySelector('.loading[role=status]')"));
 const loadingCamera=await camera();await screenshot(route+'-loading');await delay(500);assert.deepEqual((await camera()).projectionMatrix,loadingCamera.projectionMatrix,'Entrance preserves camera projection');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.top-actions')).opacity"),'1');
 holdGeometry=false;for(const requestId of held)await send('Fetch.continueRequest',{requestId});await send('Fetch.disable');await ready();
 await waitFor("document.querySelector('.studio').dataset.sceneReady==='true'&&getComputedStyle(document.querySelector('.scene canvas')).opacity==='1'",'coherent completed anatomy reveal');
 assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 // Deterministic old-theme migration, including on a dark OS.
 await evaluate("localStorage.setItem('human-atlas-theme','system');localStorage.setItem('human-atlas-display','bad JSON')");
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});await send('Page.reload');await ready();await delay(600);
 assert.equal(await evaluate('document.documentElement.dataset.theme'),'light');assert.equal(await evaluate("localStorage.getItem('human-atlas-theme')"),'light');
 assert.equal(await evaluate("document.querySelectorAll('.theme-trigger').length"),1);assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Choose theme\"]')"),false);
 const whole=route==='male'?2217:2239;
 await checkCount(whole);
 const beforeTheme=await snapshot();await evaluate("document.querySelector('.theme-trigger').focus()");await key('Enter');await waitFor("document.documentElement.dataset.theme==='dark'",'keyboard switches to Dark');await assertSnapshot(beforeTheme);await key('Enter');await waitFor("document.documentElement.dataset.theme==='light'",'keyboard switches to Light');await assertSnapshot(beforeTheme);
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.theme-trigger svg')).display"),'block','Theme icon visible');
 // Exact slash -> pectoral -> assembly -> real 3D member click.
 await pressKey('/');await evaluate("(()=>{const e=document.querySelector('[aria-label=\"Search named anatomical structures\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'pectoral');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
 await waitFor("[...document.querySelectorAll('[role=option]')].some(e=>e.textContent.toLowerCase().includes('muscle of pectoral girdle'))",'pectoral result');
 await evaluate("[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.toLowerCase().includes('muscle of pectoral girdle')).click()");await delay(300);await buttonText('Isolate structure');await checkCount(22);await delay(400);
 const group=atlas.concepts.find(c=>c.name.toLowerCase()==='muscle of pectoral girdle'),before=await gpu(),assemblyCamera=await camera();
  const pick=async eligible=>{
   const matrices=await camera(),view=new T.Matrix4().fromArray(matrices.viewMatrix),projection=new T.Matrix4().fromArray(matrices.projectionMatrix),pixels=await gpu();
   const safe={left:mobile?20:285,right:width-(mobile?62:370),top:mobile?320:130,bottom:height-(mobile?175:200)};
   for(const p of eligible){
    if(!buffers.has(p.chunk)){const c=atlas.chunks[p.chunk],raw=`public${c.url}`;buffers.set(p.chunk,fs.existsSync(raw)?fs.readFileSync(raw):gunzipSync(fs.readFileSync(`public${c.gzip}`)));}
    const buffer=buffers.get(p.chunk),positions=new Float32Array(buffer.buffer,buffer.byteOffset+p.positions,p.vertexCount*3),indices=new Uint32Array(buffer.buffer,buffer.byteOffset+p.indices,p.indexCount),offset=partIndex.get(p.id)*4;
    for(const fraction of [.5,.25,.75,.1,.9]){const triangle=Math.floor((indices.length/3-1)*fraction)*3,point=new T.Vector3();for(let k=0;k<3;k++)point.add(new T.Vector3().fromArray(positions,indices[triangle+k]*3));point.multiplyScalar(1/3).add(new T.Vector3(...pixels.slice(offset,offset+3))).applyMatrix4(view).applyMatrix4(projection);const x=(point.x+1)*width/2,y=(1-point.y)*height/2;if(point.z< -1||point.z>1||x<safe.left||x>safe.right||y<safe.top||y>safe.bottom)continue;await mouse(x,y);await delay(150);if(await evaluate("document.querySelector('.structure-meta span:last-child strong')?.textContent==='1'")){const reference=await evaluate("document.querySelector('.structure-meta span:first-child strong').textContent");const highlighted=await evaluate('window.__atlasTestSelection'),selected=atlas.parts.filter((p,i)=>highlighted[i*4]>0);assert.equal(selected.length,1,'Direct pick highlights exactly one GPU representation');const picked=selected[0];assert.equal(picked.provenance?.sourceId??picked.conceptId,reference,'Direct pick has a valid active-model source reference');assert.equal(await evaluate("document.querySelector('.structure-meta span:last-child strong').textContent"),'1');return {part:picked,x,y};}}
   }
   throw new Error(`No visible mesh picked: ${route} ${width}`);
  };

 const serratus=atlas.parts.find(p=>p.name.toLowerCase()==='left serratus anterior');
 const member=await pick([serratus,...atlas.parts.filter(p=>group.elements.includes(p.id)&&p!==serratus)]);
 await checkCount(22);assert.deepEqual((await gpu()).filter((_,i)=>i%4===3),before.filter((_,i)=>i%4===3));await assertCamera(assemblyCamera);
 assert.equal(await evaluate("document.querySelectorAll('.member-list button').length"),22,'Assembly stays browsable after member pick');
 await screenshot(route+'-direct-member');
 await click('.member-list button');await checkCount(22);await assertCamera(assemblyCamera);assert.equal(await evaluate('window.__atlasTestSelection.filter((x,i)=>i%4===0&&x>0).length'),1);
 await buttonText('Show surrounding anatomy');await checkCount(whole);assert.equal(await evaluate("!!document.querySelector('.detail-sheet.is-isolated')"),false);
 const shades=[];
 for(const theme of ['light','dark']){
  await chooseTheme(theme);await reset();await delay(300);await screenshot(route+'-'+theme+'-whole');
  await click('[aria-label="Display settings"]');assert.ok(await evaluate("[...document.querySelectorAll('.display-setting [data-slot=slider-track]')].every(e=>parseFloat(getComputedStyle(e).height)>=4)"),'Display tracks have visible dimensions');await screenshot(route+'-'+theme+'-display');await key('Escape');await delay(200);
  await click('[aria-label="Search anatomy"]');await screenshot(route+'-'+theme+'-search');await click('[aria-label="Close search"]');
  await search(group.name);await buttonText('Isolate structure');await checkCount(22);await screenshot(route+'-'+theme+'-isolated-group');
  // Display/reset and theme changes preserve exact GPU masks, selection, camera, URL and hides.
  await reset();await search('right clavicle');await hide();await region('shoulder');await area('axilla');await search(group.name);await buttonText('Isolate structure');await explode();await closeInspector();await delay(500);await settled();
  const stable=await snapshot(),requests=network.filter(u=>/\/(models|identity|regions|areas)\//.test(u)).length;
  const resources=await evaluate("({...window.__presentation,canvas:!!(window.__savedCanvas=document.querySelector('.scene canvas'))})");
  await click('[aria-label="Display settings"]');
  for(const end of [false,true]){await displaySlider(0,end);await displaySlider(1,end);const uniforms=await evaluate('window.__presentation.uniforms');assert.ok(Math.abs(uniforms.toneMappingExposure-(end?1.3:.7))<.00001);assert.ok(Math.abs(uniforms.displayContrast-(end?1.15:.85))<.00001);await assertSnapshot(stable);}
  await buttonText('Reset display');await assertSnapshot(stable);assert.deepEqual(await evaluate('JSON.parse(localStorage.getItem("human-atlas-display"))'),{brightness:1,contrast:1});
  await key('Escape');await delay(200);
  assert.equal(await evaluate("window.__savedCanvas===document.querySelector('.scene canvas')"),true);
  assert.equal(network.filter(u=>/\/(models|identity|regions|areas)\//.test(u)).length,requests);
  const afterResources=await evaluate('window.__presentation');assert.equal(afterResources.shaderCompiles,resources.shaderCompiles);assert.equal(afterResources.framebuffers,resources.framebuffers);
  for(const system of ['skeletal','muscular','arterial','venous']){
   await reset();const candidates=atlas.concepts.filter(c=>c.elements.length===1&&atlas.parts.some(p=>p.id===c.elements[0]&&p.system===system&&(system!=='skeletal'||p.name.toLowerCase()==='right clavicle')));
   const score=c=>{const p=atlas.parts.find(p=>p.id===c.elements[0]);return p.bounds[0].reduce((v,n,i)=>v*(p.bounds[1][i]-n),1);};const concept=candidates.sort((a,b)=>score(b)-score(a))[0];assert.ok(concept);
   await search(concept.name);await buttonText('Isolate structure');await closeInspector();await delay(400);
   const baseline=await selectionPixels(`${route}-${theme}-${system}-baseline`,width,height);assert.ok(baseline.tealPixels>20&&baseline.shadedColors>16);
   for(const end of [false,true]){
    await click('[aria-label="Display settings"]');await displaySlider(0,end);await displaySlider(1,end);await key('Escape');await delay(200);
    const pixels=await selectionPixels(`${route}-${theme}-${system}-${end?'max':'min'}`,width,height);assert.ok(pixels.tealPixels>20&&pixels.shadedColors>16,'Curved lit teal survives display limits');shades.push({theme,system,end,...pixels});
   }
   await click('[aria-label="Display settings"]');await buttonText('Reset display');await key('Escape');await delay(150);
  }
  await reset();await region('shoulder');await screenshot(route+'-'+theme+'-region');await area('heart');await screenshot(route+'-'+theme+'-area');await reset();
 }
 // Persist display + binary choice across reload, clamp invalid out-of-range values.
 await chooseTheme('dark');await click('[aria-label="Display settings"]');await displaySlider(0,true);await displaySlider(1,false);await key('Escape');await send('Page.reload');await ready();
 assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');await click('[aria-label="Display settings"]');assert.deepEqual(await evaluate("[...document.querySelectorAll('.display-setting output')].map(e=>e.textContent)"),['130%','85%']);await key('Escape');
 await evaluate("localStorage.setItem('human-atlas-display',JSON.stringify({brightness:99,contrast:-99}))");await send('Page.reload');await ready();await click('[aria-label="Display settings"]');assert.deepEqual(await evaluate("[...document.querySelectorAll('.display-setting output')].map(e=>e.textContent)"),['130%','85%']);await buttonText('Reset display');await key('Escape');
 // Startup never replays for navigation/discovery; model changes keep the header and document stable.
 await delay(800);const entrances=await evaluate('window.__presentation.entrances.length');
 await region('shoulder');await area('heart');await click('[aria-label="Search anatomy"]');await click('[aria-label="Close search"]');await reset();
 assert.equal(await evaluate('window.__presentation.entrances.length'),entrances);
 await evaluate("window.__stableHeader=document.querySelector('.identity');window.__stableDocument=document;");
 await switchModel(route==='male'?'female':'male');await waitFor("document.querySelector('.scene').dataset.revealed==='true'",'model reveal');await delay(400);
 assert.equal(await evaluate('window.__stableHeader===document.querySelector(".identity")&&window.__stableDocument===document'),true);assert.equal(await evaluate('window.__presentation.entrances.length'),entrances);
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.scene canvas')).opacity"),'1');await screenshot(route+'-model-switch');
 report.push({route,passed:true,scope:22,directMember:member.part.name,displayUniforms:true,resetIndependent:true,noRefetchOrRecompile:true,readinessGate:true,stableCamera:true,noEntranceReplay:true,modelSwitch:true,shades});console.log('PASS '+route);
 }
 // Reduced motion removes every startup animation and canvas fade.
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.navigate',{url:baseUrl+'/male'});await ready();
 assert.equal(await evaluate('window.__presentation.entrances.length'),0);assert.equal(await evaluate("getComputedStyle(document.querySelector('.scene canvas')).transitionDuration"),'0s');assert.equal(await evaluate("getComputedStyle(document.querySelector('.scene canvas')).opacity"),'1');
 // Manifest and chunk failures remain visible and terminate preparation.
 for(const pattern of ['*models/atlas.json','*models/*.bin*']){failManifest=true;await send('Fetch.enable',{patterns:[{urlPattern:pattern}]});await send('Page.reload');await waitFor("!!document.querySelector('.error[role=alert]')",'immediate load error');assert.equal(await evaluate("!!document.querySelector('.loading[role=status]')"),false);assert.equal(await evaluate("getComputedStyle(document.querySelector('.error')).pointerEvents"),'auto');await screenshot(pattern.includes('bin')?'chunk-error':'catalogue-error');await send('Fetch.disable');failManifest=false;}
 assert.deepEqual(errors,[],'No JavaScript exceptions');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:true,reducedMotion:true,errorsVisible:true,suites:report,errors},null,2));
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
