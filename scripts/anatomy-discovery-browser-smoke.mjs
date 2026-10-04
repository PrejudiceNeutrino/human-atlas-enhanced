/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {MODEL_REGISTRY} from '../app/model-registry.ts';
import {createIdentityIndex} from '../app/identity-index.ts';
import {buildDiscoveryIndex,sortDiscoveryEntries,filterDiscoveryEntries,searchDiscoveryEntries,DISCOVERY_ROW_HEIGHT} from '../app/anatomy-discovery.ts';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3028';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-4.8/browser');fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'chrome-'));
const processHandle=spawn(chrome,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions',...(process.env.CHROME_ANGLE?[`--use-angle=${process.env.CHROME_ANGLE}`,'--enable-unsafe-swiftshader']:[]),'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
processHandle.stderr.on('data',d=>fs.appendFileSync(path.join(output,'chrome.log'),d));
processHandle.on('exit',(code,signal)=>console.log('Chrome exit',code,signal));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sidecar=read('public/identity/core-crosswalk-v1.json');
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
 const press=async(key,text,modifiers=0)=>{const codes={Escape:['Escape',27],Enter:['Enter',13],ArrowDown:['ArrowDown',40],ArrowUp:['ArrowUp',38],ArrowLeft:['ArrowLeft',37],ArrowRight:['ArrowRight',39],End:['End',35],Home:['Home',36],Tab:['Tab',9],'/':['Slash',191]};const [code,windowsVirtualKeyCode]=codes[key];await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,modifiers,...(text?{text}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode,modifiers});await delay(100);};
 const close=async()=>{await press('Escape');await waitFor("!document.querySelector('.discovery-panel')",'discovery closed');};
 const open=async()=>{await click('[aria-label="Search anatomy"]');await waitFor("document.activeElement?.id==='anatomy-query'",'input focused');};
 const input=async value=>{await evaluate(`(()=>{const e=document.querySelector('#anatomy-query');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await delay(100);};
 const rows=()=>evaluate("[...document.querySelectorAll('.discovery-row')].map(e=>({id:e.dataset.discoveryId,count:Number(e.dataset.pieceCount),height:e.getBoundingClientRect().height}))");
 const browseTab=async()=>{const pos=await evaluate("(()=>{const e=[...document.querySelectorAll('.discovery-panel [role=tab]')].find(e=>e.textContent==='Browse'),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");await mouse(pos.x,pos.y);await delay(150);};
 const native=async(label,value)=>{const ms=await evaluate(`(async()=>{const e=document.querySelector('[aria-label="${label}"]');const start=performance.now();e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-start})()`);await delay(60);return ms;};
 const contained=async()=>{
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'No page overflow');
  assert.equal(await evaluate("(()=>{const p=document.querySelector('.discovery-panel'),r=p.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})()"),true,'Panel contained in viewport');
  assert.equal(await evaluate("document.querySelector('.discovery-panel').contains(document.querySelector('.discovery-scroll'))"),true);
  assert.equal(await evaluate("document.querySelectorAll('[data-slot=combobox-content]').length"),0,'No detached result popup');
  assert.equal(await evaluate("[...document.querySelectorAll('.discovery-panel *')].filter(e=>{const s=getComputedStyle(e);return ['auto','scroll'].includes(s.overflowY)&&e.scrollHeight>e.clientHeight}).length<=1"),true,'One logical content scroll');
 };
 const camera=()=>evaluate('window.__atlasTestCamera');
 const unchangedCamera=async before=>{const after=await camera();for(const name of ['viewMatrix','projectionMatrix'])for(let i=0;i<16;i++)assert.ok(Math.abs(before[name][i]-after[name][i])<.00001,'Discovery does not move camera');};
 const clear=async()=>{await buttonText('Clear selection');await waitFor("!document.querySelector('.detail-sheet')",'inspector closed');await assembled();};
 const openBrowse=async()=>{await open();await browseTab();await contained();};
 const chooseEntry=async(entry,inventory)=>{
  const index=inventory.findIndex(e=>e.id===entry.id);assert.ok(index>=0);
  await evaluate(`document.querySelector('.discovery-scroll').scrollTop=${index*DISCOVERY_ROW_HEIGHT}`);
  await waitFor(`!!document.querySelector('[data-discovery-id="${entry.id}"]')`,'windowed entry mounted');
  assert.equal(await evaluate(`Number(document.querySelector('[data-discovery-id="${entry.id}"]').dataset.pieceCount)`),entry.modeledPieceCount);
  await click(`[data-discovery-id="${entry.id}"]`);
  await waitFor("!!document.querySelector('.detail-sheet')&&!document.querySelector('.discovery-panel')",'selection opens inspector and closes discovery');
  assert.equal(await evaluate("document.querySelector('.structure-title').textContent"),entry.name);
  assert.equal(Number(await evaluate("document.querySelector('.structure-meta span:last-child strong').textContent")),entry.modeledPieceCount);
 };
 for(const [route,width,height] of (process.env.SMOKE_DESKTOP?[['male',1440,900],['female',1440,900]]:[['male',1440,900],['female',1440,900],['male',390,844],['female',390,844],['male',740,420],['female',740,420]])){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
  await send('Page.navigate',{url:`${baseUrl}/${route}`});await ready();await assembled();
  const model=MODEL_REGISTRY[route==='male'?'bp3d-male-4':'female-study-v3'],atlas=read(`public${model.manifestUrl}`),identity=createIdentityIndex(model,atlas,sidecar),entries=buildDiscoveryIndex(atlas,identity);
  const timings={},before=await camera(),requests=network.filter(u=>u.includes('/models/')).length;
  await evaluate('window.__discoveryCanvas=document.querySelector("canvas")');
  timings.openMs=await evaluate("(async()=>{const start=performance.now();document.querySelector('[aria-label=\"Search anatomy\"]').click();while(!document.querySelector('#anatomy-query'))await new Promise(r=>requestAnimationFrame(r));await new Promise(r=>requestAnimationFrame(r));return performance.now()-start})()");
  await waitFor("document.activeElement?.id==='anatomy-query'",'click opens Search with focus');await contained();
  assert.equal(await evaluate("document.querySelector('.discovery-panel [role=tab][aria-selected=true]').textContent"),'Search');
  const suggested=await rows();assert.deepEqual(suggested.map(e=>e.id),searchDiscoveryEntries(entries,'').slice(0,suggested.length).map(e=>e.id));assert.equal(await evaluate("Number(document.querySelector('.discovery-list').dataset.totalEntries)"),searchDiscoveryEntries(entries,'').length);
  await press('Tab');assert.equal(await evaluate("document.activeElement.getAttribute('role')"),'option','Tab reaches result');await press('Tab',undefined,8);assert.equal(await evaluate("document.activeElement.id"),'anatomy-query','Shift+Tab returns to input');
  await unchangedCamera(before);await screenshot(`${route}-${width}-search`);
  await close();assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"),'Search anatomy','Escape restores trigger focus');
  await press('/');await waitFor("document.activeElement?.id==='anatomy-query'",'slash opens same focused Search');
  await press('/','/');assert.equal(await evaluate("document.querySelector('#anatomy-query').value"),'/','typing guard allows slash in input');
  await input('unknown structure xyz');assert.equal(await evaluate("document.querySelector('.discovery-empty').textContent"),'No matching selectable structures.');
  await input('quads');assert.equal((await rows())[0].id,'ATLAS:group:quadriceps');
  await press('ArrowDown');await press('Enter');await waitFor("!!document.querySelector('.detail-sheet')",'keyboard Search selection');assert.equal(await evaluate("document.querySelector('.structure-title').textContent"),'Quadriceps');await clear();
  await openBrowse();await press('ArrowLeft');assert.equal(await evaluate("document.activeElement.textContent"),'Search','Tab arrows keep tab focus');await press('ArrowRight');assert.equal(await evaluate("document.activeElement.textContent"),'Browse');await press('/');await waitFor("document.activeElement?.id==='anatomy-query'",'slash from Browse returns to same Search input');assert.equal(await evaluate("document.querySelectorAll('.discovery-panel').length"),1);await browseTab();await press('Tab');if(await evaluate("document.activeElement.getAttribute('role')==='tabpanel'"))await press('Tab');assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"),'Sort structures');await press('Tab');assert.equal(await evaluate("document.activeElement.getAttribute('aria-label')"),'Filter structures by system');await press('Tab');assert.equal(await evaluate("document.activeElement.getAttribute('role')"),'option');await screenshot(`${route}-${width}-browse`);
  assert.equal(await evaluate("document.querySelector('.discovery-summary[role=status]').textContent"),`${entries.length.toLocaleString('en-US')} selectable structures \u00b7 ${identity.representationCount.toLocaleString('en-US')} model pieces`);
  let maxRows=0;
  for(const sort of ['name','largest','smallest']){
   timings[sort+'Ms']=await native('Sort structures',sort);
   const expected=sortDiscoveryEntries(entries,sort),rendered=await rows();maxRows=Math.max(maxRows,rendered.length);
   assert.deepEqual(rendered.map(e=>e.id),expected.slice(0,rendered.length).map(e=>e.id));assert.ok(rendered.every(e=>e.height>=44));
   for(const fraction of [.5,1]){
    await evaluate(`(()=>{const e=document.querySelector('.discovery-scroll');e.scrollTop=(e.scrollHeight-e.clientHeight)*${fraction};})()`);await delay(80);
    const mounted=await rows();maxRows=Math.max(maxRows,mounted.length);assert.ok(mounted.length<30);assert.equal(new Set(mounted.map(e=>e.id)).size,mounted.length);
    if(fraction===1)assert.equal(mounted.at(-1).id,expected.at(-1).id);
   }
   await evaluate("document.querySelector('.discovery-scroll').scrollTop=0");await delay(80);
  }
  const multi=entries.find(e=>e.systemIds.length>1&&e.modeledPieceCount>1),filter=multi.systemIds[0];
  timings.filterMs=await native('Filter structures by system',filter);await native('Sort structures','name');
  const filtered=sortDiscoveryEntries(filterDiscoveryEntries(entries,filter),'name'),first=await rows();
  assert.deepEqual(first.map(e=>e.id),filtered.slice(0,first.length).map(e=>e.id));
  await native('Filter structures by system','all');
  const alphabetical=sortDiscoveryEntries(entries,'name'),single=alphabetical.find(e=>e.modeledPieceCount===1);
  await chooseEntry(single,alphabetical);await clear();
  await openBrowse();await evaluate("document.querySelector('.discovery-row').focus()");await press('End');
  assert.equal(await evaluate("document.activeElement.dataset.discoveryId"),alphabetical.at(-1).id,'keyboard reaches last windowed row');await press('Home');assert.equal(await evaluate("document.activeElement.dataset.discoveryId"),alphabetical[0].id);await close();
  // A source concept is a selection, independently of the curated Foot teaching station.
  const compound=entries.find(e=>e.id==='FMA11343');assert.equal(compound.name,'right foot');assert.equal(compound.modeledPieceCount,26);
  await region('thoracic');await assembled();await openBrowse();await chooseEntry(compound,alphabetical);
  assert.equal(await evaluate("document.querySelector('#region-choice').value"),'atlas:region:thoracic');assert.equal(await evaluate("document.querySelector('#area-choice').value"),'');
  await buttonText('Isolate structure');assert.equal(await count(),compound.modeledPieceCount);await assembled();
  const gpu=await evaluate('window.__atlasTestRender.pixels');for(const [i,p] of atlas.parts.entries())assert.equal(gpu[i*4+3]>.5,compound.partIds.includes(p.id),'exact compound isolate GPU mask');
  await screenshot(`${route}-${width}-right-foot-isolated`);await clear();assert.equal(await count(),compound.modeledPieceCount);await buttonText('Show surrounding anatomy');
  await area('heart');await assembled();const context=await evaluate('location.search');
  await openBrowse();await chooseEntry(compound,alphabetical);assert.equal(await evaluate('location.search'),context,'Browse preserves Region and Teaching Area');
  await buttonText('Isolate structure');assert.equal(await count(),26);await clear();assert.equal(await count(),26);await buttonText('Show surrounding anatomy');assert.equal(await count(),77);
  await click('[aria-label="Assemble and reset"]');await assembled();
  await noOverlap();await screenshot(`${route}-${width}-navigation`);
  if(width===1440){
   const aligned=await evaluate("(()=>{const r=[...document.querySelectorAll('.anatomy-choice [data-slot=select-trigger]'),document.querySelector('.layers-panel')].map(e=>e.getBoundingClientRect());return r.every(a=>Math.abs(a.left-r[0].left)<1&&Math.abs(a.width-r[0].width)<1)})()");assert.ok(aligned,'Shared desktop rail widths and left edges');
   assert.equal(await menuOptions('#area-choice'),18);await region('head-jaw');await screenshot(`${route}-${width}-navigation-menu-context`);await region('body');
  }
  assert.equal(await evaluate('window.__discoveryCanvas===document.querySelector("canvas")'),true,'No geometry/renderer rebuild');
  assert.equal(network.filter(u=>u.includes('/models/')).length,requests,'No discovery model refetch');
  // Switching models while Browse is open invalidates the old inventory and filter.
  await openBrowse();await native('Filter structures by system','skeletal');
  await close();await click('[aria-label="Choose male or female anatomy"]');
  await evaluate(`([...document.querySelectorAll('[role=option]')].find(e=>e.textContent.trim()===${JSON.stringify(route==='male'?'Female anatomy':'Male anatomy')})).click()`);await ready();
  await openBrowse();const dest=route==='male'?'female':'male',destination=MODEL_REGISTRY[dest==='male'?'bp3d-male-4':'female-study-v3'],destAtlas=read(`public${destination.manifestUrl}`),destIdentity=createIdentityIndex(destination,destAtlas,sidecar),destEntries=buildDiscoveryIndex(destAtlas,destIdentity);
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Filter structures by system\"]').value"),'all');
  assert.equal(await evaluate("Number(document.querySelector('.discovery-list').dataset.totalEntries)"),destEntries.length);
  const bone=destEntries.find(e=>e.id==='FMA30317')??destEntries.find(e=>e.name==='bone organ');const boneIndex=sortDiscoveryEntries(destEntries,'name').findIndex(e=>e.id===bone.id);await evaluate(`document.querySelector('.discovery-scroll').scrollTop=${boneIndex*DISCOVERY_ROW_HEIGHT}`);await waitFor(`!!document.querySelector('[data-discovery-id="${bone.id}"]')`,'destination count row');assert.equal(await evaluate(`Number(document.querySelector('[data-discovery-id="${bone.id}"]').dataset.pieceCount)`),bone.modeledPieceCount);
  await close();
  const result={route,width,height,entries:entries.length,modeledPieces:identity.representationCount,maxRenderedRows:maxRows,timings,compound:{id:compound.id,name:compound.name,count:26,exactIsolateGpuMask:true},oneSurface:true,contained:true,keyboard:true,regionAreaPreserved:true,noCameraMovement:true,noGeometryRebuild:true,modelSwitch:true};
  report.push(result);console.log('PASS '+JSON.stringify(result));
 }
 assert.deepEqual(errors,[],'No JavaScript exceptions');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:!!process.env.SMOKE_DESKTOP,report,exceptions:errors},null,2)+'\n');console.log(`Browser evidence: ${output}`);
}catch(error){try{await failureCapture?.();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
