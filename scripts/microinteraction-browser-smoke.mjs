/** Dependency-free Chrome DevTools smoke. Run against npm run dev or a preview server. */
import fs from 'node:fs';
import {selectBrowserHelpers} from './select-browser-helpers.mjs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const baseUrl=process.env.ATLAS_URL??'http://127.0.0.1:3075';
const chrome=process.env.CHROME_PATH??['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
if(!chrome)throw new Error('Set CHROME_PATH to an installed Chromium executable.');
const output=path.resolve(process.env.SMOKE_OUTPUT??'work/phase-5.6.2/browser');fs.mkdirSync(output,{recursive:true});
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
 const key=async(key,code=key,virtual=key==='Home'?36:key==='End'?35:39)=>{
  await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:virtual});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:virtual});
 };
 const pulse=()=>evaluate("document.querySelector('.explode-slider').dataset.idlePulse==='true'");
 const value=()=>evaluate("document.querySelector('.explode-control input').value");
 const sample=()=>evaluate(`(()=>{
  const thumb=document.querySelector('.explode-control [data-slot=slider-thumb]'),trace=document.querySelector('.edition-trace'),badge=document.querySelector('.edition');
  return {primary:getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),switch:getComputedStyle(document.querySelector('.system-row [data-slot=switch]')).backgroundColor,rail:getComputedStyle(document.querySelector('.view-controls .active')).backgroundColor,thumb:getComputedStyle(thumb).backgroundColor,halo:getComputedStyle(thumb,'::before').animationName,thumbTransform:getComputedStyle(thumb).transform,thumbRect:thumb.getBoundingClientRect().toJSON(),traceOpacity:getComputedStyle(trace).opacity,glow:getComputedStyle(badge,'::before').opacity,reset:document.querySelector('.dock-reset svg').getAnimations().map(a=>({name:a.animationName,playState:a.playState})),animations:window.__microEvents};})()`);
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__microEvents=[];document.addEventListener('animationstart',e=>{window.__microEvents.push({name:e.animationName,time:performance.now()});});`});
 await send('Page.navigate',{url:baseUrl+'/male'});await waitFor("!!document.querySelector('.theme-trigger')",'theme controller');
 const report=[];
 for(const theme of ['light','dark']){
  await evaluate(`localStorage.setItem('human-atlas-theme',${JSON.stringify(theme)})`);
  holdGeometry=true;held=[];await send('Fetch.enable',{patterns:[{urlPattern:'*models/*.bin*'}]});
  const previousOrigin=await evaluate('performance.timeOrigin');await send('Page.navigate',{url:baseUrl+'/male?microinteraction='+theme});
  await waitFor(`performance.timeOrigin!==${previousOrigin}`,'fresh entrance document');
  await waitFor("!!document.querySelector('.edition-trace rect')",'badge');
  await waitFor("(()=>{const r=document.querySelector('.edition-trace rect');const v=parseFloat(getComputedStyle(r).strokeDashoffset);return v>5&&v<95})()",'live perimeter trace');
  assert.equal(await evaluate(`(()=>{const b=document.querySelector('.edition').getBoundingClientRect(),s=document.querySelector('.edition-trace svg').getBoundingClientRect();return Math.abs(s.width-b.width)<.1&&Math.abs(s.height-b.height)<.1})()`),true,'trace covers the full badge perimeter, not the generic icon size');
  assert.equal(await pulse(),false,'idle cue waits for primary entrance');await screenshot(theme+'-badge-trace');
  await waitFor("parseFloat(getComputedStyle(document.querySelector('.edition'),'::before').opacity)>.1",'one terminal glow');await screenshot(theme+'-badge-glow');
  holdGeometry=false;for(const request of held.splice(0))await send('Fetch.continueRequest',{requestId:request});await send('Fetch.disable');
  await waitFor("document.querySelector('.studio').dataset.entrance==='settled'",'anatomy and shell settle');
  await waitFor("document.querySelector('.explode-slider').dataset.idlePulse==='true'",'delayed pulse');
  const before=await sample();assert.equal(before.halo,'atlas-explode-idle');
  await delay(450);const after=await sample();assert.deepEqual(after.thumbRect,before.thumbRect,'actual thumb stays stationary');assert.equal(after.thumbTransform,before.thumbTransform);
  await waitFor("parseFloat(getComputedStyle(document.querySelector('.explode-control [data-slot=slider-thumb]'),'::before').opacity)>.1",'subtle halo peak');await screenshot(theme+'-idle');
  if(theme==='dark'){assert.equal(before.primary,'#70cbd5');assert.equal(before.rail,before.switch);assert.equal(before.rail,before.thumb);}
  else assert.equal(before.primary,'#263b48');
  // Pointer hold at zero; release outside the slider cannot leave interaction stuck.
  const point=await evaluate("(()=>{const r=document.querySelector('.explode-control [data-slot=slider-thumb]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});assert.equal(await pulse(),false);
  await delay(1200);assert.equal(await pulse(),false,'no pulse under held pointer');
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y+100,button:'left',clickCount:1});
  await delay(500);assert.equal(await pulse(),false,'release settles before idle cue resumes');await waitFor("document.querySelector('.explode-slider').dataset.idlePulse==='true'",'outside release recovery');
  await evaluate("document.querySelector('.explode-control input').focus()");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Home',code:'Home',windowsVirtualKeyCode:36});
  assert.equal(await pulse(),false);await delay(1200);assert.equal(await pulse(),false,'held keyboard at zero suppresses pulse');
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Home',code:'Home',windowsVirtualKeyCode:36});
  await delay(500);assert.equal(await pulse(),false);await waitFor("document.querySelector('.explode-slider').dataset.idlePulse==='true'",'keyboard idle recovery');
  for(let i=0;i<20;i++)await key('ArrowRight');assert.equal(await value(),'20');assert.equal(await pulse(),false);
  await delay(1200);assert.equal(await pulse(),false,'absent above zero');await screenshot(theme+'-above-zero');
  const beforeReset=await evaluate("document.querySelector('.dock-reset').getBoundingClientRect().toJSON()");
  await click('.dock-reset');assert.equal(await value(),'0');assert.equal((await sample()).reset[0]?.name,'atlas-reset-confirmation');await screenshot(theme+'-reset');
  assert.deepEqual(await evaluate("document.querySelector('.dock-reset').getBoundingClientRect().toJSON()"),beforeReset,'no Reset layout shift');
  await delay(650);assert.equal((await sample()).reset.length,0,'one shot completes');
  await evaluate("window.__resetIcon=document.querySelector('.dock-reset svg');true");await click('.dock-reset');
  assert.equal(await evaluate("window.__resetIcon!==document.querySelector('.dock-reset svg')"),true);assert.equal((await sample()).reset[0]?.name,'atlas-reset-confirmation');
  await delay(1100);assert.equal((await sample()).reset.length,0);await screenshot(theme+'-whole');
  const settledBadge=await sample();assert.equal(settledBadge.traceOpacity,'0');assert.equal(settledBadge.glow,'0');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.edition'),'::after').content"),'none','old underline removed');
  const brandStarts=()=>evaluate("window.__microEvents.filter(e=>e.name.startsWith('atlas-badge')).length");
  const starts=await brandStarts();
  // Actual navigation and Random use the existing action pipelines; badge identity stays mounted.
  const {select}=selectBrowserHelpers({evaluate,click,waitFor,delay});
  await select('#region-choice','atlas:region:head-jaw');await select('#area-choice','atlas:area:brainstem');
  await click('.dock-reset');await click('[aria-label="Random anatomy"]');await delay(400);await click('.dock-reset');
  await click('#model-choice');await click('[data-slot=select-item][data-value="female"]');await waitFor("document.querySelector('.studio').dataset.entrance==='settled'&&!document.querySelector('.loading')",'female loaded');
  assert.equal(await brandStarts(),starts,'badge never replays during navigation, Random or model change');
  await screenshot(theme+'-female');
  // Theme remains persisted across reload.
  await send('Page.reload');await waitFor("document.querySelector('.studio')?.dataset.entrance==='settled'",'persisted reload');
  assert.equal(await evaluate("document.documentElement.dataset.theme"),theme);
  report.push({theme,passed:true,before,settledBadge,pointerHold:true,keyboardHold:true,outsideRelease:true,aboveZero:true,resetReplay:true,noBrandReplay:true,persistence:true});
  console.log('PASS '+theme);
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.navigate',{url:baseUrl+'/male'});await waitFor("document.querySelector('.studio')?.dataset.entrance==='settled'",'reduced motion settles');await delay(1300);
 assert.equal((await sample()).halo,'none');assert.equal((await sample()).traceOpacity,'0');assert.equal((await sample()).glow,'0');
 await click('.dock-reset');assert.equal((await sample()).reset.length,0);await screenshot('reduced-motion');
 assert.equal(await evaluate("window.__microEvents.some(e=>e.name.startsWith('atlas-badge')||e.name==='atlas-reset-confirmation'||e.name==='atlas-explode-idle')"),false);
 assert.deepEqual(errors,[],'zero application exceptions');
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({passed:true,desktopOnly:true,report,reducedMotion:true,errors},null,2));
}catch(error){if(failureCapture)try{await failureCapture();}catch{}throw error;}finally{ws?.close();processHandle.kill();}
