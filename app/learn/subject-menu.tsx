import { useRef } from 'react';
import { ArrowUpRight, BookOpen, X } from 'lucide-react';
import {
  Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog';
import { learnSubjects } from './subjects';
import './subject-menu.css';

export function LearnSubjectMenu({ active }: { active: boolean }) {
  const firstSubject = useRef<HTMLAnchorElement>(null);

  return (
    <Dialog>
      <DialogTrigger className="learn-menu-trigger" aria-current={active ? 'page' : undefined}>
        Learn
      </DialogTrigger>
      <DialogContent
        className="learn-menu-surface"
        overlayClassName="learn-menu-backdrop"
        showCloseButton={false}
        initialFocus={firstSubject}
        aria-modal="true"
        data-atlas-shortcuts="disabled"
      >
        <DialogClose className="learn-menu-close" aria-label="Close Learn menu">
          <X size={18} aria-hidden="true" />
        </DialogClose>
        <header className="learn-menu-heading">
          <div className="learn-menu-eyebrow"><BookOpen size={15} aria-hidden="true" /><span>Human Atlas</span></div>
          <DialogTitle className="learn-menu-title">Learn</DialogTitle>
          <DialogDescription className="learn-menu-description">Choose a system to explore.</DialogDescription>
        </header>
        <nav className="learn-menu-subjects" aria-label="Learn subjects">
          {learnSubjects.map((subject, index) => {
            const entryCount = subject.sections.reduce((count, section) => count + section.sections.length, 0);
            return (
              <a
                ref={index === 0 ? firstSubject : undefined}
                className="learn-menu-subject"
                href={subject.href}
                key={subject.slug}
              >
                <span className="learn-menu-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="learn-menu-subject-copy">
                  <span className="learn-menu-subject-title">{subject.title}</span>
                  <span className="learn-menu-subject-preview">{subject.sections[0]?.title}</span>
                  <span className="learn-menu-subject-count">{entryCount} {entryCount === 1 ? 'explanation' : 'explanations'}</span>
                </span>
                <span className="learn-menu-subject-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
              </a>
            );
          })}
        </nav>
        <footer className="learn-menu-footer">
          <span>{learnSubjects.length} {learnSubjects.length === 1 ? 'subject' : 'subjects'}</span>
          <span className="learn-menu-key-hint"><kbd>Esc</kbd> to close</span>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
