import { createContext } from 'react';
import type { Annotation } from './annotation-core';
export const AnnotationDocumentContext=createContext<{subjectId:string;tabId:string}|null>(null);
export const AnnotationRecordsContext=createContext<Annotation[]>([]);
export const AnnotationJumpContext=createContext<string|null>(null);
export const AnnotationSourceContext=createContext<string|undefined>(undefined);
