/** Display-only values, independent of every anatomical identity and navigation scope. */
export const SCENE_FLOOR_PRESETS=[
 {id:'classic',label:'Classic',shader:0,animated:false},
 {id:'minimal',label:'Minimal',shader:1,animated:false},
 {id:'grid',label:'Grid',shader:2,animated:false},
 {id:'scanner',label:'Scanner',shader:3,animated:true},
 {id:'orbital',label:'Orbital',shader:4,animated:true},
 {id:'event-horizon',label:'Event Horizon',shader:5,animated:true},
 {id:'void',label:'Void',shader:0,animated:false},
] as const;
export type SceneFloorPreset=typeof SCENE_FLOOR_PRESETS[number]['id'];
export function normalizeSceneFloor(value:unknown):SceneFloorPreset {
 return SCENE_FLOOR_PRESETS.find(preset=>preset.id===value)?.id??'classic';
}
export function sceneFloorDefinition(value:SceneFloorPreset){
 return SCENE_FLOOR_PRESETS.find(preset=>preset.id===value)!;
}
