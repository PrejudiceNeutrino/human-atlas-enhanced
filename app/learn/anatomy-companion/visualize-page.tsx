import { useLayoutEffect, useRef } from 'react';
import { anatomyLessons } from './references';
import { LearningAnatomyViewer } from './learning-viewer';

export function VisualizePage({ subjectId, tabId }: { subjectId: string; tabId: string }) {
  const lesson = anatomyLessons.find(item => item.subjectId === subjectId && item.visualizeTabId === tabId);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => { if (document.activeElement === document.body) heading.current?.focus({ preventScroll: true }); }, []);
  return <section className="learn-visualize" aria-labelledby={`${tabId}-heading`} data-annotation-excluded data-atlas-shortcuts="disabled">
    <header className="learn-article-header"><h2 ref={heading} id={`${tabId}-heading`} tabIndex={-1}>Visualize</h2><p className="learn-reading-intro">Explore the Digestive System in 3D. Rotate, zoom and select anatomical structures.</p></header>
    {lesson ? <LearningAnatomyViewer lesson={lesson}/> : <p>This subject does not have an interactive anatomy lesson yet.</p>}
  </section>;
}
