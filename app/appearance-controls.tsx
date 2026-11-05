import { useId } from 'react';
import { Check, Palette, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { PALETTE_OPTIONS } from './palette';
import { browserPalette, usePalette } from './palette-store';
import { browserTheme, useTheme } from './theme-store';
import './appearance-controls.css';

export function PaletteOptions() {
  const palette = usePalette(), { mode } = useTheme(), group = useId();
  return <fieldset className="palette-options"><legend>Color palette</legend><div className="palette-option-grid">
    {PALETTE_OPTIONS.map(option => <label className="palette-option" key={option.id} data-selected={palette === option.id}>
      <input className="sr-only" type="radio" name={`atlas-palette-${group}`} value={option.id} checked={palette === option.id} onChange={() => browserPalette.setPalette(option.id)}/>
      <span className="palette-option-top"><span className="palette-swatches" aria-hidden="true">{option[mode].map(color => <span key={color} style={{ backgroundColor: color }}/>)}</span>{palette === option.id && <Check size={14} aria-hidden="true"/>}</span>
      <strong>{option.label}</strong><span className="palette-option-description">{option.description}</span>
    </label>)}
  </div><p className="palette-scene-note">Palette changes affect the interface. Anatomy keeps its original Light/Dark colors.</p></fieldset>;
}

export function AppearanceControls() {
  const { mode } = useTheme();
  return <Popover>
    <PopoverTrigger render={<Button variant="ghost" className="appearance-trigger" aria-label="Appearance settings" title="Appearance settings"/>}><Palette size={18}/></PopoverTrigger>
    <PopoverContent align="end" sideOffset={10} className="appearance-popover" data-atlas-shortcuts="disabled" data-annotation-excluded>
      <PopoverTitle>Appearance</PopoverTitle>
      <div className="appearance-mode" role="group" aria-label="Light or dark mode"><button type="button" aria-pressed={mode === 'light'} onClick={() => browserTheme.setMode('light')}><Sun size={15} aria-hidden="true"/>Light</button><button type="button" aria-pressed={mode === 'dark'} onClick={() => browserTheme.setMode('dark')}><Moon size={15} aria-hidden="true"/>Dark</button></div>
      <PaletteOptions/>
    </PopoverContent>
  </Popover>;
}
