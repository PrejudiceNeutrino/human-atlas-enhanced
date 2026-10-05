/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3076';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.6.3/browser');fs.mkdirSync(output,{recursive:true});
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
 const screenshot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',...(name.includes('badge')?{clip:{x:15,y:25,width:295,height:115,scale:2}}:{})});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64'));};
 failureCapture=async()=>{await screenshot('failure');fs.writeFileSync(path.join(output,'failure-state.json'),JSON.stringify(await sample(),null,2));};
 const pulse=()=>evaluate("document.querySelector('.explode-slider').dataset.idlePulse==='true'");
 const value=()=>evaluate("document.querySelector('.explode-control input').value");

 const {select}=selectBrowserHelpers({evaluate,click,waitFor,delay});
 const buttonText=async(text,scope='.layers-panel')=>{await evaluate(`(()=>{const b=[...document.querySelector(${JSON.stringify(scope)}).querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing '+${JSON.stringify(text)});b.click()})()`);await delay(200);};
 const key=async(key,code=key,virtual=key==='Tab'?9:key==='Enter'?13:key==='End'?35:key==='Home'?36:key.toUpperCase().charCodeAt(0))=>{for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key,code,windowsVirtualKeyCode:virtual});await delay(200);};
 const ready=()=>waitFor("document.querySelector('.studio')?.dataset.entrance==='settled'&&!document.querySelector('.loading')",'settled anatomy');
 const title=async()=>assert.equal(await evaluate('document.title'),'Human Atlas');
 const sample=()=>evaluate(`(()=>{
  const rect=s=>document.querySelector(s)?.getBoundingClientRect().toJSON();const eye=document.querySelector('.system-visibility-toggle');
  return {title:document.title,eyebrow:rect('.identity>.eyebrow'),label:rect('.eyebrow-label'),dot:rect('.identity .status-dot'),titleRect:rect('.identity h1'),navigation:rect('.anatomy-choice'),visibility:rect('.layers-panel'),helper:document.querySelector('.studio-footer>span').textContent,helperRect:rect('.studio-footer>span'),helperLineHeight:getComputedStyle(document.querySelector('.studio-footer>span')).lineHeight,theme:document.documentElement.dataset.theme,systems:[...document.querySelectorAll('.system-list [role=switch]')].map(e=>({name:e.getAttribute('aria-label'),checked:e.getAttribute('aria-checked'),disabled:e.hasAttribute('disabled')})),eyeLabel:eye?.getAttribute('aria-label'),icon:eye?.querySelector('svg')?.getAttribute('class'),cursor:eye&&getComputedStyle(eye).cursor,hidden:document.querySelector('.hidden-count').textContent,count:document.querySelector('.panel-foot>span').textContent,region:document.querySelector('#region-choice').value,area:document.querySelector('#area-choice').value,caption:document.querySelector('.scene-caption>span:not(.caption-line)').textContent,inspector:document.querySelector('.detail-header .structure-title')?.textContent,inspectorTransform:document.querySelector('.detail-header .structure-title')&&getComputedStyle(document.querySelector('.detail-header .structure-title')).textTransform,explode:document.querySelector('.explode-control input').value,camera:window.__atlasTestCamera,pixels:window.__atlasTestPixels};
 })()`);
 const eyeCycle=async()=>{
  const before=await sample();await click('.system-visibility-toggle');const off=await sample();
  assert.equal(off.eyeLabel,'Show all systems');assert.match(off.icon,/eye-off/);assert.ok(off.systems.every(s=>s.checked==='false'));
  await click('.system-visibility-toggle');const on=await sample();assert.equal(on.eyeLabel,'Hide all systems');assert.match(on.icon,/lucide-eye(?:\s|$)/);
  for(const field of ['hidden','region','area',...(before.explode==='0'?['caption']:[]),'inspector','explode','camera']){assert.deepEqual(off[field],before[field],'Eye off preserves '+field);assert.deepEqual(on[field],before[field],'Eye on preserves '+field);}
  assert.ok(on.systems.every(s=>s.checked==='true'),'all model-available switches on');await title();return {before,off,on};
 };
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 // Observe actual shader matrices and GPU layer/selection textures in the test browser only.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
  document.modelContext={registerTool:tool=>{window.__atlasTools??={};window.__atlasTools[tool.name]=tool;}};
  const names=new WeakMap();window.__atlasTestCamera={};
  for(const type of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(type){
   const locate=type.prototype.getUniformLocation;type.prototype.getUniformLocation=function(program,name){const loc=locate.call(this,program,name);if(loc)names.set(loc,name);return loc;};
   const matrix=type.prototype.uniformMatrix4fv;type.prototype.uniformMatrix4fv=function(loc,transpose,value,...rest){const name=names.get(loc);if(name==='viewMatrix'||name==='projectionMatrix')window.__atlasTestCamera[name]=Array.from(value);return matrix.call(this,loc,transpose,value,...rest);};
   for(const method of ['texImage2D','texSubImage2D']){const original=type.prototype[method];type.prototype[method]=function(...args){const p=args.at(-1);if(p instanceof Float32Array&&p.length===16384&&(method==='texImage2D'?args[4]:args[5])===1)window.__atlasTestPixels=Array.from(p);return original.apply(this,args);};}
  }
 })()`});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:baseUrl+'/male'});await ready();await title();
 const baseline=JSON.parse(fs.readFileSync('work/phase-5.6.3/baseline/report.json','utf8'));
 const records=[];
 for(const theme of ['light','dark'])for(const route of ['male','female']){
  await evaluate(`localStorage.setItem('human-atlas-theme',${JSON.stringify(theme)})`);
  await send('Page.navigate',{url:baseUrl+'/'+route});await ready();await title();
  const initial=await sample();assert.equal(initial.helper,'LMB orbit \u00b7 RMB pan \u00b7 Click inspect');assert.equal(initial.cursor,'pointer');assert.ok(initial.helperRect.height<2*parseFloat(initial.helperLineHeight),'helper stays on one line');
  assert.equal(initial.label.y-baseline.report[0].label.y,8);assert.equal(initial.dot.y-baseline.report[0].dot.y,8);assert.equal(initial.titleRect.y,baseline.report[0].titleRect.y);assert.equal(initial.navigation.y,baseline.report[0].navigation.y);assert.equal(initial.visibility.y,baseline.report[0].visibility.y);
  await screenshot(route+'-'+theme+'-whole');
  await click('.system-visibility-toggle');assert.equal((await sample()).eyeLabel,'Show all systems');await screenshot(route+'-'+theme+'-off');
  await click('[aria-label="Show skeleton"]');await click('[aria-label="Show arteries"]');
  const partial=await sample();assert.deepEqual(partial.systems.filter(s=>s.checked==='true').map(s=>s.name).sort(),['Show arteries','Show skeleton']);assert.equal(partial.eyeLabel,'Hide all systems');await screenshot(route+'-'+theme+'-custom');
  const customCycle=await eyeCycle();assert.equal(customCycle.off.count,'0 pieces visible');
  assert.ok(customCycle.off.pixels.every((n,i)=>i%4!==3||n===0),'underlying GPU layers off');
  // Keyboard tab reaches the native button; Space toggles and shows a visible ring.
  await evaluate("document.querySelector('.panel-heading>span').tabIndex=0;document.querySelector('.panel-heading>span').focus()");await key('Tab');
  assert.equal(await evaluate("document.activeElement.classList.contains('system-visibility-toggle')&&document.activeElement.matches(':focus-visible')"),true);
  const focusStyle=await evaluate("getComputedStyle(document.activeElement).boxShadow");assert.notEqual(focusStyle,'none');await key(' ','Space',32);assert.equal((await sample()).eyeLabel,'Show all systems');await key(' ','Space',32);
  await buttonText('Organs');await delay(500);const organsCycle=await eyeCycle();
  await click('.dock-reset');await select('#region-choice','atlas:region:head-jaw');await title();const regionCycle=await eyeCycle();
  await select('#area-choice','atlas:area:brainstem');await title();const areaCycle=await eyeCycle();assert.equal(areaCycle.on.caption,'BRAINSTEM');
  await click('.dock-reset');
  const inventory=JSON.parse(fs.readFileSync(route==='male'?'public/models/atlas.json':'public/models/atlas-female-reconstructed.json','utf8'));
  const inspect=async id=>{await evaluate(`window.__atlasTools.inspect_anatomical_structure.execute({id:${JSON.stringify(id)}})`);await waitFor("!!document.querySelector('.detail-header .structure-title')",'inspector');await delay(400);await title();};
  const concept=inventory.concepts.find(c=>c.id==='FMA22842');await inspect(concept.id);await buttonText('Isolate structure','.detail-sheet');await delay(400);
  const caption=await sample();assert.equal(caption.caption,concept.name);assert.equal(caption.inspector,concept.name);assert.equal(caption.inspectorTransform,'none');await screenshot(route+'-'+theme+'-caption');const isolationCycle=await eyeCycle();
  await click('.dock-reset');
  const clavicle=inventory.concepts.find(c=>c.name.toLowerCase()==='right clavicle');await inspect(clavicle.id);await evaluate('document.activeElement?.blur()');await key('h','KeyH',72);
  const hidden=await sample();assert.equal(hidden.hidden,'1');const hiddenCycle=await eyeCycle();assert.equal(hiddenCycle.on.hidden,'1');await screenshot(route+'-'+theme+'-hidden');await evaluate('document.activeElement?.blur()');await key('j','KeyJ',74);assert.equal((await sample()).hidden,'0');
  await click('.dock-reset');const randoms=[];
  for(let i=0;i<3;i++){
   await click('[aria-label="Random anatomy"]');await delay(600);const random=await sample();assert.ok(random.inspector);assert.equal(random.caption,random.inspector);assert.equal(random.inspectorTransform,'none');await title();const randomCycle=await eyeCycle();randoms.push({caption:random.caption,cyclePreserved:true});
  }
  await screenshot(route+'-'+theme+'-random');
  await click('.dock-reset');
  const long=inventory.concepts.filter(c=>c.elements.length>0).sort((a,b)=>b.name.length-a.name.length)[0];await inspect(long.id);await buttonText('Isolate structure','.detail-sheet');await delay(600);
  assert.equal((await sample()).caption,long.name);assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.scene-caption').scrollWidth<=document.querySelector('.scene-caption').clientWidth+1"),true,'long source label fits');await screenshot(route+'-'+theme+'-long-caption');
  await click('.dock-reset');await evaluate("document.querySelector('.explode-control input').focus()");await key('ArrowRight','ArrowRight',39);await delay(600);const explodedCycle=await eyeCycle();assert.equal(explodedCycle.on.explode,'1');await click('.dock-reset');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:600,deviceScaleFactor:1,mobile:false});await delay(400);const short=await sample();assert.ok(short.helperRect.height<2*parseFloat(short.helperLineHeight),'short helper stays on one line');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await screenshot(route+'-'+theme+'-short');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  records.push({route,theme,initial,customCycle,organsCameraPreserved:true,regionPreserved:true,areaPreserved:true,caption:concept.name,isolationPreserved:true,hiddenPreserved:true,randoms,longCaption:long.name,explodeCameraPreserved:true,shortHelper:short.helper,keyboardFocus:true,focusStyle});console.log('PASS '+route+' '+theme);
 }
 // Actual model selection does not replace the product title.
 await select('#model-choice','male');await ready();await title();await select('#model-choice','female');await ready();await title();
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.reload');await ready();
 const reduced=await sample();assert.equal(reduced.label.y,45);assert.equal(await evaluate("document.querySelector('.identity>.eyebrow').getAnimations().length"),0);await screenshot('reduced-motion');
 assert.deepEqual(errors,[],'no application JS exceptions');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:true,records,reducedMotion:true,modelSwitchTitle:true,errors},null,2));
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
