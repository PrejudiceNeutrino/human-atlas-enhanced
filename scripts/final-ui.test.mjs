import test from 'node:test';
import assert from 'node:assert/strict';
import {VIEWER_SHORTCUTS,viewerShortcut} from '../app/viewer-shortcuts.ts';
import {shouldHideSelection,shouldRestoreNewest} from '../app/hide-restore.ts';
import {shouldOpenDiscovery} from '../app/anatomy-discovery.ts';
const event=(key,extra={})=>({key,target:null,ctrlKey:false,metaKey:false,altKey:false,defaultPrevented:false,isComposing:false,repeat:false,...extra});
test('Every documented shortcut dispatches its declared action in either letter case',()=>{
 assert.equal(new Set(VIEWER_SHORTCUTS.map(s=>s.key)).size,8);
 for(const shortcut of VIEWER_SHORTCUTS){assert.equal(viewerShortcut(event(shortcut.key)),shortcut.action);assert.equal(viewerShortcut(event(shortcut.key.toLowerCase())),shortcut.action);}
 assert.equal(viewerShortcut(event('q')),null);assert.equal(shouldOpenDiscovery(event('/')),true);assert.equal(shouldRestoreNewest(event('j')),true);assert.equal(shouldHideSelection(event('h'),null,[]),false);
});
test('All eight actions defer to typing, editable ancestors, modifier chords, composition and repeats',()=>{
 for(const {key} of VIEWER_SHORTCUTS){
  for(const flag of ['ctrlKey','metaKey','altKey','defaultPrevented','isComposing','repeat'])assert.equal(viewerShortcut(event(key,{[flag]:true})),null,`${key}/${flag}`);
  for(const token of ['input','textarea','select','contenteditable','combobox','textbox','searchbox','slider','spinbutton','listbox','menu'])assert.equal(viewerShortcut(event(key,{target:{closest:selector=>selector.includes(token)?{}:null}})),null,`${key}/${token}`);
 }
});

test('Every viewer shortcut defers while focus is inside the Learn chooser',()=>{
 for(const {key} of VIEWER_SHORTCUTS){
  assert.equal(viewerShortcut(event(key,{target:{closest:selector=>selector.includes('[data-atlas-shortcuts="disabled"]')?{}:null}})),null,key);
 }
});

test('An embedded viewer accepts keys only inside its own boundary and still defers to editors',()=>{
 const scope={contains:target=>target===inside||target===nested},inside={closest:selector=>selector.includes('data-atlas-shortcuts')?scope:null},nested={closest:selector=>selector.includes('data-atlas-shortcuts')?nested:null};
 assert.equal(viewerShortcut(event('h',{target:inside}),scope),'hide');
 assert.equal(viewerShortcut(event('j',{target:inside}),scope),'restore');
 assert.equal(viewerShortcut(event('h',{target:nested}),scope),null);
 assert.equal(viewerShortcut(event('h',{target:{closest:()=>null}}),scope),null);
 assert.equal(viewerShortcut(event('h',{target:inside})),null,'Explore window handler still defers to the Learn boundary');
 const editor={closest:()=>({})},editorScope={contains:target=>target===editor};
 assert.equal(viewerShortcut(event('h',{target:editor}),editorScope),null);
});
