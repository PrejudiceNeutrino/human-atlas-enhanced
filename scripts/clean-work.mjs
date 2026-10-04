import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(fileURLToPath(new URL('../work',import.meta.url)));
const apply=process.argv.includes('--apply');
if(process.argv.slice(2).some(arg=>!['--apply','--dry-run'].includes(arg)))throw Error('Use --dry-run (default) or --apply.');
// Fail closed if the process inventory cannot establish which profiles are active.
const processText=process.platform==='win32'?execFileSync('powershell.exe',['-NoProfile','-Command',"Get-CimInstance Win32_Process -ErrorAction Stop | Where-Object { $_.Name -match '^(chrome|msedge)\\.exe$' } | Select-Object -ExpandProperty CommandLine"],{encoding:'utf8',windowsHide:true}):execFileSync('ps',['-eo','args'],{encoding:'utf8'});
const within=(base,target)=>{const relative=path.relative(base,target);return !!relative&&!relative.startsWith('..')&&!path.isAbsolute(relative);};
const sizes=directory=>fs.readdirSync(directory,{withFileTypes:true}).reduce((sum,e)=>{const name=path.join(directory,e.name);if(e.isSymbolicLink())throw Error('Refusing linked content: '+name);return sum+(e.isDirectory()?sizes(name):fs.statSync(name).size);},0);
const candidates=[],skipped=[];
function walk(directory){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  if(!entry.isDirectory()||entry.isSymbolicLink())continue;
  const target=path.join(directory,entry.name);
  if(entry.name.startsWith('chrome-')){
   let passed=false;try{passed=JSON.parse(fs.readFileSync(path.join(directory,'report.json'),'utf8')).passed===true;}catch{}
   if(!passed||fs.existsSync(path.join(directory,'failure.json'))){skipped.push({path:target,reason:'No clean successful report; retain evidence'});continue;}
   const resolved=fs.realpathSync(target);
   if(!within(root,resolved)||resolved!==target)throw Error('Refusing escaped/linked profile: '+target);
   if(processText.toLowerCase().includes(target.toLowerCase())||processText.toLowerCase().includes(target.replaceAll('\\','/').toLowerCase())){skipped.push({path:target,reason:'Active browser'});continue;}
   candidates.push({path:target,bytes:sizes(target)});
  }else walk(target);
 }
}
if(fs.existsSync(root)){if(fs.lstatSync(root).isSymbolicLink())throw Error('Refusing linked work root');walk(root);}
if(apply)for(const candidate of candidates){const resolved=fs.realpathSync(candidate.path);if(!within(root,resolved)||resolved!==candidate.path)throw Error('Target changed');fs.rmSync(resolved,{recursive:true});}
console.log(JSON.stringify({mode:apply?'apply':'dry-run',root,bytes:candidates.reduce((n,c)=>n+c.bytes,0),candidates,skipped},null,2));
