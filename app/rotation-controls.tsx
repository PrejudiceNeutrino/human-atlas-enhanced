import {Gauge,Pause,RotateCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover,PopoverTrigger,PopoverContent,PopoverTitle} from '@/components/ui/popover';
import {Slider} from '@/components/ui/slider';
import {browserRotation,useRotation} from './rotation-store';
import {ROTATION_LIMITS} from './rotation';
export function RotationControls({active,disabled,onToggle}:{active:boolean;disabled:boolean;onToggle:()=>void}){
 const speed=useRotation();
 return <><Button variant="ghost" disabled={disabled} aria-label={active?'Pause rotation':'Rotate body'} aria-pressed={active} title="Auto rotate" className={active?'active':''} onClick={onToggle}>{active?<Pause size={17}/>:<RotateCw size={18}/>}</Button><Popover><PopoverTrigger render={<Button variant="ghost" aria-label="Rotation speed" title="Rotation speed"/>}><Gauge size={18}/></PopoverTrigger><PopoverContent side="left" sideOffset={10} className="rotation-popover"><PopoverTitle>Auto rotation</PopoverTitle><div className="rotation-setting"><label id="rotation-speed-label">Speed</label><output>{speed.toFixed(2).replace(/0$/,'')}×</output></div><Slider aria-labelledby="rotation-speed-label" getAriaValueText={(_formatted,value)=>`${value} times default rotation speed`} min={ROTATION_LIMITS[0]} max={ROTATION_LIMITS[1]} step={.05} value={[speed]} onValueChange={value=>browserRotation.set(Array.isArray(value)?value[0]:value)}/><div className="slider-endpoints"><span>0.25×</span><span>3×</span></div></PopoverContent></Popover></>;
}
