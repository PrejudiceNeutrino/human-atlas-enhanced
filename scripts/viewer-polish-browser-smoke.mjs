/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {createAreaIndex} from '../app/areas.ts';
import {SYSTEMS} from '../app/anatomy.ts';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';
import {createRegionIndex} from '../app/regions.ts';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3021';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-4.5-browser');fs.mkdirSync(output,{recursive:true});
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
 const {select,options}=selectBrowserHelpers({evaluate,click,waitFor,delay});
 const region=slug=>select('#region-choice',`atlas:region:${slug}`);
 const area=slug=>select('#area-choice',slug?`atlas:area:${slug}`:'');
 const ready=async()=>{await delay(400);return waitFor("!!document.querySelector('.scene canvas')&&!document.querySelector('.loading')&&!!document.querySelector('#area-choice')",'geometry ready');};
 const count=async()=>Number((await evaluate("document.querySelector('.panel-foot span').textContent")).replace(/[^0-9]/g,''));
 const screenshot=async name=>{await delay(600);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(shot.data,'base64'));};
 failureCapture=()=>screenshot('failure');
 const key=async name=>{const vk={Escape:27,ArrowDown:40,ArrowUp:38,Enter:13,Space:32}[name];await send('Input.dispatchKeyEvent',{type:'keyDown',key:name==='Space'?' ':name,code:name,windowsVirtualKeyCode:vk});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name==='Space'?' ':name,code:name,windowsVirtualKeyCode:vk});await delay(180);};
 const layers=async mobile=>{if(mobile)await click('[aria-label="Open system layers"]');};
 const closeLayers=async mobile=>{if(mobile)await click('[aria-label="Close systems"]');};
 const search=async name=>{
  await click('[aria-label="Search anatomy"]');await evaluate(`(()=>{const e=document.querySelector('[aria-label="Search named anatomical structures"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(name)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor(`[...document.querySelectorAll('.search-result-name')].some(e=>e.textContent.toLowerCase()===${JSON.stringify(name.toLowerCase())})`,'search result');
  await evaluate(`(()=>{[...document.querySelectorAll('.search-result-name')].find(e=>e.textContent.toLowerCase()===${JSON.stringify(name.toLowerCase())}).closest('[role=option]').click()})()`);
  await waitFor("!!document.querySelector('.detail-sheet')",'selected inspector');
 };
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  const names=new WeakMap();window.__atlasTestCamera={};
  for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type){
   const locate=type.prototype.getUniformLocation;type.prototype.getUniformLocation=function(program,name){const location=locate.call(this,program,name);if(location)names.set(location,name);return location;};
   const matrix=type.prototype.uniformMatrix4fv;type.prototype.uniformMatrix4fv=function(location,transpose,value,...rest){const name=names.get(location);if(name==='viewMatrix'||name==='projectionMatrix')window.__atlasTestCamera[name]=Array.from(value);return matrix.call(this,location,transpose,value,...rest);};
  }
 })()`});
 const before=process.env.POLISH_BASELINE==='1',report=[];
 const menu=async(id,name,width,height)=>{
  await delay(800);const cameraBefore=await evaluate('window.__atlasTestCamera');await click(id);await waitFor("!!document.querySelector('[data-slot=select-content][data-open]')",'menu opens');await delay(500);
  const geometry=await evaluate(`(()=>{const t=document.querySelector(${JSON.stringify(id)}).getBoundingClientRect(),p=document.querySelector('[data-slot=select-content][data-open]'),r=p.getBoundingClientRect();return{trigger:t.toJSON(),popup:r.toJSON(),client:p.clientHeight,scroll:p.scrollHeight,overflow:p.scrollWidth>p.clientWidth,items:[...p.querySelectorAll('[data-slot=select-item]')].map(e=>({value:e.dataset.value,text:e.innerText,relevant:e.dataset.regionRelevant,selected:e.hasAttribute('data-selected'),height:e.getBoundingClientRect().height})),labels:[...p.querySelectorAll('[data-slot=select-label]')].map(e=>e.textContent)};})()`);
  fs.writeFileSync(path.join(output,name+'-geometry.json'),JSON.stringify(geometry,null,2));
  assert.ok(Math.abs(geometry.popup.left-geometry.trigger.left)<2,'Menu left edge attached');assert.ok(Math.abs(geometry.popup.width-geometry.trigger.width)<2,'Menu width matches trigger');assert.ok(geometry.popup.top>=geometry.trigger.bottom-1&&geometry.popup.top-geometry.trigger.bottom<=6,'Small attached menu gap');
  assert.ok(geometry.popup.right<=width&&geometry.popup.bottom<=height&&geometry.popup.top>=0,'Popup remains inside viewport');assert.equal(geometry.overflow,false);assert.ok(geometry.items.every(i=>i.height>=36),'Comfortable items');
  assert.ok(geometry.popup.height<geometry.scroll+60,'No unused menu height');assert.deepEqual(await evaluate('window.__atlasTestCamera'),cameraBefore,'Opening menu does not move camera');
  await screenshot(`${name}-menu`);await key('Escape');await waitFor("!document.querySelector('[data-slot=select-content][data-open]')",'Escape closes menu');assert.equal(await evaluate(`document.activeElement===document.querySelector(${JSON.stringify(id)})`),true,'Focus returns to trigger');return geometry;
 };
 for(const [width,height] of (before?[[1440,900]]:process.env.SMOKE_QUICK?[[1440,900]]:[[1440,900],[390,844],[740,420]]))for(const route of ['male','female']){
  const mobile=width<768||height<600;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:`${baseUrl}/${route}`});await ready();
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),ri=createRegionIndex(regions,sidecar,identity),ai=createAreaIndex(dataset,sidecar,regions,identity);
  await screenshot(`${route}-${width}-whole`);
  if(before||width===1440){
   await layers(mobile);await buttonText('Skeleton');await closeLayers(mobile);await screenshot(`${route}-${width}-skeleton`);
   await layers(mobile);await buttonText('Muscles',"document.querySelector('.system-list')");await closeLayers(mobile);await screenshot(`${route}-${width}-muscular`);
   await click('[aria-label="Assemble and reset"]');await region('shoulder');await screenshot(`${route}-${width}-shoulder`);await region('thoracic');await screenshot(`${route}-${width}-thoracic`);await area('heart');await screenshot(`${route}-${width}-heart`);
   await click('[aria-label="Assemble and reset"]');
   if(route==='female'){await layers(mobile);for(const view of ['Tissue','Glands','Pectorals']){await buttonText(view);await screenshot(`${route}-${width}-chest-${view.toLowerCase()}`);}await closeLayers(mobile);await click('[aria-label="Assemble and reset"]');}
  }
  if(before){report.push({route,width,height,before:true});continue;}
  const menus=[];menus.push(await menu('[aria-label="Choose male or female anatomy"]',`${route}-${width}-model`,width,height));menus.push(await menu('#region-choice',`${route}-${width}-region`,width,height));
  const wholeArea=await menu('#area-choice',`${route}-${width}-areas`,width,height);assert.equal(wholeArea.items.length,18);assert.equal(wholeArea.items.filter(i=>i.relevant==='true').length,0);
  const expectedOrder=['orbit','circle-of-willis','brainstem','larynx','brachial-plexus','axilla','cubital-fossa','wrist','hand','heart','lung-roots','porta-hepatis','celiac-trunk','kidneys','pelvic-viscera','popliteal-fossa','foot'];
  assert.deepEqual(wholeArea.items.slice(1).map(i=>i.value),expectedOrder.map(s=>`atlas:area:${s}`));
  for(const slug of ['head-jaw','ankle-foot','shoulder','cervical']){
   await region(slug);const m=await menu('#area-choice',`${route}-${width}-${slug}-areas`,width,height);assert.equal(m.items.length,18);
   assert.deepEqual(m.items.filter(i=>i.relevant==='true').map(i=>i.value).sort(),dataset.areas.filter(a=>a.regionIds.includes(`atlas:region:${slug}`)).map(a=>a.id).sort());
   assert.ok(m.items.filter(i=>i.relevant==='true').every(i=>i.text.includes('Affiliated with')),'Relevance includes text semantics');
  }
  await area('brachial-plexus');assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:cervical');await area(null);assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:cervical');
  await region('ankle-foot');await area('circle-of-willis');assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:head-jaw');
  const snapshots=[];
  for(const [kind,slug] of [['region','body'],['region','shoulder'],['region','ankle-foot'],['area','heart'],['area','kidneys'],['area','brachial-plexus']]){
   if(kind==='region')await region(slug);else await area(slug);
   const rs=kind==='region'?ri.representationsForRegion(`atlas:region:${slug}`,model.id):ai.representationsForArea(`atlas:area:${slug}`,model.id),expected=Object.fromEntries(SYSTEMS.map(s=>[s.name,rs.filter(r=>r.sourcePart.system===s.id).length]));
   await layers(mobile);
   const actual=await evaluate("Object.fromEntries([...document.querySelectorAll('.system-row')].map(e=>[e.querySelector('.system-name').textContent.replace(/\\d+$/,'').trim(),Number(e.querySelector('.system-count').textContent)]))");
   for(const [name,n] of Object.entries(actual))assert.equal(n,expected[name],`${slug} ${name} scoped inventory`);
   assert.equal(await evaluate("[...document.querySelectorAll('.system-row')].filter(e=>e.querySelector('.system-count').textContent==='0').every(e=>e.querySelector('button.system-name').matches(':disabled,[aria-disabled=true],[data-disabled]')&&e.querySelector('[role=switch]').matches(':disabled,[aria-disabled=true],[data-disabled]'))"),true,'Zero scope rows are non-operative');
   snapshots.push({kind,slug,counts:actual,total:rs.length});await closeLayers(mobile);
  }
  // Ordinary toggles and hide/search exceptions never rewrite scoped inventory.
  await region('ankle-foot');await layers(mobile);const inventory=await evaluate("document.querySelector('.system-list').textContent");await click('[aria-label="Show skeleton"]');assert.equal(await evaluate("document.querySelector('.system-list').textContent"),inventory);await click('[aria-label="Show skeleton"]');await closeLayers(mobile);
  await area('heart');await layers(mobile);const heartInventory=await evaluate("document.querySelector('.system-list').textContent");await closeLayers(mobile);await search('brain');await click('.hide-structure');await layers(mobile);assert.equal(await evaluate("document.querySelector('.system-list').textContent"),heartInventory);await evaluate("[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent.startsWith('Hidden')).click()");await delay(150);await click('.restore-hidden');await evaluate("[...document.querySelectorAll('[role=tab]')].find(e=>e.textContent.startsWith('Systems')).click()");await closeLayers(mobile);
  await layers(mobile);await buttonText('Skeleton');await closeLayers(mobile);assert.equal(await count(),0);assert.ok((await evaluate("document.querySelector('.region-status').textContent")).includes('No area pieces'));assert.equal(await evaluate("document.querySelector('#area-choice').value"),'atlas:area:heart');
  await click('[aria-label="Assemble and reset"]');await layers(mobile);
  const reproductive=()=>evaluate("document.querySelector('[aria-label=\"Show reproductive\"]').getAttribute('aria-checked')");assert.equal(await reproductive(),route==='male'?'false':'true');
  if(route==='male'){await click('[aria-label="Show reproductive"]');assert.equal(await reproductive(),'true');await click('[aria-label="Show reproductive"]');assert.equal(await reproductive(),'false');await buttonText('All');assert.equal(await reproductive(),'true');}
  await closeLayers(mobile);await click('[aria-label="Assemble and reset"]');
  if(route==='male'){
   const reproductivePart=atlas.parts.find(p=>p.system==='reproductive'),reproductiveConcept=atlas.concepts.find(c=>c.id===reproductivePart.conceptId);assert.ok(reproductiveConcept);
   const ordinary=await count();await search(reproductiveConcept.name);assert.ok(await count()>ordinary,'Explicit reproductive selection can reveal default-off pieces');await click('.hide-structure');
   await click('[aria-label="Assemble and reset"]');
  }
  // Native keyboard navigation with Enter and Space, plus scrolling to the last station.
  await evaluate("document.querySelector('#area-choice').focus()");await key('ArrowDown');await key('ArrowDown');await key('Enter');await waitFor("document.querySelector('#area-choice').value==='atlas:area:orbit'",'Keyboard area selection');
  await area('foot');assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:ankle-foot');await area(null);
  await evaluate("document.querySelector('#region-choice').focus()");await key('Space');await waitFor("!!document.querySelector('[data-slot=select-content][data-open]')",'Space opens selector');await key('ArrowUp');await key('Space');await waitFor("document.querySelector('#region-choice').value==='atlas:region:knee'",'Space selects focused region');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'No page overflow');
  const target=route==='male'?'female':'male';await click('[aria-label="Choose male or female anatomy"]');await click(`[data-slot=select-item][data-value="${target}"]`);await waitFor(`location.pathname==='/${target}'`,'model switched');await ready();await layers(mobile);assert.equal(await reproductive(),target==='male'?'false':'true');await closeLayers(mobile);
  report.push({route,width,height,menus,snapshots,scopeInventoryStable:true,defaultAndSwitch:true,keyboard:true,noOverflow:true});console.log(`PASS polish ${route} ${width}x${height}`);
 }
 assert.deepEqual(errors,[],'No browser exceptions');fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,before,report,exceptions:errors},null,2));
}catch(error){try{await failureCapture?.();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
