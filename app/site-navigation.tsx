import './site-navigation.css';

export function SiteNavigation({ section }: { section: 'explore' | 'learn' }) {
  return (
    <nav className="site-navigation" aria-label="Main navigation">
      <a href="/male" aria-current={section === 'explore' ? 'page' : undefined}>Explore</a>
      <a href="/learn" aria-current={section === 'learn' ? 'page' : undefined}>Learn</a>
    </nav>
  );
}
