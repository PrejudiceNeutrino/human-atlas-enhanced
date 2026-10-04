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

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3021';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-4.6-browser');fs.mkdirSync(output,{recursive:true});
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
 // Inspect actual screenshot pixels in a temporary 2D canvas; no production rendering changes.
 const selectionPixels=async(name,width,height)=>{
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(shot.data,'base64'));
  const left=width<768?0:285,top=height<600?90:width<768?320:130,right=width-(width<768?62:90),bottom=height-(height<600?110:width<768?175:200);
  return evaluate(`new Promise((resolve,reject)=>{const img=new Image();img.onerror=reject;img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(${left},${top},${right-left},${bottom-top}).data,colors=new Set();let teal=0;for(let i=0;i<pixels.length;i+=4){const r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(g>100&&b>60&&r<g*.78&&b>r*1.15&&g>b*1.04){teal++;colors.add(r+','+g+','+b);}}resolve({tealPixels:teal,shadedColors:colors.size});};img.src=${JSON.stringify('data:image/png;base64,'+shot.data)};})`);
 };

 const chooseTheme=async mode=>{if(await evaluate('document.documentElement.dataset.theme')!==mode)await click('.theme-trigger');await waitFor(`document.documentElement.dataset.theme===${JSON.stringify(mode)}`,'theme applied');};
 const snapshot=()=>evaluate("({gpu:window.__atlasTestRender.pixels,selection:window.__atlasTestSelection,camera:window.__atlasTestCamera,url:location.href,explode:document.querySelector('.explode-control output').textContent,hidden:document.querySelector('.hidden-count').textContent,isolate:!!document.querySelector('.detail-sheet.is-isolated'),reference:document.querySelector('.structure-meta strong')?.textContent})");
 const assertSnapshot=async before=>{const after=await snapshot();const {camera:ignoredBefore,...previous}=before,{camera:ignoredAfter,...current}=after;assert.deepEqual(current,previous);await assertCamera(before.camera);};
 const isolated=()=>evaluate("!!document.querySelector('.detail-sheet.is-isolated')");
 for(const [width,height] of (process.env.SMOKE_DESKTOP?[[1440,900]]:process.env.SMOKE_QUICK==='landscape'?[[740,420]]:process.env.SMOKE_QUICK?[[1440,900]]:[[1440,900],[390,844],[740,420]]))for(const route of ['male','female']){
  const mobile=width<768||height<600;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});
  await send('Page.navigate',{url:`${baseUrl}/${route}`});await ready();
  await evaluate("localStorage.removeItem('human-atlas-theme')");await send('Page.reload');await ready();
  assert.equal(await evaluate("document.documentElement.dataset.theme"),'light','No saved choice stays Light even on dark OS');
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar);
  const piecesHidden=async ids=>{const pixels=await gpu();for(const id of ids){const i=atlas.parts.findIndex(p=>p.id===id)*4;assert.deepEqual(pixels.slice(i,i+4),[0,0,0,0]);}};
  const group=atlas.concepts.find(c=>c.name.toLowerCase()==='muscle of pectoral girdle');assert.ok(group);
  const groupIds=identity.resolve(identity.sourceConceptCanonicalId(group.id),model.id).map(r=>r.sourcePart.id);assert.equal(groupIds.length,22);
  const single=atlas.concepts.find(c=>c.name.toLowerCase()==='right clavicle'&&c.elements.length===1);assert.ok(single);
  const whole=route==='male'?2217:2239;
  await checkCount(whole);await noOverlap();
  // Same reviewed isolate state for assembled and exploded Included structures drill-down.
  const drill=[];
  for(const exploded of [false,true]){
   await reset();await search(single.name);await hide();await region('shoulder');await area('axilla');
   await delay(700);const ordinary=await gpu(),ordinaryCamera=await camera();
   await search(group.name);await buttonText('Isolate structure');await checkCount(22);
   if(exploded)await explode();await delay(700);
   await screenshot(`${route}-${width}-${exploded?'exploded':'assembled'}-isolated-group`);
   await click('.member-list button');await waitFor("document.querySelector('.structure-meta span:last-child strong').textContent==='1'",'member selected');await checkCount(22);assert.equal(await isolated(),true);
   assert.equal(await evaluate("document.querySelector('.detail-actions .primary-action').textContent.includes('Isolate structure')&&[...document.querySelectorAll('.detail-actions button')].some(e=>e.textContent.includes('Show surrounding anatomy'))"),true);
   const selectedPixels=await evaluate('window.__atlasTestSelection'),member=atlas.parts.find((p,i)=>selectedPixels[i*4]>0);assert.equal(member.id,groupIds[0]);
   assert.equal(await hiddenCount(),1);assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:shoulder');assert.equal(await evaluate("document.querySelector('#area-choice').value"),'atlas:area:axilla');
   assert.notDeepEqual(await camera(),ordinaryCamera,'Isolated member does not invoke ordinary context frame');
   if(exploded)assert.equal(await evaluate("document.querySelector('.explode-control output').textContent"),'100%');
   await screenshot(`${route}-${width}-${exploded?'exploded':'assembled'}-isolated-member`);
   await buttonText('Show surrounding anatomy');assert.equal(await isolated(),false);await assembled();
   const after=await gpu();for(let i=0;i<atlas.parts.length;i++)assert.equal(after[i*4+3],ordinary[i*4+3]||Number(atlas.parts[i].id===member.id),'Exit restores ordinary active station/systems plus selected exception');
   drill.push({exploded,member:member.id,surrounding:await count()});
   await search(group.name);await click('.member-list button');assert.equal(await isolated(),false);assert.ok(await count()>1,'Non-isolated member retains surroundings');
  }
  // UI-only tabs, counts at zero, native keyboard and one scroll surface.
  await reset();await layers(mobile);await tab('Hidden');assert.equal(await hiddenCount(),0);assert.equal(await evaluate("document.querySelector('.hidden-empty').textContent"),'No structures hidden.');
  const beforeTabs=await snapshot();await tab('Systems');await tab('Hidden');await assertSnapshot(beforeTabs);
  await evaluate("[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent.startsWith('Hidden')).focus()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});await delay(250);
  assert.equal(await evaluate("document.activeElement.getAttribute('role')"),'tab');assert.equal(await evaluate("document.activeElement.textContent.trim()"),'Systems');
  await tab('Systems');await closeLayers(mobile);
  const pieces=['right clavicle','left clavicle','right scapula'].map(name=>atlas.concepts.find(c=>c.name.toLowerCase()===name&&c.elements.length===1));
  for(const c of pieces){await search(c.name);await hide();}
  assert.equal(await hiddenCount(),3);assert.equal(await evaluate("document.querySelector('[role=tab][aria-selected=true]').textContent.trim()"),'Systems','Hide does not switch tabs');
  await layers(mobile);const beforeHidden=await snapshot();await tab('Hidden');await assertSnapshot(beforeHidden);
  const ids=pieces.map(c=>identity.representationForPart(c.elements[0]).id);assert.deepEqual(await hiddenOrder(),[...ids].reverse());
  assert.equal(await evaluate("document.querySelectorAll('.hidden-list').length"),1);assert.equal(await evaluate("!!document.querySelector('.system-list')"),false);
  const beforeRestore=await camera();await restoreOne(ids[1]);await assertCamera(beforeRestore);assert.deepEqual(await hiddenOrder(),[ids[2],ids[0]]);await piecesHidden([pieces[0].elements[0],pieces[2].elements[0]]);
  await screenshot(`${route}-${width}-light-hidden`);await restore();await closeLayers(mobile);await checkCount(whole);
  await search('heart');await hide();await layers(mobile);await tab('Hidden');
  assert.equal(await evaluate("(()=>{const p=document.querySelector('.layers-panel'),c=document.querySelector('.visibility-content'),l=document.querySelector('.hidden-list');return getComputedStyle(p).overflowY==='hidden'&&getComputedStyle(l).overflowY==='visible'&&c.scrollHeight>c.clientHeight&&[...l.querySelectorAll('button')].every(e=>e.getBoundingClientRect().height>=44)})()"),true,'Only tab content scrolls, with full touch targets');
  await screenshot(`${route}-${width}-light-hidden-long`);await restore();await closeLayers(mobile);
  // Hide/Show systems independently of model-specific dissection in all navigation scopes.
  await search(single.name);await hide();const inventory=[];
  for(const scope of ['body','shoulder','heart']){
   if(scope==='heart')await area('heart');else await region(scope);
   await layers(mobile);const counts=await evaluate("document.querySelector('.system-list').textContent"),url=await evaluate('location.search');
   await buttonText('Hide all systems');await checkCount(0);assert.equal(await hiddenCount(),1);
   assert.equal(await evaluate("document.querySelector('.systems-global-action').textContent"),'Show all systems');
   await buttonText('Show all systems');assert.equal(await hiddenCount(),1);await piecesHidden(single.elements);
   assert.equal(await evaluate('location.search'),url);assert.equal(await evaluate("document.querySelector('.system-list').textContent"),counts);
   assert.equal(await evaluate("document.querySelector('[aria-label=\"Show reproductive\"]').getAttribute('aria-checked')"),'true','Explicit All enables reproductive on both models');
   inventory.push({scope,visible:await count()});await closeLayers(mobile);
  }
  await layers(mobile);await buttonText('Hide all systems');await tab('Hidden');await restore();await checkCount(0);await buttonText('Show all systems');await closeLayers(mobile);
  // Theme is independent: actual uniforms, GPU state, URLs and model/network stay unchanged.
  await reset();await search('left clavicle');await hide();await region('shoulder');await search(single.name);await buttonText('Isolate structure');await explode();await delay(800);
  // Utility controls are intentionally hidden beside the landscape inspector; close inspector without clearing isolate.
  await closeInspector();await delay(700);const beforeTheme=await snapshot(),canvasIdentity=await evaluate("(()=>{window.__savedCanvas=document.querySelector('.scene canvas');return true})()"),networkBefore=network.filter(u=>/\/(models|identity|regions|areas)\//.test(u)).length;
  for(const mode of ['dark','light']){await chooseTheme(mode);await delay(400);await assertSnapshot(beforeTheme);assert.equal(await evaluate("window.__savedCanvas===document.querySelector('.scene canvas')"),true);}
  assert.equal(network.filter(u=>/\/(models|identity|regions|areas)\//.test(u)).length,networkBefore,'Theme does not refetch any anatomy/data');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'}]});assert.equal(await evaluate('document.documentElement.dataset.theme'),'light','Binary choice ignores OS');
  await chooseTheme('dark');await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'}]});assert.equal(await evaluate("document.documentElement.dataset.theme"),'dark');
  await send('Page.reload');await ready();assert.equal(await evaluate("document.documentElement.dataset.theme"),'dark');assert.equal(await hiddenCount(),0);assert.equal(await evaluate("document.querySelector('.explode-control output').textContent"),'0%');
  const colors=[];
  for(const theme of ['light','dark']){
   await chooseTheme(theme);await reset();await screenshot(`${route}-${width}-${theme}-whole`);
   await layers(mobile);await screenshot(`${route}-${width}-${theme}-systems`);await buttonText('Skeleton');await closeLayers(mobile);await screenshot(`${route}-${width}-${theme}-skeleton`);
   await layers(mobile);await buttonText('Muscles',"document.querySelector('.system-list')");await closeLayers(mobile);await screenshot(`${route}-${width}-${theme}-muscles`);
   for(const system of ['skeletal','muscular','arterial','venous']){
    await reset();const candidates=atlas.concepts.filter(c=>c.elements.length===1&&atlas.parts.some(p=>p.id===c.elements[0]&&p.system===system&&(system!=='skeletal'||p.id===single.elements[0])));const score=c=>{const p=atlas.parts.find(p=>p.id===c.elements[0]);return p.bounds[0].reduce((v,n,i)=>v*(p.bounds[1][i]-n),1);};const concept=candidates.sort((a,b)=>score(b)-score(a))[0],part=atlas.parts.find(p=>p.id===concept?.elements[0]);assert.ok(concept);
    await search(concept.name);await buttonText('Isolate structure');await closeInspector();await delay(600);
    if(height<600){for(let i=0;i<3;i++)await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:width/2,y:250,deltaX:0,deltaY:-300});await delay(400);}
    const pixels=await selectionPixels(`${route}-${width}-${theme}-${system}-selected`,width,height);assert.ok(pixels.tealPixels>20,'Strong selected accent in both themes');assert.ok(pixels.shadedColors>16);colors.push({theme,system,part:part.id,...pixels});
   }
   await reset();await area('heart');await screenshot(`${route}-${width}-${theme}-heart-area`);await reset();
   await search('heart');await hide();await layers(mobile);await tab('Hidden');await screenshot(`${route}-${width}-${theme}-hidden`);await restore();await closeLayers(mobile);
  }
  await chooseTheme('dark');await reset();
  const menus=[];
  for(const selector of ['[aria-label="Choose male or female anatomy"]','#region-choice','#area-choice']){
   await click(selector);await waitFor("!!document.querySelector('[data-slot=select-content][data-open]')",'dark menu');
   const color=await evaluate("getComputedStyle(document.querySelector('[data-slot=select-content][data-open]')).backgroundColor");assert.notEqual(color,'rgb(255, 255, 255)');menus.push({selector,color});await screenshot(`${route}-${width}-dark-menu-${menus.length}`);
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(200);
  }
  await click('[aria-label="Search anatomy"]');await screenshot(`${route}-${width}-dark-search`);assert.notEqual(await evaluate("getComputedStyle(document.querySelector('.discovery-panel')).backgroundColor"),'rgb(255, 255, 255)');await click('[aria-label="Close search"]');
  const chest=[];
  if(route==='female'){
   await layers(mobile);for(const name of ['Tissue','Glands','Pectorals']){await buttonText(name);await screenshot(`${route}-${width}-dark-${name.toLowerCase()}`);chest.push({mode:name,visible:await count()});}await closeLayers(mobile);
   assert.deepEqual(chest.map(c=>c.visible),[2239,2237,2229]);
  }
  await reset();await layers(mobile);await buttonText('Body surface',"document.querySelector('.system-list')");await closeLayers(mobile);await screenshot(`${route}-${width}-dark-body-surface`);
  await reset();await layers(mobile);await noOverlap();assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await closeLayers(mobile);
  const suite={route,width,height,passed:true,drill,inventory,colors,menus,chest,errors:errors.length};report.push(suite);console.log(JSON.stringify(suite));
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,quick:!!process.env.SMOKE_QUICK,suites:report,errors},null,2));
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
