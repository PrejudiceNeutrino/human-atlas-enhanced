import { useRef } from 'react';
import { BookOpen, Info, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { upcomingLearningSections, type LearnSubject } from './subjects';
import './subject-menu.css';

export function SectionGuide({ subject }: { subject: LearnSubject }) {
  const close = useRef<HTMLButtonElement>(null);
  const available = subject.tabs.filter(tab => tab.kind !== 'coming-soon');
  return (
    <Dialog>
      <DialogTrigger className="learn-section-guide-trigger" aria-label="About these sections" title="Section guide">
        <Info size={18} strokeWidth={1.6} aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="learn-menu-surface learn-section-guide" overlayClassName="learn-menu-backdrop"
        showCloseButton={false} initialFocus={close} aria-modal="true" data-atlas-shortcuts="disabled">
        <DialogClose ref={close} className="learn-menu-close" aria-label="Close section guide"><X size={18} aria-hidden="true" /></DialogClose>
        <div className="learn-menu-heading">
          <div className="learn-menu-eyebrow"><BookOpen size={15} aria-hidden="true" /><span>Human Atlas</span></div>
          <DialogTitle className="learn-menu-title">Section guide</DialogTitle>
          <DialogDescription className="learn-menu-description">Choose the learning approach that best fits what you want to understand, explore, or review.</DialogDescription>
        </div>
        <div className="learn-section-guide-body">
          <dl className="learn-section-guide-entries">
            {available.map(tab => <div key={tab.id}><dt>{tab.title}</dt><dd>{tab.description}</dd></div>)}
          </dl>
          <dl className="learn-section-guide-entries learn-section-guide-planned">
            {upcomingLearningSections.map(section => <div key={section.id}>
              <dt>{section.title}<span className="learn-coming-soon">Coming Soon</span></dt><dd>{section.description}</dd>
            </div>)}
          </dl>
        </div>
        <div className="learn-menu-footer">
          <span>{available.length} learning approaches · {upcomingLearningSections.length} coming soon</span>
          <span className="learn-menu-key-hint"><kbd>Esc</kbd> to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
