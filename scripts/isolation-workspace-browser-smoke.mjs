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
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.1/browser');fs.mkdirSync(output,{recursive:true});
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
 const report=[],cameraDeltas=[];
 const hiddenCount=async()=>Number(await evaluate("document.querySelector('.hidden-count')?.textContent??'0'"));
 const gpu=()=>evaluate('window.__atlasTestRender.pixels');
 const camera=()=>evaluate('window.__atlasTestCamera');
 const assertCamera=async(before,tolerance=.00001)=>{const after=await camera();cameraDeltas.push({tolerance,max:Math.max(...Object.keys(before).flatMap(k=>before[k].map((v,j)=>Math.abs(v-after[k][j]))))});for(const key of ['viewMatrix','projectionMatrix'])for(let i=0;i<16;i++)assert.ok(Math.abs(before[key][i]-after[key][i])<tolerance,`Inspection/dissection preserves ${key}[${i}]: ${before[key][i]} -> ${after[key][i]}`);};
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


 const included=async part=>{
  const pos=await evaluate(`(()=>{const e=[...document.querySelectorAll('.member-list button')].find(e=>e.textContent.trim()===${JSON.stringify(part.name)});if(!e)throw Error('Missing included member');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await mouse(pos.x,pos.y);await delay(200);
  await waitFor(`document.querySelector('.structure-title')?.textContent===${JSON.stringify(part.name)}`,'Included inspector updates');
  assert.equal(await evaluate(`document.querySelector('.member-list button[aria-pressed="true"]')?.textContent.trim()===${JSON.stringify(part.name)}`),true);
 };
 const amount=async value=>{
  await evaluate("document.querySelector('.explode-control input[type=range]').focus()");
  await key('Home');for(let i=0;i<value;i++){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});}
  await waitFor(`document.querySelector('.explode-control output').textContent==='${value}%'`,'explode value');await delay(250);await settled();
 };
 const orbit=async()=>{
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:650,y:440,button:'left',buttons:1,clickCount:1});
  for(let i=1;i<=6;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:650+i*4,y:440+i*2,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:674,y:452,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:650,y:440,deltaY:-90,deltaX:0});await delay(350);
 };
 for(const route of ['male','female']){
 const width=1440,height=900,mobile=false;
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:baseUrl+'/'+route});await ready();await assembled();
 const whole=await count(),model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=read('public'+model.manifestUrl),identity=createIdentityIndex(model,atlas,sidecar),buffers=new Map(),partIndex=new Map(atlas.parts.map((p,i)=>[p.id,i]));
 for(const name of [route==='male'?'Abdomen':'Abdomen Proper','Muscle Of Pectoral Girdle']){
 console.log('Workspace',route,name);await reset();await search(name);assert.ok(await count()>=whole,'Ordinary search preserves surrounding anatomy');await assembled();
 const group=atlas.concepts.find(c=>c.name.toLowerCase()===name.toLowerCase()),candidates=atlas.parts.filter(p=>group.elements.includes(p.id)),n=group.elements.length;
 await buttonText('Isolate structure');await checkCount(n);await delay(400);
 const workspace=await gpu(),scopeMask=workspace.filter((_,i)=>i%4===3),entryCamera=await camera();
 for(const [i,p] of atlas.parts.entries())assert.equal(scopeMask[i]>.5,group.elements.includes(p.id),'Exact current-model workspace GPU membership');
  const pick=async eligible=>{
   const matrices=await camera(),view=new T.Matrix4().fromArray(matrices.viewMatrix),projection=new T.Matrix4().fromArray(matrices.projectionMatrix),pixels=await gpu();
   const safe={left:mobile?20:285,right:width-(mobile?62:370),top:mobile?320:130,bottom:height-(mobile?175:200)};
   for(const p of eligible){
    if(!buffers.has(p.chunk)){const c=atlas.chunks[p.chunk],raw=`public${c.url}`;buffers.set(p.chunk,fs.existsSync(raw)?fs.readFileSync(raw):gunzipSync(fs.readFileSync(`public${c.gzip}`)));}
    const buffer=buffers.get(p.chunk),positions=new Float32Array(buffer.buffer,buffer.byteOffset+p.positions,p.vertexCount*3),indices=new Uint32Array(buffer.buffer,buffer.byteOffset+p.indices,p.indexCount),offset=partIndex.get(p.id)*4;if(pixels[offset+3]<.5)continue;
    for(const fraction of Array.from({length:40},(_,i)=>(i+.5)/40)){const triangle=Math.floor((indices.length/3-1)*fraction)*3,point=new T.Vector3();for(let k=0;k<3;k++)point.add(new T.Vector3().fromArray(positions,indices[triangle+k]*3));point.multiplyScalar(1/3).add(new T.Vector3(...pixels.slice(offset,offset+3))).applyMatrix4(view).applyMatrix4(projection);const x=(point.x+1)*width/2,y=(1-point.y)*height/2;if(point.z< -1||point.z>1||x<safe.left||x>safe.right||y<safe.top||y>safe.bottom)continue;await mouse(x,y);await delay(150);if(await evaluate("document.querySelector('.structure-meta span:last-child strong')?.textContent==='1'")){const reference=await evaluate("document.querySelector('.structure-meta span:first-child strong').textContent");const highlighted=await evaluate('window.__atlasTestSelection'),selected=atlas.parts.filter((p,i)=>highlighted[i*4]>0);assert.equal(selected.length,1,'Direct pick highlights exactly one GPU representation');const picked=selected[0];if(picked.id!==p.id)continue;assert.equal(picked.provenance?.sourceId??picked.conceptId,reference,'Direct pick has a valid active-model source reference');assert.equal(await evaluate("document.querySelector('.structure-meta span:last-child strong').textContent"),'1');return {part:picked,x,y};}}
   }
   throw new Error(`No visible mesh picked: ${route} ${width}`);
  };



 const chooseIncluded=async p=>{if(!await evaluate("!!document.querySelector('.member-list')"))await pick(candidates);await included(p);};
 const first=await pick(candidates);await checkCount(n);await assertCamera(entryCamera);
 const second=await pick(candidates.filter(p=>p.id!==first.part.id));await checkCount(n);await assertCamera(entryCamera);
 const third=await pick(candidates.filter(p=>p.id!==first.part.id&&p.id!==second.part.id));await checkCount(n);await assertCamera(entryCamera);
 await pick([first.part]);await assertCamera(entryCamera);assert.deepEqual((await gpu()).filter((_,i)=>i%4===3),scopeMask);
 await orbit();let previousCamera=await camera();for(let i=0;i<100;i++){await delay(200);const current=await camera();const d=Math.max(...Object.keys(current).flatMap(k=>current[k].map((v,j)=>Math.abs(v-previousCamera[k][j]))));previousCamera=current;if(i>12&&d<1e-8)break;}const manual=await camera();assert.notDeepEqual(manual,entryCamera,'Native orbit/zoom changes camera');
 for(const p of [first.part,second.part,third.part,first.part]){await chooseIncluded(p);await checkCount(n);await assertCamera(manual,.002);assert.deepEqual((await gpu()).filter((_,i)=>i%4===3),scopeMask);}
 const hidePart=name.includes('Pectoral')?candidates.find(p=>p.name.toLowerCase()==='left serratus anterior'):second.part;assert.ok(hidePart);await chooseIncluded(hidePart);await assertCamera(manual,.002);
 assert.equal(await evaluate('window.__atlasTestSelection.filter((x,i)=>i%4===0&&x>0).length'),1,'Only active child highlighted');
 await screenshot(route+'-'+name.replaceAll(' ','-')+'-active-child');
 await evaluate('document.activeElement?.blur()');await hideByKey('H');await checkCount(n-1);await assertCamera(manual,.002);
 const rid=identity.representationForPart(hidePart.id).id,offset=partIndex.get(hidePart.id)*4;
 assert.equal((await gpu())[offset+3],0);assert.equal(await hiddenCount(),1);
 await restoreOne(rid);await checkCount(n);await assertCamera(manual,.002);await tab('Systems');
 await chooseIncluded(first.part);await buttonText('Clear selection');await waitFor("!document.querySelector('.detail-sheet')",'selection clears');await checkCount(n);await assertCamera(manual,.002);
 assert.equal(await evaluate('window.__atlasTestSelection.some(x=>x!==0)'),false);
 assert.equal(await evaluate("!!document.querySelector('.workspace-exit')"),true,'Exit reachable without active selection');
 await mouse(700,140);await checkCount(n);await assertCamera(manual,.002); // Background is an established no-op.
 const afterClear=await pick(candidates);await assertCamera(manual,.002);
 // Hide multiple members individually and restore without changing scope or camera.
 for(const p of [first.part,second.part]){await chooseIncluded(p);await hideByKey('h');}
 await checkCount(n-2);await assertCamera(manual,.002);
 for(const p of [first.part,second.part])await restoreOne(identity.representationForPart(p.id).id);
 await checkCount(n);await assertCamera(manual,.002);await tab('Systems');
 // Restore all composes even when the entire workspace is temporarily empty.
 await buttonText('Show surrounding anatomy');await search(name);await buttonText('Isolate structure');await delay(350);const allHiddenCamera=await camera();
 await hideByKey('H');await checkCount(0);await assertCamera(allHiddenCamera);assert.equal(await hiddenCount(),n);
 await tab('Hidden');await click('.restore-hidden');await checkCount(n);await assertCamera(allHiddenCamera);await tab('Systems');
 await pick(candidates);await amount(60);const exploded=await gpu(),explodedCamera=await camera();
 for(const p of [first.part,second.part,third.part,first.part]){await chooseIncluded(p);assert.deepEqual(await gpu(),exploded,'Selection-only updates leave GPU explode offsets/membership identical');await assertCamera(explodedCamera);}
 const explodedPick=await pick([first.part]);assert.deepEqual(await gpu(),exploded);await assertCamera(explodedCamera);
 await hideByKey('H');await checkCount(n-1);await assertCamera(explodedCamera);assert.equal((await gpu())[partIndex.get(first.part.id)*4+3],0);await mouse(explodedPick.x,explodedPick.y);await delay(200);assert.equal(await evaluate('window.__atlasTestSelection['+partIndex.get(first.part.id)*4+']'),0,'Native pick cannot select hidden member');await assertCamera(explodedCamera);
 await restoreOne(identity.representationForPart(first.part.id).id);await checkCount(n);await assertCamera(explodedCamera);await tab('Systems');assert.deepEqual(await gpu(),exploded,'Restore reconstructs identical stable target layout');
 await screenshot(route+'-'+name.replaceAll(' ','-')+'-exploded-workspace');
 await chooseIncluded(first.part);await buttonText('Isolate structure');await checkCount(1);await delay(250);
 assert.equal(await evaluate("[...document.querySelectorAll('.detail-actions button')].some(e=>e.textContent.includes('Show surrounding anatomy'))"),true);
 await buttonText('Show surrounding anatomy');assert.ok(await count()>=whole);await assembled();
 // Discovery is the reviewed explicit navigation action: no silent scope corruption.
 await search(name);await buttonText('Isolate structure');await search('right clavicle');assert.ok(await count()>=whole);assert.equal(await evaluate("!!document.querySelector('.detail-sheet.is-isolated')"),false);
 await search(name);await buttonText('Isolate structure');await hideByKey('h');await switchModel(route==='male'?'female':'male');assert.equal(await hiddenCount(),0);assert.equal(await evaluate("!!document.querySelector('.workspace-exit')||!!document.querySelector('.detail-sheet.is-isolated')"),false);await switchModel(route);await reset();
 report.push({route,name,scope:n,directMembers:[first.part.name,second.part.name,third.part.name,first.part.name],exactSerratus:name.includes('Pectoral')?hidePart.name:null,directAndIncluded:true,hideRestore:true,restoreAllFromEmpty:true,clearSelection:true,backgroundNoOp:true,explicitNarrowing:true,explicitExit:true,manualOrbitPreserved:true,explodeContinuity:true,hideExplodeComposition:true,discoveryNavigation:true,modelSwitchClearsScope:true,afterClearMember:afterClear.part.name});
 fs.writeFileSync(path.join(output,'progress.json'),JSON.stringify(report,null,2));console.log('PASS',route,name);
 }
 }
 assert.equal(errors.length,0);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:true,report,cameraDeltas,errors},null,2));
}catch(error){if(failureCapture)try{await failureCapture();}catch{}console.error(error);process.exitCode=1;}finally{ws?.close();processHandle.kill();}
