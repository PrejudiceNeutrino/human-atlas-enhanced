import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import postcss from 'postcss';
import { JSDOM } from 'jsdom';
import { PALETTES, PALETTE_KEY, createPaletteController, normalizePalette } from '../app/palette.ts';
import { SCENE_THEMES, THEME_KEY, createThemeController } from '../app/theme.ts';
const css = postcss.parse(fs.readFileSync('app/palette-themes.css', 'utf8'));
const expected = {
  ignition: { light: ['#f7f4ed','#19232d','#b93c28','#edb454','#ffffff'], dark: ['#101419','#f4f0e8','#ff866b','#ebc174','#17191e'] },
  ultraviolet: { light: ['#f5f3fa','#241e36','#6339c2','#d9ef72','#ffffff'], dark: ['#12101d','#f4f0fc','#c2a8ff','#ddf17b','#1d152a'] },
  'iris-ember': { light: ['#f8f6f1','#241e31','#5c3cb8','#efad9d','#ffffff'], dark: ['#161320','#f5f0e9','#bda7ff','#e28b70','#171320'] },
};
const luminance = hex => {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value,16)/255).map(value => value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
};
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);

test('palettes normalize safely, persist independently of mode, refresh across tabs and survive storage failures', () => {
  assert.deepEqual(PALETTES,['classic','ignition','ultraviolet','iris-ember']);
  for(const value of [null,undefined,'unknown','Classic',{},''])assert.equal(normalizePalette(value),'classic');
  const saved=new Map([[THEME_KEY,'dark']]),applied=[];
  const storage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
  const theme=createThemeController({storage,apply(){}}),snapshot=theme.getSnapshot(),scene=JSON.stringify(SCENE_THEMES);
  const store=createPaletteController({storage,apply:value=>applied.push(value)});let calls=0;const unsubscribe=store.subscribe(()=>calls++);
  for(const palette of PALETTES){store.setPalette(palette);assert.equal(saved.get(PALETTE_KEY),palette);assert.equal(theme.getSnapshot(),snapshot);assert.equal(JSON.stringify(SCENE_THEMES),scene);}
  assert.equal(saved.get(THEME_KEY),'dark');assert.equal(calls,3);
  saved.set(PALETTE_KEY,'ignition');store.refresh();assert.equal(store.getSnapshot(),'ignition');
  saved.delete(PALETTE_KEY);store.refresh();assert.equal(store.getSnapshot(),'classic');
  unsubscribe();store.dispose();
  const blocked=createPaletteController({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},apply(){}});
  assert.equal(blocked.getSnapshot(),'classic');blocked.setPalette('ultraviolet');assert.equal(blocked.getSnapshot(),'ultraviolet');
});

test('six source palette/mode combinations map semantic UI tokens and preserve readable source contrast', () => {
  const blocks=[];
  css.walkRules(rule=>{if(/^:root\[data-palette="(?:ignition|ultraviolet|iris-ember)"\]/.test(rule.selector))blocks.push(rule);});
  assert.equal(blocks.length,6);
  for(const rule of blocks){
    const name=rule.selector.match(/data-palette="([^"]+)"/)[1],mode=rule.selector.includes(':not(')?'light':'dark',values={};
    rule.walkDecls(declaration=>{values[declaration.prop]=declaration.value;});
    assert.deepEqual(['--background','--foreground','--primary','--secondary','--primary-foreground'].map(key=>values[key]),expected[name][mode]);
    for(const key of ['--card','--popover','--ui-secondary','--ui-muted','--ui-link','--border','--input','--focus','--selected-control','--switch-active','--control-input','--text-selection-background','--text-selection-foreground','--scrollbar'])assert.ok(values[key],`${name}/${mode}/${key}`);
    assert.ok(contrast(values['--foreground'],values['--background'])>=4.5);
    assert.ok(contrast(values['--primary'],values['--primary-foreground'])>=4.5);
    assert.ok(contrast(values['--ui-muted'],values['--card'])>=4.5);
    assert.equal(values['--destructive'],undefined);assert.equal(values['--study-success'],undefined);assert.equal(values['--study-error'],undefined);
  }
});

test('Classic has no palette overrides; scene staging is mode-only and cannot inherit UI palette colors', () => {
  const dom=new JSDOM('<html data-palette="classic"><body></body></html>');
  css.walkRules(rule=>{if(dom.window.document.documentElement.matches(rule.selector))rule.walkDecls(declaration=>assert.match(declaration.prop,/^--scene-/));});
  assert.deepEqual(SCENE_THEMES.light,{background:'#e4e8eb',ring:'#8c969f',innerRing:'#a4aeb8',marker:'#64748b'});
  assert.deepEqual(SCENE_THEMES.dark,{background:'#141414',ring:'#92928f',innerRing:'#777774',marker:'#bcbcb7'});
  assert.ok(css.toString().includes(':is(.studio,.learn-anatomy-stage,.learn-anatomy-status) { background: var(--scene-background); }'));
  assert.doesNotMatch(fs.readFileSync('app/palette-store.ts','utf8'),/browserTheme|browserDisplay|SCENE_THEMES|canvas|renderer/);
  dom.window.close();
});

test('prepaint initialization and controller agree for every palette/mode, invalid preferences and blocked storage', () => {
  const script=fs.readFileSync('web/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  for(const palette of [...PALETTES,'invalid'])for(const mode of ['light','dark']){
    const root={dataset:{},classList:{toggle(name,active){this[name]=active;}}};
    vm.runInNewContext(script,{document:{documentElement:root},localStorage:{getItem:key=>key===PALETTE_KEY?palette:mode}});
    assert.equal(root.dataset.palette,normalizePalette(palette));assert.equal(root.dataset.theme,mode);assert.equal(root.classList.dark,mode==='dark');
  }
  const root={dataset:{},classList:{toggle(){}}};vm.runInNewContext(script,{document:{documentElement:root},localStorage:{getItem(){throw Error('blocked');}}});
  assert.equal(root.dataset.palette,'classic');assert.equal(root.dataset.theme,'light');
});
