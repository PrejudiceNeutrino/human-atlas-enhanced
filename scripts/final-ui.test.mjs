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
