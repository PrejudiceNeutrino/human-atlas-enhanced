import {SlidersHorizontal} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover,PopoverTrigger,PopoverContent,PopoverTitle} from '@/components/ui/popover';
import {Slider} from '@/components/ui/slider';
import {browserDisplay,useDisplay} from './display-store';
import {DISPLAY_LIMITS} from './display';
export function DisplayControls(){
 const settings=useDisplay();
 return <Popover><PopoverTrigger render={<Button variant="ghost" className="icon-button" aria-label="Display settings" title="Display settings"/>}><SlidersHorizontal size={18}/></PopoverTrigger><PopoverContent align="end" sideOffset={10} className="display-popover"><PopoverTitle>Display</PopoverTitle>{(['brightness','contrast'] as const).map(key=><div className="display-setting" key={key}><div><label id={`display-${key}-label`}>{key==='brightness'?'Brightness':'Contrast'}</label><output>{Math.round(settings[key]*100)}%</output></div><Slider aria-labelledby={`display-${key}-label`} min={DISPLAY_LIMITS[key][0]*100} max={DISPLAY_LIMITS[key][1]*100} step={1} value={[settings[key]*100]} onValueChange={value=>browserDisplay.set({...settings,[key]:(Array.isArray(value)?value[0]:value)/100})}/></div>)}<Button variant="ghost" className="reset-display" onClick={browserDisplay.reset}>Reset display</Button></PopoverContent></Popover>;
}
