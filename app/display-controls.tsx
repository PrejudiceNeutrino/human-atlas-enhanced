import {SlidersHorizontal} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover,PopoverTrigger,PopoverContent,PopoverTitle} from '@/components/ui/popover';
import {Slider} from '@/components/ui/slider';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {browserDisplay,useDisplay} from './display-store';
import {DISPLAY_LIMITS} from './display';
import {SCENE_FLOOR_PRESETS,normalizeSceneFloor} from './scene-floor-presets';
export function DisplayControls(){
 const settings=useDisplay();
 return <Popover>
  <PopoverTrigger render={<Button variant="ghost" className="icon-button" aria-label="Display settings" title="Display settings"/>}><SlidersHorizontal size={18}/></PopoverTrigger>
  <PopoverContent align="end" sideOffset={10} className="display-popover">
   <PopoverTitle>Display</PopoverTitle>
   {(['brightness','contrast'] as const).map(key=><div className="display-setting" key={key}><div><label id={`display-${key}-label`}>{key==='brightness'?'Brightness':'Contrast'}</label><output>{Math.round(settings[key]*100)}%</output></div><Slider aria-labelledby={`display-${key}-label`} min={DISPLAY_LIMITS[key][0]*100} max={DISPLAY_LIMITS[key][1]*100} step={1} value={[settings[key]*100]} onValueChange={value=>browserDisplay.set({...settings,[key]:(Array.isArray(value)?value[0]:value)/100})}/></div>)}
   <div className="scene-floor-setting">
    <label id="scene-floor-label" htmlFor="scene-floor-choice">Scene floor</label>
    <Select value={settings.sceneFloor} onValueChange={value=>browserDisplay.set({...settings,sceneFloor:normalizeSceneFloor(value)})} items={SCENE_FLOOR_PRESETS.map(preset=>({value:preset.id,label:preset.label}))}>
     <SelectTrigger id="scene-floor-choice" value={settings.sceneFloor} aria-labelledby="scene-floor-label"><SelectValue/></SelectTrigger>
     <SelectContent>{SCENE_FLOOR_PRESETS.map(preset=><SelectItem key={preset.id} value={preset.id} data-value={preset.id}>{preset.label}</SelectItem>)}</SelectContent>
    </Select>
   </div>
   <Button variant="ghost" className="reset-display" onClick={browserDisplay.reset}>Reset display</Button>
  </PopoverContent>
 </Popover>;
}
