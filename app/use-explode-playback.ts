import { useCallback, useEffect, useRef, useState } from 'react';
import { motionDuration } from './motion';
import { SYSTEM_SEPARATION_END } from './explosion-layout';
import { nextExplosionStop, explosionPlaybackDuration, type ExplosionPlaybackRun } from './explode-playback';

/** Commands and UI only: the existing scene loop owns playback timing/rendering. */
export function useExplodePlayback({ amount, familyCount, enabled, scope, onChange }: {
  amount: number;
  familyCount: number;
  enabled: boolean;
  scope: object;
  onChange: (amount: number) => void;
}) {
  const current = useRef({ amount, familyCount, enabled, scope, onChange });
  current.current = { amount, familyCount, enabled, scope, onChange };
  const active = useRef<ExplosionPlaybackRun | null>(null);
  const [run, setRun] = useState<ExplosionPlaybackRun | null>(null);

  const cancel = useCallback(() => {
    if (active.current) active.current.cancelled = true;
    active.current = null;
  }, []);
  const stop = useCallback((preservePosition = true) => {
    const playback = active.current, state = current.current;
    cancel(); setRun(null);
    if (preservePosition && playback && playback.scope === state.scope && state.enabled) state.onChange(playback.current);
  }, [cancel]);

  const toggle = useCallback(() => {
    const state = current.current;
    if (active.current?.scope === state.scope) { stop(); return; }
    cancel();
    if (!state.enabled || state.amount >= 1) return;
    const to = nextExplosionStop(state.amount, state.familyCount);
    const stageDuration = motionDuration(to === SYSTEM_SEPARATION_END ? '--motion-explode-systems' : '--motion-explode-pieces');
    const duration = explosionPlaybackDuration(state.amount, to, stageDuration, state.familyCount);
    if (!duration) { state.onChange(to); return; }
    const playback = { from: state.amount, to, start: performance.now(), duration, scope: state.scope, current: state.amount, cancelled: false };
    active.current = playback; setRun(playback);
    state.onChange(state.amount); // Pause autorotation without moving the slider.
  }, [cancel, stop]);

  const update = useCallback((playback: ExplosionPlaybackRun, amount: number, done: boolean) => {
    const state = current.current;
    if (active.current !== playback || playback.cancelled || playback.scope !== state.scope || !state.enabled) return;
    playback.current = amount;
    state.onChange(amount);
    if (done) { cancel(); setRun(null); }
  }, [cancel]);

  const playback = run?.scope === scope && enabled ? run : null;
  useEffect(() => {
    if (!enabled || active.current?.scope !== scope) stop(false);
  }, [enabled, scope, stop]);
  useEffect(() => {
    if (!playback) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => {
      if (media.matches && active.current === playback) {
        stop(false); current.current.onChange(playback.to);
      }
    };
    const hide = () => { if (document.hidden) stop(); };
    const blur = () => stop();
    media.addEventListener('change', reduce);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('blur', blur);
    reduce();
    return () => {
      media.removeEventListener('change', reduce);
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('blur', blur);
    };
  }, [playback, stop]);
  useEffect(() => cancel, [cancel]);

  return {
    run: playback,
    playing: playback !== null,
    destination: playback?.to ?? nextExplosionStop(amount, familyCount),
    toggle,
    stop,
    update,
  };
}
