/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {createAreaIndex} from '../app/areas.ts';
import {createStableExplosionLayout,evaluateExplosionOffset} from '../app/explosion-layout.ts';
import {createRegionIndex,regionBounds} from '../app/regions.ts';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3039';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5/browser');fs.mkdirSync(output,{recursive:true});
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
 let serial=0;const pending=new Map(),errors=[],network=[],parsedScripts=[];
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Debugger.scriptParsed')parsedScripts.push(m.params);else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Network.responseReceived')network.push(m.params.response.url);else if(m.method==='Fetch.requestPaused'){if(failManifest)send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'Failed'});else if(holdGeometry)held.push(m.params.requestId);else send('Fetch.continueRequest',{requestId:m.params.requestId});}};
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
     window.__explosionUploads=(window.__explosionUploads??0)+1;window.__atlasTestRender={maxOffset,maxChange,displayed,pixels:Array.from(pixels)};previous=pixels.slice();
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

 // Conditional debugger probes observe real builder entries without production hooks.
 await send('Debugger.enable');
 await send('Page.navigate',{url:baseUrl+'/male'});await ready();
 const moduleScript=parsedScripts.find(s=>s.url.includes('explosion-layout'));assert.ok(moduleScript,JSON.stringify(parsedScripts.map(s=>s.url)));
 const {scriptSource:moduleSource}=await send('Debugger.getScriptSource',{scriptId:moduleScript.scriptId});
 fs.writeFileSync(path.join(output,'runtime-layout.js'),moduleSource);
 const lines=moduleSource.split('\n'),entry=lines.findIndex(l=>l.includes('const ordered =')),exit=lines.findIndex(l=>l.includes('key: explosionLayoutKey'));
 assert.ok(entry>=0&&exit>=0,'Unminified runtime layout module is available for cache probes');
 await send('Debugger.setBreakpointByUrl',{url:moduleScript.url,lineNumber:entry,condition:'(globalThis.__explosionBuilds=(globalThis.__explosionBuilds??0)+1,globalThis.__explosionStart=performance.now(),false)'});
 await send('Debugger.setBreakpointByUrl',{url:moduleScript.url,lineNumber:exit,condition:'((globalThis.__explosionTimes??=[]).push(performance.now()-globalThis.__explosionStart),false)'});
 const key=async name=>{const codes={Home:36,End:35,ArrowRight:39,ArrowLeft:37};await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:codes[name]});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:codes[name]});};
 const gpu=()=>evaluate('window.__atlasTestRender.pixels');
 const camera=()=>evaluate('window.__atlasTestCamera');
 const builds=()=>evaluate('window.__explosionBuilds??0');
 const setAmount=async value=>{
  await evaluate("document.querySelector('.explode-control input[type=range]').focus()");
  const before=Number((await evaluate("document.querySelector('.explode-control output').textContent")).replace(/[^0-9]/g,''));
  if(value===0)await key('Home');else if(value===100)await key('End');else for(let j=0;j<Math.abs(value-before);j++)await key(value>before?'ArrowRight':'ArrowLeft');
  await waitFor(`document.querySelector('.explode-control output').textContent==='${value}%'`,'slider value');await delay(100);
 };
 const layoutFor=async(atlas,model,identity)=>{
  const pixels=await gpu(),eligible=atlas.parts.filter((p,i)=>pixels[i*4+3]>.5),url=new URL(await evaluate('location.href'));
  const isIsolated=await evaluate("!!document.querySelector('.detail-sheet.is-isolated')");
  const regionId=url.searchParams.get('region'),areaId=url.searchParams.get('area');
  const regionIndex=createRegionIndex(regions,sidecar,identity),areaIndex=createAreaIndex(dataset,sidecar,regions,identity,read('public/areas/area-representation-scopes-v1.json'));
  const scope=isIsolated?null:areaId?areaIndex.representationsForArea(areaId,model.id):regionId?regionIndex.representationsForRegion(regionId,model.id):null;
  const bounds=scope?.length?regionBounds(scope):null,focus=bounds?.[0].map((n,a)=>(n+bounds[1][a])/2);
  return createStableExplosionLayout(eligible,model.id,focus);
 };
 const assertOffsets=async(atlas,layout,value)=>{
  const pixels=await gpu();for(const [i,p] of atlas.parts.entries()){
   const target=layout.targets.get(p.id),expected=target?evaluateExplosionOffset(target,value/100,layout.lanes.length):[0,0,0];
   for(let a=0;a<3;a++)assert.ok(Math.abs(pixels[i*4+a]-expected[a])<.00002,`${p.id}: GPU offset at ${value}%`);
   assert.equal(pixels[i*4+3]>.5,!!target);
  }
 };
 const orientation=mat=>[0,1,2,4,5,6,8,9,10].map(i=>mat.viewMatrix[i]);
 const sameOrientation=(a,b)=>orientation(a).forEach((n,i)=>assert.ok(Math.abs(n-orientation(b)[i])<.00001,'Slider preserves camera orientation'));
 const closeInspector=async()=>{if(await evaluate("!!document.querySelector('.detail-sheet')"))await evaluate("document.querySelector('.detail-sheet [data-slot=sheet-close]').click()");await delay(300);};
 const report=[];
 for(const route of ['male','female']){
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=read('public'+model.manifestUrl),identity=createIdentityIndex(model,atlas,sidecar);
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:baseUrl+'/'+route});await ready();await assembled();await noOverlap();
  assert.equal(await count(),route==='male'?2217:2239);
  const layout=await layoutFor(atlas,model,identity),buildCount=await builds(),initialCamera=await camera();assert.ok(buildCount>0,'Real layout builds were observed');
  const samples=[];
  for(let value=0;value<=100;value++){
   await setAmount(value);await assertOffsets(atlas,layout,value);sameOrientation(initialCamera,await camera());
   assert.equal(await builds(),buildCount,'Slider-only motion never rebuilds targets');
   if([0,10,20,30,35,36,40,50,70,100].includes(value)){await screenshot(`${route}-${value}`);samples.push({value,camera:await camera()});}
   const valueText=await evaluate("document.querySelector('.explode-control input[type=range]').getAttribute('aria-valuetext')");assert.ok(valueText,'Accessible stage value text');
  }
  await setAmount(0);await assertOffsets(atlas,layout,0);
  const returned=await camera();for(const name of ['viewMatrix','projectionMatrix'])initialCamera[name].forEach((n,i)=>assert.ok(Math.abs(n-returned[name][i])<.00001,'Camera round trip has no drift'));
  for(const value of [25,60,10,90,35,40]){await setAmount(value);await assertOffsets(atlas,layout,value);assert.equal(await builds(),buildCount);}
  // Native pointer drag across the former jump, with continuous intermediate values.
  await setAmount(34);
  const track=await evaluate("document.querySelector('.explode-control [data-slot=slider-track]').getBoundingClientRect().toJSON()");
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:track.x+track.width*.34,y:track.y+track.height/2,button:'left',clickCount:1});
  for(let value=35;value<=41;value++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:track.x+track.width*value/100,y:track.y+track.height/2,button:'left',buttons:1});await delay(100);await assertOffsets(atlas,layout,value);sameOrientation(initialCamera,await camera());}
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:track.x+track.width*.41,y:track.y+track.height/2,button:'left',clickCount:1});assert.equal(await builds(),buildCount);
  // Orbit and cursor zoom at full explosion cannot change the target assignment.
  await setAmount(100);await evaluate("document.querySelector('.explode-control input').blur()");
  const beforeOrbit=await camera();await send('Input.dispatchMouseEvent',{type:'mousePressed',x:900,y:420,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:960,y:440,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:960,y:440,button:'left',clickCount:1});await delay(800);
  assert.notDeepEqual(orientation(beforeOrbit),orientation(await camera()));assert.equal(await builds(),buildCount);await assertOffsets(atlas,layout,100);
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:850,y:400,deltaX:0,deltaY:-100});await delay(250);assert.equal(await builds(),buildCount);
  await click('[aria-label="Assemble and reset"]');await assembled();
  // Independent navigation scopes retain correct counts and offsets.
  for(const slug of ['head-jaw','shoulder','ankle-foot']){
   await region(slug);const scoped=await layoutFor(atlas,model,identity),expected=await count();
   for(const value of [30,100]){await setAmount(value);await assertOffsets(atlas,scoped,value);assert.equal(await count(),expected);await screenshot(`${route}-region-${slug}-${value}`);}
   await setAmount(0);
  }
  for(const slug of ['heart','kidneys','brachial-plexus']){
   await area(slug);const scoped=await layoutFor(atlas,model,identity),expected=await count();
   for(const value of [30,100]){await setAmount(value);await assertOffsets(atlas,scoped,value);assert.equal(await count(),expected);await screenshot(`${route}-area-${slug}-${value}`);}
   await setAmount(0);
  }
  await click('[aria-label="Assemble and reset"]');await assembled();
  for(const preset of ['All','Skeleton','Organs']){
   await buttonText(preset,"document.querySelector('.layer-presets')");const scoped=await layoutFor(atlas,model,identity);
   await setAmount(10);await assertOffsets(atlas,scoped,10);await setAmount(30);await assertOffsets(atlas,scoped,30);
   assert.equal(await evaluate("!!document.querySelector('.slider-stage-label')"),scoped.lanes.length>=2);
   await setAmount(100);await assertOffsets(atlas,scoped,100);await screenshot(`${route}-preset-${preset.toLowerCase()}`);await setAmount(0);
  }
  await click('[aria-label="Assemble and reset"]');await assembled();
  await search('muscle of pectoral girdle');await buttonText('Isolate structure');await delay(400);assert.equal(await count(),22);
  const isolated=await layoutFor(atlas,model,identity);assert.equal(isolated.lanes.length,2);
  for(const value of [10,30,60,100,0]){await setAmount(value);await assertOffsets(atlas,isolated,value);assert.equal(await count(),22);}
  await screenshot(`${route}-isolated`);await buttonText('Show surrounding anatomy');await closeInspector();await setAmount(30);
  const surroundingCamera=await camera();samples.find(s=>s.value===30).camera.viewMatrix.forEach((n,i)=>assert.ok(Math.abs(n-surroundingCamera.viewMatrix[i])<.0001,'Leaving isolation restores the ordinary assembled camera reference'));
  await click('[aria-label="Assemble and reset"]');await assembled();
  await search('sartorius');await buttonText('Isolate structure');await delay(400);assert.equal(await count(),2);
  const singleFamily=await layoutFor(atlas,model,identity);assert.equal(singleFamily.lanes.length,1);assert.equal(await evaluate("!!document.querySelector('.slider-stage-label')"),false);
  await setAmount(10);await assertOffsets(atlas,singleFamily,10);assert.ok((await gpu()).some((n,i)=>i%4!==3&&Math.abs(n)>1e-8));await setAmount(100);await assertOffsets(atlas,singleFamily,100);await screenshot(`${route}-single-family`);
  await buttonText('Show surrounding anatomy');await closeInspector();await click('[aria-label="Assemble and reset"]');await assembled();
  for(const value of [30,60,100]){
   await setAmount(value);await search('right clavicle');await delay(250);const before=await count(),beforeCamera=await camera();
   await click('.hide-structure');assert.equal(await count(),before-1);let scoped=await layoutFor(atlas,model,identity);await assertOffsets(atlas,scoped,value);
   assert.deepEqual(await camera(),beforeCamera,'Hide preserves camera');
   await tab('Hidden');await click('.hidden-list button');await tab('Systems');assert.equal(await count(),before);scoped=await layoutFor(atlas,model,identity);await assertOffsets(atlas,scoped,value);assert.deepEqual(await camera(),beforeCamera,'Restore preserves camera');
  }
  // Theme and reduced-motion preferences do not affect layout or direct manipulation.
  await setAmount(30);let scoped=await layoutFor(atlas,model,identity);const themeBuilds=await builds();await click('.theme-trigger');await assertOffsets(atlas,scoped,30);assert.equal(await builds(),themeBuilds);const midpointCamera=await camera();for(const name of ['viewMatrix','projectionMatrix'])samples.find(s=>s.value===30).camera[name].forEach((n,i)=>assert.ok(Math.abs(n-midpointCamera[name][i])<.0001,'Hide/restore retains assembled fit reference when returning to midpoint'));await screenshot(`${route}-dark-midpoint`);await setAmount(100);await screenshot(`${route}-dark-full`);await click('.theme-trigger');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await setAmount(0);await setAmount(30);await assertOffsets(atlas,scoped,30);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  if(route==='female')for(const chest of ['Tissue','Glands','Pectorals']){await buttonText(chest,"document.querySelector('.breast-views')");scoped=await layoutFor(atlas,model,identity);await setAmount(30);await assertOffsets(atlas,scoped,30);await setAmount(100);await assertOffsets(atlas,scoped,100);await screenshot(`${route}-chest-${chest}`);}
  report.push({route,width:1440,height:900,samples,keyStable:true,cacheBuilds:await builds(),offsetUploads:await evaluate('window.__explosionUploads'),layoutTimes:await evaluate('window.__explosionTimes'),pointerDrag:true,orbitZoom:true,scopes:true,isolation:true,hideRestore:true,themes:true,reducedMotion:true});
 }
 // Actual routed model switch disposes old model targets.
 const switchModel=async target=>{await click('#model-choice');await click(`[data-slot=select-item][data-value="${target}"]`);await waitFor(`location.pathname==='/${target}'`,'model switch');await ready();};
 await switchModel('male');await setAmount(30);assert.equal(await count(),2217);await switchModel('female');await setAmount(30);assert.equal(await count(),2239);
 assert.equal(errors.length,0,JSON.stringify(errors));
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:true,report,exceptions:errors},null,2)+'\n');console.log('Phase 5 desktop browser validation passed',output);
}catch(error){await failureCapture?.();throw error;}finally{ws?.close();processHandle.kill();}
