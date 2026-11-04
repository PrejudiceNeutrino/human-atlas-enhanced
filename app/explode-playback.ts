import { SYSTEM_SEPARATION_END } from './explosion-layout.ts';

export interface ExplosionPlaybackRun {
  from: number;
  to: number;
  start: number;
  duration: number;
  scope: object;
  /** Renderer-owned progress, used to pause at the last displayed pose. */
  current: number;
  cancelled: boolean;
}

export function nextExplosionStop(amount: number, familyCount: number): number {
  return familyCount >= 2 && amount < SYSTEM_SEPARATION_END - 1e-6 ? SYSTEM_SEPARATION_END : 1;
}

/** Scale a stage's timing to the remaining distance, with a short minimum for resume. */
export function explosionPlaybackDuration(from: number, to: number, stageDuration: number, familyCount: number): number {
  if (stageDuration <= 0 || from === to) return 0;
  const span = to === SYSTEM_SEPARATION_END ? SYSTEM_SEPARATION_END : familyCount >= 2 ? 1 - SYSTEM_SEPARATION_END : 1;
  return Math.max(400, stageDuration * Math.min(1, Math.abs(to - from) / span));
}

export function explosionPlaybackAmount(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  const eased = progress * progress * (3 - 2 * progress);
  return from + (to - from) * eased;
}
