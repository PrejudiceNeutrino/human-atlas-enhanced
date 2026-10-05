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

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3068';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.6/browser');fs.mkdirSync(output,{recursive:true});
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
 const press=async key=>{const code={Home:36,End:35,ArrowRight:39,Escape:27}[key]??key.toUpperCase().charCodeAt(0);await send('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,windowsVirtualKeyCode:code});await delay(220);};
 const reset=async()=>{await click('.dock-reset');await delay(400);};
 const floor=async id=>{await click('[aria-label="Display settings"]');await selectMenu('#scene-floor-choice',id);await click('[aria-label="Display settings"]');await delay(300);};
 const snapshot=()=>evaluate('({pixels:window.__atlasTestRender.pixels,selection:window.__atlasTestSelection,camera:window.__atlasTestCamera,url:location.href,hidden:document.querySelector(".hidden-count").textContent})');
 const sameAnatomy=async before=>{const after=await snapshot();assert.deepEqual(after.pixels,before.pixels);assert.deepEqual(after.selection,before.selection);assert.equal(after.url,before.url);assert.equal(after.hidden,before.hidden);for(const key of ['viewMatrix','projectionMatrix'])assert.ok(after.camera[key].every((v,i)=>Math.abs(v-before.camera[key][i])<.00001),'Floor leaves camera unchanged');};
 const floorRendered=async(preset,eligible)=>{
  await floor(preset);const before=await snapshot(),withFloor=await evaluate('window.__draws');
  await floor('void');await sameAnatomy(before);const absent=await evaluate('window.__draws');
  assert.equal(withFloor-absent,eligible&&preset!=='void'?(preset==='classic'?4:1):0,`${preset} actual floor draws; eligible=${eligible}`);
  await floor(preset);
 };
 const explodeTo=async n=>{await evaluate(`document.querySelector('.explode-control input[type=range]').focus()`);await press('Home');for(let i=0;i<n;i++)await press('ArrowRight');await delay(300);};
 const geometry=()=>evaluate(`Array.from(document.querySelectorAll('.system-row [data-slot=switch]')).map(e=>{const t=e.querySelector('[data-slot=switch-thumb]'),r=e.getBoundingClientRect(),b=t.getBoundingClientRect();return{label:e.getAttribute('aria-label'),checked:e.getAttribute('aria-checked'),width:r.width,height:r.height,thumb:b.width,top:b.top-r.top,bottom:r.bottom-b.bottom,left:b.left-r.left,right:r.right-b.right};})`);
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 for(const route of ['male','female']){
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],inventory=JSON.parse(fs.readFileSync('public'+model.manifestUrl,'utf8')),identity=createIdentityIndex(model,inventory,JSON.parse(fs.readFileSync('public/identity/core-crosswalk-v1.json','utf8'))),candidates=randomAnatomyCandidates(buildDiscoveryIndex(inventory,identity),identity);let lastRandomTestId=null;
  await send('Page.navigate',{url:baseUrl+'/'+route});await ready();await waitFor(`document.querySelector('.studio').dataset.entrance==='settled'`,'entrance settled');
  if(process.env.SMOKE_BASELINE){await screenshot(route+'-before-whole');await click('[aria-label="Search anatomy"]');await screenshot(route+'-before-search');await click('[aria-label="Close search"]');report.push({route,beforeGeometry:await geometry()});continue;}
  for(const theme of ['light','dark']){
   if(await evaluate('document.documentElement.dataset.theme')!==theme)await click('.theme-trigger');await reset();await floor('classic');
   assert.equal(await evaluate(`!!document.querySelector('.systems-global-action')`),false);
   for(const selector of ['[aria-label="Show skeleton"]','[aria-label="Show muscles"]','[aria-label="Show arteries"]']){
    for(let i=0;i<2;i++){await click(selector);await delay(220);for(const g of await geometry()){assert.equal(g.height,20);assert.equal(g.width,32);assert.equal(g.thumb,16);assert.ok(Math.abs(g.top-2)<.01&&Math.abs(g.bottom-2)<.01);assert.ok(Math.abs((g.checked==='true'?g.right:g.left)-2)<.01,JSON.stringify(g));}}
   }
   await reset();await screenshot(route+'-'+theme+'-whole');await floorRendered('classic',true);
   for(const n of [1,15,100]){if(n===100){await evaluate(`document.querySelector('.explode-control input[type=range]').focus()`);await press('End');}else await explodeTo(n);await settled();await floorRendered('grid',false);await screenshot(route+'-'+theme+'-explode-'+n);}
   await explodeTo(0);await assembled();await floorRendered('grid',true);
   await buttonText('Skeleton');await floorRendered('classic',true);await explodeTo(1);await floorRendered('classic',false);await explodeTo(0);await floorRendered('classic',true);await screenshot(route+'-'+theme+'-skeleton');
   await reset();await search('liver');await buttonText('Isolate structure');await delay(450);await floorRendered('event-horizon',false);await screenshot(route+'-'+theme+'-isolated-liver');await buttonText('Show surrounding anatomy');await delay(450);await floorRendered('event-horizon',true);await click('.detail-sheet [data-slot=sheet-close]');
   await click('[aria-label="Search anatomy"]');assert.match(await evaluate(`document.querySelector('.discovery-summary').textContent`),/Featured anatomy/);const featured=await evaluate(`({count:+document.querySelector('.discovery-list').dataset.totalEntries,rows:[...document.querySelectorAll('.discovery-row')].map(e=>({id:e.dataset.discoveryId,count:+e.dataset.pieceCount}))})`);assert.ok(featured.count>=10&&featured.count<=15);assert.equal(new Set(featured.rows.map(e=>e.id)).size,featured.rows.length);await screenshot(route+'-'+theme+'-featured');await click('.discovery-row');await waitFor(`!!document.querySelector('.detail-sheet')`,'Featured ordinary selection');assert.equal(await evaluate(`!!document.querySelector('.detail-sheet.is-isolated')`),false);await reset();
   for(const preset of ['classic','minimal','grid','scanner','orbital','event-horizon','void']){
    await floor(preset);const pool=candidates.filter(e=>e.id!==lastRandomTestId),target=lastRandomTestId==='FMA7088'?'FMA7197':'FMA7088',randomIndex=pool.findIndex(e=>e.id===target);assert.ok(randomIndex>=0);await evaluate(`Math.random=()=>${(randomIndex+.5)/pool.length}`);lastRandomTestId=target;await click('[aria-label="Random anatomy"]');await delay(500);await settled();assert.equal(await evaluate(`!!document.querySelector('.detail-sheet')`),true);assert.ok((await count())>=5);assert.equal(await evaluate(`window.__atlasTestSelection.some(v=>v!==0)`),false);await floorRendered(preset,false);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('human-atlas-display')).sceneFloor`),preset);await screenshot(route+'-'+theme+'-random-'+preset);
    if(preset!=='classic'){await reset();await floorRendered(preset,true);continue;}
    // Click an actual visible member using the GPU offset and original camera projection.
    const pick=await evaluate(`({pixels:window.__atlasTestRender.pixels,camera:window.__atlasTestCamera})`);
    const modelFile=route==='male'?'atlas.json':'atlas-female-reconstructed.json',atlas=JSON.parse(fs.readFileSync('public/models/'+modelFile,'utf8'));
    const view=new T.Matrix4().fromArray(pick.camera.viewMatrix),projection=new T.Matrix4().fromArray(pick.camera.projectionMatrix),points=[];
    atlas.parts.forEach((part,i)=>{if(pick.pixels[i*4+3]>.5){const p=new T.Vector3().fromArray(part.bounds[0]).add(new T.Vector3().fromArray(part.bounds[1])).multiplyScalar(.5).applyMatrix4(view).applyMatrix4(projection);points.push({x:(p.x+1)*720,y:(1-p.y)*450});}});
    for(const p of points){if(p.x<300||p.x>1320||p.y<100||p.y>730)continue;await mouse(p.x,p.y);await delay(200);if(await evaluate(`document.querySelector('.structure-meta span:last-child strong')?.textContent==='1'`))break;}
    await waitFor(`!!document.querySelector('.detail-sheet')`,'Random member picked');await delay(250);assert.equal(await evaluate(`window.__atlasTestSelection.filter((v,i)=>i%4===0&&v>0).length`),1);await screenshot(route+'-'+theme+'-random-member');await evaluate(`(()=>{const e=[...document.querySelectorAll('.member-list button')].find(e=>e.getAttribute('aria-pressed')!=='true');if(!e)throw new Error('Missing second member');e.click()})()`);await delay(300);assert.equal(await evaluate(`window.__atlasTestSelection.filter((v,i)=>i%4===0&&v>0).length`),1);await evaluate('document.activeElement?.blur()');const n=await count();await press('h');assert.equal(await count(),n-1);await press('j');assert.equal(await count(),n);await reset();await floorRendered(preset,true);
   }
   await send('Emulation.setDeviceMetricsOverride',{width:1280,height:600,deviceScaleFactor:1,mobile:false});await delay(300);await screenshot(route+'-'+theme+'-short');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
   await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await explodeTo(1);await floorRendered('scanner',false);await explodeTo(0);await floorRendered('scanner',true);await send('Emulation.setEmulatedMedia',{features:[]});
   report.push({route,theme,featured,toggles:true,floors:true,random:true,member:true,hideRestore:true,reducedMotion:true});
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:true,report,errors},null,2));console.log('PASS Phase 5.6 desktop presentation/discovery on both models');
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
