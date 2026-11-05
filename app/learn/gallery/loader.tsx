import { Component, lazy, Suspense, type ReactNode } from 'react';
const Gallery = lazy(() => import('./page'));
class GalleryBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <section className="learn-article-header" role="alert"><h2>Gallery could not be opened</h2><p>The other Learn tabs are still available.</p><button type="button" onClick={() => window.location.reload()}>Reload Gallery</button></section> : this.props.children; }
}
export function GalleryLoader(props: { tabId: string; subjectSlug: string }) {
  return <div className="learn-gallery-slot"><GalleryBoundary><Suspense fallback={<p role="status">Opening Gallery…</p>}><Gallery {...props}/></Suspense></GalleryBoundary></div>;
}
