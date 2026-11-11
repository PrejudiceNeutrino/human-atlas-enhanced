import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Info, Keyboard, Layers3, LockKeyhole, Minus, Plus, RotateCcw, UnlockKeyhole } from 'lucide-react';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { VIEWER_SHORTCUTS, viewerShortcut } from '../../viewer-shortcuts';
import { clearActiveSelection, exitIsolation, isolateSelection, selectAssemblyMember, toggleAllSystems } from '../../viewer-interaction';
import { hiddenPartIdsForModel, hiddenRepresentationsForModel, hideSelectedRepresentations, restoreHiddenRepresentation, restoreHiddenRepresentations, selectRepresentations } from '../../hide-restore';
import { modelGrounding } from '../../spatial-presentation';
import { availableRepresentations, initialLearningState, learningScope, learningSceneState, loadLearningCatalogue, partBounds, type LearningCatalogue } from './model';
import { LearningInspector, LearningVisibility } from './panels';
import { lessonForModel, type AnatomyLesson } from './references';
import { learnSubjects } from '../subjects';
import type { AnatomyRequest } from './learning-viewer';

const AnatomyScene = lazy(() => import('../../scene'));
const learningModels = [{ value: 'bp3d-male-4', label: 'Male reference' }, { value: 'female-study-v3', label: 'Female study model' }];

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
  return current ? <LearningWorkspace key={modelId} catalogue={current} lesson={lessonForModel(lesson, model.id)} requested={requested} active={active} compact={compact} onModelChange={setModelId}/> : <div className="learn-anatomy-loading" role={error ? 'alert' : 'status'}><p>{error || 'Loading anatomical catalogue…'}</p>{error && <><button type="button" onClick={() => setRetry(value => value + 1)}>Retry 3D</button>{model.route && <a href={model.route} target="_blank" rel="noreferrer">Open in Explore</a>}</>}</div>;
}

