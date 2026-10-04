/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import * as T from 'three';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3039';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.2/browser');fs.mkdirSync(output,{recursive:true});
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
 const press=async key=>{const codes={Escape:27,Enter:13,Home:36,End:35,ArrowDown:40,ArrowRight:39,h:72,j:74};await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key.length===1?'Key'+key.toUpperCase():key,windowsVirtualKeyCode:codes[key]});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key.length===1?'Key'+key.toUpperCase():key,windowsVirtualKeyCode:codes[key]});await delay(150);};
 const gpu=()=>evaluate('window.__atlasTestRender.pixels');
 const camera=()=>evaluate('window.__atlasTestCamera');
 const hiddenCount=()=>evaluate("Number(document.querySelector('.hidden-count').textContent)");
 const checkCount=async n=>{assert.equal(await count(),n);await waitFor(`window.__atlasTestRender.displayed===${n}`,'GPU visible count');};
 const closeInspector=async()=>{if(await evaluate("!!document.querySelector('.detail-sheet')")){await evaluate("document.querySelector('.detail-sheet [data-slot=sheet-close]').click()");await waitFor("!document.querySelector('.detail-sheet')",'inspector closed');}};
 const reset=async()=>{await closeInspector();await click('[aria-label="Assemble and reset"]');await assembled();await delay(400);};
 const compareCamera=async before=>{const after=await camera();for(const name of ['viewMatrix','projectionMatrix'])before[name].forEach((value,i)=>assert.ok(Math.abs(value-after[name][i])<.00001,'No camera refit on dissection'));};
 const assertFooter=async()=>assert.equal(await evaluate("(()=>{const f=document.querySelector('.panel-foot'),b=f.querySelector('.restore-hidden'),r=f.getBoundingClientRect(),q=b.getBoundingClientRect();return q.top>=r.top&&q.bottom<=r.bottom&&b.textContent==='Restore all hidden'&&!document.querySelector('.visibility-content .restore-hidden')})()"),true);
 for(const route of ['male','female']){
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:baseUrl+'/'+route});await ready();await delay(500);
  const whole=route==='male'?2217:2239;
  await checkCount(whole);await assertFooter();
  assert.equal(await evaluate("document.querySelector('.restore-hidden').disabled"),true);
  assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Reset view and layers\"]')"),false);
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.top-actions>button,.top-actions>[data-slot=popover-trigger]')].map(e=>Math.round(e.getBoundingClientRect().height))"),[44,44,44,44,44]);
  await screenshot(route+'-light-whole');
  // A real stage point away from anatomy behaves like background.
  const matrices=await camera(),point=new T.Vector3(.38,-.005,0).applyMatrix4(new T.Matrix4().fromArray(matrices.viewMatrix)).applyMatrix4(new T.Matrix4().fromArray(matrices.projectionMatrix));
  const stageX=(point.x+1)*720,stageY=(1-point.y)*450;
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:stageX,y:stageY});await delay(200);assert.equal(await evaluate("document.querySelector('.part-hover').hidden"),true);
  await mouse(stageX,stageY);await delay(200);assert.equal(await evaluate("!!document.querySelector('.detail-sheet')"),false);await checkCount(whole);
  // Compact Reset hover/focus and keyboard reset.
  const rect=await evaluate("document.querySelector('.dock-reset').getBoundingClientRect().toJSON()");assert.ok(rect.height<=60&&rect.height>=44&&rect.width>=44);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x+rect.width/2,y:rect.y+rect.height/2});await screenshot(route+'-reset-hover');
  await evaluate("document.querySelector('.dock-reset').focus()");await screenshot(route+'-reset-focus');await press('Enter');await checkCount(whole);
  // Scroll is reset only on a new info opening, with focus at the title.
  await click('[aria-label="About this atlas"]');await waitFor("!!document.querySelector('.about-sheet')",'info open');
  assert.equal(await evaluate("document.querySelector('.about-sheet').scrollTop"),0);assert.equal(await evaluate("document.activeElement?.textContent"),'A body, revealed.');
  await evaluate("document.querySelector('.about-sheet').scrollTop=350");const infoTop=await evaluate("document.querySelector('.about-sheet').scrollTop");assert.ok(infoTop>100);
  await evaluate("document.querySelector('.theme-trigger').click()");await delay(200);assert.equal(await evaluate("document.querySelector('.about-sheet').scrollTop"),infoTop);
  await press('Escape');await waitFor("!document.querySelector('.about-sheet')",'info closed');await click('[aria-label="About this atlas"]');await waitFor("!!document.querySelector('.about-sheet')",'info reopen');assert.equal(await evaluate("document.querySelector('.about-sheet').scrollTop"),0);await press('Escape');
  if(await evaluate('document.documentElement.dataset.theme')==='dark')await click('.theme-trigger');
  // Live auto rotation, slider, persistence, and an increased actual angular rate.
  await click('[aria-label="Rotate body"]');await delay(250);const defaultStart=await camera();await delay(900);const defaultEnd=await camera();assert.notDeepEqual(defaultEnd.viewMatrix,defaultStart.viewMatrix);
  await click('[aria-label="Rotation speed"]');await evaluate("document.querySelector('.rotation-popover input[type=range]').focus()");await press('End');
  assert.equal(await evaluate("localStorage.getItem('human-atlas-rotation-speed')"),'3');await press('Escape');
  const fastStart=await camera();await delay(900);const fastEnd=await camera();
  const angle=c=>Math.atan2(c.viewMatrix[2],c.viewMatrix[10]);const angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(angle(b)-angle(a)),Math.cos(angle(b)-angle(a))));
  const normalDelta=angularDistance(defaultStart,defaultEnd),fastDelta=angularDistance(fastStart,fastEnd);assert.ok(fastDelta>normalDelta*1.8,'Live speed changes actual rotation');
  await click('[aria-label="Pause rotation"]');await delay(800);await send('Page.reload');await ready();await click('[aria-label="Rotation speed"]');assert.equal(await evaluate("document.querySelector('.rotation-popover input[type=range]').value"),'3');await evaluate("document.querySelector('.rotation-popover input[type=range]').focus()");await press('Home');assert.equal(await evaluate("localStorage.getItem('human-atlas-rotation-speed')"),'0.25');await press('Escape');
  await evaluate("localStorage.setItem('human-atlas-rotation-speed','bad JSON')");await send('Page.reload');await ready();await click('[aria-label="Rotation speed"]');assert.equal(await evaluate("document.querySelector('.rotation-popover input[type=range]').value"),'1');await screenshot(route+'-rotation-speed');await press('Escape');
  // H A/B/C, then actual J restores C/B/A in ordinary context.
  const names=['right clavicle','left clavicle','sternum'];
  for(const name of names){await search(name);await press('h');await waitFor("!document.querySelector('.detail-sheet')",'H closed inspector');}
  const history=await hiddenCount();assert.ok(history>=3);await tab('Hidden');const initialOrder=await evaluate("[...document.querySelectorAll('.hidden-list li')].map(e=>e.dataset.representationId)");
  for(let i=0;i<3;i++){await evaluate("document.querySelector('.restore-hidden').focus()");await press('j');assert.equal(await hiddenCount(),history-i-1);assert.deepEqual(await evaluate("[...document.querySelectorAll('.hidden-list li')].map(e=>e.dataset.representationId)"),initialOrder.slice(i+1));}
  await click('.restore-hidden');assert.equal(await hiddenCount(),0);await press('j');await checkCount(whole);
  // Many hidden rows: global action remains outside the scrolling content.
  await tab('Systems');await search('brain');await press('h');await waitFor("!document.querySelector('.detail-sheet')",'group hidden');await tab('Hidden');assert.ok(await hiddenCount()>30);
  for(const fraction of [0,.5,1]){await evaluate(`(()=>{const e=document.querySelector('.visibility-content:not([hidden])');e.scrollTop=(e.scrollHeight-e.clientHeight)*${fraction}})()`);await assertFooter();await screenshot(route+'-hidden-'+fraction);}
  // J ignored in the real Search input and contenteditable ancestor.
  const guarded=await hiddenCount();await click('[aria-label="Search anatomy"]');await evaluate("document.querySelector('#anatomy-query').focus()");await press('j');assert.equal(await hiddenCount(),guarded);await screenshot(route+'-search-focused');await press('Escape');
  await evaluate("(()=>{const e=document.createElement('div');e.id='editable-guard';e.contentEditable='true';e.tabIndex=0;document.body.append(e);e.focus()})()");await press('j');assert.equal(await hiddenCount(),guarded);await evaluate("document.querySelector('#editable-guard').remove()");
  await tab('Systems');await assertFooter();await click('.restore-hidden');await checkCount(whole);await reset();
  // Deterministic exploration uses an ordinary explicit isolation workspace.
  await evaluate('Math.random=()=>0');await click('[aria-label="Random anatomy"]');await waitFor("!!document.querySelector('.detail-sheet.is-isolated')",'random isolated');await delay(400);
  const randomName=await evaluate("document.querySelector('.structure-title').textContent"),n=Number(await evaluate("document.querySelector('.structure-meta span:last-child strong').textContent"));assert.ok(n>=5&&n<=200);await checkCount(n);
  const isolatedGPU=await gpu(),isolatedCamera=await camera();await screenshot(route+'-random-isolation');
  await press('h');await waitFor("!document.querySelector('.detail-sheet')",'empty isolation');await checkCount(0);
  for(let i=0;i<3;i++){await evaluate("document.querySelector('.restore-hidden').focus()");await press('j');await checkCount(i+1);await compareCamera(isolatedCamera);}
  await click('.restore-hidden');await checkCount(n);await compareCamera(isolatedCamera);assert.deepEqual(await gpu(),isolatedGPU);
  await click('[aria-label="Random anatomy"]');await waitFor("!!document.querySelector('.detail-sheet.is-isolated')",'second random');assert.notEqual(await evaluate("document.querySelector('.structure-title').textContent"),randomName);await reset();
  // Light/Dark, oblique, Region, Area, small/large isolation and explode composition.
  for(const theme of ['light','dark']){
   if(await evaluate('document.documentElement.dataset.theme')!==theme)await click('.theme-trigger');
   await screenshot(route+'-'+theme+'-whole');
   await click('[aria-label="front view"]');await screenshot(route+'-'+theme+'-front');
   await send('Input.dispatchMouseEvent',{type:'mousePressed',x:900,y:430,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1020,y:450,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:1020,y:450,button:'left',clickCount:1});await delay(600);await screenshot(route+'-'+theme+'-oblique');
   await region('shoulder');await screenshot(route+'-'+theme+'-region');await area('heart');await screenshot(route+'-'+theme+'-area');await reset();
   await search('muscle of pectoral girdle');await buttonText('Isolate structure');await screenshot(route+'-'+theme+'-large-isolation');await closeInspector();await reset();
   await search('right clavicle');await buttonText('Isolate structure');await screenshot(route+'-'+theme+'-small-isolation');await closeInspector();await reset();
   await explode();await screenshot(route+'-'+theme+'-exploded');await reset();
  }
  // Basic native search keyboard flow; retained discovery suite covers all sort/filter cases.
  await click('[aria-label="Search anatomy"]');await press('ArrowDown');await press('Enter');await waitFor("!!document.querySelector('.detail-sheet')",'keyboard selects discovery result');await reset();
  report.push({route,passed:true,whole,randomName,randomPieces:n,normalAngularDelta:normalDelta,fastAngularDelta:fastDelta,infoScroll:true,J:true,footer:true,floorBackground:true,reset:true,rotationPersistence:true});console.log('PASS',route);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,report,errors},null,2));
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
