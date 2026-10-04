import {useSyncExternalStore} from 'react';
import {createDisplayController} from './display';
export const browserDisplay=createDisplayController({getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)});
export function useDisplay(){return useSyncExternalStore(browserDisplay.subscribe,browserDisplay.getSnapshot);}
