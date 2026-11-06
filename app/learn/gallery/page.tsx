import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Images, Search, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { categoryLabel, figureSource, filterFigures, parseGallery, type GalleryCollection } from './model';
import { ZoomFigure } from './zoom-figure';
import '../subject-menu.css';
import './gallery.css';

function GalleryContent({ collection, assetBase }: { collection: GalleryCollection; assetBase: string }) {
  const [category, setCategory] = useState('all'), [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<string[]>([]);
  const opener = useRef<HTMLButtonElement | null>(null);
  const figures = useMemo(() => filterFigures(collection.items, category, query), [collection, category, query]);
  const index = figures.findIndex(figure => figure.id === selected), figure = figures[index];
  const navigate = (direction: number) => { if (figures.length) setSelected(figures[(index + direction + figures.length) % figures.length].id); };
  const filterOptions = [{ id: 'all', label: 'All', count: collection.items.length }, ...collection.gallerySections.map(section => ({ id: section.id, label: categoryLabel(section.id, section.title), count: collection.items.filter(item => item.category === section.id).length }))];
  return <>
    <div className="learn-gallery-tools">
      <div className="learn-gallery-filters" role="group" aria-label="Gallery categories">{filterOptions.map(option => <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}<span>{option.count}</span></button>)}</div>
      <label className="learn-gallery-search"><Search size={17} aria-hidden="true"/><span className="sr-only">Search gallery titles, descriptions and tags</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search figures…"/></label>
    </div>
    <p className="learn-gallery-count" role="status" aria-live="polite">{figures.length} of {collection.items.length} figures{query.trim() ? ` matching “${query.trim()}”` : ''}</p>
    {figures.length ? <ul className="learn-gallery-grid">{figures.map(item => <li key={item.id}>
      <button type="button" className="learn-gallery-card" aria-haspopup="dialog" aria-label={`Open figure: ${item.title}`} onClick={event => { opener.current = event.currentTarget; setSelected(item.id); }}>
        <span className="learn-gallery-thumbnail">{thumbnailErrors.includes(item.id) ? <span className="learn-gallery-thumbnail-error">Preview unavailable · Open full-size figure</span> : <img src={`${assetBase}/${item.thumbnail}`} alt={item.alt} width={640} height={450} loading="lazy" decoding="async" onError={() => setThumbnailErrors(previous => previous.includes(item.id) ? previous : [...previous, item.id])}/>}</span>
        <span className="learn-gallery-card-copy"><span className="learn-gallery-category">{categoryLabel(item.category)}</span><strong>{item.title}</strong><span className="learn-gallery-caption">{item.description}</span><span className="learn-gallery-card-action">Inspect figure <span aria-hidden="true">↗</span></span></span>
      </button>
    </li>)}</ul> : <div className="learn-gallery-empty"><p>No figures match these filters.</p><button type="button" onClick={() => { setCategory('all'); setQuery(''); }}>Clear filters</button></div>}
    <Dialog open={!!figure} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="learn-menu-surface learn-gallery learn-gallery-viewer" overlayClassName="learn-menu-backdrop" showCloseButton={false} aria-modal="true" data-atlas-shortcuts="disabled" data-annotation-excluded
        initialFocus={() => document.querySelector<HTMLElement>('.learn-gallery-viewer .learn-gallery-image-stage')}
        finalFocus={() => opener.current?.isConnected ? opener.current : null}
        onKeyDown={event => {
          if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as Element).closest('[contenteditable="true"]')) return;
          if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
          else if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
        }}>
        {figure && <>
          <header className="learn-gallery-viewer-header"><div className="learn-menu-eyebrow"><Images size={15} aria-hidden="true"/><span>Human Atlas · Gallery</span></div><div className="learn-gallery-page-controls"><button type="button" aria-label="Previous figure" aria-keyshortcuts="ArrowLeft" disabled={figures.length < 2} onClick={() => navigate(-1)}><ArrowLeft size={18} aria-hidden="true"/></button><span aria-live="polite">{index + 1} / {figures.length}</span><button type="button" aria-label="Next figure" aria-keyshortcuts="ArrowRight" disabled={figures.length < 2} onClick={() => navigate(1)}><ArrowRight size={18} aria-hidden="true"/></button></div><DialogClose className="learn-gallery-close" aria-label="Close image viewer"><X size={19} aria-hidden="true"/></DialogClose></header>
          <div className="learn-gallery-viewer-body">
            <ZoomFigure key={figure.id} figure={figure} src={`${assetBase}/${figure.image}`}/>
            <div className="learn-gallery-figure-copy"><span className="learn-gallery-category">{categoryLabel(figure.category)}</span><DialogTitle className="learn-gallery-figure-title">{figure.title}</DialogTitle><DialogDescription className="learn-gallery-figure-description">{figure.description}</DialogDescription><p className="learn-gallery-provenance">{figureSource(figure)}</p></div>
          </div>
          <footer className="learn-gallery-viewer-footer"><span>← / → Previous / next figure</span><span>Esc Close viewer</span></footer>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}

export default function EducationalGallery({ tabId, subjectSlug }: { tabId: string; subjectSlug: string }) {
  const [collection, setCollection] = useState<GalleryCollection | null>(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => { if (document.activeElement === document.body) heading.current?.focus({ preventScroll: true }); }, []);
  const assetBase = `/images/learn/${subjectSlug}/gallery`;
  useEffect(() => {
    const controller = new AbortController();
    setCollection(null);
    setError('');
    void fetch(`${assetBase}/gallery.json`, { signal: controller.signal, credentials: 'same-origin' }).then(async response => {
      if (!response.ok) throw new Error('The gallery could not load. Please try again.');
      return parseGallery(await response.json());
    }).then(data => { if (!controller.signal.aborted) setCollection(data); }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'The gallery could not load.'); });
    return () => controller.abort();
  }, [assetBase, attempt]);
  return <section className="learn-gallery" data-annotation-excluded data-atlas-shortcuts="disabled" aria-labelledby={`${tabId}-heading`}>
    <header className="learn-article-header"><h2 ref={heading} id={`${tabId}-heading`} tabIndex={-1}>Digestive System Gallery</h2><p className="learn-reading-intro">30 curated anatomical models, illustrations, and physiological diagrams from the course lectures.</p></header>
    {error ? <div className="learn-gallery-notice" role="alert"><h3>Gallery unavailable</h3><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div> : collection ? <GalleryContent collection={collection} assetBase={assetBase}/> : <p role="status">Loading gallery…</p>}
  </section>;
}
