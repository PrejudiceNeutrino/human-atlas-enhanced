import { useEffect } from 'react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { SiteNavigation } from '../site-navigation';
import { AppearanceControls } from '../appearance-controls';
import { SubjectTabs } from './subject-tabs';
import { AnnotationReader } from '../notes/annotation-reader';
import { learnSubjects, subjectForPath } from './subjects';
import { LearnContextMenu } from './context-menu/learn-context-menu';
import { LearnBackToTop } from './back-to-top';
import { LearnSubjectMenu } from './subject-menu';
import './learn.css';
import '../notes/notes.css';

export default function LearnPage({ pathname, initialNotesOpen = false }: { pathname: string; initialNotesOpen?: boolean }) {
  const subject = subjectForPath(pathname);
  const title = subject?.title ?? (pathname === '/learn' ? 'Learn' : 'Page not found');
  useEffect(() => {
    document.title = `${title} · Human Atlas`;
  }, [title]);

  return (
    <div className="learn-shell">
      {!subject && <LearnContextMenu/>}
      <a className="learn-skip-link" href="#learn-content">Skip to content</a>
      <header className="learn-header">
        <a className="learn-wordmark" href="/" aria-label="Human Atlas home">Human Atlas</a>
        <SiteNavigation section="learn" initialNotesOpen={initialNotesOpen}/>
        <AppearanceControls/>
      </header>
      <main id="learn-content" className="learn-content" data-subject={subject?.slug} tabIndex={-1}>
        <div className="learn-page-heading">
          {subject && <nav className="learn-subject-path" aria-label="Breadcrumb">
            <a className="learn-breadcrumb" href="/learn">Learn</a>
            <ChevronRight className="learn-breadcrumb-divider" size={14} aria-hidden="true"/>
            <LearnSubjectMenu active subject={subject}/>
          </nav>}
          <h1>{title}</h1>
        </div>
        {subject ? <AnnotationReader key={subject.slug}><SubjectTabs subject={subject} /></AnnotationReader> : (
          <div className="learn-subject-list">
            {learnSubjects.map(item => (
              <a className="learn-subject-card" key={item.slug} href={item.href}>
                <span>{item.title}</span><ArrowUpRight size={20} aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </main>
      <footer className="learn-footer"><a href="/male">Explore the 3D atlas <ArrowUpRight size={14} aria-hidden="true" /></a></footer>
      <LearnBackToTop/>
    </div>
  );
}
