/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {buildDiscoveryIndex} from '../app/anatomy-discovery.ts';
import {randomAnatomyCandidates} from '../app/random-anatomy.ts';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import * as T from 'three';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3071';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.6.1/browser');fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'chrome-'));
const processHandle=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions',...(process.env.CHROME_ANGLE?[`--use-angle=${process.env.CHROME_ANGLE}`,'--enable-unsafe-swiftshader']:[]),'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
processHandle.stderr.on('data',d=>fs.appendFileSync(path.join(output,'chrome.log'),d));
processHandle.on('exit',(code,signal)=>console.log('Chrome exit',code,signal));
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
 const count=async()=>Number((await evaluate(`document.querySelector('.panel-foot span').textContent`)).replace(/[^0-9]/g,''));
 const settled=async()=>{let previous;for(let i=0;i<100;i++){const pixels=await evaluate('window.__atlasTestRender?.pixels');if(pixels&&JSON.stringify(pixels)===previous)return;previous=JSON.stringify(pixels);await delay(100);}throw new Error('Explosion offsets did not settle');};
 const assembled=async()=>{const expected=await count();await waitFor(`window.__atlasTestRender?.maxOffset<0.0005&&window.__atlasTestRender.displayed===${expected}`,'rendered anatomy assembled');};
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
 failureCapture=async()=>{await screenshot('failure');fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify(await evaluate(`({url:location.href,text:document.body.innerText,options:[...document.querySelectorAll('[role=option]')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))})`),null,2));};
 const ready=async()=>{await delay(400);await waitFor("!!document.querySelector('.scene canvas')&&!document.querySelector('.loading')&&!!document.querySelector('#region-choice')",'all model geometry loaded');};
 const tab=async name=>{await evaluate(`(()=>{[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent.trim().startsWith(${JSON.stringify(name)})).click()})()`);await delay(150);};
 const layers=async mobile=>{if(mobile)await click('[aria-label="Open system layers"]');await tab('Systems');};
 const closeLayers=async mobile=>{if(mobile)await click('[aria-label="Close systems"]');};
 const search=async(name='heart')=>{
  if(await evaluate(`!!document.querySelector('.detail-sheet')&&getComputedStyle(document.querySelector('.top-actions')).visibility==='hidden'`))await closeInspector();
  await click('[aria-label="Search anatomy"]');
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Search named anatomical structures"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(name)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor(`[...document.querySelectorAll('[role=option]')].some(e=>e.querySelector('.search-result-name')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())})`,'search result');
  const pos=await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.querySelector('.search-result-name')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await mouse(pos.x,pos.y);
  await waitFor(`document.querySelector('.detail-sheet .structure-title')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())}`,'search selected');
 };
 const area=slug=>selectMenu('#area-choice',slug?`atlas:area:${slug}`:'');
 const noOverlap=async()=>{
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'No horizontal overflow');
  assert.equal(await evaluate(`(()=>{const a=document.querySelector('.anatomy-choice').getBoundingClientRect(),b=document.querySelector('.view-controls').getBoundingClientRect();return a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top})()`),true,'Navigation and camera controls do not overlap');
 };
 const explode=async()=>{await evaluate(`document.querySelector('.explode-control input[type=range]').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'End',code:'End',windowsVirtualKeyCode:35});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'End',code:'End',windowsVirtualKeyCode:35});await waitFor("document.querySelector('.explode-control output').textContent==='100%'",'explode reached 100%');await delay(500);await settled();};
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


 // Observe actual draws in the test process; no application hooks are added.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  window.__draws=0;const p=WebGL2RenderingContext.prototype;
  const clear=p.clear;p.clear=function(...args){window.__draws=0;return clear.apply(this,args);};
  for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const draw=p[name];p[name]=function(...args){window.__draws++;return draw.apply(this,args);};}
 })()`});
 const report=[];
 const camera=()=>evaluate('window.__atlasTestCamera');
 const direction=async()=>{const v=(await camera()).viewMatrix;return new T.Vector3(v[2],v[6],v[10]).normalize().toArray();};
 const difference=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
 const press=async key=>{const code={Home:36,End:35,ArrowRight:39,ArrowDown:40,Escape:27,Enter:13}[key]??key.toUpperCase().charCodeAt(0);await send('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:code});await delay(50);};
 const blur=()=>evaluate('document.activeElement?.blur()');
 const reset=async()=>{await click('.dock-reset');await delay(400);};
 const explodeTo=async n=>{await evaluate(`document.querySelector('.explode-control input[type=range]').focus()`);await press('Home');for(let i=0;i<n;i++)await press('ArrowRight');};
 const closeInspector=async()=>{if(await evaluate(`!!document.querySelector('.detail-sheet')`))await click('.detail-sheet [data-slot=sheet-close]');};
 const chooseTheme=async theme=>{if(await evaluate('document.documentElement.dataset.theme')!==theme)await click('.theme-trigger');};
 const cameraSettled=async()=>{let before=await direction(),stable=0;for(let i=0;i<180;i++){await delay(100);const next=await direction();stable=difference(before,next)<1e-7?stable+1:0;before=next;if(stable>=8)return;}throw new Error('Camera damping did not settle');};
 const drag=async()=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',x:850,y:370,button:'left',clickCount:1});for(let i=1;i<=8;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:850+i*12,y:370+i*5,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:946,y:410,button:'left',clickCount:1});await cameraSettled();};
 const caption=async()=>{const gap=await evaluate(`(()=>{const a=document.querySelector('.scene-caption').getBoundingClientRect(),b=document.querySelector('.bottom-dock').getBoundingClientRect();return b.top-a.bottom})()`);assert.ok(gap>=9.9&&gap<=10.1,`caption clearance ${gap}`);return gap;};
 const projectBounds=async(bounds,offset)=>{const matrices=await camera(),cam=new T.PerspectiveCamera();cam.projectionMatrix.fromArray(matrices.projectionMatrix);cam.matrixWorldInverse.fromArray(matrices.viewMatrix);const box={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};for(let i=0;i<8;i++){const p=new T.Vector3(bounds[i&1?1:0][0],bounds[i&2?1:0][1]+offset,bounds[i&4?1:0][2]).project(cam),x=(p.x+1)*1440/2,y=(1-p.y)*900/2;box.left=Math.min(box.left,x);box.right=Math.max(box.right,x);box.top=Math.min(box.top,y);box.bottom=Math.max(box.bottom,y);}const center=new T.Vector3().fromArray(bounds[0]).add(new T.Vector3().fromArray(bounds[1])).multiplyScalar(.5);center.y+=offset;center.project(cam);return {...box,centerX:(center.x+1)*720,centerY:(1-center.y)*450};};
 const regions=JSON.parse(fs.readFileSync('public/regions/canonical-regions-v1.json','utf8')),areas=JSON.parse(fs.readFileSync('public/areas/canonical-areas-v1.json','utf8')),scopes=JSON.parse(fs.readFileSync('public/areas/area-representation-scopes-v1.json','utf8')),sidecar=JSON.parse(fs.readFileSync('public/identity/core-crosswalk-v1.json','utf8'));
 const {createRegionIndex,regionBounds}=await import('../app/regions.ts'),{createAreaIndex}=await import('../app/areas.ts'),{modelGrounding}=await import('../app/spatial-presentation.ts');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 for(const route of ['male','female']){
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=JSON.parse(fs.readFileSync('public'+model.manifestUrl,'utf8')),identity=createIdentityIndex(model,atlas,sidecar),entries=buildDiscoveryIndex(atlas,identity),candidatePool=randomAnatomyCandidates(entries,identity),offset=modelGrounding(atlas.parts),regionIndex=createRegionIndex(regions,sidecar,identity),areaIndex=createAreaIndex(areas,sidecar,regions,identity,scopes);
  let lastRandomTestId=null;
  await send('Page.navigate',{url:baseUrl+'/'+route});await ready();await waitFor(`document.querySelector('.studio').dataset.entrance==='settled'`,'entrance settled');
  for(const theme of ['light','dark']){
   await chooseTheme(theme);await reset();await caption();await screenshot(`${route}-${theme}-whole`);
   assert.equal(await evaluate(`getComputedStyle(document.querySelector('[aria-label="Show skeleton"]')).cursor`),'pointer');
   const bodyDirection=await direction();await buttonText('Skeleton');await delay(350);assert.ok(difference(bodyDirection,await direction())<1e-6);await screenshot(`${route}-${theme}-skeleton`);
   await buttonText('Organs');await delay(400);const organBounds=regionBounds(atlas.parts.filter(p=>['cardiac','respiratory','digestive','urinary','endocrine','reproductive'].includes(p.system)).map(p=>({representation:{bounds:p.bounds}}))),organBox=await projectBounds(organBounds,offset);
   assert.ok(Math.abs(organBox.centerX-720)<.01);assert.ok(organBox.bottom-organBox.top>380&&organBox.top>=110&&organBox.bottom<720,JSON.stringify(organBox));await screenshot(`${route}-${theme}-organs`);
   await reset();const regionSlugs=theme==='light'?['head-jaw','cervical','thoracic','lumbar','hip','elbow-wrist','knee','ankle-foot']:['hip'];
   const regionResults=[];for(const slug of regionSlugs){await region(slug);await delay(300);const b=regionBounds(regionIndex.representationsForRegion(`atlas:region:${slug}`,model.id));if(b){const screen=await projectBounds(b,offset);assert.ok(Math.abs(screen.centerX-720)<.02,JSON.stringify(screen));regionResults.push({slug,screen});}await caption();if(slug==='hip')await screenshot(`${route}-${theme}-hip`);}
   await reset();const areaResults=[];for(const slug of theme==='light'?['orbit','brainstem','larynx','brachial-plexus','hand','foot']:['brainstem']){await area(slug);await delay(300);const b=regionBounds(areaIndex.representationsForArea(`atlas:area:${slug}`,model.id));if(b){const screen=await projectBounds(b,offset);assert.ok(Math.abs(screen.centerX-720)<.02);areaResults.push({slug,screen});}await caption();if(slug==='brainstem')await screenshot(`${route}-${theme}-brainstem`);}
   assert.equal(await evaluate(`getComputedStyle(document.querySelector('.system-row [data-disabled]')).cursor`),'default');
   await reset();await explodeTo(1);await delay(500);assert.ok(Math.abs((await direction())[0])<1e-5,'Untouched default assists Front');await explodeTo(18);await delay(150);assert.ok(Math.abs((await direction())[0])<1e-5);await caption();await screenshot(`${route}-${theme}-explode-front`);await explodeTo(0);assert.ok(Math.abs((await direction())[0])<1e-5,'Zero does not restore 3/4');
   await reset();await drag();const custom=await direction();await explodeTo(20);assert.ok(difference(custom,await direction())<.0005,'Manual orbit preserved '+JSON.stringify({custom,after:await direction()}));
   for(const view of ['side','back']){await reset();await click(`[aria-label="${view} view"]`);const chosen=await direction();await explodeTo(5);assert.ok(difference(chosen,await direction())<1e-5,view+' preserved');}
   await reset();await click('[aria-label="Lock view"]');const locked=await direction();await explodeTo(5);assert.ok(difference(locked,await direction())<1e-5,'Lock prevents automatic assist');await click('[aria-label="Unlock view"]');
   await reset();await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:720,y:420,deltaX:0,deltaY:-100});await delay(100);await explodeTo(1);await delay(500);assert.ok(Math.abs((await direction())[0])<1e-5,'Dolly does not mark orientation');
   await reset();await explodeTo(1);await drag();const interrupted=await direction();await delay(500);assert.ok(difference(interrupted,await direction())<.005,'Orbit interrupts assist');await screenshot(`${route}-${theme}-interrupted`);
   await reset();const heart=candidatePool.find(e=>e.id===(theme==='light'?'FMA7088':'FMA7197')),pool=candidatePool.filter(e=>e.id!==lastRandomTestId),idx=pool.indexOf(heart);assert.ok(idx>=0);await evaluate(`Math.random=()=>${(idx+.5)/pool.length}`);lastRandomTestId=heart.id;await click('[aria-label="Random anatomy"]');await delay(400);assert.equal(await evaluate(`document.querySelector('.structure-title')?.textContent.toLowerCase()`),heart.name.toLowerCase());assert.equal(await evaluate('window.__atlasTestSelection.some(v=>v!==0)'),false);assert.equal(await count(),heart.modeledPieceCount);await caption();await screenshot(`${route}-${theme}-random-root`);
   const beforeMember=await camera();await click('.member-list button');await delay(300);assert.equal(await evaluate(`window.__atlasTestSelection.filter((v,i)=>i%4===0&&v>0).length`),1);assert.ok(await evaluate(`document.querySelector('.detail-sheet').classList.contains('is-isolated')`));const afterMember=await camera();assert.ok(difference(beforeMember.viewMatrix,afterMember.viewMatrix)<1e-5,'Member inspection preserves camera');await screenshot(`${route}-${theme}-random-member`);
   await buttonText('Clear selection');await delay(250);assert.equal(await evaluate(`document.querySelector('.structure-title').textContent.toLowerCase()`),heart.name.toLowerCase());assert.equal(await evaluate('window.__atlasTestSelection.some(v=>v!==0)'),false);
   await click('.member-list button');await delay(250);await blur();const visible=await count();await press('h');await delay(250);assert.equal(await count(),visible-1);assert.equal(await evaluate(`document.querySelector('.structure-title').textContent.toLowerCase()`),heart.name.toLowerCase());await blur();await press('j');await delay(250);assert.equal(await count(),visible);
   await buttonText('Show surrounding anatomy');await delay(250);assert.equal(await evaluate(`!!document.querySelector('.detail-sheet.is-isolated')`),false);
   await reset();await click('[aria-label="Search anatomy"]');await press('ArrowDown');const focus=await evaluate(`(()=>{const e=document.activeElement,s=getComputedStyle(e);return{row:e.classList.contains('discovery-row'),outline:s.outlineWidth,shadow:s.boxShadow,padding:s.paddingLeft}})()`);assert.equal(focus.row,true);assert.equal(focus.outline,'0px');assert.notEqual(focus.shadow,'none');assert.equal(focus.padding,'10px');await screenshot(`${route}-${theme}-featured-focus`);
   await evaluate(`(()=>{const e=document.querySelector('.discovery-input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'vertebral column');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await waitFor(`!!document.querySelector('[data-discovery-id="FMA13478"]')`,'canonical Spine result');await click('[data-discovery-id="FMA13478"]');await waitFor(`document.querySelector('.structure-title')?.textContent.toLowerCase()==='vertebral column'`,'Spine selected');assert.equal(await evaluate(`!!document.querySelector('.detail-sheet.is-isolated')`),false);await screenshot(`${route}-${theme}-spine`);
   await reset();await send('Emulation.setDeviceMetricsOverride',{width:1280,height:600,deviceScaleFactor:1,mobile:false});await delay(300);await caption();await screenshot(`${route}-${theme}-short`);await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await delay(300);
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await reset();await explodeTo(1);await delay(100);assert.ok(Math.abs((await direction())[0])<1e-5);await send('Emulation.setEmulatedMedia',{features:[]});await reset();
   report.push({route,theme,organBox,regionResults,areaResults,groundOffset:offset,captionGap:10,cursors:true,defaultAssist:true,customCamera:true,presets:true,zoom:true,lock:true,interruption:true,randomInspector:true,memberClear:true,hideRestore:true,featuredFocus:focus,spine:true,reducedMotion:true});console.log('PASS',route,theme);
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:true,report,errors},null,2));console.log('PASS Phase 5.6.1 desktop spatial cleanup');
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
