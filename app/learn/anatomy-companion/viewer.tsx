import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Minus, Plus, RotateCcw } from 'lucide-react';
import { explanation, type SceneState } from '../../anatomy';
import { MODEL_REGISTRY } from '../../model-registry';
import type { CanonicalConceptId, ModelId } from '../../identity-contracts';
import { useTheme } from '../../theme-store';
import { useDisplay } from '../../display-store';
import { modelGrounding } from '../../spatial-presentation';
import { availableRepresentations, learningScope, learningSceneState, loadLearningCatalogue, partBounds, type LearningCatalogue } from './model';
import type { AnatomyLesson } from './references';
import type { AnatomyRequest } from './learning-viewer';

const AnatomyScene = lazy(() => import('../../scene'));
const noAction = () => {};

export default function LearningViewer({ lesson, requested, active }: { lesson: AnatomyLesson; requested?: AnatomyRequest; active: boolean }) {
  const [modelId, setModelId] = useState<ModelId>('bp3d-male-4');
  const [catalogue, setCatalogue] = useState<LearningCatalogue | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [focused, setFocused] = useState<CanonicalConceptId | ''>(requested?.conceptId ?? ''), [picked, setPicked] = useState<string | null>(null);
  const [context, setContext] = useState(false), [reset, setReset] = useState(0), [view, setView] = useState<SceneState['view']>('three-quarter'), [intent, setIntent] = useState<'reset' | 'preset'>('preset');
  const [interactive, setInteractive] = useState(() => !window.matchMedia('(pointer: coarse)').matches);
  const [ready, setReady] = useState(false), [progress, setProgress] = useState(0), [zoom, setZoom] = useState(0);
  const { mode } = useTheme(), display = useDisplay(), model = MODEL_REGISTRY[modelId];
  const current = catalogue?.model.id === modelId ? catalogue : null;
  useEffect(() => {
    const controller = new AbortController(); setCatalogue(null); setError(''); setReady(false); setProgress(0);
    void loadLearningCatalogue(model, controller.signal).then(data => { if (!controller.signal.aborted) setCatalogue(data); }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Anatomy could not be loaded.'); });
    return () => controller.abort();
  }, [model, retry]);
  useEffect(() => { if (requested) { setFocused(requested.conceptId); setPicked(null); setView('three-quarter'); setIntent('preset'); setReset(value => value + 1); } }, [requested?.conceptId, requested?.revision]);
  const scope = useMemo(() => current ? learningScope(current, lesson, context) : null, [current, lesson, context]);
  useEffect(() => { setReady(false); setProgress(0); }, [scope?.atlas]);
  const reference = lesson.structures.find(item => item.conceptId === focused);
  const resolved = useMemo(() => current && focused ? availableRepresentations(current, focused) : [], [current, focused]);
  const selected = useMemo(() => picked ? [picked] : resolved.map(item => item.sourcePart.id), [picked, resolved]);
  const selectedParts = useMemo(() => current?.atlas.parts.filter(part => selected.includes(part.id)) ?? [], [current, selected]);
  const focus = useMemo(() => partBounds(selectedParts), [selectedParts]);
  const state = useMemo(() => current && scope ? learningSceneState(current, scope, selected, focus, context, reset, view, intent) : null, [current, scope, selected, focus, context, reset, view, intent]);
  const sceneDisplay = useMemo(() => ({ ...display, sceneFloor: 'void' as const }), [display]);
  const stageOffset = useMemo(() => current ? modelGrounding(current.atlas.parts) : 0, [current]);
  const unavailable = !!(current && focused && !resolved.length && !picked);
  const pickedPart = current?.atlas.parts.find(part => part.id === picked);
  const name = pickedPart?.name ?? reference?.label ?? 'Complete digestive system';
  const description = pickedPart ? explanation(pickedPart.name, pickedPart.system, model.sex) : reference?.summary ?? 'Rotate and inspect the digestive anatomy. Select a structure in the model or choose one above.';
  const choose = (id: CanonicalConceptId | '') => { setFocused(id); setPicked(null); setView('three-quarter'); setIntent('preset'); setReset(value => value + 1); };
  const choosePart = (id: string) => {
    if (!current || !scope?.atlas.parts.some(part => part.id === id)) return;
    const parent = lesson.structures.find(item => availableRepresentations(current, item.conceptId).some(representation => representation.sourcePart.id === id));
    setFocused(parent?.conceptId ?? ''); setPicked(id);
  };
  const exploreConcept = pickedPart ? current?.identity.sourceConceptCanonicalId(pickedPart.conceptId) : focused;
  const exploreHref = `${model.route ?? '/male'}${exploreConcept && !unavailable ? `?concept=${encodeURIComponent(exploreConcept)}` : ''}`;
  return <>
    <div className="learn-anatomy-controls">
      <label>Model<select value={modelId} onChange={event => { setModelId(event.target.value as ModelId); setPicked(null); }}><option value="bp3d-male-4">Male reference</option><option value="female-study-v3">Female study model</option></select></label>
      <label>Focus anatomy<select value={focused} disabled={!current} onChange={event => choose(event.target.value as CanonicalConceptId | '')}><option value="">Complete digestive system</option>{lesson.structures.map(item => <option key={item.conceptId} value={item.conceptId}>{item.label}{current && !availableRepresentations(current, item.conceptId).length ? ' — unavailable' : ''}</option>)}</select></label>
    </div>
    <div className="learn-anatomy-stage" data-interactive={interactive} role="group" aria-label="Interactive digestive anatomy" tabIndex={0} onKeyDown={event => {
      if (!ready || event.ctrlKey || event.altKey || event.metaKey || event.target instanceof HTMLSelectElement) return;
      if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(value => value + 1); }
      if (event.key === '-') { event.preventDefault(); setZoom(value => value - 1); }
    }}>
      {current && scope && state && !error && <Suspense fallback={<p className="learn-anatomy-status" role="status">Starting 3D renderer…</p>}><AnatomyScene embedded active={active} stageOffset={stageOffset} zoomSteps={zoom} modelId={modelId} atlas={scope.atlas} state={state} display={sceneDisplay} theme={mode} viewLocked={false} rotationSpeed={1} revealed={ready} onReady={() => setReady(true)} onSettled={noAction} onAssistedView={setView} explodePlayback={null} onExplodePlaybackUpdate={noAction} onSelect={choosePart} onProgress={setProgress} onError={setError}/></Suspense>}
      {!ready && !error && <p className="learn-anatomy-status" role="status">{current ? `Loading anatomy · ${progress}%` : 'Loading anatomical catalogue…'}</p>}
      {error && <div className="learn-anatomy-status" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Retry 3D</button></div>}
      {ready && !interactive && <button type="button" className="learn-anatomy-enable" onClick={() => setInteractive(true)}>Interact with model</button>}
    </div>
    <div className="learn-anatomy-actions">
      <button type="button" disabled={!ready} onClick={() => { setIntent('reset'); setView('three-quarter'); setReset(value => value + 1); }}><RotateCcw size={15} aria-hidden="true"/>Reset View</button>
      <button type="button" disabled={!ready} aria-label="Zoom in" onClick={() => setZoom(value => value + 1)}><Plus size={16} aria-hidden="true"/></button><button type="button" disabled={!ready} aria-label="Zoom out" onClick={() => setZoom(value => value - 1)}><Minus size={16} aria-hidden="true"/></button>
      <label className="learn-anatomy-context"><input type="checkbox" checked={context} onChange={event => setContext(event.target.checked)}/>Surrounding context</label>
      <button type="button" disabled={!ready} aria-pressed={interactive} onClick={() => setInteractive(value => !value)}>{interactive ? 'Pause interaction' : 'Enable interaction'}</button>
    </div>
    <div className="learn-anatomy-views" role="group" aria-label="Anatomy camera angle">{(['three-quarter', 'front', 'side', 'back'] as const).map(angle => <button type="button" key={angle} disabled={!ready} aria-pressed={view === angle} onClick={() => { setIntent('preset'); setView(angle); }}>{angle === 'three-quarter' ? '¾ view' : angle[0].toUpperCase() + angle.slice(1)}</button>)}</div>
    <div className="learn-anatomy-selection" aria-live="polite"><h4>{name}</h4>{unavailable ? <p>{reference?.label} is not represented in this model. No substitute anatomy is highlighted.</p> : <><p>{description}</p>{pickedPart && !reference && <small>System overview · structure identified from source anatomy</small>}</>}</div>
    <div className="learn-anatomy-links"><button type="button" onClick={() => choose('')}>Full digestive system</button><a href={exploreHref} target="_blank" rel="noreferrer">Open in Explore <ArrowUpRight size={14} aria-hidden="true"/></a></div>
    <p className="learn-anatomy-help">Drag to rotate · Pinch or + / − to zoom. Pause interaction to scroll over the model.</p>
    {model.experimental && <p className="learn-anatomy-disclosure">Female study model · adapted reference geometry with estimated proportions. Placement is experimental and has not been independently anatomically validated.</p>}
  </>;
}
