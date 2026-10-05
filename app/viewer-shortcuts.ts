/** One reference for keyboard dispatch and the Info panel. */
export const VIEWER_SHORTCUTS=[
 {key:'/',action:'find',label:'Find anatomy',context:'Search all named structures'},
 {key:'H',action:'hide',label:'Hide selected',context:'Requires a valid selection'},
 {key:'J',action:'restore',label:'Restore newest hidden',context:'Restores one piece from the current model'},
 {key:'I',action:'isolate',label:'Isolate selected',context:'Requires a valid selection'},
 {key:'R',action:'reset',label:'Reset view',context:'Assemble and reset navigation, layers and dissection'},
 {key:'F',action:'front',label:'Front view',context:'Available while view is locked'},
 {key:'S',action:'side',label:'Side view',context:'Available while view is locked'},
 {key:'B',action:'back',label:'Back view',context:'Available while view is locked'},
] as const;
export type ViewerShortcutAction=typeof VIEWER_SHORTCUTS[number]['action'];
type ShortcutEvent=Pick<KeyboardEvent,'key'|'target'|'ctrlKey'|'metaKey'|'altKey'|'defaultPrevented'|'isComposing'|'repeat'>;
export function viewerShortcut(event:ShortcutEvent):ViewerShortcutAction|null {
 if(event.ctrlKey||event.metaKey||event.altKey||event.defaultPrevented||event.isComposing||event.repeat)return null;
 const target=event.target as Element|null;
 if(target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="combobox"],[role="textbox"],[role="searchbox"],[role="slider"],[role="spinbutton"],[role="listbox"],[role="menu"]'))return null;
 return VIEWER_SHORTCUTS.find(shortcut=>shortcut.key.toLowerCase()===event.key.toLowerCase())?.action??null;
}
