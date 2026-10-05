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

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3057';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.3/browser');fs.mkdirSync(output,{recursive:true});
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



 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  window.__presentation={uniforms:{},shaderCompiles:0,framebuffers:0,entrances:[],canvasStates:[]};
  document.addEventListener('animationstart',e=>{if(e.animationName.startsWith('atlas-enter'))window.__presentation.entrances.push({name:e.animationName,time:performance.now()});});
  const names=new WeakMap();
  for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type){
   const locate=type.prototype.getUniformLocation;type.prototype.getUniformLocation=function(program,name){const loc=locate.call(this,program,name);if(loc)names.set(loc,name);return loc;};
   const uniform=type.prototype.uniform1f;type.prototype.uniform1f=function(loc,value){const name=names.get(loc);if(name==='displayContrast'||name==='toneMappingExposure')window.__presentation.uniforms[name]=value;return uniform.call(this,loc,value);};
   const compile=type.prototype.compileShader;type.prototype.compileShader=function(...args){window.__presentation.shaderCompiles++;return compile.apply(this,args);};
   const framebuffer=type.prototype.createFramebuffer;type.prototype.createFramebuffer=function(...args){window.__presentation.framebuffers++;return framebuffer.apply(this,args);};
  }
 })()`});

 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  window.__motion={events:[],frames:[],sceneFrames:[],caretFrames:[],themes:[]};
  document.addEventListener('animationstart',e=>window.__motion.events.push({name:e.animationName,element:e.target.className,time:performance.now()}));
  let previous,count=0,scenePrevious;
  function sample(now){const studio=document.querySelector('.studio');if(studio){const letter=document.querySelector('.eyebrow-letter:last-child');if(letter&&getComputedStyle(letter).opacity==='1')window.__motion.caretFrames.push(Number(getComputedStyle(letter,'::after').opacity));window.__motion.themes.push(document.documentElement.dataset.theme);if(previous)window.__motion.frames.push(now-previous);previous=now;if(studio.dataset.sceneReady==='true'){if(scenePrevious)window.__motion.sceneFrames.push(now-scenePrevious);scenePrevious=now;}if(++count>=100&&window.__motion.sceneFrames.length>=40)return;}requestAnimationFrame(sample);}
  requestAnimationFrame(sample);
 })()`});
 const finish=()=>waitFor("document.querySelector('.studio')?.dataset.entrance==='settled'",'finite entrance settled');
 const key=async name=>{const codes={Home:36,End:35,Escape:27,Enter:13,ArrowRight:39};await send('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,windowsVirtualKeyCode:codes[name]});await send('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name,windowsVirtualKeyCode:codes[name]});};
 const brandEvents=()=>evaluate("window.__motion.events.filter(e=>e.name.startsWith('atlas-enter')||e.name.startsWith('atlas-wordmark')||e.name.startsWith('atlas-type')||e.name==='atlas-caret-blink').length");
 let frameNumber=0,recording='';
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Page.screencastFrame'){if(recording&&frameNumber<40)fs.writeFileSync(path.join(output,recording+'-frame-'+String(frameNumber++).padStart(2,'0')+'.png'),Buffer.from(m.params.data,'base64'));send('Page.screencastFrameAck',{sessionId:m.params.sessionId});}});
 for(const theme of ['light','dark']){
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:baseUrl+'/male'});await ready();
  await evaluate(`localStorage.setItem('human-atlas-theme',${JSON.stringify(theme)})`);
  holdGeometry=true;held=[];await send('Fetch.enable',{patterns:[{urlPattern:'*models/*.bin*'}]});
  recording=theme;frameNumber=0;await send('Page.startScreencast',{format:'png',maxWidth:1440,maxHeight:900,everyNthFrame:1});
  await send('Page.reload');
  await waitFor("!!document.querySelector('.wordmark-ghost')",'signature brand');
  await screenshot(theme+'-brand');
  await waitFor("!!document.querySelector('.scene canvas')&&document.querySelector('.studio').dataset.sceneReady==='false'",'real loading shell');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.scene canvas')).opacity"),'0');
  assert.equal(await evaluate("document.querySelector('.wordmark-ghost').getAttribute('aria-hidden')"),'true');
  await waitFor("document.querySelector('.studio').dataset.shellSettled==='true'",'shell choreography complete');await screenshot(theme+'-navigation');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.wordmark-solid')).opacity"),'1');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.wordmark-ghost')).opacity"),'0');
  assert.equal(await evaluate("document.querySelector('.atlas-home-link .wordmark-solid').textContent"),'Human Atlas');
  assert.equal(await evaluate("document.querySelector('.eyebrow-label .sr-only').textContent"),'INTERACTIVE ANATOMY');
  assert.equal(await evaluate("document.querySelector('.eyebrow-label [aria-hidden]').textContent"),'INTERACTIVE ANATOMY');
  assert.equal(await evaluate("[...document.querySelectorAll('.eyebrow-letter')].every(e=>getComputedStyle(e).opacity==='1')"),true);
  assert.equal(await evaluate("[...document.querySelectorAll('.eyebrow-letter')].every(e=>getComputedStyle(e,'::after').opacity==='0')"),true,'typing caret ends cleanly');
  const caret=await evaluate("window.__motion.caretFrames.filter((value,index,all)=>index===0||value!==all[index-1])");assert.deepEqual(caret,[1,0,1,0],'cursor blinks twice after the final letter');
  assert.ok(held.length);
  holdGeometry=false;for(const requestId of held)await send('Fetch.continueRequest',{requestId});await send('Fetch.disable');
  await waitFor("document.querySelector('.scene').dataset.revealed==='true'",'ready immediately starts reveal');
  const loadingCamera=await camera();await screenshot(theme+'-anatomy');await delay(280);await screenshot(theme+'-floor');await finish();await screenshot(theme+'-settled');
  await send('Page.stopScreencast');recording='';
  await assertCamera(loadingCamera);
  const animationCount=await brandEvents();
  await region('shoulder');await area('heart');await area(null);await reset();
  assert.equal(await brandEvents(),animationCount);
  await search('heart');await delay(220);await evaluate("void(window.__inspector=document.querySelector('.detail-sheet'))");
  const resources=await evaluate('({compile:window.__presentation.shaderCompiles,fb:window.__presentation.framebuffers})');
  await search('right clavicle');await delay(220);
  assert.equal(await evaluate("window.__inspector===document.querySelector('.detail-sheet')"),true,'inspector container stays mounted');
  assert.equal(await evaluate("document.querySelector('.detail-sheet').getAnimations().filter(a=>a.playState==='running').length"),0,'member change does not move inspector');
  await screenshot(theme+'-inspector');await buttonText('Isolate structure');await closeInspector();await delay(200);
  assert.deepEqual(await evaluate('({compile:window.__presentation.shaderCompiles,fb:window.__presentation.framebuffers})'),resources,'selection does not recompile or allocate render targets');
  await reset();await click('[aria-label="Search anatomy"]');await delay(220);
  assert.match(await evaluate("getComputedStyle(document.querySelector('.discovery-panel')).transitionProperty"),/opacity/);
  await screenshot(theme+'-discovery');await click('[aria-label="Close search"]');await waitFor("!document.querySelector('.discovery-panel')",'discovery completes exit');
  await click('[aria-label="About this atlas"]');await delay(220);await evaluate("document.querySelector('.about-sheet').scrollTop=400");await click('.about-sheet [data-slot="sheet-close"]');await waitFor("!document.querySelector('.about-sheet')",'info completes exit');
  await click('[aria-label="About this atlas"]');assert.equal(await evaluate("document.querySelector('.about-sheet').scrollTop"),0);await key('Escape');await waitFor("!document.querySelector('.about-sheet')",'info closed');
  await click('[aria-label="Random anatomy"]');await delay(500);assert.equal(await evaluate("!!document.querySelector('.detail-sheet')"),false);assert.ok(await count()>=5);await closeInspector();
  await reset();await explode();await reset();assert.equal(await brandEvents(),animationCount);
  await switchModel('female');await finish();assert.equal(await brandEvents(),animationCount);await screenshot(theme+'-female');
  await switchModel('male');await finish();assert.equal(await brandEvents(),animationCount);
  const frames=await evaluate('window.__motion.frames'),themes=await evaluate('window.__motion.themes');
  assert.ok(themes.every(value=>value===theme),'stored theme applies before the first viewer frame');
  const sorted=[...frames].sort((a,b)=>a-b);
  report.push({theme,passed:true,readinessGate:true,settled:true,stableCamera:true,noReplay:true,inspectorStable:true,themeFlash:false,frames:{count:frames.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:Math.max(...frames)},sceneFrames:await evaluate('window.__motion.sceneFrames'),events:await evaluate('window.__motion.events')});
  console.log('PASS motion '+theme);
 }
 // Representative responsive surfaces, including closing behavior and overflow.
 for(const [width,height] of (process.env.SMOKE_DESKTOP?[]:[[390,844],[740,420]])){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:baseUrl+'/male'});await ready();await finish();await noOverlap();
  await click('[aria-label="Search anatomy"]');await delay(220);await screenshot('responsive-'+width+'-search');await click('[aria-label="Close search"]');await waitFor("!document.querySelector('.discovery-panel')",'responsive close');
  await search('heart');await delay(220);await screenshot('responsive-'+width+'-inspector');await closeInspector();
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.navigate',{url:baseUrl+'/male'});await ready();await finish();
 assert.equal(await brandEvents(),0);
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.wordmark-ghost')).display"),'none');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.scene canvas')).transitionDuration"),'0s');
 await search('heart');await delay(200);await buttonText('Isolate structure');await closeInspector();await explode();await reset();await screenshot('reduced-motion');
 for(const pattern of ['*models/atlas.json','*models/*.bin*']){failManifest=true;await send('Fetch.enable',{patterns:[{urlPattern:pattern}]});const previousOrigin=await evaluate('performance.timeOrigin');await send('Page.reload');await waitFor(`performance.timeOrigin!==${previousOrigin}`,'failure document');await waitFor("document.querySelector('.studio')?.dataset.entrance==='error'",'error overrides entrance');assert.equal(await evaluate("!!document.querySelector('.loading[role=status]')"),false);assert.equal(await evaluate("getComputedStyle(document.querySelector('.error')).opacity"),'1');await screenshot(pattern.includes('bin')?'chunk-error':'catalogue-error');await send('Fetch.disable');failManifest=false;}
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:!!process.env.SMOKE_DESKTOP,report,responsive:!process.env.SMOKE_DESKTOP,reducedMotion:true,errorsVisible:true,exceptions:errors},null,2));
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
