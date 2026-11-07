import { openNotes } from './notes-navigation';

export function NotesTrigger({ children = 'Notes', className = '' }: { children?: React.ReactNode; className?: string }) {
  return <button type="button" className={className} aria-haspopup="dialog" onClick={event => openNotes(event.currentTarget)}>{children}</button>;
}
