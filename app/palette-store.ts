import { useSyncExternalStore } from 'react';
import { createPaletteController, PALETTE_KEY } from './palette';

export const browserPalette = createPaletteController({
  storage: { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) },
  apply: palette => { document.documentElement.dataset.palette = palette; },
});
window.addEventListener('storage', event => {
  if (event.key === PALETTE_KEY || event.key === null) browserPalette.refresh();
});
export function usePalette() { return useSyncExternalStore(browserPalette.subscribe, browserPalette.getSnapshot); }
