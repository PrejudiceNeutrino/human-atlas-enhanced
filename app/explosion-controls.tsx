import { flushSync } from 'react-dom';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SYSTEM_SEPARATION_END, explosionValueText } from './explosion-layout';
import type { useExplodeIdle } from './use-explode-idle';
import type { useExplodePlayback } from './use-explode-playback';
import './explode-playback.css';

/** The same dock content in Explore, Visualize and Anatomy Companion. */
export function ExplosionControls({ amount, familyCount, playback, idle, resetActivation, onChange, onReset, playDisabled, sliderDisabled = false, sliderId = 'explode-range', labelId = 'explode-label' }: {
  amount: number; familyCount: number; playback: ReturnType<typeof useExplodePlayback>; idle: ReturnType<typeof useExplodeIdle>; resetActivation: number;
  onChange: (amount: number) => void; onReset: () => void; playDisabled: boolean; sliderDisabled?: boolean; sliderId?: string; labelId?: string;
}) {
  const playLabel = playback.playing ? 'Pause expansion' : amount >= 1 ? 'Every piece is fully expanded' : `Play expansion to ${playback.destination === SYSTEM_SEPARATION_END ? 'Systems apart' : 'Every piece'}`;
  return <>
    <div className="explode-control">
      <div className="explode-label"><label id={labelId}>Explode anatomy</label><div className="explode-label-actions"><output>{Math.round(amount * 100)}<span>%</span></output><Button variant="ghost" className="explode-play" aria-label={playLabel} title={playLabel} aria-pressed={playback.playing} aria-controls={sliderId} disabled={playDisabled} onClick={() => { idle.onValueChange(); playback.toggle(); }}>{playback.playing ? <Pause size={12} fill="currentColor" aria-hidden="true"/> : <Play size={12} fill="currentColor" aria-hidden="true"/>}</Button></div></div>
      <div className="explode-slider" data-idle-pulse={idle.pulse} onPointerDownCapture={() => { if (playback.playing) flushSync(() => playback.stop()); idle.onPointerDownCapture(); }} onKeyDownCapture={event => { if (playback.playing && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) flushSync(() => playback.stop()); idle.onKeyDownCapture(event); }}>
        <Slider id={sliderId} disabled={sliderDisabled} getAriaValueText={(_formatted, value) => explosionValueText(value / 100, familyCount)} aria-labelledby={labelId} min={0} max={100} step={1} value={[amount * 100]} onValueChange={value => { playback.stop(false); idle.onValueChange(); onChange((Array.isArray(value) ? value[0] : value) / 100); }}/>
        {familyCount >= 2 && <span className="slider-stage-marker" aria-hidden="true" style={{ left: `${SYSTEM_SEPARATION_END * 100}%` }}/>}</div>
      <div className="slider-endpoints"><span>Assembled</span>{familyCount >= 2 && <span className="slider-stage-label" style={{ left: `${SYSTEM_SEPARATION_END * 100}%` }}>Systems apart</span>}<span>Every piece</span></div>
    </div>
    <Button variant="ghost" className="dock-reset" onClick={onReset} aria-keyshortcuts="R" title="Assemble and reset (R)" aria-label="Assemble and reset"><RotateCcw key={resetActivation} className={resetActivation ? 'reset-confirmation' : undefined} size={18}/><span>Reset</span></Button>
  </>;
}
