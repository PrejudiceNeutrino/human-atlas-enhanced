import { useRef } from 'react';
import { ArrowUpRight, BookOpen, Check, ChevronDown, X } from 'lucide-react';
import {
  Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog';
import { learnSubjects, type LearnSubject } from './subjects';
import './subject-menu.css';

export function LearnSubjectMenu({ active, subject: currentSubject }: { active: boolean; subject?: LearnSubject }) {
  const firstSubject = useRef<HTMLAnchorElement>(null);
  const currentPath = currentSubject?.href ?? window.location.pathname;
  const selectedIndex = Math.max(0, learnSubjects.findIndex(item => item.href === currentPath));

  return (
    <Dialog>
      <DialogTrigger className={currentSubject ? 'learn-subject-switcher' : 'learn-menu-trigger'} aria-current={!currentSubject && active ? 'page' : undefined}
        aria-label={currentSubject ? `Change learning subject: ${currentSubject.title}` : undefined}>
        {currentSubject ? <><BookOpen size={15} aria-hidden="true"/><span>{currentSubject.label}</span><ChevronDown size={14} aria-hidden="true"/></> : 'Learn'}
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
            const sectionCount = subject.tabs.filter(tab => tab.kind !== 'coming-soon').length;
            return (
              <a
                ref={index === selectedIndex ? firstSubject : undefined}
                className="learn-menu-subject"
                href={subject.href}
                key={subject.slug}
                aria-current={currentPath === subject.href ? 'page' : undefined}
              >
                <span className="learn-menu-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="learn-menu-subject-copy">
                  <span className="learn-menu-subject-title">{subject.title}</span>
                  <span className="learn-menu-subject-preview" role="list" aria-label={`${subject.title} sections`}>
                    {subject.tabs.map(tab => (
                      <span className="learn-menu-preview-item" role="listitem" key={tab.id}>
                        <span>{tab.title}</span>
                        {tab.kind === 'coming-soon' && <span className="learn-menu-preview-status">Coming Soon</span>}
                      </span>
                    ))}
                  </span>
                  <span className="learn-menu-subject-count">{sectionCount} {sectionCount === 1 ? 'section' : 'sections'}</span>
                </span>
                <span className="learn-menu-subject-arrow" aria-hidden="true">{currentPath === subject.href ? <Check size={18}/> : <ArrowUpRight size={18}/>}</span>
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
