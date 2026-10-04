/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {createAreaIndex} from '../app/areas.ts';
import {SYSTEMS,DEFAULT_VISIBLE,partIsVisible} from '../app/anatomy.ts';
import {regionBounds} from '../app/regions.ts';
import {fitRegionCamera} from '../app/region-camera.ts';
import * as T from 'three';
import {gunzipSync} from 'node:zlib';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';
import {defaultVisibleForModel} from '../app/viewer-polish.ts';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3017';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SCOPE_OUTPUT??'work/phase-4.7/browser');fs.mkdirSync(output,{recursive:true});
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
 let serial=0;const pending=new Map(),errors=[],network=[];
 ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(new Error(JSON.stringify(m.error)));else p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);else if(m.method==='Network.responseReceived')network.push(m.params.response.url);};
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
 const layers=async mobile=>{if(mobile)await click('[aria-label="Open system layers"]');};
 const closeLayers=async mobile=>{if(mobile)await click('[aria-label="Close systems"]');};
 const search=async(name='heart')=>{
  await click('[aria-label="Search anatomy"]');
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Search named anatomical structures"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(name)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor(`[...document.querySelectorAll('[role=option]')].some(e=>e.querySelector('.search-result-name')?.textContent===${JSON.stringify(name)})`,'search result');
  const pos=await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.querySelector('.search-result-name')?.textContent===${JSON.stringify(name)});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await mouse(pos.x,pos.y);
  await waitFor(`document.querySelector('.detail-sheet .structure-title')?.textContent===${JSON.stringify(name)}`,'search selected');
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
    }return original.apply(this,args);
   };
  }
 })()`});
 const report=[];
 const representative=['orbit','circle-of-willis','heart','lung-roots','porta-hepatis','celiac-trunk','kidneys','brachial-plexus','cubital-fossa','popliteal-fossa','foot'];
 for(const [width,height] of (process.env.SMOKE_DESKTOP?[[1440,900]]:process.env.SMOKE_QUICK?[[1440,900]]:[[1440,900],[390,844]]))for(const route of (process.env.SMOKE_QUICK?['male']:['male','female'])){
  const mobile=width<768;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:`${baseUrl}/${route}`});await ready();
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),index=createAreaIndex(dataset,sidecar,regions,identity,JSON.parse(fs.readFileSync(new URL('../public/areas/area-representation-scopes-v1.json',import.meta.url),'utf8')));
  const whole=route==='male'?(process.env.POLISH_BASELINE==='1'?2229:2217):2239;assert.equal(await count(),whole);await assembled();await noOverlap();await screenshot(`${route}-${width}-whole`);
  // Verify ordinary region navigation before and after station mode.
  await region('shoulder');assert.equal(await count(),122);assert.equal(await evaluate("document.querySelector('#area-choice').value"),'');await region('body');
  assert.equal(await menuOptions('#area-choice'),18);
  assert.equal(await evaluate("document.querySelector('#area-choice').getBoundingClientRect().height>=44"),true,'Area control has a touch-sized target');
  await evaluate("document.querySelector('#area-choice').focus()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  await delay(200);
  if(await evaluate("document.querySelector('#area-choice').tagName!=='SELECT'")){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});}
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await waitFor("document.querySelector('#area-choice').value==='atlas:area:orbit'",'Keyboard area selection');
  await click('[aria-label="Assemble and reset"]');
  const results=[];
  for(const slug of (process.env.SMOKE_QUICK?['heart','brachial-plexus']:representative)){
   await region('body');await area(slug);
   const definition=index.area(`atlas:area:${slug}`),rs=(process.env.SCOPE_BASELINE?index.conceptRepresentationsForArea:index.representationsForArea)(definition.id,model.id),ids=new Set(rs.map(r=>r.sourcePart.id));
   const expected=atlas.parts.filter(p=>ids.has(p.id)&&defaultVisibleForModel(route).includes(p.system)).length;
   assert.equal(await evaluate("document.querySelector('#region-choice').value"),definition.regionIds[0]);
   assert.equal(await count(),expected);await assembled();await noOverlap();await screenshot(`${route}-${width}-${slug}`);
   const ordinaryGpu=await evaluate('window.__atlasTestRender.pixels');
   for(const [i,p] of atlas.parts.entries())assert.equal(ordinaryGpu[i*4+3]>0,ids.has(p.id)&&defaultVisibleForModel(route).includes(p.system),`Exact ordinary scope GPU mask ${slug} ${p.id}`);
   if(process.env.SCOPE_BASELINE){results.push({slug,representations:rs.length,visible:expected});continue;}
   assert.match(await evaluate("document.querySelector('.region-status').textContent"),new RegExp(rs.length+' area pieces'));
   await layers(mobile);
   const rows=await evaluate("[...document.querySelectorAll('.system-row')].map(e=>({id:e.querySelector('[role=switch]')?.getAttribute('aria-label'),count:Number(e.querySelector('.system-count')?.textContent)}))");
   for(const system of SYSTEMS){const row=rows.find(r=>r.id==='Show '+system.id);if(row)assert.equal(row.count,rs.filter(r=>r.sourcePart.system===system.id).length);}
   await closeLayers(mobile);
   const system=slug==='heart'?'arterial':rs[0].sourcePart.system,systemName=SYSTEMS.find(s=>s.id===system).name;
   await layers(mobile);await buttonText(systemName,"document.querySelector('.system-list')");await closeLayers(mobile);
   const filtered=rs.filter(r=>r.sourcePart.system===system);assert.equal(await count(),filtered.length);assert.ok(filtered.length>0);
   // Pick actual current-model triangles under the active station and system filter.
   const safe={left:mobile?20:285,right:width-(mobile?62:90),top:mobile?320:130,bottom:height-(mobile?175:200)},f=fitRegionCamera(regionBounds(rs),'three-quarter',34,width,height,safe),camera=new T.PerspectiveCamera(34,width/height,.005,100);
   camera.setViewOffset(width,height,f.offsetX,f.offsetY,width,height);camera.position.copy(f.center).addScaledVector(f.direction,f.distance);camera.lookAt(f.center);camera.updateMatrixWorld();
   const buffers=new Map();let picked=false,xPick;
   for(const {sourcePart:p} of filtered){
    if(!buffers.has(p.chunk)){const c=atlas.chunks[p.chunk],raw=`public${c.url}`;buffers.set(p.chunk,fs.existsSync(raw)?fs.readFileSync(raw):gunzipSync(fs.readFileSync(`public${c.gzip}`)));}
    const buffer=buffers.get(p.chunk),positions=new Float32Array(buffer.buffer,buffer.byteOffset+p.positions,p.vertexCount*3),indices=new Uint32Array(buffer.buffer,buffer.byteOffset+p.indices,p.indexCount);
    for(const fraction of [.5,.25,.75,.1,.9]){const offset=Math.floor((indices.length/3-1)*fraction)*3,point=new T.Vector3();for(let k=0;k<3;k++)point.add(new T.Vector3().fromArray(positions,indices[offset+k]*3));point.multiplyScalar(1/3).project(camera);const x=(point.x+1)*width/2,y=(1-point.y)*height/2;if(x<safe.left||x>safe.right||y<safe.top||y>safe.bottom)continue;await mouse(x,y);await delay(150);if(await evaluate("!!document.querySelector('.detail-sheet')")){picked=true;xPick={x,y};break;}}
    if(picked)break;
   }
   assert.ok(picked,`${route} ${width} ${slug} visible area geometry pickable`);
   const pickedName=await evaluate("document.querySelector('.structure-title').textContent");
   if(slug==='lung-roots'){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'h',code:'KeyH',windowsVirtualKeyCode:72});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'h',code:'KeyH',windowsVirtualKeyCode:72});}else await click('.hide-structure');await waitFor("!document.querySelector('.detail-sheet')",'hide scoped selection');assert.equal(await count(),filtered.length-1);
   await layers(mobile);await evaluate("[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent.startsWith('Hidden')).click()");await delay(150);await click(slug==='lung-roots'?'.restore-hidden':'.hidden-list button');await buttonText('Systems');await closeLayers(mobile);assert.equal(await count(),filtered.length);
   // Select the same visible triangle again for isolate.
   await mouse(xPick.x,xPick.y);await waitFor("!!document.querySelector('.detail-sheet')",'restored scoped piece pickable');
   await buttonText('Isolate structure');assert.equal(await count(),1);await buttonText('Clear selection');await buttonText('Show surrounding anatomy');assert.equal(await count(),filtered.length);
   await explode();assert.equal(await count(),filtered.length);assert.equal(await evaluate('window.__atlasTestRender.displayed'),filtered.length);if(slug==='heart')await screenshot(`${route}-${width}-heart-exploded`);
   // Choosing the same area assembles, clears selection/isolate and preserves systems.
   await area(null);assert.equal(await evaluate("document.querySelector('#area-choice').value"),'');await area(slug);assert.equal(await count(),filtered.length);await assembled();
   const name=slug==='heart'?'brain':'heart',concept=atlas.concepts.find(c=>c.name===name),selected=concept.elements;
   await search(name);
   const union=new Set([...filtered.map(r=>r.sourcePart.id),...selected]);assert.equal(await count(),union.size);
   await buttonText('Isolate structure');assert.equal(await count(),selected.length);await buttonText('Clear selection');await buttonText('Show surrounding anatomy');assert.equal(await count(),filtered.length);
   // Broad region change removes active station/masks, then reset removes URL state.
   await region('shoulder');assert.equal(await evaluate("document.querySelector('#area-choice').value"),'');assert.equal(await evaluate("new URL(location.href).searchParams.has('area')"),false);
   await click('[aria-label="Assemble and reset"]');assert.equal(await count(),whole);assert.equal(await evaluate('location.search'),'');
   results.push({slug,representations:rs.length,visible:expected,system,filtered:filtered.length,picked:pickedName,searchException:name,isolate:true,explode:true,clearArea:true,regionClearsArea:true,reset:true,hide:true,restore:true,statusCount:true,systemCounts:true});
   console.log(`PASS ${route} ${width} ${slug}: ${rs.length} area / ${filtered.length} ${system}; picked ${pickedName}`);
  }
  if(process.env.SCOPE_BASELINE){report.push({route,width,height,areas:results});continue;}
  // Real historically expanded distal artery remains a temporary search exception.
  await area('lung-roots');
  const removed=read('data/areas/representation-scope-audit-v1.json').rows.find(r=>r.areaId==='atlas:area:lung-roots'&&r.modelId===model.id).removed;
  const distal=atlas.concepts.find(c=>c.name.toLowerCase()==='right anterior segmental artery');
  assert.ok(distal&&distal.elements.every(id=>removed.some(r=>r.sourcePartId===id)));
  const ordinary=index.representationsForArea('atlas:area:lung-roots',model.id).length;assert.equal(await count(),ordinary);
  await search(distal.name);assert.equal(await count(),ordinary+distal.elements.length);await waitFor(`window.__atlasTestRender.displayed===${ordinary+distal.elements.length}`,'distal selected exception rendered');
  let pixels=await evaluate('window.__atlasTestRender.pixels');for(const id of distal.elements)assert.ok(pixels[atlas.parts.findIndex(p=>p.id===id)*4+3]>0,'Distal selection appears on GPU');
  await buttonText('Clear selection');assert.equal(await count(),ordinary);await assembled();pixels=await evaluate('window.__atlasTestRender.pixels');for(const id of distal.elements)assert.equal(pixels[atlas.parts.findIndex(p=>p.id===id)*4+3],0,'Distal exception disappears from GPU after clear');
  // Direct transitions between two stations sharing Thoracic cannot retain the old mask.
  await area('heart');await area('lung-roots');
  assert.equal(await count(),index.representationsForArea('atlas:area:lung-roots',model.id).length);await assembled();
  await region('body');await area('brachial-plexus');
  // Multi-affiliation discoverability retains the active station in its current context.
  await send('Page.navigate',{url:`${baseUrl}/${route}?region=atlas%3Aregion%3Acervical&area=atlas%3Aarea%3Abrachial-plexus`});await ready();
  assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:cervical');assert.equal(await evaluate("document.querySelector('#area-choice').value"),'atlas:area:brachial-plexus');
  await send('Page.reload');await ready();assert.equal(await evaluate("document.querySelector('#area-choice').value"),'atlas:area:brachial-plexus');
  await click('[aria-label="Choose male or female anatomy"]');const next=route==='male'?'Female anatomy':'Male anatomy';
  await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.trim()===${JSON.stringify(next)});if(!e)throw new Error('Missing model option');e.click();})()`);
  await waitFor(`location.pathname===${JSON.stringify(route==='male'?'/female':'/male')}`,'model route changed');await ready();
  const destination=MODEL_REGISTRY[route==='male'?'female-study-v3':'bp3d-male-4'],destinationAtlas=read(`public${destination.manifestUrl}`),destinationIdentity=createIdentityIndex(destination,destinationAtlas,sidecar),destinationIndex=createAreaIndex(dataset,sidecar,regions,destinationIdentity,JSON.parse(fs.readFileSync(new URL('../public/areas/area-representation-scopes-v1.json',import.meta.url),'utf8')));
  assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:cervical');assert.equal(await evaluate("document.querySelector('#area-choice').value"),'atlas:area:brachial-plexus');assert.equal(await count(),destinationIndex.representationsForArea('atlas:area:brachial-plexus',destination.id).length);assert.equal(await evaluate("!!document.querySelector('.detail-sheet')"),false);await assembled();await screenshot(`${route}-${width}-switched`);
  await area(null);assert.equal(await count(),153);await region('body');assert.equal(await count(),route==='male'?2239:(process.env.POLISH_BASELINE==='1'?2229:2217));
  await send('Page.navigate',{url:`${baseUrl}/${route}?region=unknown&area=unknown`});await ready();assert.equal(await evaluate('location.search'),'');assert.equal(await count(),whole);
  report.push({route,width,height,wholeVisible:whole,areas:results,keyboardSelection:true,touchSizedControl:true,directSameRegionAreaSwitch:true,multiRegionContext:true,areaUrlReload:true,modelSwitchRetainedCanonicalNavigation:true,unknownIdsNormalized:true,noOverflow:true});
 }
 assert.deepEqual(errors,[],'No browser JavaScript exceptions');
 assert.ok(!network.some(url=>/body-.*context|overview|mvmt-.*\.bin/.test(url)),'Only baseline model chunks fetched');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,quick:!!process.env.SMOKE_QUICK,report,exceptions:errors,modelGeometryRequests:[...new Set(network.filter(url=>/\/models\/.*\.bin/.test(url)))]},null,2)+'\n');
 console.log(`Browser evidence: ${output}`);
}catch(error){try{await failureCapture?.();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
