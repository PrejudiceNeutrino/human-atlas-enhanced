import { LearnSubjectMenu } from './learn/subject-menu';
import './site-navigation.css';

export function SiteNavigation({ section }: { section: 'explore' | 'learn' | 'notes' }) {
  return (
    <nav className="site-navigation" aria-label="Main navigation">
      <a href="/male" aria-current={section === 'explore' ? 'page' : undefined}>Explore</a>
      <LearnSubjectMenu active={section === 'learn'} />
      <a href="/notes" aria-current={section === 'notes' ? 'page' : undefined}>Notes</a>
    </nav>
  );
}
