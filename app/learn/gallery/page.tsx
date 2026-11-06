import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowRight, Info, Search, Star, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { categoryLabel, figureSource, filterFigures, parseGallery, type GalleryCollection } from './model';
import { ZoomFigure } from './zoom-figure';
import { createGalleryPreferencesStore } from './preferences';
import '../subject-menu.css';
import './gallery.css';

function GalleryContent({ collection, assetBase, subjectSlug }: { collection: GalleryCollection; assetBase: string; subjectSlug: string }) {
  const [category, setCategory] = useState('all'), [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  const [thumbnailErrors, setThumbnailErrors] = useState<string[]>([]);
  const [preferencesStore] = useState(() => {
    let storage: Storage | undefined;
    try { storage = window.localStorage; } catch { /* The store exposes session-only persistence errors. */ }
    return createGalleryPreferencesStore(subjectSlug, collection.items.map(item => item.id), storage);
  });
  const { preferences, error: preferencesError } = useSyncExternalStore(preferencesStore.subscribe, preferencesStore.getSnapshot);
  const starred = useMemo(() => new Set(preferences.starredIds), [preferences.starredIds]);
  const starredFilter = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const refresh = (event: StorageEvent) => { if (event.key === preferencesStore.key || event.key === null) preferencesStore.refresh(); };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [preferencesStore]);
  const opener = useRef<HTMLButtonElement | null>(null);
  const figures = useMemo(() => filterFigures(collection.items, category, query).filter(item => !preferences.starredOnly || starred.has(item.id)), [collection, category, query, preferences.starredOnly, starred]);
  const index = figures.findIndex(figure => figure.id === selected), figure = figures[index];
  useEffect(() => { if (selected && !figure) setSelected(null); }, [selected, figure]);
  const toggleStar = (id: string) => {
    if (preferences.starredOnly && starred.has(id)) {
      if (selected === id) setSelected(figures.length > 1 ? figures[(index + 1) % figures.length].id : null);
      else starredFilter.current?.focus({ preventScroll: true });
    }
    preferencesStore.toggleStar(id);
  };
  const navigate = (direction: number) => { if (figures.length) setSelected(figures[(index + direction + figures.length) % figures.length].id); };
  const filterOptions = [{ id: 'all', label: 'All', count: collection.items.length }, ...collection.gallerySections.map(section => ({ id: section.id, label: categoryLabel(section.id, section.title), count: collection.items.filter(item => item.category === section.id).length }))];
  return <>
    <div className="learn-gallery-tools">
      <div className="learn-gallery-filters" role="group" aria-label="Gallery categories">{filterOptions.map(option => <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}<span>{option.count}</span></button>)}</div>
      <button ref={starredFilter} type="button" className="learn-gallery-starred-filter" aria-pressed={preferences.starredOnly} title="Show only your starred figures. Saved in this browser." onClick={() => preferencesStore.toggleStarredOnly()}><Star size={16} aria-hidden="true" fill={preferences.starredOnly ? 'currentColor' : 'none'}/>Starred<span>{starred.size}</span></button>
      <label className="learn-gallery-search"><Search size={17} aria-hidden="true"/><span className="sr-only">Search gallery titles, descriptions and tags</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search figures…"/></label>
      <p className="sr-only" role="status" aria-live="polite">{figures.length} of {collection.items.length} figures{preferences.starredOnly ? ' · Starred only' : ''}{query.trim() ? ` matching “${query.trim()}”` : ''}</p>
    </div>
    {preferencesError && <p className="learn-gallery-preferences-error" role="status">{preferencesError}</p>}
    {figures.length ? <ul className="learn-gallery-grid">{figures.map(item => <li key={item.id}>
      <button type="button" className="learn-gallery-card" aria-haspopup="dialog" aria-label={`Open figure: ${item.title}`} onClick={event => { opener.current = event.currentTarget; setSelected(item.id); }}>
        <span className="learn-gallery-thumbnail">{thumbnailErrors.includes(item.id) ? <span className="learn-gallery-thumbnail-error">Preview unavailable · Open full-size figure</span> : <img src={`${assetBase}/${item.thumbnail}`} alt={item.alt} width={640} height={450} loading="lazy" decoding="async" onError={() => setThumbnailErrors(previous => previous.includes(item.id) ? previous : [...previous, item.id])}/>}</span>
        <span className="learn-gallery-card-copy"><span className="learn-gallery-category">{categoryLabel(item.category)}</span><strong>{item.title}</strong><span className="learn-gallery-caption">{item.description}</span><span className="learn-gallery-card-action">Inspect figure <span aria-hidden="true">↗</span></span></span>
      </button>
      <button type="button" className="learn-gallery-star learn-gallery-card-star" aria-label={`Star figure: ${item.title}`} aria-pressed={starred.has(item.id)} title={starred.has(item.id) ? 'Remove star' : 'Star this figure'} onClick={() => toggleStar(item.id)}><Star size={19} aria-hidden="true" fill={starred.has(item.id) ? 'currentColor' : 'none'}/></button>
    </li>)}</ul> : <div className="learn-gallery-empty"><p>{preferences.starredOnly && !starred.size ? 'No starred figures yet. Star images to build your own selection.' : 'No figures match these filters.'}</p><button type="button" onClick={() => { setCategory('all'); setQuery(''); if (preferences.starredOnly) preferencesStore.toggleStarredOnly(); }}>{preferences.starredOnly && !starred.size ? 'Browse all figures' : 'Clear filters'}</button></div>}
    <Dialog open={!!figure} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="learn-menu-surface learn-gallery learn-gallery-viewer" overlayClassName="learn-menu-backdrop" showCloseButton={false} aria-modal="true" data-atlas-shortcuts="disabled" data-annotation-excluded
        initialFocus={() => document.querySelector<HTMLElement>('.learn-gallery-viewer .learn-gallery-image-stage')}
        finalFocus={() => opener.current?.isConnected ? opener.current : starredFilter.current}
        onKeyDown={event => {
          if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as Element).closest('[contenteditable="true"]')) return;
          if (event.key === 'ArrowLeft') { event.preventDefault(); navigate(-1); }
          else if (event.key === 'ArrowRight') { event.preventDefault(); navigate(1); }
        }}>
        {figure && <ZoomFigure key={figure.id} figure={figure} src={`${assetBase}/${figure.image}`}
          navigation={<div className="learn-gallery-page-controls" role="group" aria-label="Figure navigation"><button type="button" aria-label="Previous figure" title="Previous figure (←)" aria-keyshortcuts="ArrowLeft" disabled={figures.length < 2} onClick={() => navigate(-1)}><ArrowLeft size={18} aria-hidden="true"/></button><span aria-live="polite">{index + 1} / {figures.length}</span><button type="button" aria-label="Next figure" title="Next figure (→)" aria-keyshortcuts="ArrowRight" disabled={figures.length < 2} onClick={() => navigate(1)}><ArrowRight size={18} aria-hidden="true"/></button></div>}
          actions={<div className="learn-gallery-viewer-actions"><button type="button" className="learn-gallery-star" aria-label={`Star figure: ${figure.title}`} aria-pressed={starred.has(figure.id)} title={starred.has(figure.id) ? 'Remove star' : 'Star this figure'} onClick={() => toggleStar(figure.id)}><Star size={18} aria-hidden="true" fill={starred.has(figure.id) ? 'currentColor' : 'none'}/></button><button type="button" className="learn-gallery-details-toggle" aria-label="Figure details" title="Figure details" aria-expanded={showDetails} aria-controls={detailsId} onClick={() => setShowDetails(value => !value)}><Info size={17} aria-hidden="true"/><span>Details</span></button><DialogClose className="learn-gallery-close" aria-label="Close image viewer" title="Close viewer (Esc)"><X size={19} aria-hidden="true"/></DialogClose></div>}
          caption={<footer className="learn-gallery-figure-copy"><div className="learn-gallery-caption-heading"><DialogTitle className="learn-gallery-figure-title">{figure.title}</DialogTitle><span className="learn-gallery-category">{categoryLabel(figure.category)}</span></div><div id={detailsId} className={showDetails ? 'learn-gallery-details' : 'sr-only'}><DialogDescription className="learn-gallery-figure-description">{figure.description}</DialogDescription><p className="learn-gallery-provenance">{figureSource(figure)}</p><p className="learn-gallery-gestures">Scroll or pinch to zoom · Drag to pan · Double-click to fit / enlarge · + / − zoom · 0 fit · ← / → browse · Esc close</p></div></footer>}
        />}
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
    {error ? <div className="learn-gallery-notice" role="alert"><h3>Gallery unavailable</h3><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div> : collection ? <GalleryContent key={subjectSlug} collection={collection} assetBase={assetBase} subjectSlug={subjectSlug}/> : <p role="status">Loading gallery…</p>}
  </section>;
}
