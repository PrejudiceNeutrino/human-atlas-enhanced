import {useSyncExternalStore} from 'react';
import {createThemeController} from './theme';

// Initialize before the lazy viewer mounts, including persisted System resolution.
export const browserTheme=createThemeController({
 storage:{getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)},
 media:window.matchMedia('(prefers-color-scheme: dark)'),
 apply:theme=>{document.documentElement.dataset.theme=theme;document.documentElement.classList.toggle('dark',theme==='dark');document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#202a33':'#e4e8eb');},
});
export function useTheme(){return useSyncExternalStore(browserTheme.subscribe,browserTheme.getSnapshot);}
