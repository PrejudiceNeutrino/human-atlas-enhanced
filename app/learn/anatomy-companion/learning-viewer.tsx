import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CanonicalConceptId } from '../../identity-contracts';
import type { AnatomyLesson } from './references';
import './companion.css';

const Viewer = lazy(() => import('./viewer'));
export interface AnatomyRequest { conceptId: CanonicalConceptId; revision: number }
class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert">The interactive viewer could not be opened. The reading material is still available. Reload the page to retry.</p> : this.props.children; }
}

export function LearningAnatomyViewer({ lesson, requested, compact = false }: { lesson: AnatomyLesson; requested?: AnatomyRequest; compact?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false), [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      const intersects = entries.some(entry => entry.isIntersecting);
      setVisible(intersects); if (intersects) setStarted(true);
    }, { root: node.closest('.learn-shell'), threshold: .01 });
    observer.observe(node); return () => observer.disconnect();
  }, []);
  return <div ref={host} className={`learn-anatomy ${compact ? 'learn-anatomy--compact' : ''}`} data-annotation-excluded data-atlas-shortcuts="disabled">
    <ViewerBoundary>{started ? <Suspense fallback={<div className="learn-anatomy-loading" role="status">Opening interactive anatomy…</div>}><Viewer lesson={lesson} requested={requested} active={visible}/></Suspense> : <div className="learn-anatomy-loading"><p>Interactive anatomy loads when this panel is in view.</p><button type="button" onClick={() => { setVisible(true); setStarted(true); }}>Load interactive model</button></div>}</ViewerBoundary>
  </div>;
}
