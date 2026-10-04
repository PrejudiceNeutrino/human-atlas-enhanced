import {useSyncExternalStore} from 'react';
import {createRotationController} from './rotation';
export const browserRotation=createRotationController({getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)});
export function useRotation(){return useSyncExternalStore(browserRotation.subscribe,browserRotation.getSnapshot);}
