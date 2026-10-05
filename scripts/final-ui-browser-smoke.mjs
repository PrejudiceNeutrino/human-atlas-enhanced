/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import * as T from 'three';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3066';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.5/browser');fs.mkdirSync(output,{recursive:true});
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

 const report=[],camera=()=>evaluate('window.__atlasTestCamera');
 const press=async(key,modifiers=0)=>{const special={Escape:27,Enter:13,Home:36,End:35,ArrowDown:40,ArrowRight:39,'/':191};const code=key==='/'?'Slash':key.length===1?'Key'+key.toUpperCase():key;await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,modifiers,windowsVirtualKeyCode:special[key]??key.toUpperCase().charCodeAt(0)});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,modifiers,windowsVirtualKeyCode:special[key]??key.toUpperCase().charCodeAt(0)});await delay(220);};
 const blur=()=>evaluate('document.activeElement?.blur()');
 const drag=async(button='left')=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',x:850,y:370,button,clickCount:1});for(let i=1;i<=8;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:850+i*12,y:370+i*5,button,buttons:button==='left'?1:2});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:946,y:410,button,clickCount:1});await delay(900);};
 const delta=(a,b,orientation=false)=>Math.max(...(orientation?[0,1,2,4,5,6,8,9,10]:Array.from({length:16},(_,i)=>i)).map(i=>Math.abs(a.viewMatrix[i]-b.viewMatrix[i])));
 const closeInspector=async()=>{if(await evaluate(`!!document.querySelector('.detail-sheet')`)){await evaluate(`document.querySelector('.detail-sheet [data-slot=sheet-close]').click()`);await waitFor("!document.querySelector('.detail-sheet')",'inspector closed');}};
 const lock=async()=>{await click('[aria-label="Lock view"]');await waitFor("document.querySelector('.studio').dataset.viewLocked==='true'",'view locked');};
 const clearance=async()=>{const bounds=await evaluate(`(()=>{const a=document.querySelector('.scene-caption').getBoundingClientRect(),b=document.querySelector('.bottom-dock').getBoundingClientRect();return{caption:a.toJSON(),dock:b.toJSON(),display:getComputedStyle(document.querySelector('.scene-caption')).display}})()`);assert.notEqual(bounds.display,'none');assert.ok(bounds.caption.bottom+10<=bounds.dock.top,JSON.stringify(bounds));return bounds.dock.top-bounds.caption.bottom;};
 const chooseTheme=async mode=>{if(await evaluate('document.documentElement.dataset.theme')!==mode)await click('.theme-trigger');await delay(300);};
 const chooseFloor=async id=>{await click('[aria-label="Display settings"]');await selectMenu('#scene-floor-choice',id);await press('Escape');await delay(400);};
 for(const route of ['male','female']){
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:baseUrl+'/'+route});await ready();await delay(1400);await chooseTheme('light');await screenshot(route+'-light-whole');await clearance();
  const oblique=await camera();await lock();assert.ok(delta(oblique,await camera())<.00001,'Lock retains current orientation');const locked=await camera();await drag();assert.ok(delta(locked,await camera())<.00001,'Locked left drag cannot orbit');
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:710,y:380,deltaX:0,deltaY:-120});await delay(400);const zoom=await camera();assert.ok(delta(locked,zoom)>.0001,'Zoom remains available');assert.ok(delta(locked,zoom,true)<.00001,'Zoom retains orientation');
  await drag('right');const panned=await camera();assert.ok(delta(zoom,panned)>.0001,'Right drag pan remains available');assert.ok(delta(zoom,panned,true)<.00001,'Pan retains orientation');
  const views=[];for(const [key,view] of [['f','front'],['s','side'],['b','back']]){await blur();await press(key);await delay(250);assert.equal(await evaluate(`document.querySelector('[aria-label="${view} view"]').getAttribute('aria-pressed')`),'true');assert.equal(await evaluate(`document.querySelector('.studio').dataset.viewLocked`),'true');views.push(await camera());}
  assert.ok(delta(views[0],views[1],true)>.1&&delta(views[1],views[2],true)>.1,'Preset shortcuts change rendered orientation');
  await press('r');await delay(400);assert.equal(await evaluate(`document.querySelector('[aria-label="three-quarter view"]').getAttribute('aria-pressed')`),'true');assert.equal(await evaluate(`document.querySelector('.studio').dataset.viewLocked`),'true');
  await press('i');assert.equal(await evaluate(`!!document.querySelector('.workspace-exit')`),false,'No-selection I is a no-op');
  await click('[aria-label="Unlock view"]');await click('[aria-label="Rotate body"]');await delay(500);await lock();const stopped=await camera();await delay(900);assert.ok(delta(stopped,await camera())<.00001,'Lock pauses autorotation');assert.equal(await evaluate(`document.querySelector('[aria-label="Rotate body"]').disabled`),true);await click('[aria-label="Unlock view"]');assert.equal(await evaluate(`document.querySelector('[aria-label="Rotate body"]').getAttribute('aria-pressed')`),'false','Unlock does not resume autorotation');
  await blur();await press('/');await waitFor("!!document.querySelector('.discovery-input')",'Slash opens Search');
  const beforeTyping=await camera();await send('Input.insertText',{text:'F S B R I H J'});assert.ok(delta(beforeTyping,await camera())<.00001);assert.equal(await evaluate(`document.querySelector('.discovery-input').value`),'F S B R I H J');
  for(const k of ['f','s','b','r','i','h','j'])await press(k);assert.ok(delta(beforeTyping,await camera())<.00001,'Actual Search focus guards all single keys');
  await press('Escape');await waitFor("!document.querySelector('.discovery-panel')",'Search closed');
  await blur();const beforeModified=await camera();for(const k of ['f','s','b','r','i','h','j']){await press(k,2);await press(k,4);}assert.ok(delta(beforeModified,await camera())<.00001,'Ctrl/Meta chords ignored');
  await search('heart');await lock();await blur();await press('i');await waitFor("!!document.querySelector('.detail-sheet.is-isolated')",'I enters selected Heart workspace');await delay(400);await screenshot(route+'-light-locked-isolation');const isolatedViews=[];for(const k of ['f','s','b']){await blur();await press(k);await delay(200);isolatedViews.push(await camera());assert.equal(await evaluate(`document.querySelector('.studio').dataset.viewLocked`),'true');}assert.ok(delta(isolatedViews[0],isolatedViews[1],true)>.1&&delta(isolatedViews[1],isolatedViews[2],true)>.1,'Preset directions work in a locked isolation workspace');
  await blur();await press('h');await waitFor("!document.querySelector('.detail-sheet')",'H hides selected');assert.ok(await evaluate(`Number(document.querySelector('.hidden-count').textContent)>0`));await blur();await press('j');assert.equal(await evaluate(`document.querySelector('.studio').dataset.viewLocked`),'true');
  await blur();await press('r');await delay(450);assert.equal(await evaluate(`Number(document.querySelector('.hidden-count').textContent)`),0);await click('[aria-label="Unlock view"]');
  await chooseTheme('dark');assert.equal(await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--background').trim()`),'#141414');
  for(const floor of ['classic','minimal','grid','scanner','orbital','event-horizon','void']){await chooseFloor(floor);await screenshot(route+'-dark-'+floor);await clearance();}
  await chooseFloor('classic');await search('heart');await screenshot(route+'-dark-inspector');await closeInspector();await click('[aria-label="Search anatomy"]');const selectedBefore=await evaluate(`({selection:window.__atlasTestSelection,hidden:document.querySelector('.hidden-count').textContent,isolate:!!document.querySelector('.workspace-exit')})`);for(const k of ['f','s','b','r','i','h','j'])await press(k);assert.deepEqual(await evaluate(`({selection:window.__atlasTestSelection,hidden:document.querySelector('.hidden-count').textContent,isolate:!!document.querySelector('.workspace-exit')})`),selectedBefore,'Search editing cannot hide/isolate/restore a valid selection');await screenshot(route+'-dark-search');await buttonText('Browse');await screenshot(route+'-dark-browse');assert.ok(await evaluate(`Number(document.querySelector('.discovery-list').dataset.totalEntries)>500`));await press('Escape');
  await region('cervical');await click('#area-choice');const relevance=await evaluate(`[...document.querySelectorAll('.teaching-area-menu [role=option][data-region-relevant=true]')].map(e=>({name:e.textContent.trim(),heading:e.closest('[role=group]')?.querySelector('[data-slot=select-label]')?.textContent,dot:!!e.querySelector('.area-relevance-dot'),shadow:getComputedStyle(e).boxShadow}))`);
  assert.ok(relevance.some(e=>e.name.startsWith('Brainstem'))&&relevance.some(e=>e.name.startsWith('Larynx'))&&relevance.some(e=>e.name.startsWith('Brachial plexus')));assert.ok(relevance.every(e=>e.shadow==='none'&&e.dot));assert.ok(relevance.find(e=>e.name.startsWith('Brainstem')).heading.includes('Head'));assert.ok(relevance.find(e=>e.name.startsWith('Larynx')).heading.includes('Cervical'));assert.ok(relevance.find(e=>e.name.startsWith('Brachial plexus')).heading.includes('Shoulder'));await screenshot(route+'-dark-teaching-areas');await press('Escape');await blur();await press('r');
  await click('[aria-label="About this atlas"]');assert.equal(await evaluate(`document.querySelector('.about-sheet').scrollTop`),0);const links=await evaluate(`[...document.querySelectorAll('.about-copy a')].map(a=>a.href)`);assert.ok(links.includes('https://github.com/ashemag/human-atlas')&&links.includes('https://github.com/PrejudiceNeutrino/human-atlas-enhanced'));assert.equal(await evaluate(`document.querySelectorAll('.shortcut-reference kbd').length`),8);await screenshot(route+'-dark-info');await evaluate(`document.querySelector('.about-sheet').scrollTop=900`);await press('Escape');await click('[aria-label="About this atlas"]');assert.equal(await evaluate(`document.querySelector('.about-sheet').scrollTop`),0);await press('Escape');
  const clearances=[];for(const [width,height] of [[1440,700],[1280,600],[1440,900]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(300);clearances.push({width,height,gap:await clearance()});await screenshot(route+'-dark-height-'+height);}
  await lock();await send('Page.reload');await ready();await delay(1100);assert.equal(await evaluate(`document.querySelector('.studio').dataset.viewLocked`),'false','Reload begins unlocked');assert.equal(await evaluate('document.documentElement.dataset.theme'),'dark');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await lock();await blur();await press('s');assert.equal(await evaluate(`document.querySelector('[aria-label="side view"]').getAttribute('aria-pressed')`),'true');await screenshot(route+'-dark-reduced-motion');await send('Emulation.setEmulatedMedia',{features:[]});
  report.push({route,lock:true,zoom:true,pan:true,autorotation:true,presetShortcuts:true,resetLocked:true,invalidIsolation:true,isolationShortcut:true,hideRestoreShortcuts:true,inputGuard:true,modifierGuard:true,reloadUnlocked:true,info:true,relevance,clearances,reducedMotion:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:true,report,errors},null,2));console.log('PASS Phase 5.5 keyboard, lock, help, palettes, floors and caption clearance on both models');
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
