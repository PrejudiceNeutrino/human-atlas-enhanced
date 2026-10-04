export const DISPLAY_KEY='human-atlas-display';
export const DISPLAY_DEFAULTS={brightness:1,contrast:1} as const;
export const DISPLAY_LIMITS={brightness:[.7,1.3],contrast:[.85,1.15]} as const;
export interface DisplaySettings {brightness:number;contrast:number}
export function normalizeDisplay(value:unknown):DisplaySettings {
 const input=value&&typeof value==='object'?value as Partial<DisplaySettings>:{};
 const setting=(key:keyof DisplaySettings)=>typeof input[key]==='number'&&Number.isFinite(input[key])?Math.max(DISPLAY_LIMITS[key][0],Math.min(DISPLAY_LIMITS[key][1],input[key]!)):DISPLAY_DEFAULTS[key];
 return {brightness:setting('brightness'),contrast:setting('contrast')};
}
export function createDisplayController(storage:Pick<Storage,'getItem'|'setItem'>) {
 let snapshot:DisplaySettings={...DISPLAY_DEFAULTS};try{snapshot=normalizeDisplay(JSON.parse(storage.getItem(DISPLAY_KEY)??'null'));}catch{/* Malformed/unavailable storage uses reviewed defaults. */}
 const listeners=new Set<()=>void>();
 const set=(value:DisplaySettings)=>{const next=normalizeDisplay(value);try{storage.setItem(DISPLAY_KEY,JSON.stringify(next));}catch{/* Session controls remain usable. */}if(next.brightness===snapshot.brightness&&next.contrast===snapshot.contrast)return;snapshot=next;listeners.forEach(listener=>listener());};
 return {getSnapshot:()=>snapshot,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},set,reset:()=>set(DISPLAY_DEFAULTS)};
}
/** Smooth symmetric curve in output color space; identity at 1, no added clipping. */
export const DISPLAY_CONTRAST_SHADER=`
vec3 displayColor = clamp(gl_FragColor.rgb, 0.0, 1.0);
vec3 displayLow = pow(displayColor, vec3(displayContrast));
vec3 displayHigh = pow(1.0 - displayColor, vec3(displayContrast));
gl_FragColor.rgb = displayLow / (displayLow + displayHigh);
`;
