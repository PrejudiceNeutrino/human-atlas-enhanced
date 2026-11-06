import { ChevronRight, Eye, EyeOff, Focus, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SYSTEMS, type Part, type SceneState, type SystemId } from '../../anatomy';
import type { RepresentationId } from '../../identity-contracts';
import type { AnatomyLesson } from './references';

type HiddenItem = { id: RepresentationId; part: Part };
export function LearningVisibility({ id, parts, state, hidden, visibleCount, lesson, context, onContextChange, onToggleSystem, onToggleAll, onRestore, onRestoreAll, onChoose, countForConcept, onClose }: {
  id: string; parts: Part[]; state: SceneState; hidden: HiddenItem[]; visibleCount: number; lesson: AnatomyLesson;
  onToggleSystem: (id: SystemId) => void; onToggleAll: () => void; onRestore: (id: RepresentationId) => void; onRestoreAll: () => void;
  onChoose: (id: AnatomyLesson['structures'][number]['conceptId']) => void; countForConcept: (id: AnatomyLesson['structures'][number]['conceptId']) => number; onClose: () => void;
  context: boolean; onContextChange: (context: boolean) => void;
}) {
  const systems = SYSTEMS.filter(system => parts.some(part => part.system === system.id));
  const enabled = systems.some(system => state.visible.includes(system.id));
  return <section id={id} className="learn-viewer-panel learn-viewer-visibility" aria-label="Anatomical visibility">
    <header className="learn-viewer-panel-heading"><h3>Visibility</h3><div><button type="button" aria-label={enabled ? 'Hide all systems' : 'Show all systems'} title={enabled ? 'Hide all systems' : 'Show all systems'} onClick={onToggleAll}>{enabled ? <Eye size={16}/> : <EyeOff size={16}/>}</button><button type="button" aria-label="Close visibility panel" onClick={onClose}><X size={16}/></button></div></header>
    <Tabs defaultValue="systems" className="learn-viewer-visibility-tabs">
      <TabsList aria-label="Visibility tools"><TabsTrigger value="systems">Systems</TabsTrigger><TabsTrigger value="hidden">Hidden <span>{hidden.length}</span></TabsTrigger></TabsList>
      <TabsContent value="systems">
        <div className="learn-viewer-system-list">{systems.map(system => <div key={system.id} className="learn-viewer-system-row"><span className="system-dot" style={{ background: system.color }}/><span>{system.name}</span><small>{parts.filter(part => part.system === system.id).length}</small><Switch checked={state.visible.includes(system.id)} onCheckedChange={() => onToggleSystem(system.id)} aria-label={`Show ${system.name.toLowerCase()}`}/></div>)}</div>
        <h4 className="learn-viewer-subheading">Digestive structures</h4><div className="learn-viewer-structure-list">{lesson.structures.map(item => <button type="button" key={item.conceptId} disabled={!countForConcept(item.conceptId)} onClick={() => onChoose(item.conceptId)}><span>{item.label}</span><small>{countForConcept(item.conceptId)}</small><ChevronRight size={14}/></button>)}</div>
      </TabsContent>
      <TabsContent value="hidden"><div className="learn-viewer-hidden-list">{hidden.length ? <ul aria-label="Hidden structures, newest first">{hidden.map(item => <li key={item.id}><span>{item.part.name}<small>{item.part.provenance?.sourceId ?? item.part.id}</small></span><button type="button" aria-label={`Restore ${item.part.name}`} onClick={() => onRestore(item.id)}>Restore</button></li>)}</ul> : <p>No structures hidden. Select anatomy and press H to hide it.</p>}</div></TabsContent>
    </Tabs>
    <footer className="learn-viewer-panel-foot"><span>{visibleCount} pieces visible</span><button type="button" disabled={!hidden.length} title="Restore all hidden structures. J restores the newest." onClick={onRestoreAll}>Restore all hidden</button></footer>
    <label className="learn-anatomy-context"><input type="checkbox" checked={context} onChange={event => onContextChange(event.target.checked)}/>Surrounding context</label>
  </section>;
}

export function LearningInspector({ id, name, description, selected, members, isolated, unavailable, onHide, onIsolate, onExit, onClear, onMember, onClose }: {
  id: string; name: string; description: string; selected: Part[]; members: Part[]; isolated: boolean; unavailable: boolean;
  onHide: () => void; onIsolate: () => void; onExit: () => void; onClear: () => void; onMember: (id: string) => void; onClose: () => void;
}) {
  return <section id={id} className="learn-viewer-panel learn-viewer-inspector" aria-label="Structure inspector">
    <header className="learn-viewer-panel-heading"><h3>Inspect</h3><button type="button" aria-label="Close structure inspector" onClick={onClose}><X size={16}/></button></header>
    <div className="learn-viewer-inspector-copy" aria-live="polite"><span className="learn-viewer-subheading">{isolated ? 'Isolated anatomy' : 'Digestive anatomy'}</span><h4>{name}</h4><p>{unavailable ? 'This structure is not represented in this model. No substitute anatomy is highlighted.' : description}</p>{selected.length > 0 && <small>{selected.length} selected {selected.length === 1 ? 'piece' : 'pieces'}</small>}</div>
    {members.length > 1 && <div className="learn-viewer-members"><h4 className="learn-viewer-subheading">Included structures</h4><div className="learn-viewer-structure-list">{members.map(part => <button key={part.id} type="button" aria-pressed={selected.some(item => item.id === part.id)} onClick={() => onMember(part.id)}>{part.name}</button>)}</div></div>}
    <div className="learn-viewer-inspector-actions"><button type="button" disabled={!selected.length} aria-keyshortcuts="H" onClick={onHide}><EyeOff size={15}/>Hide selected<kbd>H</kbd></button><button type="button" disabled={!selected.length} aria-keyshortcuts="I" onClick={onIsolate}><Focus size={15}/>Isolate selection<kbd>I</kbd></button>{isolated && <button type="button" onClick={onExit}>Show digestive anatomy</button>}<button type="button" disabled={!selected.length} onClick={onClear}>Clear selection</button></div>
  </section>;
}
