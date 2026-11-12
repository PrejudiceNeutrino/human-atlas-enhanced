import { useLayoutEffect, useRef } from 'react';
import { learnSubjects } from '../subjects';
import { anatomyLessons } from './references';
import { LearningAnatomyViewer } from './learning-viewer';

export function VisualizePage({ subjectId, tabId }: { subjectId: string; tabId: string }) {
  const lesson = anatomyLessons.find(item => item.subjectId === subjectId && item.visualizeTabId === tabId);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => { if (document.activeElement === document.body) heading.current?.focus({ preventScroll: true }); }, []);
  return <section className="learn-visualize" aria-labelledby={`${tabId}-heading`} data-annotation-excluded data-atlas-shortcuts="disabled">
    <header className="learn-article-header"><h2 ref={heading} id={`${tabId}-heading`} tabIndex={-1}>Visualize</h2><p className="learn-reading-intro">Explore the {learnSubjects.find(item => item.slug === subjectId)?.title ?? subjectId} in 3D. Rotate, zoom and select anatomical structures.</p></header>
    {subjectId === 'respiratory' && <p className="learn-anatomy-disclosure">Male and female study models show airways and lung vessel assemblies. Choose HRA female reference for segmented lung tissue and lobes. Nasal cavity, complete pharynx and pleura have no verified shortcuts. Only inferior nasal conchae are represented. Model coverage varies.</p>}
    {lesson?.coverageNote && <p className="learn-anatomy-disclosure">{lesson.coverageNote}</p>}
    {lesson ? <LearningAnatomyViewer lesson={lesson}/> : <p>This subject does not have an interactive anatomy lesson yet.</p>}
  </section>;
}
