import { useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SiteNavigation } from '../site-navigation';
import { AppearanceControls } from '../appearance-controls';
import { SubjectTabs } from './subject-tabs';
import { AnnotationReader } from '../notes/annotation-reader';
import { learnSubjects, subjectForPath } from './subjects';
import { LearnContextMenu } from './context-menu/learn-context-menu';
import { LearnBackToTop } from './back-to-top';
import './learn.css';
import '../notes/notes.css';

export default function LearnPage({ pathname }: { pathname: string }) {
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
        <SiteNavigation section="learn" />
        <AppearanceControls/>
      </header>
      <nav className="learn-subjects" aria-label="Learn subjects">
        <span>Subjects</span>
        {learnSubjects.map(item => (
          <a key={item.slug} href={item.href} aria-current={item === subject ? 'page' : undefined}>
            {item.label}
          </a>
        ))}
      </nav>
      <main id="learn-content" className="learn-content" data-subject={subject?.slug} tabIndex={-1}>
        <div className="learn-page-heading">
          {subject && <a className="learn-breadcrumb" href="/learn">Learn</a>}
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
