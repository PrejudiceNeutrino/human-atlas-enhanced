// Listener lifecycle, portal and command architecture adapted from Engineering Club.
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { createPortal, flushSync } from 'react-dom';
import { browserTheme, useTheme } from '../../theme-store';
import { browserPalette, usePalette } from '../../palette-store';
import { PALETTE_OPTIONS } from '../../palette';
import { learnSubjects, type LearnSubject } from '../subjects';
import { backToLearnTop, learnScrollBehavior } from '../scroll-navigation';
import { ReadingPageContext } from '../section-index';
import { openNotes } from '../../notes/notes-navigation';
import { eligibleContextTarget } from './context-target';
import { MenuPanel, type MenuCommand } from './menu-panel';
import { usePageSections } from './page-sections';
import './context-menu.css';

type Activation = { id: number; x: number; y: number };
export function LearnContextMenu({ subject, activeTab, onNavigate }: {
  subject?: LearnSubject; activeTab?: string; onNavigate?: (id: string) => void;
}) {
  const { mode } = useTheme(), palette = usePalette();
  const sections = usePageSections();
  const pages = useContext(ReadingPageContext);
  const host = useRef<HTMLDivElement>(null), opener = useRef<HTMLElement | null>(null);
  const serial = useRef(0), hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [activation, setActivation] = useState<Activation | null>(null);
  const close = useCallback((restore = false) => {
    serial.current++;
    clearTimeout(hoverTimer.current);
    setActivation(null);
    if (restore && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  }, []);
  useEffect(() => { close(); }, [activeTab, close]);
  useEffect(() => {
    let lastPointerType = '';
    const open = (x: number, y: number, keyboardTarget?: HTMLElement) => {
      if (!host.current?.contains(document.activeElement)) opener.current = keyboardTarget ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      close();
      setActivation({ id: serial.current, x, y });
    };
    const contextmenu = (event: MouseEvent) => {
      const target = lastPointerType === 'touch' ? null : eligibleContextTarget(event);
      if (!target) { close(); return; }
      event.preventDefault();
      open(event.clientX, event.clientY);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
      if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
      const target = eligibleContextTarget(event);
      if (!target) return;
      event.preventDefault();
      const rect = target.getBoundingClientRect();
      open(Math.max(8, rect.left + 12), Math.max(8, rect.top + 16), target);
    };
    const pointerdown = (event: PointerEvent) => {
      lastPointerType = event.pointerType;
      if (!host.current?.contains(event.target as Node)) close();
    };
    const focusin = (event: FocusEvent) => {
      if (host.current && !host.current.contains(event.target as Node)) close();
    };
    document.addEventListener('contextmenu', contextmenu);
    document.addEventListener('keydown', keyboard);
    document.addEventListener('pointerdown', pointerdown);
    document.addEventListener('focusin', focusin);
    return () => {
      document.removeEventListener('contextmenu', contextmenu);
      document.removeEventListener('keydown', keyboard);
      document.removeEventListener('pointerdown', pointerdown);
      document.removeEventListener('focusin', focusin);
      clearTimeout(hoverTimer.current);
    };
  }, [close]);
  useEffect(() => {
    if (!activation) return;
    const dismiss = () => close();
    const scroll = (event: Event) => { if (!(event.target instanceof Node) || !host.current?.contains(event.target)) close(); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Tab') close(true); };
    window.addEventListener('blur', dismiss);
    window.addEventListener('resize', dismiss);
    window.addEventListener('hashchange', dismiss);
    document.addEventListener('scroll', scroll, true);
    document.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('blur', dismiss);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('hashchange', dismiss);
      document.removeEventListener('scroll', scroll, true);
      document.removeEventListener('keydown', key);
    };
  }, [activation, close]);
  if (!activation) return null;

  // Remove the portal before handing focus to a heading or another workspace.
  const finish = (action: () => void, restore = false) => { flushSync(() => close(restore)); action(); };
  const commands: MenuCommand[] = [];
  const shortcut = subject?.modelShortcut;
  const modelTab = subject?.tabs.find(tab => tab.id === shortcut?.tabId && tab.kind === 'visualize');
  const href = modelTab && subject ? `${subject.href}#${modelTab.id}` : null;
  if (href && shortcut) commands.push({ id: 'model', label: shortcut.label, href, current: activeTab === modelTab?.id, run: () => finish(() => onNavigate?.(shortcut.tabId)) });
  commands.push({ id: 'navigate', label: 'Navigate', divider: !!href, children: subject ? subject.tabs.filter(tab => tab.kind !== 'coming-soon').map(tab => ({
    id: tab.id, label: tab.title, current: tab.id === activeTab, run: () => finish(() => onNavigate?.(tab.id)),
  })) : learnSubjects.map(item => ({ id: item.slug, label: item.title, href: item.href, run: () => finish(() => window.location.assign(item.href)) })) });
  const liveSections = sections.filter(({ id }) => {
    const element = document.getElementById(id);
    return element && !element.closest('[hidden]');
  });
  if (liveSections.length) commands.push({ id: 'sections', label: 'On This Page', children: liveSections.map(section => ({
    id: section.id, label: section.title, run: () => finish(() => {
      const heading = document.getElementById(section.id);
      if (!heading) return;
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${section.id}`);
      const shell = heading.closest<HTMLElement>('.learn-shell');
      if (shell) {
        const inset = (shell.querySelector('.learn-tab-bar')?.getBoundingClientRect().height ?? 0) + 24;
        shell.scrollTo({ top: shell.scrollTop + heading.getBoundingClientRect().top - shell.getBoundingClientRect().top - inset, behavior: learnScrollBehavior() });
      }
      heading.focus({ preventScroll: true });
    }),
  })) });
  commands.push(
    { id: 'notes', label: 'My Notes', divider: true, run: () => finish(() => openNotes(), true) },
    { id: 'top', label: 'Back to top', run: () => finish(backToLearnTop) },
    { id: 'appearance', label: 'Appearance', children: [
      { id: 'theme', label: 'Light / Dark', children: (['light', 'dark'] as const).map(choice => ({ id: choice, label: choice === 'light' ? 'Light' : 'Dark', checked: mode === choice, run: () => browserTheme.setMode(choice) })) },
      { id: 'palette', label: 'Color Palette', children: PALETTE_OPTIONS.map(choice => ({ id: choice.id, label: choice.label, checked: palette === choice.id, run: () => browserPalette.setPalette(choice.id) })) },
    ] },
    { id: 'reload', label: 'Reload page', divider: true, run: () => finish(() => window.location.reload()) },
  );
  const footerCommands: MenuCommand[] = pages ? [
    { id: 'previous-page', label: pages.previous ? `Previous page: ${pages.previous.title}` : 'Previous page', icon: <ArrowLeft size={18} aria-hidden="true"/>, disabled: !pages.previous, run: () => finish(() => { if (pages.previous) pages.onNavigate(pages.previous.id); }) },
    { id: 'next-page', label: pages.next ? `Next page: ${pages.next.title}` : 'Next page', icon: <ArrowRight size={18} aria-hidden="true"/>, disabled: !pages.next, run: () => finish(() => { if (pages.next) pages.onNavigate(pages.next.id); }) },
  ] : [];
  return createPortal(<div ref={host} className="site-context-host" data-annotation-excluded data-atlas-shortcuts="disabled">
    <MenuPanel key={activation.id} commands={commands} footerCommands={footerCommands} label="Page context menu" point={activation} onClose={() => close(true)} hoverTimer={hoverTimer}/>
  </div>, document.body);
}
