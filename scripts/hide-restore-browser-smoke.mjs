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

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3021';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-4-browser');fs.mkdirSync(output,{recursive:true});
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
 const region=async slug=>{await evaluate(`(()=>{const e=document.querySelector('#region-choice');e.value=${JSON.stringify(`atlas:region:${slug}`)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(300);assert.equal(await evaluate("document.querySelector('#region-choice').value"),`atlas:region:${slug}`);};
 const count=async()=>Number((await evaluate("document.querySelector('.panel-foot span').textContent")).replace(/[^0-9]/g,''));
 const settled=()=>waitFor("window.__atlasTestRender?.maxChange<0.0001",'rendered explosion offsets settled');
 const assembled=async()=>{const expected=await count();await waitFor(`window.__atlasTestRender?.maxOffset<0.0005&&window.__atlasTestRender.displayed===${expected}`,'rendered anatomy assembled');};
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
 failureCapture=async()=>{await screenshot('failure');fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify(await evaluate("({url:location.href,text:document.body.innerText,options:[...document.querySelectorAll('[role=option]')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))})"),null,2));};
 const ready=()=>waitFor("!!document.querySelector('.scene canvas')&&!document.querySelector('.loading')&&document.querySelector('#region-choice')?.options.length===10",'all model geometry loaded');
 const layers=async mobile=>{if(mobile)await click('[aria-label="Open system layers"]');};
 const closeLayers=async mobile=>{if(mobile)await click('[aria-label="Close systems"]');};
 const search=async(name='heart')=>{
  await click('[aria-label="Search anatomy"]');
  await evaluate(`(()=>{const e=document.querySelector('[aria-label="Search named anatomical structures"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(name)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor(`[...document.querySelectorAll('[role=option]')].some(e=>e.querySelector('.search-result-name')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())})`,'search result');
  const pos=await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.querySelector('.search-result-name')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await mouse(pos.x,pos.y);
  await waitFor(`document.querySelector('.detail-sheet .structure-title')?.textContent?.toLowerCase()===${JSON.stringify(name.toLowerCase())}`,'search selected');
 };
 const area=async slug=>{
  await evaluate(`(()=>{const e=document.querySelector('#area-choice');e.value=${JSON.stringify(slug?`atlas:area:${slug}`:'')};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await waitFor(`document.querySelector('#area-choice').value===${JSON.stringify(slug?`atlas:area:${slug}`:'')}`,'area selected');await delay(300);
 };
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
 const restore=async()=>{await click('.restore-hidden');await waitFor("!document.querySelector('.restore-hidden')",'hidden state cleared');};
 const reset=async()=>{await click('[aria-label="Assemble and reset"]');await waitFor("!document.querySelector('.restore-hidden')&&!document.querySelector('.detail-sheet')&&document.querySelector('#region-choice').value==='atlas:region:body'&&document.querySelector('#area-choice').value===''",'full reset');await assembled();};
 const switchModel=async target=>{await click('[aria-label="Choose male or female anatomy"]');await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.trim()===${JSON.stringify(target==='male'?'Male anatomy':'Female anatomy')});if(!e)throw new Error('Missing model');e.click()})()`);await waitFor(`location.pathname===${JSON.stringify('/'+target)}`,'model switch');await ready();};
 const pressKey=async(key,text)=>{const code=key==='/'?'Slash':'KeyH',windowsVirtualKeyCode=key==='/'?191:72,modifiers=key==='H'?8:0;await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,modifiers,...(text?{text}:{} )});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode,modifiers});await delay(150);};
 // Setup only: use the existing Close button action without racing its moving pointer target.
 const closeInspector=async()=>{await evaluate("document.querySelector('.detail-sheet [data-slot=\"sheet-close\"]').click()");await waitFor("!document.querySelector('.detail-sheet')",'inspector close transition completed');};
 const hideByKey=async letter=>{await pressKey(letter);await waitFor("!document.querySelector('.detail-sheet')&&!window.__atlasTestSelection.some(x=>x!==0)",'shortcut hides and clears GPU selection');};
 const hiddenOrder=()=>evaluate("[...document.querySelectorAll('.hidden-list li')].map(e=>e.dataset.representationId)");
 const restoreOne=async id=>{await click(`.hidden-list li[data-representation-id="${id}"] button`);await delay(150);};
 // Inspect actual screenshot pixels in a temporary 2D canvas; no production rendering changes.
 const selectionPixels=async(name,width,height)=>{
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(shot.data,'base64'));
  const left=width<768?0:285,top=width<768?320:130,right=width-(width<768?62:90),bottom=height-(width<768?175:200);
  return evaluate(`new Promise((resolve,reject)=>{const img=new Image();img.onerror=reject;img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(${left},${top},${right-left},${bottom-top}).data,colors=new Set();let teal=0;for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(g>100&&b>60&&r<g*.78&&b>r*1.15&&g>b*1.04){teal++;colors.add(r+','+g+','+b);}}resolve({tealPixels:teal,shadedColors:colors.size});};img.src=${JSON.stringify('data:image/png;base64,'+shot.data)};})`);
 };
 for(const [width,height] of (process.env.SMOKE_QUICK?(process.env.SMOKE_QUICK==='mobile'?[[390,844]]:[[1440,900]]):[[1440,900],[390,844]]))for(const route of (process.env.SMOKE_QUICK?['male']:['male','female'])){
  const mobile=width<768;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:`${baseUrl}/${route}`});await ready();
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),index=createAreaIndex(dataset,sidecar,regions,identity),whole=route==='male'?2229:2239;
  const partIndex=new Map(atlas.parts.map((p,i)=>[p.id,i])),buffers=new Map();
  const idsFor=name=>{const c=atlas.concepts.find(c=>c.name===name);assert.ok(c,`Concept ${name}`);return identity.resolve(identity.sourceConceptCanonicalId(c.id),model.id).map(r=>r.sourcePart.id);};
  const piecesHidden=async ids=>{const data=await gpu();for(const id of ids){const offset=partIndex.get(id)*4;assert.deepEqual(data.slice(offset,offset+4),[0,0,0,0],`${id} has no GPU visibility or exploded offset`);}};
  const pick=async eligible=>{
   const matrices=await camera(),view=new T.Matrix4().fromArray(matrices.viewMatrix),projection=new T.Matrix4().fromArray(matrices.projectionMatrix),pixels=await gpu();
   const safe={left:mobile?20:285,right:width-(mobile?62:90),top:mobile?320:130,bottom:height-(mobile?175:200)};
   for(const p of eligible){
    if(!buffers.has(p.chunk)){const c=atlas.chunks[p.chunk],raw=`public${c.url}`;buffers.set(p.chunk,fs.existsSync(raw)?fs.readFileSync(raw):gunzipSync(fs.readFileSync(`public${c.gzip}`)));}
    const buffer=buffers.get(p.chunk),positions=new Float32Array(buffer.buffer,buffer.byteOffset+p.positions,p.vertexCount*3),indices=new Uint32Array(buffer.buffer,buffer.byteOffset+p.indices,p.indexCount),offset=partIndex.get(p.id)*4;
    for(const fraction of [.5,.25,.75,.1,.9]){const triangle=Math.floor((indices.length/3-1)*fraction)*3,point=new T.Vector3();for(let k=0;k<3;k++)point.add(new T.Vector3().fromArray(positions,indices[triangle+k]*3));point.multiplyScalar(1/3).add(new T.Vector3(...pixels.slice(offset,offset+3))).applyMatrix4(view).applyMatrix4(projection);const x=(point.x+1)*width/2,y=(1-point.y)*height/2;if(point.z< -1||point.z>1||x<safe.left||x>safe.right||y<safe.top||y>safe.bottom)continue;await mouse(x,y);await delay(150);if(await evaluate("!!document.querySelector('.detail-sheet')")){const reference=await evaluate("document.querySelector('.structure-meta span:first-child strong').textContent");const highlighted=await evaluate('window.__atlasTestSelection'),selected=atlas.parts.filter((p,i)=>highlighted[i*4]>0);assert.equal(selected.length,1,'Direct pick highlights exactly one GPU representation');const picked=selected[0];assert.equal(picked.provenance?.sourceId??picked.conceptId,reference,'Direct pick has a valid active-model source reference');assert.equal(await evaluate("document.querySelector('.structure-meta span:last-child strong').textContent"),'1');return {part:picked,x,y};}}
   }
   throw new Error(`No visible mesh picked: ${route} ${width}`);
  };
  const packing=async eligible=>{
   await delay(150);const pixels=await gpu(),layout=createExplosionLayout(eligible,width/height);assert.equal(layout.cells.size,eligible.length);
   for(const p of atlas.parts){const i=partIndex.get(p.id)*4,cell=layout.cells.get(p.id);if(!cell){assert.equal(pixels[i+3],0);assert.deepEqual(pixels.slice(i,i+3),[0,0,0]);continue;}const center=p.bounds[0].map((v,a)=>(v+p.bounds[1][a])/2),expected=[cell.x-center[0],cell.y+.85-center[1],-center[2]];for(let a=0;a<3;a++)assert.ok(Math.abs(pixels[i+a]-expected[a])<.001,`${p.id} offset matches eligible-only inventory cell`);assert.equal(pixels[i+3],1);}
  };
  await checkCount(whole);await assembled();await noOverlap();
  // A: actual mesh selection/hide/restore, count, pick rejection and unchanged camera.
  await region('shoulder');await layers(mobile);await buttonText('Skeleton');await closeLayers(mobile);await assembled();
  const shoulder=atlas.parts.filter(p=>p.system==='skeletal'&&regions.memberships.some(m=>m.regionId==='atlas:region:shoulder'&&identity.resolve(m.conceptId,model.id).some(r=>r.sourcePart.id===p.id)));
  const direct=await pick(shoulder);await screenshot(`${route}-${width}-inspector`);await delay(300);const beforeHide=await camera();await hide();await checkCount(33);assert.equal(await hiddenCount(),1);await piecesHidden([direct.part.id]);await assertCamera(beforeHide);
  await mouse(direct.x,direct.y);await delay(150);assert.notEqual(await evaluate("document.querySelector('.structure-meta span:first-child strong')?.textContent"),direct.part.provenance?.sourceId??direct.part.conceptId,'Hidden mesh cannot be picked');if(await evaluate("!!document.querySelector('.detail-sheet')"))await buttonText('Clear selection');
  await layers(mobile);const beforeRestore=await camera();await restore();await closeLayers(mobile);await checkCount(34);await assertCamera(beforeRestore);
  // C/F: hiding survives region changes and system disable/re-enable; restore keeps filters.
  await search(direct.part.name);await hide();assert.equal(await hiddenCount(),1);await region('body');await region('shoulder');await checkCount(33);
  await layers(mobile);await click('[aria-label="Show skeleton"]');await checkCount(0);assert.equal(await hiddenCount(),1);await click('[aria-label="Show skeleton"]');await checkCount(33);await click('[aria-label="Show skeleton"]');await restore();await checkCount(0);await click('[aria-label="Show skeleton"]');await closeLayers(mobile);await checkCount(34);
  // B: multi-piece search restore removes only selected hidden IDs.
  await reset();await search(direct.part.name);await hide();const unrelated=[direct.part.id];await search('heart');const heartIds=idsFor('heart');assert.ok(heartIds.length>1);await hide();assert.equal(await hiddenCount(),heartIds.length+1);await checkCount(whole-heartIds.length-1);await piecesHidden([...heartIds,...unrelated]);await search('heart');assert.equal(await hiddenCount(),1);await checkCount(whole-1);await click('.member-list button');await hide();assert.equal(await hiddenCount(),2);await search('heart');assert.equal(await hiddenCount(),1,'Partly hidden multi-piece selection restores only its matching representation');await buttonText('Clear selection');
  await layers(mobile);await screenshot(`${route}-${width}-restore`);await restore();await closeLayers(mobile);await checkCount(whole);
  // D/E: area persistence and hidden outside-area selected exception.
  await area('heart');const heartVisible=await count(),heartIntersection=index.representationsForArea('atlas:area:heart',model.id).filter(r=>heartIds.includes(r.sourcePart.id)&&DEFAULT_VISIBLE.includes(r.sourcePart.system)).length;await search('heart');await hide();assert.equal(await hiddenCount(),heartIds.length);await area('lung-roots');assert.equal(await hiddenCount(),heartIds.length);await area('heart');await checkCount(heartVisible-heartIntersection);await layers(mobile);await restore();await closeLayers(mobile);await checkCount(heartVisible);
  await search('brain');const brainIds=idsFor('brain');await hide();await checkCount(heartVisible);await piecesHidden(brainIds);assert.equal(await evaluate("document.querySelector('#area-choice').value"),'atlas:area:heart');
  // G: isolate then hide exits isolation and returns ordinary area view.
  await search('heart');await buttonText('Isolate structure');await checkCount(heartIds.length);await hide();await checkCount(heartVisible-heartIntersection);await layers(mobile);await restore();await closeLayers(mobile);await checkCount(heartVisible);
  // H: eligible-only GPU offsets, stale hover removal, hide/restore while fully exploded.
  await reset();await region('shoulder');await layers(mobile);await buttonText('Skeleton');await closeLayers(mobile);await assembled();
  await search(direct.part.name);await hide();await explode();let eligible=shoulder.filter(p=>p.id!==direct.part.id);await checkCount(eligible.length);await packing(eligible);
  const exploded=await pick(eligible);const beforeExploded=await camera();if(!mobile){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:exploded.x,y:exploded.y});await waitFor("!document.querySelector('.part-hover').hidden",'exploded hover target visible before hide');}await hide();eligible=eligible.filter(p=>p.id!==exploded.part.id);await checkCount(eligible.length);await packing(eligible);await assertCamera(beforeExploded);await piecesHidden([direct.part.id,exploded.part.id]);await screenshot(`${route}-${width}-exploded-hidden`);
  await layers(mobile);const restoreCamera=await camera();await restore();await closeLayers(mobile);await checkCount(34);await packing(shoulder);await assertCamera(restoreCamera);assert.equal(await evaluate("document.querySelector('.explode-control output').textContent"),'100%');
  // I/J: reset clears multiple hides; route switching clears model IDs but retains canonical navigation.
  await search('heart');await hide();await search('brain');await hide();assert.ok(await hiddenCount()>1);await reset();await checkCount(whole);assert.equal(await hiddenCount(),0);assert.equal(await evaluate('location.search'),'');
  await area('heart');await search('heart');await hide();assert.ok(await hiddenCount()>0);await switchModel(route==='male'?'female':'male');assert.equal(await hiddenCount(),0);assert.equal(await evaluate("document.querySelector('#area-choice').value"),'atlas:area:heart');assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:thoracic');await switchModel(route);assert.equal(await hiddenCount(),0);await checkCount(heartVisible);
  // K: Tissue/Glands/Pectorals persist hidden override and restore never changes mode.
  const chest=[];
  if(route==='female'){
   await reset();const breast=atlas.parts.find(p=>p.id==='VH_F_fat_L'),breastConcept=atlas.concepts.find(c=>c.elements.length===1&&c.elements[0]===breast?.id);assert.ok(breastConcept);await search(breastConcept.name);await hide();
   await layers(mobile);for(const name of ['Tissue','Glands','Pectorals']){await buttonText(name);assert.equal(await hiddenCount(),1);await piecesHidden([breast.id]);const n=await count();assert.equal(n,{Tissue:2238,Glands:2237,Pectorals:2229}[name],'Chest mode keeps its original ordinary visibility rules');chest.push({mode:name,visible:n});await checkCount(n);}await restore();assert.equal(await evaluate("[...document.querySelectorAll('.breast-views button')].find(e=>e.getAttribute('aria-pressed')==='true').textContent"),'Pectorals');await checkCount(2229);await closeLayers(mobile);
  }
  await reset();await search('heart');await hide();await layers(mobile);await buttonText('Hide all');await checkCount(0);assert.equal(await hiddenCount(),heartIds.length);await restore();await checkCount(0);await closeLayers(mobile);
  // Hidden interaction state never enters URLs/storage and reload starts clean.
  await reset();await search('heart');await hide();assert.equal(await evaluate('location.search'),'');await send('Page.reload');await ready();await checkCount(whole);assert.equal(await hiddenCount(),0);await noOverlap();
  assert.equal(await evaluate("(()=>{const selectors=['.hide-structure','.restore-hidden'];return selectors.every(s=>!document.querySelector(s)||document.querySelector(s).getBoundingClientRect().height>=44)})()"),true);
  // Refinement: real bone shading, H/h safety and piece-by-piece dissection.
  const colorResults=[];
  for(const [system,label] of [['skeletal','Skeleton'],['muscular','Muscles'],['arterial','Arteries'],['venous','Veins']]){
   await reset();if(system==='skeletal')await region('shoulder');await layers(mobile);await buttonText(label,"document.querySelector('.system-list')");await closeLayers(mobile);await assembled();
   const normal=await selectionPixels(`${route}-${width}-${system}-normal`,width,height),picked=await pick(system==='skeletal'?shoulder:atlas.parts.filter(p=>p.system===system));if(system==='skeletal')assert.match(picked.part.name.toLowerCase(),/rib|clavicle|scapula|humerus|sternum|vertebra/,'Pale physical bone, rather than another skeletal-system tissue');await buttonText('Isolate structure');await closeInspector();await delay(300);
   const selected=await selectionPixels(`${route}-${width}-${system}-selected`,width,height);assert.ok(selected.tealPixels>normal.tealPixels+20,`${system} selection is visibly teal in actual rendered pixels`);assert.ok(selected.shadedColors>16,'Selected surface preserves varied shading');colorResults.push({system,part:picked.part.id,normal,selected});
  }
  await reset();await region('shoulder');await layers(mobile);await buttonText('Skeleton');await closeLayers(mobile);await assembled();
  const concepts=['right clavicle','left clavicle','right scapula'].map(name=>atlas.concepts.find(c=>c.name.toLowerCase()===name&&c.elements.length===1));assert.ok(concepts.every(Boolean),'Three current-model physical pieces');
  await search(concepts[0].name);assert.equal(await evaluate("document.querySelector('.hide-structure kbd').textContent"),'H');assert.equal(await evaluate("document.querySelector('.hide-structure').getAttribute('aria-keyshortcuts')"),'H');await closeInspector();const assembledBone=await selectionPixels(`${route}-${width}-bone-assembled-selected`,width,height);assert.ok(assembledBone.tealPixels>0,'Selected pale bone is clear among ordinary ivory bones');
  // Native search typing must never invoke H, even while a valid mesh remains selected.
  await click('[aria-label="Search anatomy"]');await pressKey('h','h');assert.equal(await hiddenCount(),0);assert.equal(await evaluate("document.querySelector('[aria-label=\"Search named anatomical structures\"]').value.endsWith('h')"),true);await click('[aria-label="Close search"]');
  for(const field of ['ctrlKey','metaKey','altKey']){await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'h',${field}:true,bubbles:true}))`);assert.equal(await hiddenCount(),0);}
  // Test real editable targets and inherited contenteditable, preserving the selection throughout.
  for(const kind of ['input','textarea','select','editable','combobox','textbox','searchbox']){
   await evaluate(`(()=>{const e=document.createElement(${JSON.stringify(['input','textarea','select'].includes(kind)?kind:'div')});e.id='shortcut-editor';e.tabIndex=0;if(${JSON.stringify(kind)}==='editable'){e.contentEditable='true';e.innerHTML='<span tabindex="0">Text</span>';}else if(!['input','textarea','select'].includes(${JSON.stringify(kind)}))e.setAttribute('role',${JSON.stringify(kind)});document.body.appendChild(e);(e.firstElementChild??e).focus();})()`);await pressKey('h','h');assert.equal(await hiddenCount(),0,kind+' blocks H');await evaluate("document.querySelector('#shortcut-editor').remove()");
  }
  await evaluate('document.activeElement?.blur()');await hideByKey('H');assert.equal(await hiddenCount(),1);await piecesHidden(concepts[0].elements);
  await search(concepts[1].name);await hideByKey('h');await search(concepts[2].name);await hide();assert.equal(await hiddenCount(),3);
  const ids=concepts.map(c=>identity.representationForPart(c.elements[0]).id);assert.deepEqual(await hiddenOrder(),[...ids].reverse());await piecesHidden(concepts.flatMap(c=>c.elements));await checkCount(31);
  await layers(mobile);await screenshot(`${route}-${width}-dissection-stack`);assert.equal(await evaluate("[...document.querySelectorAll('.hidden-list button')].every(e=>e.getBoundingClientRect().height>=44&&e.getBoundingClientRect().width>=44)"),true);assert.ok(await evaluate("document.querySelector('.hidden-list').clientHeight>=44"),'At least one complete hidden row remains visible');assert.ok(await evaluate("document.querySelector('.system-list').clientHeight>=80"),'Systems remains navigable');assert.equal(await evaluate("document.querySelector('.hidden-structures').textContent.includes('atlas:representation:')"),false,'Names instead of internal IDs');
  const beforeSingle=await camera();await restoreOne(ids[1]);await checkCount(32);await assertCamera(beforeSingle);assert.deepEqual(await hiddenOrder(),[ids[2],ids[0]]);await piecesHidden([...concepts[0].elements,...concepts[2].elements]);assert.equal(await evaluate('window.__atlasTestSelection.some(x=>x!==0)'),false,'Individual restore does not select');
  await restoreOne(ids[2]);await restoreOne(ids[0]);await checkCount(34);assert.equal(await hiddenCount(),0);await closeLayers(mobile);
  await pressKey('h');assert.equal(await hiddenCount(),0,'No selection means no shortcut');await pressKey('/','/');await waitFor("!!document.querySelector('[aria-label=\"Search named anatomical structures\"]')",'existing slash opens search');await click('[aria-label="Close search"]');
  for(const c of concepts){await search(c.name);await hideByKey('h');}await explode();await checkCount(31);await packing(shoulder.filter(p=>!concepts.some(c=>c.elements.includes(p.id))));
  await layers(mobile);const beforeExplodedSingle=await camera();await restoreOne(ids[1]);await closeLayers(mobile);await checkCount(32);await packing(shoulder.filter(p=>!concepts[0].elements.includes(p.id)&&!concepts[2].elements.includes(p.id)));await assertCamera(beforeExplodedSingle);
  await search(concepts[1].name);await closeInspector();const explodedColor=await selectionPixels(`${route}-${width}-bone-exploded-selected`,width,height);assert.ok(explodedColor.tealPixels>0,'Selection accent remains visible exploded');
  const selectedBeforeRestore=await evaluate('window.__atlasTestSelection');await layers(mobile);await restore();await closeLayers(mobile);await checkCount(34);await packing(shoulder);assert.deepEqual(await evaluate('window.__atlasTestSelection'),selectedBeforeRestore,'Restore all preserves unrelated current selection');await reset();
  // Many physical pieces use bounded scrolling, without consuming the whole Systems panel.
  await search('heart');await hideByKey('H');await layers(mobile);assert.equal(await evaluate("document.querySelectorAll('.hidden-list li').length"),heartIds.length);assert.equal(await evaluate("(()=>{const e=document.querySelector('.hidden-list');return e.scrollHeight>e.clientHeight&&e.clientHeight<=156})()"),true);assert.ok(await evaluate("document.querySelector('.system-list').clientHeight>=80"));await noOverlap();await screenshot(`${route}-${width}-many-hidden`);await restore();await closeLayers(mobile);await reset();
  report.push({route,width,height,wholeVisible:whole,directPick:direct.part.id,multiPieceHeart:heartIds.length,brainException:brainIds.length,singleMesh:true,notPickable:true,gpuHighlightCleared:true,noStaleHover:true,partialMultiPieceRestore:true,regionPersistence:true,areaPersistence:true,systemIndependence:true,isolateExit:true,eligibleOnlyGpuPacking:true,restoreWhileExploded:true,hideRestoreCameraUnchanged:true,reset:true,modelSwitchClearsHidden:true,canonicalNavigationRetained:true,chest,hideAllIndependent:true,reloadClearsHidden:true,noOverflow:true,refinement:{colorResults,assembledBone,explodedColor,uppercaseAndLowercaseH:true,searchTypingSafe:true,editableTargetsSafe:true,modifiersSafe:true,slashSearchPreserved:true,newestFirstDissection:true,individualMiddleRestore:true,restorePreservesCameraAndSelection:true,individualExplodedPacking:true,boundedLongList:true,touchSizedRestore:true}});
  console.log(`PASS ${route} ${width}x${height}: hide/restore, search, regions, areas, systems, isolate, GPU packing/count/highlight, camera, reset, model switch${route==='female'?', chest modes':''}`);
 }
 assert.deepEqual(errors,[],'No browser JavaScript exceptions');
 assert.ok(!network.some(url=>/body-.*context|overview|mvmt-.*\.bin/.test(url)),'Only baseline model chunks fetched');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,quick:!!process.env.SMOKE_QUICK,report,exceptions:errors,modelGeometryRequests:[...new Set(network.filter(url=>/\/models\/.*\.bin/.test(url)))]},null,2)+'\n');
 console.log(`Browser evidence: ${output}`);
}catch(error){try{await failureCapture?.();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
