import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:net';

// Verify built output by HTTP, including each thumbnail, not just source paths.
const argument=process.argv.indexOf('--base-url');
const reservation=createServer();
let port;
if(argument<0){
  await new Promise((resolve,reject)=>{reservation.once('error',reject);reservation.listen(0,'127.0.0.1',resolve);});
  port=reservation.address().port;
  await new Promise(resolve=>reservation.close(resolve));
}
const base=argument>=0?process.argv[argument+1]:`http://127.0.0.1:${port}`;
let server, serverOutput='';
if(argument<0){
  assert.ok(fs.existsSync('dist/index.html'),'Run npm run build first.');
  server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
  server.stdout.on('data',data=>{serverOutput+=data;});server.stderr.on('data',data=>{serverOutput+=data;});
}
try{
  let ready=false;
  for(let i=0;i<100;i++){
    if(server?.exitCode!==null&&server?.exitCode!==undefined)throw Error('Production preview failed to start.');
    try{const response=await fetch(base+'/learn/respiratory');if(response.ok){ready=true;break;}}catch{}
    await delay(100);
  }
  assert.ok(ready,'Respiratory route must return HTTP 200. '+serverOutput);
  const response=await fetch(base+'/images/learn/respiratory/gallery/gallery.json');
  assert.equal(response.status,200);const gallery=await response.json();assert.equal(gallery.count,29);assert.equal(gallery.items.length,29);
  const inventory=JSON.parse(fs.readFileSync('docs/integration/respiratory-source/archive-inventory.json','utf8')).entries;
  let checked=0;
  for(const figure of gallery.items)for(const field of ['image','thumbnail']){
    const url=`/images/learn/respiratory/gallery/${figure[field]}`;
    const response=await fetch(base+url);assert.equal(response.status,200,url);assert.match(response.headers.get('content-type'),/image\/webp/,url);
    const bytes=Buffer.from(await response.arrayBuffer());
    const expected=inventory.find(entry=>entry.path===`phase-05-visuals/${figure[field]}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha256,url);checked++;
  }
  console.log(JSON.stringify({base,route:'/learn/respiratory',figures:29,fullResolution:29,thumbnails:29,verifiedWebpResponses:checked,originalByteHashes:'all match',browserRendering:'not covered by HTTP check'},null,2));
}finally{server?.kill();}
