import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { StickyNote, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AppearanceControls } from '../appearance-controls';
import { OPEN_NOTES_EVENT, revisitReading } from './notes-navigation';
import '../learn/subject-menu.css';
import './notes.css';

const NotesWorkspace = lazy(() => import('./page'));

export function NotesDialog({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const opener = useRef<HTMLElement | null>(null), closeButton = useRef<HTMLButtonElement>(null), navigating = useRef(false);
  useEffect(() => {
    const show = (event: Event) => {
      const requested = (event as CustomEvent<{ opener?: HTMLElement | null }>).detail?.opener;
      opener.current = requested?.isConnected ? requested : document.activeElement instanceof HTMLElement ? document.activeElement : null;
      navigating.current = false;
      setOpen(true);
    };
    window.addEventListener(OPEN_NOTES_EVENT, show);
    return () => window.removeEventListener(OPEN_NOTES_EVENT, show);
  }, []);
  const navigate = (href: string) => {
    navigating.current = true;
    flushSync(() => setOpen(false));
    revisitReading(href);
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="learn-menu-surface notes-workspace-dialog" overlayClassName="learn-menu-backdrop" showCloseButton={false}
      initialFocus={closeButton} finalFocus={() => navigating.current ? false : opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>('.site-notes-trigger')}
      aria-modal="true" data-atlas-shortcuts="disabled" data-annotation-excluded>
      <header className="notes-dialog-heading">
        <div className="notes-dialog-title"><div className="learn-menu-eyebrow"><StickyNote size={15} aria-hidden="true"/><span>Personal study space</span></div><DialogTitle className="learn-menu-title">Notes</DialogTitle><DialogDescription className="learn-menu-description">Your highlights, with your thinking alongside them.</DialogDescription></div>
        <div className="notes-dialog-actions"><AppearanceControls/><DialogClose ref={closeButton} className="notes-dialog-close" aria-label="Close Notes"><X size={18} aria-hidden="true"/></DialogClose></div>
      </header>
      <div className="notes-dialog-body">{open && <Suspense fallback={<p role="status" className="notes-dialog-loading">Opening your local notes…</p>}><NotesWorkspace onNavigate={navigate}/></Suspense>}</div>
    </DialogContent>
  </Dialog>;
}
