import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Minus, Plus, RotateCcw, Scan } from 'lucide-react';
import type { GalleryFigure } from './model';

type Point = { x: number; y: number };
type Geometry = { width: number; height: number; stageWidth: number; stageHeight: number; fit: number };
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

export function ZoomFigure({ figure, src, navigation, actions, caption }: { figure: GalleryFigure; src: string; navigation: ReactNode; actions: ReactNode; caption: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null), picture = useRef<HTMLImageElement>(null);
  const geometry = useRef<Geometry>({ width: 0, height: 0, stageWidth: 0, stageHeight: 0, fit: 1 });
  const view = useRef({ scale: 1, x: 0, y: 0 }), pointers = useRef(new Map<number, Point>());
  const [size, setSize] = useState({ width: 0, height: 0 }), [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true), [failed, setFailed] = useState(false);

  function apply(nextScale: number, x: number, y: number) {
    const g = geometry.current, maximum = Math.max(1, 1 / g.fit);
    const zoom = Math.max(1, Math.min(maximum, nextScale));
    view.current = { scale: zoom, x: clamp(x, Math.max(0, (g.width * zoom - g.stageWidth) / 2 + 16)), y: clamp(y, Math.max(0, (g.height * zoom - g.stageHeight) / 2 + 16)) };
    if (zoom === 1) { view.current.x = 0; view.current.y = 0; }
    if (picture.current) picture.current.style.transform = `translate(-50%, -50%) translate(${view.current.x}px, ${view.current.y}px) scale(${zoom})`;
    if (stage.current) stage.current.dataset.zoomed = String(zoom > 1.001);
    // Panning only updates the image transform; it does not rerender the gallery or viewer.
    setScale(previous => Math.abs(previous - zoom) > .001 ? zoom : previous);
  }
  function zoomTo(next: number, point?: Point) {
    const previous = view.current, maximum = Math.max(1, 1 / geometry.current.fit);
    const nextScale = Math.max(1, Math.min(maximum, next)), ratio = nextScale / previous.scale;
    const anchor = point ?? { x: 0, y: 0 };
    apply(nextScale, anchor.x - (anchor.x - previous.x) * ratio, anchor.y - (anchor.y - previous.y) * ratio);
  }
  function localPoint(client: Point): Point {
    const rect = stage.current!.getBoundingClientRect();
    return { x: client.x - rect.left - rect.width / 2, y: client.y - rect.top - rect.height / 2 };
  }
  useLayoutEffect(() => {
    const node = stage.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    const measure = () => {
      const width = node.clientWidth, height = node.clientHeight;
      const fit = Math.min(1, Math.max(1, width - 32) / figure.width, Math.max(1, height - 32) / figure.height);
      const imageWidth = figure.width * fit, imageHeight = figure.height * fit;
      geometry.current = { width: imageWidth, height: imageHeight, stageWidth: width, stageHeight: height, fit };
      setSize({ width: imageWidth, height: imageHeight });
      apply(1, 0, 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [figure.width, figure.height]);
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || failed) return;
      event.preventDefault();
      zoomTo(view.current.scale * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .0025), localPoint({ x: event.clientX, y: event.clientY }));
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, [failed]);

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (failed || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };
  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const before = [...pointers.current.values()];
    const previous = pointers.current.get(event.pointerId)!;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = [...pointers.current.values()];
    if (after.length === 1) apply(view.current.scale, view.current.x + event.clientX - previous.x, view.current.y + event.clientY - previous.y);
    else if (after.length === 2) {
      const distance = (points: Point[]) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const midpoint = (points: Point[]) => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
      const a = midpoint(before), b = midpoint(after);
      zoomTo(view.current.scale * distance(after) / Math.max(1, distance(before)), localPoint(b));
      apply(view.current.scale, view.current.x + b.x - a.x, view.current.y + b.y - a.y);
    }
  };
  const pointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => { pointers.current.delete(event.pointerId); };
  const maximum = Math.max(1, 1 / geometry.current.fit);
  return <div className="learn-gallery-inspector" onKeyDown={event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target instanceof HTMLInputElement || failed) return;
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomTo(view.current.scale * 1.25); }
    else if (event.key === '-') { event.preventDefault(); zoomTo(view.current.scale / 1.25); }
    else if (event.key === '0') { event.preventDefault(); apply(1, 0, 0); }
  }}>
    <header className="learn-gallery-viewer-toolbar" aria-label="Image viewer controls">
      {navigation}
      <div className="learn-gallery-zoom-controls" role="group" aria-label="Image zoom">
      <button type="button" aria-label="Zoom out" title="Zoom out (−)" disabled={failed || scale <= 1.001} onClick={() => zoomTo(view.current.scale / 1.25)}><Minus size={17} aria-hidden="true"/></button>
      <output aria-label="Zoom relative to fit">{Math.round(scale * 100)}%</output>
      <button type="button" aria-label="Zoom in" title="Zoom in (+)" disabled={failed || scale >= maximum - .001} onClick={() => zoomTo(view.current.scale * 1.25)}><Plus size={17} aria-hidden="true"/></button>
      <button type="button" disabled={failed} onClick={() => apply(1, 0, 0)} title="Fit image (0)"><RotateCcw size={15} aria-hidden="true"/>Fit</button>
      <button type="button" aria-label="Actual size" disabled={failed || maximum <= 1.001} onClick={() => zoomTo(maximum)} title="Actual size: one image pixel per screen CSS pixel"><Scan size={15} aria-hidden="true"/>1:1</button>
      </div>
      {actions}
    </header>
    <div ref={stage} className="learn-gallery-image-stage" role="group" aria-label="Image inspection area" aria-describedby="learn-gallery-gestures" tabIndex={0}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}
      onDoubleClick={event => { if (!failed) zoomTo(view.current.scale > 1 ? 1 : maximum, localPoint({ x: event.clientX, y: event.clientY })); }}>
      {loading && !failed && <span className="learn-gallery-image-status" role="status">Loading full-size figure…</span>}
      {failed ? <p className="learn-gallery-image-status" role="alert">This figure could not load. Close and reopen it to retry.</p> : <img ref={picture} src={src} alt={figure.alt} width={figure.width} height={figure.height} decoding="async" draggable={false} onLoad={() => setLoading(false)} onError={() => { setFailed(true); setLoading(false); }} style={{ width: size.width, height: size.height }} />}
    </div>
    <span id="learn-gallery-gestures" className="sr-only">Scroll or pinch to zoom. Drag to pan. Double-click to fit or enlarge. Plus and minus zoom, 0 fits, Left and Right browse figures, Escape closes.</span>
    {caption}
  </div>;
}
