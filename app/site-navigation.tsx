import { LearnSubjectMenu } from './learn/subject-menu';
import { NotesTrigger } from './notes/notes-trigger';
import { NotesDialog } from './notes/notes-dialog';
import './site-navigation.css';

export function SiteNavigation({ section, initialNotesOpen = false }: { section: 'explore' | 'learn' | 'notes'; initialNotesOpen?: boolean }) {
  return (
    <nav className="site-navigation" aria-label="Main navigation">
      <a href="/male" aria-current={section === 'explore' ? 'page' : undefined}>Explore</a>
      <LearnSubjectMenu active={section === 'learn'} />
      <NotesTrigger className="site-notes-trigger"/>
      <NotesDialog initiallyOpen={initialNotesOpen}/>
    </nav>
  );
}
