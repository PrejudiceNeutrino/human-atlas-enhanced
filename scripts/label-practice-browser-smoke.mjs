/** Real Chromium acceptance for shared image-space practice and the development curator. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const base = process.env.ATLAS_URL ?? 'http://127.0.0.1:3097';
const devBase = process.env.ATLAS_DEV_URL ?? 'http://127.0.0.1:3096';
assert.match(devBase, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const output = path.resolve(process.env.SMOKE_OUTPUT ?? 'work/label-practice/browser');
fs.mkdirSync(output, { recursive: true });
const chrome = process.env.CHROME_PATH ?? ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
assert.ok(chrome, 'Chromium executable');
const profile = fs.mkdtempSync(path.join(output, 'chrome-'));
const child = spawn(chrome, ['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions','about:blank'], { windowsHide: true, stdio: ['ignore','ignore','pipe'] });
child.stderr.on('data', data => fs.appendFileSync(path.join(output, 'chrome.log'), data));
let ws, send;
const errors = [], checks = [];
try {
  let port;
  for (let i = 0; i < 150; i++) { const file = path.join(profile, 'DevToolsActivePort'); if (fs.existsSync(file)) { port = Number(fs.readFileSync(file, 'utf8').split('\n')[0]); break; } await delay(100); }
  assert.ok(port, 'Chrome debugging endpoint');
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let serial = 0; const pending = new Map();
  send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 30000); pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { const request = pending.get(message.id); if (request) { pending.delete(message.id); clearTimeout(request.timer); message.error ? request.reject(Error(JSON.stringify(message.error))) : request.resolve(message.result); } } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails); };
  const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const waitFor = async (expression, label) => { for (let i = 0; i < 450; i++) { if (await evaluate(expression)) return; await delay(100); } throw Error('Timeout: ' + label); };
  const shot = async name => { const result = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(result.data, 'base64')); };
  const click = async selector => { const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing target');e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`); for (const type of ['mousePressed','mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 }); await delay(80); };
  const command = async text => { await evaluate(`(()=>{const b=[...document.querySelectorAll('.learn-gallery-viewer button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing '+${JSON.stringify(text)});b.click()})()`); await delay(80); };
  const point = selector => evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  const mouseDrag = async (from, to) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...from, button: 'left', clickCount: 1 });
    for (let i = 1; i <= 5; i++) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + (to.x - from.x) * i / 5, y: from.y + (to.y - from.y) * i / 5, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...to, button: 'left', clickCount: 1 }); await delay(80);
  };
  const key = async (key, code = key) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code }); await delay(80); };
  const openFigure = async id => {
    await waitFor("!document.querySelector('.learn-gallery-viewer')", 'previous viewer closed');
    await delay(160); // The existing dialog backdrop finishes its exit transition.
    await click(`.learn-gallery-card:has(img[src$="/${id}.webp"])`);
    await waitFor(`document.querySelector('.learn-gallery-image-space img')?.src.endsWith('/${id}.webp')&&document.querySelector('.learn-gallery-image-space img').complete&&!document.querySelector('.learn-gallery-image-status')`, 'source image ' + id);
    await waitFor("!!document.querySelector('[aria-label=\"Label Practice\"]')", 'annotation sidecar');
  };
  const alignment = async label => {
    const error = await evaluate(`(()=>{const image=document.querySelector('.learn-gallery-image-space img').getBoundingClientRect();return Math.max(...[...document.querySelectorAll('.label-practice-overlay rect')].map(r=>{const b=r.getBoundingClientRect();return Math.max(Math.abs(b.x-image.x-Number(r.getAttribute('x'))*image.width),Math.abs(b.y-image.y-Number(r.getAttribute('y'))*image.height),Math.abs(b.width-Number(r.getAttribute('width'))*image.width),Math.abs(b.height-Number(r.getAttribute('height'))*image.height))}))})()`);
    assert.ok(error < .15, `${label}: image/mask alignment error ${error}`);
  };
  const hidden = () => evaluate("document.querySelectorAll('[data-revealed=true]').length");
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base + '/learn/digestive#digestive-system-gallery' });
  await waitFor("document.querySelectorAll('.learn-gallery-card').length===30", 'Gallery');
  await openFigure('a02');
  assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Edit label masks\"]')"), false, 'production curator absent');
  await click('[aria-label="Label Practice"]');
  await waitFor("document.querySelectorAll('[data-practice-label]').length===11", 'practice masks');
  await alignment('landscape fit');
  assert.ok(await evaluate("[...document.querySelectorAll('[data-practice-label]')].every(e=>/^Reveal label \\d+$/.test(e.getAttribute('aria-label')))"));
  await click('[data-practice-label] rect'); assert.equal(await hidden(), 1);
  await command('Hide All'); assert.equal(await hidden(), 0);
  const maskPoint = await point('[data-practice-label] rect');
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...maskPoint, deltaY: -100, deltaX: 0 }); await delay(120);
  await alignment('wheel zoom');
  const beforeZoom = await evaluate("document.querySelector('.learn-gallery-zoom-controls output').textContent");
  const from = await point('[data-practice-label] rect');
  const beforePan = await evaluate("document.querySelector('.learn-gallery-image-space').style.transform");
  await mouseDrag(from, { x: from.x + 25, y: from.y + 15 });
  assert.equal(await hidden(), 0, 'dragging a mask must not reveal it');
  assert.notEqual(await evaluate("document.querySelector('.learn-gallery-image-space').style.transform"), beforePan);
  await alignment('pan');
  const double = await point('[data-practice-label] rect');
  for (const count of [1, 2]) for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...double, button: 'left', clickCount: count });
  await delay(80);
  assert.equal(await evaluate("document.querySelector('.learn-gallery-zoom-controls output').textContent"), beforeZoom, 'double mask tap cannot also zoom');
  await click('[aria-label="Actual size"]'); await alignment('actual size');
  await command('Fit'); await command('Reset Practice');
  await evaluate("document.querySelector('[data-practice-label]').focus()");
  await key('Enter'); assert.equal(await hidden(), 1);
  await key(' ', 'Space'); assert.equal(await hidden(), 0);
  await command('Label list');
  await click('.label-practice-list button'); assert.equal(await hidden(), 1);
  await command('Reveal All'); assert.equal(await hidden(), 11);
  await command('Reset Practice'); assert.equal(await hidden(), 0);
  await click('[aria-label="Figure details"]');
  assert.ok(await evaluate("document.querySelector('.learn-gallery-details').textContent.includes('Source:')"));
  await click('.learn-gallery-viewer-actions .learn-gallery-star');
  assert.deepEqual(await evaluate("JSON.parse(localStorage.getItem('human-atlas-gallery:v1:digestive')).starredIds"), ['a02']);
  await click('[aria-label="Next figure"]');
  await waitFor("document.querySelectorAll('[data-practice-label]').length===27", 'next figure');
  assert.equal(await hidden(), 0);
  await alignment('navigation');
  await evaluate("document.querySelector('.learn-gallery-image-stage').focus()"); await key('Escape');
  await waitFor("!document.querySelector('.learn-gallery-viewer')", 'Escape close');
  assert.ok(await evaluate("document.activeElement.matches('.learn-gallery-card')"));
  checks.push('production editor exclusion, click/keyboard/list controls, session isolation, details, stars, navigation, focus return');

  for (const id of ['a15', 'p09', 'p05', 'a05', 'a12', 'a13']) {
    await openFigure(id);
    await waitFor("!!document.querySelector('.label-practice-overlay')", 'practice carried to next open');
    if (['a05', 'a12', 'a13'].includes(id)) {
      assert.equal(await evaluate("document.querySelectorAll('[data-practice-label]').length"), { a05: 2, a12: 4, a13: 5 }[id]);
      assert.equal(await evaluate("!!document.querySelector('.label-practice-note')"), false, 'all requested callouts covered');
    }
    await alignment(id + ' fit');
    await click('[aria-label="Zoom in"]'); await alignment(id + ' zoom');
    await shot(id + '-zoom');
    await click('[aria-label="Close image viewer"]');
  }
  checks.push('four aspect ratios at fit, wheel, actual size, pan, figure change and zoom');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  await openFigure('a02'); await command('Reset Practice'); await alignment('mobile portrait');
  assert.ok(await evaluate("(()=>{const r=document.querySelector('.learn-gallery-viewer-toolbar').getBoundingClientRect();return [...document.querySelectorAll('.learn-gallery-viewer-toolbar button')].every(b=>{const q=b.getBoundingClientRect();return q.left>=r.left&&q.right<=r.right})})()"), 'toolbar fits narrow screen');
  const touch = await point('[data-practice-label] rect');
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...touch, id: 1 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await delay(80);
  assert.equal(await hidden(), 1, 'touch tap reveals one answer');
  await command('Reset Practice');
  const stage = await point('.learn-gallery-image-stage');
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: stage.x - 35, y: stage.y, id: 1 }, { x: stage.x + 35, y: stage.y, id: 2 }] });
  for (let i = 1; i <= 4; i++) await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: stage.x - 35 - i * 10, y: stage.y, id: 1 }, { x: stage.x + 35 + i * 10, y: stage.y, id: 2 }] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await delay(100);
  assert.equal(await hidden(), 0, 'pinch cannot reveal labels');
  assert.notEqual(await evaluate("document.querySelector('.learn-gallery-zoom-controls output').textContent"), '100%');
  await alignment('pinch'); await shot('mobile-portrait');
  await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await delay(150); await alignment('mobile rotation'); await shot('mobile-landscape');
  await click('[aria-label="Close image viewer"]');
  checks.push('390px toolbar, touch tap, pinch versus reveal, rotation alignment');

  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: devBase + '/learn/digestive#digestive-system-gallery' });
  await waitFor("document.querySelectorAll('.learn-gallery-card').length===30", 'development Gallery');
  await openFigure('a02'); await click('[aria-label="Edit label masks"]');
  await waitFor("!!document.querySelector('.label-curator-overlay')&&!document.querySelector('.learn-gallery-image-status')", 'curator');
  assert.equal(await evaluate("document.querySelectorAll('.label-curator-overlay [data-curator-label]:not([data-corner])').length"), 13, 'existing grouped masks load');
  await command('New answer');
  await evaluate("(()=>{const i=document.querySelector('[aria-label=\"Printed label\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'Curator workflow test');i.dispatchEvent(new Event('input',{bubbles:true}))})()");
  const normalized = async (x, y) => evaluate(`(()=>{const r=document.querySelector('.label-curator-overlay').getBoundingClientRect();return{x:r.x+r.width*${x},y:r.y+r.height*${y}}})()`);
  await mouseDrag(await normalized(.04, .04), await normalized(.12, .08));
  const selectedRect = '.label-curator-overlay rect.selected';
  assert.ok(await evaluate(`Math.abs(Number(document.querySelector('${selectedRect}').getAttribute('width'))-.08)<.003`));
  await mouseDrag(await point(selectedRect), await normalized(.1, .08));
  const movedX = await evaluate(`Number(document.querySelector('${selectedRect}').getAttribute('x'))`);
  assert.ok(movedX > .05);
  await mouseDrag(await point('[data-corner=se]'), await normalized(.18, .13));
  assert.ok(await evaluate(`Number(document.querySelector('${selectedRect}').getAttribute('width'))>.1`));
  await mouseDrag(await normalized(.04, .15), await normalized(.12, .19));
  await evaluate("(()=>{const i=document.querySelector('[aria-label=\"Accepted answers\"]');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(i,'Test synonym\\nSecond synonym');i.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await command('Delete region');
  assert.equal(await evaluate("document.querySelectorAll('.label-curator-overlay [data-curator-label]:not([data-corner])').length"), 14);
  await command('Preview masks');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.label-curator-overlay rect')).fillOpacity"), '1');
  await shot('curator-preview'); await command('Edit rectangles');
  await evaluate("(()=>{window.__exportedJSON=null;URL.createObjectURL=blob=>{window.__exportedJSON=blob.text();return 'blob:curator-test'};HTMLAnchorElement.prototype.click=function(){};})()");
  await command('Export JSON');
  const exported = await evaluate('window.__exportedJSON');
  assert.ok(exported, 'durable JSON export created');
  const parsed = JSON.parse(exported), curated = parsed.figures.find(figure => figure.figureId === 'a02');
  assert.equal(curated.reviewStatus, 'candidate', 'editing invalidates publication review');
  const authored = curated.labels.at(-1);
  assert.equal(authored.label, 'Curator workflow test'); assert.equal(authored.regions.length, 1);
  assert.deepEqual(authored.acceptedAnswers, ['Test synonym', 'Second synonym']);
  assert.ok(authored.regions[0].width > .1 && authored.regions[0].x > .05);
  // Import the actual exported file through the editor's file input.
  await evaluate(`(()=>{const input=document.querySelector('[aria-label="Import label annotation JSON"]');const transfer=new DataTransfer();transfer.items.add(new File([${JSON.stringify(exported)}],'label-practice.json',{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await waitFor("document.querySelector('.label-curator-controls').textContent.includes('Annotation file loaded.')", 'JSON import');
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Curator answer\"]').options.length"), 13);
  await shot('curator-editor');
  checks.push('development curator existing data, normalized draw/move/resize, multiple regions, delete, synonyms, opaque preview, export and import');

  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ passed: checks, output }, null, 2));
} catch (error) {
  if (send && ws?.readyState === WebSocket.OPEN) {
    try {
      const result = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(output, 'failure.png'), Buffer.from(result.data, 'base64'));
      const state = await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true });
      fs.writeFileSync(path.join(output, 'failure.txt'), JSON.stringify({ error: String(error), checks, errors, page: state.result.value }, null, 2));
    } catch {}
  }
  throw error;
} finally { if (send && ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} } ws?.close(); child.kill(); }
