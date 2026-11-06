import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Info, Keyboard, Layers3, LockKeyhole, Minus, MousePointer2, Pause, Plus, RotateCcw, UnlockKeyhole } from 'lucide-react';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { explanation, partIsVisible, type SceneState, type SystemId } from '../../anatomy';
import { MODEL_REGISTRY } from '../../model-registry';
import type { CanonicalConceptId, ModelId } from '../../identity-contracts';
import { useTheme } from '../../theme-store';
import { useDisplay } from '../../display-store';
import { useRotation } from '../../rotation-store';
import { RotationControls } from '../../rotation-controls';
import { useExplodePlayback } from '../../use-explode-playback';
import { useExplodeIdle } from '../../use-explode-idle';
import { ExplosionControls } from '../../explosion-controls';
import { EXPLODE_FAMILY_BY_SYSTEM } from '../../explosion-layout';
import { resolveVisibility } from '../../visibility';
import { viewerShortcut } from '../../viewer-shortcuts';
import { clearActiveSelection, exitIsolation, isolateSelection, selectAssemblyMember, toggleAllSystems } from '../../viewer-interaction';
import { hiddenPartIdsForModel, hiddenRepresentationsForModel, hideSelectedRepresentations, restoreHiddenRepresentation, restoreHiddenRepresentations, selectRepresentations } from '../../hide-restore';
import { modelGrounding } from '../../spatial-presentation';
import { availableRepresentations, initialLearningState, learningScope, learningSceneState, loadLearningCatalogue, partBounds, type LearningCatalogue } from './model';
import { LearningInspector, LearningVisibility } from './panels';
import type { AnatomyLesson } from './references';
import type { AnatomyRequest } from './learning-viewer';

const AnatomyScene = lazy(() => import('../../scene'));

