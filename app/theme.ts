export const THEME_KEY='human-atlas-theme';
export const THEME_MODES=['light','dark'] as const;
export type ThemeMode=typeof THEME_MODES[number];
export type ResolvedTheme=ThemeMode;
/** Retired System and malformed preferences deterministically migrate to Light. */
export function normalizeTheme(value:unknown):ThemeMode {return value==='dark'?'dark':'light';}
export function resolveTheme(mode:ThemeMode,_systemDark=false):ResolvedTheme {return mode;}
interface ThemeHost {
 storage:Pick<Storage,'getItem'|'setItem'>;
 media?:Pick<MediaQueryList,'matches'|'addEventListener'|'removeEventListener'>;
 apply:(theme:ResolvedTheme)=>void;
}
/** Presentation only: no OS listener, viewer state, or URL access. */
export function createThemeController({storage,apply}:ThemeHost) {
 let mode:ThemeMode='light';
 try{const saved=storage.getItem(THEME_KEY);mode=normalizeTheme(saved);if(saved!==null&&saved!==mode)storage.setItem(THEME_KEY,mode);}catch{/* Storage may be unavailable. */}
 let snapshot={mode,resolved:mode};const listeners=new Set<()=>void>();apply(mode);
 return {
  getSnapshot:()=>snapshot,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  setMode:(value:ThemeMode)=>{const next=normalizeTheme(value);try{storage.setItem(THEME_KEY,next);}catch{/* Session preference still works. */}if(next===mode)return;mode=next;snapshot={mode,resolved:mode};apply(mode);listeners.forEach(listener=>listener());},
  dispose:()=>listeners.clear(),
 };
}
export const SCENE_THEMES={
 light:{background:'#e4e8eb',ring:'#8c969f',innerRing:'#a4aeb8',marker:'#64748b'},
 dark:{background:'#202a33',ring:'#81919e',innerRing:'#71828f',marker:'#a4b6c6'},
} as const;
