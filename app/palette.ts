export const PALETTE_KEY = 'human-atlas-palette';
export const PALETTES = ['classic', 'ignition', 'ultraviolet', 'iris-ember'] as const;
export type Palette = typeof PALETTES[number];
export const PALETTE_OPTIONS = [
  { id: 'classic', label: 'Classic', description: 'Original Human Atlas', light: ['#263b48', '#537a89'], dark: ['#70cbd5', '#9cc8d4'] },
  { id: 'ignition', label: 'Ignition', description: 'Vermilion / Midnight', light: ['#b93c28', '#19232d'], dark: ['#ff866b', '#101419'] },
  { id: 'ultraviolet', label: 'Ultraviolet', description: 'Iris / Acid Yellow', light: ['#6339c2', '#d9ef72'], dark: ['#c2a8ff', '#ddf17b'] },
  { id: 'iris-ember', label: 'Iris & Ember', description: 'Iris / Vermilion', light: ['#5c3cb8', '#b73d31'], dark: ['#bda7ff', '#e28b70'] },
] as const;

export function normalizePalette(value: unknown): Palette {
  return PALETTES.includes(value as Palette) ? value as Palette : 'classic';
}

/** UI preference only. This controller cannot update theme, anatomy or scene settings. */
export function createPaletteController({ storage, apply }: {
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  apply: (palette: Palette) => void;
}) {
  const read = () => { try { return normalizePalette(storage.getItem(PALETTE_KEY)); } catch { return 'classic' as const; } };
  let current = read();
  const listeners = new Set<() => void>();
  apply(current);
  const update = (next: Palette) => {
    if (next === current) return;
    current = next; apply(next); listeners.forEach(listener => listener());
  };
  return {
    getSnapshot: () => current,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setPalette: (value: Palette) => { const next = normalizePalette(value); try { storage.setItem(PALETTE_KEY, next); } catch { /* Session selection remains available. */ } update(next); },
    refresh: () => update(read()),
    dispose: () => listeners.clear(),
  };
}
