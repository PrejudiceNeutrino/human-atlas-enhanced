import { lazy, Suspense, useRef, useState, type ReactNode } from 'react';
import { PencilRuler, Tags } from 'lucide-react';
import type { GalleryCollection, GalleryFigure } from './model';
import { answerMatches, practiceForFigure, type PracticeDataset } from './label-practice-model';
import { LabelOverlay } from './label-overlay';
import { ZoomFigure } from './zoom-figure';
import './label-practice.css';

// Vite removes this branch and editor import from production builds.
const Curator = import.meta.env?.DEV ? lazy(() => import('./label-curator')) : null;

export function LabelPracticeFigure({ figure, src, gallery, subjectId, dataset, annotationError, annotationReady, enabled, onEnabledChange, navigation, actions, caption }: {
  figure: GalleryFigure; src: string; gallery: GalleryCollection; subjectId: string; dataset: PracticeDataset | null; annotationError: string;
  annotationReady: boolean; enabled: boolean; onEnabledChange: (enabled: boolean) => void; navigation: ReactNode; actions: ReactNode; caption: ReactNode;
}) {
  const { entry, stale, labels } = practiceForFigure(dataset, figure);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set()), [numbers, setNumbers] = useState(true), [list, setList] = useState(false);
  const [identify, setIdentify] = useState(false), [target, setTarget] = useState(''), [answer, setAnswer] = useState(''), [feedback, setFeedback] = useState('');
  const [outcomes, setOutcomes] = useState<Record<string, 'correct' | 'assisted'>>({}), [editing, setEditing] = useState(false);
  const answerInput = useRef<HTMLInputElement>(null);
  const active = enabled && labels.length > 0;
  const reveal = (id: string) => {
    setRevealed(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    setOutcomes(previous => previous[id] ? previous : { ...previous, [id]: 'assisted' });
  };
  const activate = (id: string) => {
    if (identify && !revealed.has(id)) { setTarget(id); setAnswer(''); setFeedback(''); requestAnimationFrame(() => answerInput.current?.focus({ preventScroll: true })); }
    else reveal(id);
  };
  const reset = () => { setRevealed(new Set()); setOutcomes({}); setTarget(''); setAnswer(''); setFeedback(''); };
  const selected = labels.find(label => label.id === target);
  const controls = enabled && <section className="label-practice-controls" aria-label="Label Practice controls">
    {labels.length ? <>
      <div className="label-practice-command-row"><strong>Label Practice</strong><span role="status" aria-live="polite">{revealed.size} / {labels.length} revealed{identify && ` · ${Object.values(outcomes).filter(result => result === 'correct').length} identified`}</span>
        <button type="button" onClick={() => setRevealed(new Set())}>Hide All</button><button type="button" onClick={() => { setRevealed(new Set(labels.map(label => label.id))); setOutcomes(previous => Object.fromEntries(labels.map(label => [label.id, previous[label.id] ?? 'assisted']))); }}>Reveal All</button><button type="button" onClick={reset}>Reset Practice</button>
        <button type="button" aria-expanded={list} onClick={() => setList(value => !value)}>Label list</button>
        <label><input type="checkbox" checked={numbers} onChange={event => setNumbers(event.target.checked)}/>Number covers</label><label><input type="checkbox" checked={identify} onChange={event => { setIdentify(event.target.checked); setTarget(''); setFeedback(''); }}/>Identify</label>
      </div>
      {entry?.coverage === 'partial' && <p className="label-practice-note">Practice covers the reviewed labels. Other printed labels on this figure still need review.</p>}
      {list && <div className="label-practice-list" role="group" aria-label="Numbered labels">{labels.map((label, index) => <button key={label.id} type="button" aria-label={revealed.has(label.id) ? `Hide label ${index + 1}: ${label.label}` : `${identify ? 'Identify' : 'Reveal'} label ${index + 1}`} onClick={() => activate(label.id)}><span>{index + 1}</span>{revealed.has(label.id) ? label.label : 'Hidden'}</button>)}</div>}
      {identify && <form className="label-practice-identify" onSubmit={event => {
        event.preventDefault(); if (!selected) return;
        if (answerMatches(selected, answer)) { setRevealed(previous => new Set([...previous, selected.id])); setOutcomes(previous => previous[selected.id] === 'assisted' ? previous : { ...previous, [selected.id]: 'correct' }); setFeedback(outcomes[selected.id] === 'assisted' ? 'Correct after a reveal — assisted.' : 'Correct.'); }
        else setFeedback('Not a match. Try again or reveal the answer.');
      }}>
        <label>Label<select aria-label="Label to identify" value={target} onChange={event => { setTarget(event.target.value); setAnswer(''); setFeedback(''); }}><option value="">Choose a cover</option>{labels.map((label, index) => <option value={label.id} key={label.id}>Label {index + 1}</option>)}</select></label>
        <label>Your answer<input ref={answerInput} aria-label="Anatomical term" value={answer} autoComplete="off" onChange={event => setAnswer(event.target.value)} disabled={!selected}/></label><button type="submit" disabled={!selected || !answer.trim()}>Check</button><button type="button" disabled={!selected} onClick={() => { if (selected) { if (!revealed.has(selected.id)) reveal(selected.id); setFeedback(`Answer: ${selected.label} — assisted reveal.`); } }}>Reveal Answer</button><span role="status">{feedback}</span>
      </form>}
    </> : <p className="label-practice-note">{stale ? 'Label Practice needs review because this image has changed.' : annotationError || 'No reviewed label covers are available for this figure.'}</p>}
  </section>;
  const toggle = (labels.length > 0 || enabled || stale || annotationError) && <button type="button" className="label-practice-toggle" aria-label="Label Practice" aria-pressed={enabled} title="Practice the printed labels" onClick={() => { onEnabledChange(!enabled); if (!enabled) reset(); }}><Tags size={16} aria-hidden="true"/><span>Label Practice</span></button>;
  const editButton = Curator && <div className="label-curator-launch"><button type="button" aria-label="Edit label masks" disabled={!annotationReady} title={annotationReady ? 'Curator editor · development only' : 'Waiting for a valid annotation collection; reload Gallery if loading failed.'} onClick={() => { setEditing(true); onEnabledChange(false); }}><PencilRuler size={14} aria-hidden="true"/>Annotate labels</button></div>;
  if (editing && Curator) return <Suspense fallback={<p role="status">Opening annotation editor…</p>}><Curator figure={figure} gallery={gallery} subjectId={subjectId} dataset={dataset} onClose={() => setEditing(false)}>{({ overlay, controls: editorControls, preview }) => <ZoomFigure figure={figure} src={src} navigation={navigation} actions={<>{actions}</>} caption={caption} controls={editorControls} overlay={overlay} editing={!preview}/>}</Curator></Suspense>;
  return <ZoomFigure figure={figure} src={src} navigation={navigation} actions={<div className="label-practice-actions">{toggle}{actions}</div>} caption={caption}
    controls={<>{controls}{editButton}</>} overlay={active ? <LabelOverlay labels={labels} revealed={revealed} numbers={numbers} aspectRatio={figure.width / figure.height} identifying={identify} onActivate={activate}/> : null} onMaskActivate={active ? activate : undefined}
    imageAlt={active ? 'Anatomical figure for label practice. Use the numbered covers or label list to reveal answers.' : undefined}/>;
}
