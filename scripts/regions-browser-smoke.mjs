/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {createRegionIndex} from '../app/regions.ts';
import {regionBounds} from '../app/regions.ts';
import {fitRegionCamera} from '../app/region-camera.ts';
import * as T from 'three';
import {gunzipSync} from 'node:zlib';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3017';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve('work/phase-2-browser');fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'chrome-'));
const processHandle=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions',...(process.env.CHROME_ANGLE?[`--use-angle=${process.env.CHROME_ANGLE}`,'--enable-unsafe-swiftshader']:[]),'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
processHandle.stderr.on('data',d=>fs.appendFileSync(path.join(output,'chrome.log'),d));
processHandle.on('exit',(code,signal)=>console.log('Chrome exit',code,signal));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const dataset=read('public/regions/canonical-regions-v1.json'),sidecar=read('public/identity/core-crosswalk-v1.json');
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
 const buttonText=async(text,scope='document')=>{await evaluate(`(()=>{const e=[...${scope}.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw new Error('Missing button '+${JSON.stringify(text)});e.click();})()`);await delay(150);};
 const region=async slug=>{await evaluate(`(()=>{const e=document.querySelector('#region-choice');e.value=${JSON.stringify(`atlas:region:${slug}`)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(300);assert.equal(await evaluate("document.querySelector('#region-choice').value"),`atlas:region:${slug}`);};
 const count=async()=>Number((await evaluate("document.querySelector('.panel-foot span').textContent")).replace(/[^0-9]/g,''));
 const settled=()=>waitFor("window.__atlasTestRender?.maxChange<0.0001",'rendered explosion offsets settled');
 const assembled=async()=>{const expected=await count();await waitFor(`window.__atlasTestRender?.maxOffset<0.0005&&window.__atlasTestRender.displayed===${expected}`,'rendered anatomy assembled');};
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
 failureCapture=async()=>{await screenshot('failure');fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify(await evaluate("({url:location.href,text:document.body.innerText,options:[...document.querySelectorAll('[role=option]')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))})"),null,2));};
 const ready=()=>waitFor("!!document.querySelector('.scene canvas')&&!document.querySelector('.loading')&&document.querySelector('#region-choice')?.options.length===10",'all model geometry loaded');
 const layers=async mobile=>{if(mobile)await click('[aria-label="Open system layers"]');};
 const closeLayers=async mobile=>{if(mobile)await click('[aria-label="Close systems"]');};
 const search=async()=>{
  await click('[aria-label="Search anatomy"]');
  await evaluate("(()=>{const e=document.querySelector('[aria-label=\"Search named anatomical structures\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'heart');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
  await waitFor("[...document.querySelectorAll('[role=option]')].some(e=>e.querySelector('.search-result-name')?.textContent==='heart')",'heart search result');
  const pos=await evaluate("(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.querySelector('.search-result-name')?.textContent==='heart');const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await mouse(pos.x,pos.y);
  await waitFor("document.querySelector('.detail-sheet .structure-title')?.textContent==='heart'",'heart selected');
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
     window.__atlasTestRender={maxOffset,maxChange,displayed};previous=pixels.slice();
    }return original.apply(this,args);
   };
  }
 })()`});
 const report=[];
 for(const [width,height] of (process.env.SMOKE_QUICK?[[1440,900]]:[[1440,900],[390,844]]))for(const route of (process.env.SMOKE_QUICK?['male']:['male','female'])){
  const mobile=width<768;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:`${baseUrl}/${route}`});await ready();
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),index=createRegionIndex(dataset,sidecar,identity);
  const whole=route==='male'?2229:2239;assert.equal(await count(),whole);await assembled();assert.equal(await evaluate('window.__atlasTestRender.displayed'),whole);await screenshot(`${route}-${width}-whole`);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"),true,'UI has no horizontal overflow');
  assert.equal(await evaluate("(()=>{const a=document.querySelector('#region-choice').getBoundingClientRect(),b=document.querySelector('.view-controls').getBoundingClientRect();return a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top})()"),true,'Region selector and camera controls do not overlap');
  const regionResults=[];
  for(const slug of (process.env.SMOKE_QUICK?['shoulder']:['shoulder','thoracic','hip','knee','head-jaw'])){
   await region(slug);const rs=index.representationsForRegion(`atlas:region:${slug}`,model.id);const regionalIds=new Set(rs.map(r=>r.sourcePart.id));
   assert.equal(await count(),rs.length);await assembled();assert.equal(await evaluate('window.__atlasTestRender.displayed'),rs.length);await screenshot(`${route}-${width}-${slug}`);
   await layers(mobile);await buttonText('Skeleton');await closeLayers(mobile);
   const expected=atlas.parts.filter(p=>regionalIds.has(p.id)&&p.system==='skeletal').length;assert.equal(await count(),expected);
   // Project source triangle centers in this model's regional camera, then pick with real input.
   let picked=false;const area={left:mobile?20:285,right:width-(mobile?62:90),top:mobile?320:130,bottom:height-(mobile?175:200)};
   const framing=fitRegionCamera(regionBounds(rs),'three-quarter',34,width,height,area),camera=new T.PerspectiveCamera(34,width/height,.005,100);
   camera.setViewOffset(width,height,framing.offsetX,framing.offsetY,width,height);camera.position.copy(framing.center).addScaledVector(framing.direction,framing.distance);camera.lookAt(framing.center);camera.updateMatrixWorld();
   const buffers=new Map();
   for(const p of rs.map(r=>r.sourcePart).filter(p=>p.system==='skeletal')){
    if(!buffers.has(p.chunk)){const c=atlas.chunks[p.chunk],raw=`public${c.url}`;buffers.set(p.chunk,fs.existsSync(raw)?fs.readFileSync(raw):gunzipSync(fs.readFileSync(`public${c.gzip}`)));}
    const buffer=buffers.get(p.chunk),positions=new Float32Array(buffer.buffer,buffer.byteOffset+p.positions,p.vertexCount*3),indices=new Uint32Array(buffer.buffer,buffer.byteOffset+p.indices,p.indexCount);
    for(const fraction of [.5,.25,.75,.1,.9]){const offset=Math.floor((indices.length/3-1)*fraction)*3,point=new T.Vector3();for(let k=0;k<3;k++)point.add(new T.Vector3().fromArray(positions,indices[offset+k]*3));point.multiplyScalar(1/3).project(camera);const x=(point.x+1)*width/2,y=(1-point.y)*height/2;if(x<area.left||x>area.right||y<area.top||y>area.bottom)continue;await mouse(x,y);await delay(150);if(await evaluate("!!document.querySelector('.detail-sheet')")){picked=true;break;}}
    if(picked)break;
   }
   assert.ok(picked,`${route} ${width} ${slug} regional mesh picked`);
   const selectedName=await evaluate("document.querySelector('.structure-title').textContent");
   await buttonText('Isolate structure');assert.equal(await count(),1);await buttonText('Clear selection');assert.equal(await count(),expected);
   await explode();assert.equal(await count(),expected);if(slug==='shoulder')await screenshot(`${route}-${width}-${slug}-exploded`);
   await click('[aria-label="Assemble and reset"]');await waitFor("document.querySelector('#region-choice').value==='atlas:region:body'",'reset Whole body');assert.equal(await count(),whole);
   regionResults.push({slug,representations:rs.length,skeletalVisible:expected,picked:selectedName,explode:true,reset:true});
   console.log(`PASS ${route} ${width} ${slug}: ${rs.length} regional / ${expected} skeletal; picked ${selectedName}`);
  }
  await region('shoulder');await layers(mobile);await buttonText('Skeleton');await closeLayers(mobile);const shoulderSkeleton=await count();
  await search();const selected=Number((await evaluate("document.querySelector('.structure-meta span:last-child strong').textContent")).replace(/,/g,''));assert.ok(selected>0);assert.equal(await count(),shoulderSkeleton+selected);
  await buttonText('Isolate structure');assert.equal(await count(),selected);await buttonText('Clear selection');assert.equal(await count(),shoulderSkeleton);assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:shoulder');
  // Route navigation keeps a canonical region, but resets every model-specific selection/layer.
  await click('[aria-label="Choose male or female anatomy"]');const next=route==='male'?'Female anatomy':'Male anatomy';
  await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.trim()===${JSON.stringify(next)});if(!e)throw new Error('Missing model option');e.click();})()`);await delay(200);await waitFor(`location.pathname===${JSON.stringify(route==='male'?'/female':'/male')}`,'model route changed');await ready();
  assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:shoulder');assert.equal(await count(),122);assert.equal(await evaluate("!!document.querySelector('.detail-sheet')"),false);
  await region('body');assert.equal(await count(),route==='male'?2239:2229);
  if(route==='male'){
   await layers(mobile);await buttonText('Glands');assert.equal(await count(),2237);await buttonText('Pectorals');assert.equal(await count(),2229);await closeLayers(mobile);await click('[aria-label="Assemble and reset"]');assert.equal(await count(),2239);
  }
  report.push({route,width,height,wholeVisible:whole,regions:regionResults,searchOutsideRegion:true,modelSwitchRetainedCanonicalRegion:true,wholeBodyRestored:true});
  console.log(`PASS ${route} ${width}x${height}: regions, pointer selection, systems, isolate, explode, reset, search and model switch`);
 }
 assert.deepEqual(errors,[],'No browser JavaScript exceptions');
 assert.ok(!network.some(url=>/body-.*context|overview|mvmt-.*\.bin/.test(url)),'Only baseline model chunks fetched');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,quick:!!process.env.SMOKE_QUICK,report,exceptions:errors,modelGeometryRequests:[...new Set(network.filter(url=>/\/models\/.*\.bin/.test(url)))]},null,2)+'\n');
 console.log(`Browser evidence: ${output}`);
}catch(error){try{await failureCapture?.();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