export default function LearningViewer({ lesson, requested, active, compact = false }: { lesson: AnatomyLesson; requested?: AnatomyRequest; active: boolean; compact?: boolean }) {
  const [modelId, setModelId] = useState<ModelId>('bp3d-male-4');
  const [catalogue, setCatalogue] = useState<LearningCatalogue | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const model = MODEL_REGISTRY[modelId];
  useEffect(() => {
    const controller = new AbortController(); setCatalogue(null); setError('');
    void loadLearningCatalogue(model, controller.signal).then(data => { if (!controller.signal.aborted) setCatalogue(data); }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Anatomy could not be loaded.'); });
    return () => controller.abort();
  }, [model, retry]);
  const current = catalogue?.model.id === modelId ? catalogue : null;
  return current ? <LearningWorkspace key={modelId} catalogue={current} lesson={lesson} requested={requested} active={active} compact={compact} onModelChange={setModelId}/> : <div className="learn-anatomy-loading" role={error ? 'alert' : 'status'}><p>{error || 'Loading anatomical catalogue…'}</p>{error && <><button type="button" onClick={() => setRetry(value => value + 1)}>Retry 3D</button><a href={model.route ?? '/male'} target="_blank" rel="noreferrer">Open in Explore</a></>}</div>;
}

function LearningWorkspace({ catalogue, lesson, requested, active, compact, onModelChange }: { catalogue: LearningCatalogue; lesson: AnatomyLesson; requested?: AnatomyRequest; active: boolean; compact: boolean; onModelChange: (id: ModelId) => void }) {
  const { model, identity } = catalogue;
  const [context, setContext] = useState(false);
  const scope = useMemo(() => learningScope(catalogue, lesson, context), [catalogue, lesson, context]);
  const [state, setState] = useState<SceneState>(() => initialLearningState(catalogue, scope, requested?.conceptId));
  const [focused, setFocused] = useState<CanonicalConceptId | ''>(requested?.conceptId ?? ''), [picked, setPicked] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(!compact), [inspectorOpen, setInspectorOpen] = useState(!!requested);
  const [interactive, setInteractive] = useState(() => !window.matchMedia('(pointer: coarse)').matches), [viewLocked, setViewLocked] = useState(false);
  const [settled, setSettled] = useState(false), [resetActivation, setResetActivation] = useState(0);
  const [ready, setReady] = useState(false), [progress, setProgress] = useState(0), [error, setError] = useState(''), [retry, setRetry] = useState(0), [zoom, setZoom] = useState(0);
  const stage = useRef<HTMLDivElement>(null), focusSelect = useRef<HTMLSelectElement>(null);
  const controlsId = useId(), lastRequest = useRef(requested ? `${requested.conceptId}/${requested.revision}` : '');
  const { mode } = useTheme(), display = useDisplay(), rotationSpeed = useRotation();
  useEffect(() => { setReady(false); setSettled(false); setProgress(0); setError(''); }, [scope.atlas, retry]);
  useEffect(() => {
    if (!requested) return;
    const key = `${requested.conceptId}/${requested.revision}`;
    if (lastRequest.current === key) return;
    lastRequest.current = key;
    setFocused(requested.conceptId); setPicked(null); setInspectorOpen(true);
    setState(previous => {
      const next = initialLearningState(catalogue, scope, requested.conceptId, previous.reset + 1);
      return context ? exitIsolation(next) : next;
    });
  }, [requested?.conceptId, requested?.revision, catalogue, scope]);
  const reference = lesson.structures.find(item => item.conceptId === focused);
  const selectedParts = useMemo(() => scope.atlas.parts.filter(part => state.selected.includes(part.id)), [scope.atlas, state.selected]);
  const hiddenPartIds = useMemo(() => hiddenPartIdsForModel(identity, state.hiddenRepresentationIds), [identity, state.hiddenRepresentationIds]);
  const isolatedPartIds = useMemo(() => state.isolate ? hiddenPartIdsForModel(identity, state.isolatedRepresentationIds) : undefined, [identity, state.isolate, state.isolatedRepresentationIds]);
  const contextReveal = useMemo(() => context && !state.isolate ? learningSceneState(catalogue, scope, state.selected, null, true, 0, state.view, 'preset').contextReveal : undefined, [context, catalogue, scope, state.selected, state.isolate]);
  const displayState = useMemo(() => ({ ...state, regionPartIds: scope.partIds, hiddenPartIds, isolatedPartIds, contextReveal }), [state, scope.partIds, hiddenPartIds, isolatedPartIds, contextReveal]);
  const sceneDisplay = useMemo(() => ({ ...display, sceneFloor: 'void' as const }), [display]);
  const stageOffset = useMemo(() => modelGrounding(catalogue.atlas.parts), [catalogue]);
  const visibleCount = scope.atlas.parts.filter(part => partIsVisible(part, displayState)).length;
  const familyCount = useMemo(() => {
    const visibility = { selected: new Set(state.selected), systems: new Set(state.visible) };
    return new Set(scope.atlas.parts.filter(part => resolveVisibility(part, displayState, visibility).packingEligible).map(part => EXPLODE_FAMILY_BY_SYSTEM[part.system])).size;
  }, [scope, state.selected, state.visible, state.isolate, isolatedPartIds, hiddenPartIds]);
  const playbackScope = useMemo(() => ({}), [scope, state.reset, state.visible, state.selected, state.hiddenRepresentationIds, state.isolate, familyCount]);
  const idle = useExplodeIdle(state.explode, active && ready && settled && !error);
  const playback = useExplodePlayback({ amount: state.explode, familyCount, scope: playbackScope, enabled: active && ready && !error && visibleCount > 1, onChange: amount => setState(previous => ({ ...previous, explode: amount, rotate: false })) });
  const hidden = useMemo(() => hiddenRepresentationsForModel(identity, state.hiddenRepresentationIds).flatMap(representation => {
    const part = scope.atlas.parts.find(item => item.id === representation.sourcePartId.value);
    return part ? [{ id: representation.id, part }] : [];
  }), [identity, state.hiddenRepresentationIds, scope]);
  const restoreNewest = () => { if (hidden[0]) setState(previous => restoreHiddenRepresentation(previous, hidden[0].id)); };
  const members = useMemo(() => state.isolate ? scope.atlas.parts.filter(part => isolatedPartIds?.has(part.id)) : selectedParts, [state.isolate, scope, isolatedPartIds, selectedParts]);
  const pickedPart = selectedParts.find(part => part.id === picked);
  const unavailable = !!focused && !availableRepresentations(catalogue, focused).length;
  const name = pickedPart?.name ?? reference?.label ?? (state.isolate ? 'Isolated anatomy' : 'Complete digestive system');
  const description = pickedPart ? explanation(pickedPart.name, pickedPart.system, model.sex) : reference?.summary ?? 'Select a structure in the model or use the visibility panel to inspect the digestive anatomy.';
  const choose = (id: CanonicalConceptId | '') => {
    playback.stop(false); setFocused(id); setPicked(null); setInspectorOpen(!!id);
    const ids = id ? availableRepresentations(catalogue, id).map(item => item.sourcePart.id).filter(partId => scope.partIds.has(partId)) : [];
    setState(previous => {
      const next = selectRepresentations(exitIsolation(previous), identity, ids);
      const result = { ...next, regionFocus: ids.length ? partBounds(scope.atlas.parts.filter(part => ids.includes(part.id))) : scope.fullBounds, explode: 0, rotate: false, view: 'three-quarter' as const, reset: previous.reset + 1, cameraIntent: 'preset' as const, cameraIntentRevision: (previous.cameraIntentRevision ?? 0) + 1 };
      return ids.length && !context ? isolateSelection(result, identity) : result;
    });
  };
  const choosePart = (id: string) => {
    if (!scope.partIds.has(id)) return;
    playback.stop(false); setFocused(''); setPicked(id); setInspectorOpen(true);
    setState(previous => selectAssemblyMember(previous, identity, id));
  };
  const hideSelected = () => { playback.stop(false); setFocused(''); setPicked(null); setState(previous => hideSelectedRepresentations(previous, identity)); };
  const exit = () => {
    playback.stop(false); setFocused('');
    setState(previous => ({ ...exitIsolation(previous), regionFocus: scope.fullBounds, reset: previous.reset + 1 }));
  };
  const reset = () => {
    playback.stop(false); idle.onValueChange(); setResetActivation(value => value + 1); setFocused(''); setPicked(null); setZoom(0);
    setState(previous => ({ ...initialLearningState(catalogue, scope, '', previous.reset + 1), cameraIntent: 'reset', cameraIntentRevision: (previous.cameraIntentRevision ?? 0) + 1 }));
  };
  const cameraView = (view: SceneState['view']) => setState(previous => ({ ...previous, view, rotate: false, reset: previous.reset + 1, cameraIntent: 'preset', cameraIntentRevision: (previous.cameraIntentRevision ?? 0) + 1 }));
  const toggleSystem = (id: SystemId) => {
    setFocused(''); setPicked(null); playback.stop(false);
    setState(previous => ({ ...exitIsolation(clearActiveSelection(previous)), regionFocus: scope.fullBounds, visible: previous.visible.includes(id) ? previous.visible.filter(value => value !== id) : [...previous.visible, id] }));
  };
  const toggleContext = (next: boolean) => {
    playback.stop(false); setContext(next);
    setState(previous => {
      const visible = [...new Set(learningScope(catalogue, lesson, next).atlas.parts.map(part => part.system))];
      const result = { ...exitIsolation(previous), visible, reset: previous.reset + 1 };
      return !next && result.selected.length ? isolateSelection(result, identity) : result;
    });
  };
  const exploreConcept = pickedPart ? identity.sourceConceptCanonicalId(pickedPart.conceptId) : focused;
  const exploreHref = `${model.route ?? '/male'}${exploreConcept && !unavailable ? `?concept=${encodeURIComponent(exploreConcept)}` : ''}`;
  return <div className="learn-viewer" data-atlas-shortcuts="disabled" onKeyDown={event => {
    if (!ready || !active || error) return;
    const action = viewerShortcut(event.nativeEvent, event.currentTarget);
    if (action) {
      event.preventDefault(); event.stopPropagation();
      switch (action) {
        case 'find': focusSelect.current?.focus(); break;
        case 'hide': hideSelected(); break;
        case 'restore': restoreNewest(); break;
        case 'isolate': playback.stop(false); setState(previous => isolateSelection(previous, identity)); break;
        case 'reset': reset(); break;
        case 'front': case 'side': case 'back': cameraView(action); break;
      }
    } else if ((event.key === '+' || event.key === '=' || event.key === '-') && !event.ctrlKey && !event.metaKey && !event.altKey && !(event.target as Element).closest('input,textarea,select,[role="slider"],[contenteditable]')) {
      event.preventDefault(); setZoom(value => value + (event.key === '-' ? -1 : 1));
    }
  }}>
    <header className="learn-viewer-topbar"><div className="learn-anatomy-controls"><label>Model<select value={model.id} onChange={event => onModelChange(event.target.value as ModelId)}><option value="bp3d-male-4">Male reference</option><option value="female-study-v3">Female study model</option></select></label><label>Focus anatomy<select ref={focusSelect} value={focused} onChange={event => choose(event.target.value as CanonicalConceptId | '')}><option value="">Complete digestive system</option>{lesson.structures.map(item => <option key={item.conceptId} value={item.conceptId}>{item.label}{!availableRepresentations(catalogue, item.conceptId).length ? ' — unavailable' : ''}</option>)}</select></label></div>
    <div className="learn-viewer-toolbar"><div><button type="button" aria-controls={`${controlsId}-visibility`} aria-expanded={layersOpen} onClick={() => setLayersOpen(value => !value)}><Layers3 size={16}/>Visibility<span className="learn-viewer-hidden-count">{hidden.length} hidden</span></button><button type="button" aria-controls={`${controlsId}-inspector`} aria-expanded={inspectorOpen} onClick={() => setInspectorOpen(value => !value)}><Info size={16}/>Inspect</button></div><div><button type="button" disabled={!ready} aria-pressed={interactive} aria-label={interactive ? 'Pause model interaction' : 'Enable model interaction'} title={interactive ? 'Pause model interaction' : 'Enable model interaction'} onClick={() => setInteractive(value => !value)}>{interactive ? <Pause size={15}/> : <MousePointer2 size={15}/>}<span>{interactive ? 'Pause' : 'Interact'}</span></button><a href={exploreHref} target="_blank" rel="noreferrer">Open in Explore<ArrowUpRight size={14}/></a><Popover><PopoverTrigger render={<button type="button" className="learn-viewer-help-trigger" aria-label="Viewer controls and shortcuts" title="Viewer controls and shortcuts"/>}><Keyboard size={17}/></PopoverTrigger><PopoverContent side="bottom" align="end" className="learn-viewer-help-popover" data-atlas-shortcuts="disabled"><PopoverTitle>Viewer controls</PopoverTitle><p>Drag to orbit, right-drag to pan, and scroll or pinch to zoom. Pause interaction to scroll over the model.</p><dl><div><dt>H</dt><dd>Hide selected</dd></div><div><dt>J</dt><dd>Restore newest hidden</dd></div><div><dt>I</dt><dd>Isolate selection</dd></div><div><dt>R</dt><dd>Assemble and reset</dd></div><div><dt>F / S / B</dt><dd>Front / side / back</dd></div><div><dt>+ / -</dt><dd>Zoom</dd></div></dl><p>Shortcuts work while the viewer has focus and pause while you edit a control.</p></PopoverContent></Popover></div></div></header>
    <div className="learn-viewer-workspace" data-visibility={layersOpen} data-inspector={inspectorOpen}>
      {layersOpen && <LearningVisibility id={`${controlsId}-visibility`} parts={scope.atlas.parts} state={state} hidden={hidden} visibleCount={visibleCount} lesson={lesson} context={context} onContextChange={toggleContext} onToggleSystem={toggleSystem} onToggleAll={() => setState(previous => toggleAllSystems(previous, [...new Set(scope.atlas.parts.map(part => part.system))]))} onRestore={id => setState(previous => restoreHiddenRepresentation(previous, id))} onRestoreAll={() => setState(restoreHiddenRepresentations)} onChoose={choose} countForConcept={id => availableRepresentations(catalogue, id).length} onClose={() => setLayersOpen(false)}/>}
      <div className="learn-viewer-center"><div className="learn-viewer-canvas-row"><div ref={stage} className="learn-anatomy-stage" data-interactive={interactive} role="group" aria-label="Interactive digestive anatomy" aria-describedby={`${controlsId}-help`} tabIndex={0} onPointerDownCapture={event => { if ((event.target as Element).closest('canvas')) stage.current?.focus({ preventScroll: true }); }}>
        {!error && <Suspense fallback={<p className="learn-anatomy-status" role="status">Starting 3D renderer…</p>}><AnatomyScene key={retry} embedded active={active} stageOffset={stageOffset} zoomSteps={zoom} modelId={model.id} atlas={scope.atlas} state={displayState} display={sceneDisplay} theme={mode} viewLocked={viewLocked} rotationSpeed={rotationSpeed} revealed={ready} onReady={() => setReady(true)} onSettled={() => setSettled(true)} onAssistedView={view => setState(previous => ({ ...previous, view }))} explodePlayback={playback.run} onExplodePlaybackUpdate={playback.update} onSelect={choosePart} onProgress={setProgress} onError={setError}/></Suspense>}
        {!ready && !error && <p className="learn-anatomy-status" role="status">Loading anatomy · {progress}%</p>}
        {error && <div className="learn-anatomy-status" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Retry 3D</button></div>}
        {ready && !interactive && <button type="button" className="learn-anatomy-enable" onClick={() => setInteractive(true)}>Interact with model</button>}
      </div><nav className="learn-viewer-camera" aria-label="Anatomy camera controls">{(['three-quarter', 'front', 'side', 'back'] as const).map((angle, index) => <button key={angle} type="button" disabled={!ready} aria-label={`${angle} view`} title={`${angle === 'three-quarter' ? 'Three-quarter' : angle} view${index ? ` (${'FSB'[index - 1]})` : ''}`} aria-pressed={state.view === angle} onClick={() => cameraView(angle)}>{['¾', 'F', 'S', 'B'][index]}</button>)}<i/><button type="button" disabled={!ready} aria-label={viewLocked ? 'Unlock view' : 'Lock view'} aria-pressed={viewLocked} onClick={() => { setViewLocked(value => !value); setState(previous => ({ ...previous, rotate: false })); }}>{viewLocked ? <LockKeyhole size={16}/> : <UnlockKeyhole size={16}/>}</button><button type="button" disabled={!ready} aria-label="Reset view" title="Reset view" onClick={() => { playback.stop(false); setZoom(0); setState(previous => ({ ...previous, reset: previous.reset + 1, cameraIntent: 'reset', cameraIntentRevision: (previous.cameraIntentRevision ?? 0) + 1 })); }}><RotateCcw size={16}/></button><button type="button" disabled={!ready} aria-label="Zoom in" onClick={() => setZoom(value => value + 1)}><Plus size={16}/></button><button type="button" disabled={!ready} aria-label="Zoom out" onClick={() => setZoom(value => value - 1)}><Minus size={16}/></button><RotationControls active={state.rotate} disabled={!ready || viewLocked || state.explode >= .4 || state.isolate} onToggle={() => setState(previous => ({ ...previous, rotate: !previous.rotate }))}/></nav></div>
      <div className="learn-viewer-explode bottom-dock glass"><ExplosionControls sliderId={`${controlsId}-explode`} labelId={`${controlsId}-explode-label`} amount={state.explode} familyCount={familyCount} playback={playback} idle={idle} resetActivation={resetActivation} playDisabled={!ready || !!error || visibleCount < 2 || state.explode >= 1} sliderDisabled={!ready || !!error} onChange={amount => setState(previous => ({ ...previous, explode: amount, rotate: false }))} onReset={reset}/></div>
      </div>
      {inspectorOpen && <LearningInspector id={`${controlsId}-inspector`} name={name} description={description} selected={selectedParts} members={members} isolated={state.isolate} unavailable={unavailable} onHide={hideSelected} onIsolate={() => { playback.stop(false); setState(previous => isolateSelection(previous, identity)); }} onExit={exit} onClear={() => { setFocused(''); setPicked(null); setState(clearActiveSelection); }} onMember={choosePart} onClose={() => setInspectorOpen(false)}/>}
    </div>
    <p id={`${controlsId}-help`} className="sr-only">Drag to orbit · Right-drag to pan · Scroll / pinch to zoom · H hide · J restore · I isolate · R reset · F / S / B views. Shortcuts work while this viewer has focus. Pause interaction to scroll over the model.</p>
    {model.experimental && <p className="learn-anatomy-disclosure">Female study model · adapted reference geometry with estimated proportions. Placement is experimental and has not been independently anatomically validated.</p>}
  </div>;
}
