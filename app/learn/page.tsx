import { useEffect } from 'react';
import { ArrowUpRight, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteNavigation } from '../site-navigation';
import { browserTheme, useTheme } from '../theme-store';
import { SubjectTabs } from './subject-tabs';
import { learnSubjects, subjectForPath } from './subjects';
import './learn.css';

export default function LearnPage({ pathname }: { pathname: string }) {
  const subject = subjectForPath(pathname);
  const title = subject?.title ?? (pathname === '/learn' ? 'Learn' : 'Page not found');
  const { mode } = useTheme();
  useEffect(() => {
    document.title = `${title} · Human Atlas`;
  }, [title]);

  return (
    <div className="learn-shell">
      <a className="learn-skip-link" href="#learn-content">Skip to content</a>
      <header className="learn-header">
        <a className="learn-wordmark" href="/" aria-label="Human Atlas home">Human Atlas</a>
        <SiteNavigation section="learn" />
        <Button
          variant="ghost"
          className="learn-theme-trigger"
          aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
          onClick={() => browserTheme.setMode(mode === 'light' ? 'dark' : 'light')}
        >
          {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
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
        {subject ? <SubjectTabs key={subject.slug} subject={subject} /> : (
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
    </div>
  );
}
