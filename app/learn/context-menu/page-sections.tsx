// Adapted from Engineering Club's page-sections registry, without Next routing.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ReadingSectionLink } from '../section-index';

type Register = (sections: ReadingSectionLink[]) => () => void;
const RegistrationContext = createContext<Register>(() => () => {});
const SectionsContext = createContext<ReadingSectionLink[][]>([]);

export function PageSectionsProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ReadingSectionLink[][]>([]);
  const register = useCallback<Register>(sections => {
    setEntries(current => [...current, sections]);
    return () => setEntries(current => current.filter(entry => entry !== sections));
  }, []);
  return <RegistrationContext value={register}><SectionsContext value={entries}>{children}</SectionsContext></RegistrationContext>;
}

export function useRegisterPageSections(sections: ReadingSectionLink[], enabled: boolean) {
  const register = useContext(RegistrationContext);
  useEffect(() => enabled ? register(sections) : undefined, [register, sections, enabled]);
}

export function usePageSections() {
  const entries = useContext(SectionsContext);
  const seen = new Set<string>();
  return entries.flat().filter(section => {
    if (seen.has(section.id)) return false;
    seen.add(section.id);
    return true;
  });
}