function LearningWorkspace({ catalogue, lesson, requested, active, compact, onModelChange }: { catalogue: LearningCatalogue; lesson: AnatomyLesson; requested?: AnatomyRequest; active: boolean; compact: boolean; onModelChange: (id: ModelId) => void }) {
  const { model, identity } = catalogue;
  const subjectLabel = learnSubjects.find(item => item.slug === lesson.subjectId)?.label ?? lesson.subjectId;
  const subjectName = subjectLabel.toLowerCase();
  const modelOptions = lesson.modelIds ? lesson.modelIds.map(id => ({value: id, label: MODEL_REGISTRY[id].displayLabel})) : learningModels;
  const [context, setContext] = useState(false);
  const scope = useMemo(() => learningScope(catalogue, lesson, context), [catalogue, lesson, context]);
  const [state, setState] = useState<SceneState>(() => initialLearningState(catalogue, scope, requested?.conceptId));
  const [focused, setFocused] = useState<CanonicalConceptId | ''>(requested?.conceptId ?? ''), [picked, setPicked] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(!compact), [inspectorOpen, setInspectorOpen] = useState(!!requested);
  const [interactive, setInteractive] = useState(() => compact || !window.matchMedia('(pointer: coarse)').matches), [viewLocked, setViewLocked] = useState(false);
  const [settled, setSettled] = useState(false), [resetActivation, setResetActivation] = useState(0);
  const [ready, setReady] = useState(false), [progress, setProgress] = useState(0), [error, setError] = useState(''), [retry, setRetry] = useState(0), [zoom, setZoom] = useState(0);
  const stage = useRef<HTMLDivElement>(null), focusSelect = useRef<HTMLButtonElement>(null);
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
  const focusedIds = useMemo(() => focused ? availableRepresentations(catalogue, focused).map(item => item.sourcePart.id) : [], [catalogue, focused]);
  const focusOptions = useMemo(() => [{ value: '', label: `Complete ${subjectName} system` }, ...lesson.structures.map(item => ({ value: item.conceptId, label: `${item.label}${!availableRepresentations(catalogue, item.conceptId).length ? ' — unavailable' : ''}` }))], [catalogue, lesson]);
  const selectedParts = useMemo(() => scope.atlas.parts.filter(part => state.selected.includes(part.id)), [scope.atlas, state.selected]);
  const hiddenPartIds = useMemo(() => hiddenPartIdsForModel(identity, state.hiddenRepresentationIds), [identity, state.hiddenRepresentationIds]);
  const isolatedPartIds = useMemo(() => state.isolate ? hiddenPartIdsForModel(identity, state.isolatedRepresentationIds) : undefined, [identity, state.isolate, state.isolatedRepresentationIds]);
  const contextReveal = useMemo(() => context && !state.isolate ? learningSceneState(catalogue, scope, state.selected.length ? state.selected : focusedIds, null, true, 0, state.view, 'preset').contextReveal : undefined, [context, catalogue, scope, state.selected, state.isolate, focusedIds]);
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
  const name = pickedPart?.name ?? reference?.label ?? (state.isolate ? 'Isolated anatomy' : `Complete ${subjectName} system`);
  const description = pickedPart ? explanation(pickedPart.name, pickedPart.system, model.sex) : reference?.summary ?? `Select a structure in the model or use the visibility panel to inspect the ${subjectName} anatomy.`;
  const choose = (id: CanonicalConceptId | '') => {
    playback.stop(false); setFocused(id); setPicked(null); setInspectorOpen(!!id);
    const ids = id ? availableRepresentations(catalogue, id).map(item => item.sourcePart.id).filter(partId => scope.partIds.has(partId)) : [];
    setState(previous => {
      const next = selectRepresentations(exitIsolation(previous), identity, ids);
      const result = { ...next, regionFocus: ids.length ? partBounds(scope.atlas.parts.filter(part => ids.includes(part.id))) : scope.fullBounds, explode: 0, rotate: false, view: 'three-quarter' as const, reset: previous.reset + 1, cameraIntent: 'preset' as const, cameraIntentRevision: (previous.cameraIntentRevision ?? 0) + 1 };
      return clearActiveSelection(ids.length && !context ? isolateSelection(result, identity) : result);
    });
  };
  const choosePart = (id: string) => {
    if (compact || !scope.partIds.has(id)) return;
    playback.stop(false); setFocused(''); setPicked(id); setInspectorOpen(true);
    setState(previous => selectAssemblyMember(previous, identity, id));
  };
  const hideSelected = () => { playback.stop(false); setFocused(''); setPicked(null); setState(previous => hideSelectedRepresentations(previous, identity)); };
  const exit = () => {
    playback.stop(false); setFocused('');
    setState(previous => ({ ...exitIsolation(previous), regionFocus: scope.fullBounds, reset: previous.reset + 1 }));
  };
  const reset = () => {
    playback.stop(false); idle.onValueChange(); setResetActivation(value => value + 1); setFocused(compact ? requested?.conceptId ?? '' : ''); setPicked(null); setZoom(0);
    setState(previous => ({ ...initialLearningState(catalogue, scope, compact ? requested?.conceptId : '', previous.reset + 1), cameraIntent: 'reset', cameraIntentRevision: (previous.cameraIntentRevision ?? 0) + 1 }));
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
      if (next) return result;
      if (result.selected.length) return isolateSelection(result, identity);
      return focusedIds.length ? clearActiveSelection(isolateSelection({ ...result, selected: focusedIds }, identity)) : result;
    });
  };
  const exploreConcept = pickedPart ? identity.sourceConceptCanonicalId(pickedPart.conceptId) : focused;
  const exploreHref = `${model.route ?? '/male'}${exploreConcept && !unavailable ? `?concept=${encodeURIComponent(exploreConcept)}` : ''}`;
  return <div className="learn-viewer" data-atlas-shortcuts="disabled" onKeyDown={event => {
    if (compact || !ready || !active || error) return;
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
    } else if ((event.key === '+' || event.key === '=' || event.key === '-') && !event.ctrlKey && !event.metaKey && !event.altKey && !(event.target as Element).closest('input,textarea,select,[role="combobox"],[role="listbox"],[role="slider"],[contenteditable]')) {
      event.preventDefault(); setZoom(value => value + (event.key === '-' ? -1 : 1));
    }
  }}>
    {!compact && <header className="learn-viewer-topbar"><div className="learn-anatomy-controls">
      <div className="learn-anatomy-field"><label htmlFor={`${controlsId}-model`}>Model</label><Select modal={false} items={modelOptions} value={model.id} onValueChange={value => { if (typeof value === 'string') onModelChange(value as ModelId); }}><SelectTrigger id={`${controlsId}-model`} aria-label="Anatomy model"><SelectValue/></SelectTrigger><SelectContent className="anatomy-choice-menu learn-anatomy-menu" data-atlas-shortcuts="disabled" data-annotation-excluded>{modelOptions.map(item => <SelectItem key={item.value} value={item.value} data-value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="learn-anatomy-field"><label htmlFor={`${controlsId}-focus`}>Focus anatomy</label><Select modal={false} items={focusOptions} value={focused} onValueChange={value => { if (typeof value === 'string') choose(value as CanonicalConceptId | ''); }}><SelectTrigger ref={focusSelect} id={`${controlsId}-focus`} aria-label="Focus anatomy"><SelectValue/></SelectTrigger><SelectContent className="anatomy-choice-menu learn-anatomy-menu" data-atlas-shortcuts="disabled" data-annotation-excluded>{focusOptions.map(item => <SelectItem key={item.value} value={item.value} data-value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
    </div>
    <div className="learn-viewer-toolbar"><div><button type="button" aria-controls={`${controlsId}-visibility`} aria-expanded={layersOpen} onClick={() => setLayersOpen(value => !value)}><Layers3 size={16}/>Visibility<span className="learn-viewer-hidden-count">{hidden.length} hidden</span></button><button type="button" aria-controls={`${controlsId}-inspector`} aria-expanded={inspectorOpen} onClick={() => setInspectorOpen(value => !value)}><Info size={16}/>Inspect</button></div><div>{model.route && <a href={exploreHref} target="_blank" rel="noreferrer">Open in Explore<ArrowUpRight size={14}/></a>}<Popover><PopoverTrigger render={<button type="button" className="learn-viewer-help-trigger" aria-label="Viewer controls and shortcuts" title="Viewer controls and shortcuts"/>}><Keyboard size={17}/></PopoverTrigger><PopoverContent side="bottom" align="end" className="learn-viewer-help-popover" data-atlas-shortcuts="disabled"><PopoverTitle>Viewer controls</PopoverTitle><p>Drag to orbit, right-drag to pan, and scroll or pinch to zoom. Lock view to prevent rotation.</p><h3 className="learn-viewer-shortcut-heading">Keyboard shortcuts</h3><dl className="shortcut-reference">{VIEWER_SHORTCUTS.map(shortcut => <div key={shortcut.action} title={shortcut.action === 'find' ? `Choose ${subjectName} anatomy` : shortcut.context}><dt><kbd>{shortcut.key}</kbd></dt><dd>{shortcut.action === 'find' ? 'Focus anatomy' : shortcut.label}</dd></div>)}<div><dt><kbd>+</kbd></dt><dd>Zoom in</dd></div><div><dt><kbd>−</kbd></dt><dd>Zoom out</dd></div></dl><p className="learn-viewer-shortcut-note">Shortcuts work while the viewer has focus and pause while typing or editing controls. Esc closes this guide.</p></PopoverContent></Popover></div></div></header>}
    <div className="learn-viewer-workspace" data-visibility={!compact && layersOpen} data-inspector={!compact && inspectorOpen}>
      {!compact && layersOpen && <LearningVisibility id={`${controlsId}-visibility`} parts={scope.atlas.parts} state={state} hidden={hidden} visibleCount={visibleCount} lesson={lesson} activeConcept={focused} context={context} onContextChange={toggleContext} onToggleSystem={toggleSystem} onToggleAll={() => setState(previous => toggleAllSystems(previous, [...new Set(scope.atlas.parts.map(part => part.system))]))} onRestore={id => setState(previous => restoreHiddenRepresentation(previous, id))} onRestoreAll={() => setState(restoreHiddenRepresentations)} onChoose={choose} countForConcept={id => availableRepresentations(catalogue, id).length} onClose={() => setLayersOpen(false)}/>}
      <div className="learn-viewer-center"><div className="learn-viewer-canvas-row"><div ref={stage} className="learn-anatomy-stage" data-interactive={interactive} role="group" aria-label={compact ? `3D model of ${name}` : `Interactive ${subjectName} anatomy`} aria-describedby={`${controlsId}-help`} tabIndex={0} onPointerDownCapture={event => { if ((event.target as Element).closest('canvas')) stage.current?.focus({ preventScroll: true }); }}>
        {!error && <Suspense fallback={<p className="learn-anatomy-status" role="status">Starting 3D renderer…</p>}><AnatomyScene key={retry} embedded active={active} stageOffset={stageOffset} zoomSteps={zoom} modelId={model.id} atlas={scope.atlas} state={displayState} display={sceneDisplay} theme={mode} viewLocked={viewLocked} rotationSpeed={rotationSpeed} revealed={ready} onReady={() => setReady(true)} onSettled={() => setSettled(true)} onAssistedView={view => setState(previous => ({ ...previous, view }))} explodePlayback={playback.run} onExplodePlaybackUpdate={playback.update} onSelect={choosePart} onProgress={setProgress} onError={setError}/></Suspense>}
        {!ready && !error && <p className="learn-anatomy-status" role="status">Loading anatomy · {progress}%</p>}
        {error && <div className="learn-anatomy-status" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Retry 3D</button></div>}
        {ready && !interactive && <button type="button" className="learn-anatomy-enable" onClick={() => setInteractive(true)}>Interact with model</button>}
      </div>{!compact && <nav className="learn-viewer-camera" aria-label="Anatomy camera controls">{(['three-quarter', 'front', 'side', 'back'] as const).map((angle, index) => <button key={angle} type="button" disabled={!ready} aria-label={`${angle} view`} title={`${angle === 'three-quarter' ? 'Three-quarter' : angle} view${index ? ` (${'FSB'[index - 1]})` : ''}`} aria-pressed={state.view === angle} onClick={() => cameraView(angle)}>{['¾', 'F', 'S', 'B'][index]}</button>)}<i/><button type="button" disabled={!ready} aria-label={viewLocked ? 'Unlock view' : 'Lock view'} aria-pressed={viewLocked} onClick={() => { setViewLocked(value => !value); setState(previous => ({ ...previous, rotate: false })); }}>{viewLocked ? <LockKeyhole size={16}/> : <UnlockKeyhole size={16}/>}</button><button type="button" disabled={!ready} aria-label="Reset view" title="Reset view" onClick={() => { playback.stop(false); setZoom(0); setState(previous => ({ ...previous, reset: previous.reset + 1, cameraIntent: 'reset', cameraIntentRevision: (previous.cameraIntentRevision ?? 0) + 1 })); }}><RotateCcw size={16}/></button><button type="button" disabled={!ready} aria-label="Zoom in" onClick={() => setZoom(value => value + 1)}><Plus size={16}/></button><button type="button" disabled={!ready} aria-label="Zoom out" onClick={() => setZoom(value => value - 1)}><Minus size={16}/></button><RotationControls active={state.rotate} disabled={!ready || viewLocked || state.explode >= .4 || state.isolate} onToggle={() => setState(previous => ({ ...previous, rotate: !previous.rotate }))}/></nav>}</div>
      <div className="learn-viewer-explode bottom-dock glass"><ExplosionControls sliderId={`${controlsId}-explode`} labelId={`${controlsId}-explode-label`} amount={state.explode} familyCount={familyCount} playback={playback} idle={idle} resetActivation={resetActivation} playDisabled={!ready || !!error || visibleCount < 2 || state.explode >= 1} sliderDisabled={!ready || !!error} onChange={amount => setState(previous => ({ ...previous, explode: amount, rotate: false }))} onReset={reset}/></div>
      </div>
      {!compact && inspectorOpen && <LearningInspector subjectLabel={subjectLabel} id={`${controlsId}-inspector`} name={name} description={description} selected={selectedParts} members={members} isolated={state.isolate} unavailable={unavailable} onHide={hideSelected} onIsolate={() => { playback.stop(false); setState(previous => isolateSelection(previous, identity)); }} onExit={exit} onClear={() => { setFocused(''); setPicked(null); setState(clearActiveSelection); }} onMember={choosePart} onClose={() => setInspectorOpen(false)}/>}
    </div>
    <p id={`${controlsId}-help`} className="sr-only">{compact ? "Drag to rotate the model. Scroll or pinch to zoom. Use the explode toolbar to separate and reassemble this structure." : <>Drag to orbit · Right-drag to pan · Scroll / pinch to zoom · H hide · J restore · I isolate · R reset · F / S / B views. Shortcuts work while this viewer has focus. Lock view to prevent rotation.</>}</p>
    {!compact && model.experimental && <p className="learn-anatomy-disclosure">Female study model · adapted reference geometry with estimated proportions. Placement is experimental and has not been independently anatomically validated.</p>}
  </div>;
}
