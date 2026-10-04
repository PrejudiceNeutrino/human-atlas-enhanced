export const THEME_KEY='human-atlas-theme';
export const THEME_MODES=['light','dark','system'] as const;
export type ThemeMode=typeof THEME_MODES[number];
export type ResolvedTheme='light'|'dark';
export function normalizeTheme(value:unknown):ThemeMode {
 return THEME_MODES.includes(value as ThemeMode)?value as ThemeMode:'light';
}
export function resolveTheme(mode:ThemeMode,systemDark:boolean):ResolvedTheme {
 return mode==='system'?(systemDark?'dark':'light'):mode;
}
interface ThemeHost {
 storage:Pick<Storage,'getItem'|'setItem'>;
 media:Pick<MediaQueryList,'matches'|'addEventListener'|'removeEventListener'>;
 apply:(theme:ResolvedTheme)=>void;
}
/** Theme owns only a local preference and presentation; no viewer state or URL access. */
export function createThemeController({storage,media,apply}:ThemeHost) {
 let mode:ThemeMode='light';try{mode=normalizeTheme(storage.getItem(THEME_KEY));}catch{/* Storage may be unavailable. */}
 let snapshot={mode,resolved:resolveTheme(mode,media.matches)};
 const listeners=new Set<()=>void>();
 const update=()=>{const resolved=resolveTheme(mode,media.matches);if(snapshot.mode===mode&&snapshot.resolved===resolved)return;snapshot={mode,resolved};apply(resolved);listeners.forEach(listener=>listener());};
 const change=()=>update();media.addEventListener('change',change);apply(snapshot.resolved);
 return {
  getSnapshot:()=>snapshot,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  setMode:(value:ThemeMode)=>{mode=normalizeTheme(value);try{storage.setItem(THEME_KEY,mode);}catch{/* The session preference still works. */}update();},
  dispose:()=>{media.removeEventListener('change',change);listeners.clear();},
 };
}
export const SCENE_THEMES={
 light:{background:'#e4e8eb',ground:'#d5d9dc',platform:'#eeeeec',ring:'#8c969f',innerRing:'#a4aeb8',marker:'#64748b'},
 dark:{background:'#202a33',ground:'#090f14',platform:'#303c46',ring:'#8a9ba8',innerRing:'#8296a5',marker:'#a4b6c6'},
} as const;
