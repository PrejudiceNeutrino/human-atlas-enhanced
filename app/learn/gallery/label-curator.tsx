import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { GalleryCollection, GalleryFigure } from './model';
import { parsePracticeDataset, type MaskRegion, type PracticeDataset, type PracticeFigure, type PracticeLabel } from './label-practice-model';

type Rect = Extract<MaskRegion, { shape: 'rect' }>;
type Point = { x: number; y: number };
type Drag = { start: Point; before: Rect; label: string; region: number; kind: 'draw' | 'move' | 'resize'; corner?: string };
const clamp = (n: number, maximum = 1) => Math.max(0, Math.min(maximum, n));

export default function LabelCurator({ figure, gallery, subjectId, dataset, onClose, children }: {
  figure: GalleryFigure; gallery: GalleryCollection; subjectId: string; dataset: PracticeDataset | null; onClose: () => void;
  children: (parts: { overlay: ReactNode; controls: ReactNode; preview: boolean }) => ReactNode;
}) {
  const empty = (): PracticeFigure => ({ figureId: figure.id, sourceImageSha256: figure.sha256, reviewStatus: 'candidate', coverage: 'none', reviewNotes: '', labels: [] });
  const existing = dataset?.figures.find(item => item.figureId === figure.id);
  const [draft, setDraft] = useState<PracticeFigure>(() => structuredClone(existing?.sourceImageSha256 === figure.sha256 ? existing : empty()));
  const [selectedId, setSelectedId] = useState(draft.labels[0]?.id ?? ''), [regionIndex, setRegionIndex] = useState(0), [preview, setPreview] = useState(false);
  const [message, setMessage] = useState(''), [synonyms, setSynonyms] = useState(''), [importVersion, setImportVersion] = useState(0);
  const [base, setBase] = useState<PracticeDataset>(() => dataset ?? { schemaVersion: 1, subjectId, figures: [] });
  const input = useRef<HTMLInputElement>(null), svg = useRef<SVGSVGElement>(null), drag = useRef<Drag | null>(null);
  const selected = draft.labels.find(label => label.id === selectedId), region = selected?.regions[regionIndex];
  useEffect(() => { setSynonyms(draft.labels.find(label => label.id === selectedId)?.acceptedAnswers.join('\n') ?? ''); }, [selectedId, importVersion]);
  const changeLabel = (id: string, update: (label: PracticeLabel) => PracticeLabel, invalidate = true) => setDraft(previous => ({ ...previous, ...(invalidate ? { reviewStatus: 'candidate' as const, coverage: 'partial' as const } : {}), labels: previous.labels.map(label => label.id === id ? { ...update(label), ...(invalidate ? { reviewStatus: 'needs-review' as const } : {}) } : label) }));
  const newLabel = () => {
    const label: PracticeLabel = { id: `label-${crypto.randomUUID()}`, label: 'Untitled label', acceptedAnswers: [], regions: [], reviewStatus: 'needs-review' };
    setDraft(previous => ({ ...previous, reviewStatus: 'candidate', coverage: 'partial', labels: [...previous.labels, label] }));
    setSelectedId(label.id); setRegionIndex(0); setPreview(false); setMessage('Drag a rectangle over the printed answer. Add more regions to the same answer by drawing again.');
    return label.id;
  };
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: clamp((event.clientX - box.left) / box.width), y: clamp((event.clientY - box.top) / box.height) };
  };
  const removeRegion = () => { if (selected) { changeLabel(selected.id, label => ({ ...label, regions: label.regions.filter((_, index) => index !== regionIndex) })); setRegionIndex(0); } };
  const pointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (preview || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event), target = (event.target as Element).closest<SVGElement>('[data-curator-label]');
    if (target) {
      const id = target.dataset.curatorLabel!, index = Number(target.dataset.region), source = draft.labels.find(label => label.id === id)?.regions[index];
      setSelectedId(id); setRegionIndex(index);
      if (source?.shape === 'rect') drag.current = { start, before: { ...source }, label: id, region: index, kind: target.dataset.corner ? 'resize' : 'move', corner: target.dataset.corner };
    } else {
      const id = selected?.id ?? newLabel(), index = selected?.regions.length ?? 0;
      const rectangle: Rect = { shape: 'rect', ...start, width: 1 / figure.width, height: 1 / figure.height, fill: selected?.regions[0]?.fill ?? '#ffffff' };
      changeLabel(id, label => ({ ...label, regions: [...label.regions, rectangle] }));
      setRegionIndex(index); drag.current = { start, before: rectangle, label: id, region: index, kind: 'draw' };
    }
  };
  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const gesture = drag.current; if (!gesture) return;
    event.stopPropagation(); const current = point(event), before = gesture.before;
    let next: Rect;
    if (gesture.kind === 'move') next = { ...before, x: clamp(before.x + current.x - gesture.start.x, 1 - before.width), y: clamp(before.y + current.y - gesture.start.y, 1 - before.height) };
    else {
      const anchor = gesture.kind === 'draw' ? gesture.start : { x: gesture.corner?.includes('w') ? before.x + before.width : before.x, y: gesture.corner?.includes('n') ? before.y + before.height : before.y };
      next = { ...before, x: Math.min(anchor.x, current.x), y: Math.min(anchor.y, current.y), width: Math.max(1 / figure.width, Math.abs(current.x - anchor.x)), height: Math.max(1 / figure.height, Math.abs(current.y - anchor.y)) };
      next.width = Math.min(next.width, 1 - next.x); next.height = Math.min(next.height, 1 - next.y);
    }
    changeLabel(gesture.label, label => ({ ...label, regions: label.regions.map((region, index) => index === gesture.region ? next : region) }));
  };
  const exportDraft = () => {
    try {
      const next = parsePracticeDataset({ ...base, figures: [...base.figures.filter(item => item.figureId !== figure.id), draft] }, subjectId, gallery);
      const url = URL.createObjectURL(new Blob([JSON.stringify(next, null, 2) + '\n'], { type: 'application/json' })), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'label-practice.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`Exported ${draft.labels.length} answers. Replace public/images/learn/${subjectId}/gallery/label-practice.json with the reviewed file.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Annotation export failed.'); }
  };
  const controls = <section className="label-curator-controls" aria-label="Label annotation editor">
    <div className="label-practice-command-row"><strong>Curator editor</strong><span>Development only · {figure.id}</span><button type="button" onClick={newLabel}>New answer</button><button type="button" disabled={!selected} onClick={() => { setPreview(false); setMessage('Drag on empty image space to add another region to the selected answer.'); }}>Add region</button><button type="button" onClick={() => setPreview(value => !value)} aria-pressed={preview}>{preview ? 'Edit rectangles' : 'Preview masks'}</button><button type="button" onClick={exportDraft}>Export JSON</button><button type="button" onClick={() => input.current?.click()}>Import JSON</button><button type="button" onClick={() => { if (window.confirm('Close the curator editor? Export JSON first to keep your changes.')) onClose(); }}>Close editor</button></div>
    <div className="label-curator-fields">
      <label>Answer<select aria-label="Curator answer" value={selectedId} onChange={event => { setSelectedId(event.target.value); setRegionIndex(0); }}><option value="">Choose an answer</option>{draft.labels.map((label, index) => <option key={label.id} value={label.id}>{index + 1}. {label.label}</option>)}</select></label>
      {selected && <><label>Printed label<input aria-label="Printed label" value={selected.label} onChange={event => changeLabel(selected.id, label => ({ ...label, label: event.target.value }))}/></label><label>Accepted answers, one per line<textarea aria-label="Accepted answers" rows={2} value={synonyms} onChange={event => { setSynonyms(event.target.value); changeLabel(selected.id, label => ({ ...label, acceptedAnswers: event.target.value.split('\n').map(value => value.trim()).filter(Boolean) })); }}/></label>
        <label>Cover color<input aria-label="Cover color" type="color" value={region?.fill ?? '#ffffff'} onChange={event => changeLabel(selected.id, label => ({ ...label, regions: label.regions.map((region, index) => index === regionIndex ? { ...region, fill: event.target.value } : region) }))}/></label>
        <label>Mask concern<select aria-label="Mask concern" value={selected.issue ?? ''} onChange={event => changeLabel(selected.id, label => ({ ...label, issue: event.target.value ? event.target.value as PracticeLabel['issue'] : undefined }))}><option value="">None</option><option value="overlaps-anatomy">Overlaps anatomy</option><option value="truncated-source">Source label is cropped</option><option value="inadequate-mask">Mask needs adjustment</option></select></label>
        <label className="label-curator-check"><input type="checkbox" checked={selected.reviewStatus === 'verified'} onChange={event => { if (event.target.checked && selected.issue) { setMessage('Resolve the mask concern before marking this answer reviewed.'); return; } changeLabel(selected.id, label => ({ ...label, reviewStatus: event.target.checked ? 'verified' : 'needs-review' }), false); }}/>Answer reviewed</label>
        <button type="button" disabled={!region} onClick={removeRegion}>Delete region</button><button type="button" onClick={() => { setDraft(previous => ({ ...previous, reviewStatus: 'candidate', coverage: 'partial', labels: previous.labels.filter(label => label.id !== selected.id) })); setSelectedId(''); }}>Delete answer</button></>}
      <label>Coverage<select aria-label="Figure annotation coverage" value={draft.coverage} onChange={event => setDraft(previous => ({ ...previous, coverage: event.target.value as PracticeFigure['coverage'] }))}><option value="none">None / candidate</option><option value="partial">Selected labels</option><option value="complete">All eligible labels</option></select></label>
      <label className="label-curator-check"><input type="checkbox" checked={draft.reviewStatus === 'verified'} onChange={event => setDraft(previous => ({ ...previous, reviewStatus: event.target.checked ? 'verified' : 'candidate' }))}/>Figure reviewed for practice</label>
      <label>Review notes<input aria-label="Figure review notes" value={draft.reviewNotes} onChange={event => setDraft(previous => ({ ...previous, reviewNotes: event.target.value }))}/></label>
    </div>
    <input ref={input} type="file" accept="application/json,.json" className="sr-only" aria-label="Import label annotation JSON" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      try { if (file.size > 5_000_000) throw new Error('Choose a JSON file smaller than 5 MB.'); const imported = parsePracticeDataset(JSON.parse(await file.text()), subjectId, gallery); const next = imported.figures.find(item => item.figureId === figure.id);
        if (next && next.sourceImageSha256 !== figure.sha256) throw new Error('This annotation file describes a different version of the image.');
        setBase(imported); setDraft(structuredClone(next ?? empty())); setSelectedId(next?.labels[0]?.id ?? ''); setRegionIndex(0); setImportVersion(value => value + 1); setMessage('Annotation file loaded.');
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Invalid annotation file.'); }
    }}/>
    <p className="label-practice-note">Drag to draw. Drag a cover to move it; drag its corner handles to resize. Drawing again adds a region to the same answer. Arrow keys move the selected rectangle. Changes need a fresh review before publication.</p><p role="status" className="label-practice-note">{message}</p>
  </section>;
  const overlay = <svg ref={svg} className={`label-curator-overlay ${preview ? 'is-preview' : ''}`} viewBox="0 0 1 1" preserveAspectRatio="none" tabIndex={preview ? -1 : 0} role="group" aria-label="Draw and adjust label rectangles"
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
    onKeyDown={event => {
      if (!selected || region?.shape !== 'rect' || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation(); const step = event.shiftKey ? 10 : 1;
      changeLabel(selected.id, label => ({ ...label, regions: label.regions.map((item, index) => index === regionIndex ? { ...region, x: clamp(region.x + (event.key === 'ArrowRight' ? step / figure.width : event.key === 'ArrowLeft' ? -step / figure.width : 0), 1 - region.width), y: clamp(region.y + (event.key === 'ArrowDown' ? step / figure.height : event.key === 'ArrowUp' ? -step / figure.height : 0), 1 - region.height) } : item) }));
    }}>
    {draft.labels.flatMap(label => label.regions.map((region, index) => <g key={`${label.id}-${index}`}>
      {region.shape === 'rect' ? <rect data-curator-label={label.id} data-region={index} x={region.x} y={region.y} width={region.width} height={region.height} fill={region.fill} className={label.id === selectedId && index === regionIndex ? 'selected' : ''}/> : <polygon data-curator-label={label.id} data-region={index} points={region.points.map(point => point.join(',')).join(' ')} fill={region.fill}/>}
      {!preview && label.id === selectedId && index === regionIndex && region.shape === 'rect' && ['nw', 'ne', 'sw', 'se'].map(corner => <rect key={corner} className="label-curator-handle" data-curator-label={label.id} data-region={index} data-corner={corner} x={(corner.includes('w') ? region.x : region.x + region.width) - .004} y={(corner.includes('n') ? region.y : region.y + region.height) - .004} width=".008" height=".008"/>)}
    </g>))}
  </svg>;
  return children({ overlay, controls, preview });
}
