type Preferences = { version: 1; starredIds: string[]; starredOnly: boolean };

export function createGalleryPreferencesStore(subjectSlug: string, figureIds: string[], storage: Pick<Storage, 'getItem' | 'setItem'> | undefined) {
  const key = `human-atlas-gallery:v1:${subjectSlug}`;
  const validIds = new Set(figureIds), listeners = new Set<() => void>();
  const empty = (): Preferences => ({ version: 1, starredIds: [], starredOnly: false });
  let snapshot = { preferences: empty(), error: '' };
  const parse = (raw: string | null): Preferences => {
    if (!raw) return empty();
    const value = JSON.parse(raw) as Preferences;
    if (!value || value.version !== 1 || !Array.isArray(value.starredIds) || !value.starredIds.every(id => typeof id === 'string') || typeof value.starredOnly !== 'boolean') throw new Error('Invalid gallery preferences.');
    return { version: 1, starredIds: figureIds.filter(id => value.starredIds.includes(id)), starredOnly: value.starredOnly };
  };
  const read = () => {
    try {
      if (!storage) throw new Error('Storage unavailable.');
      snapshot = { preferences: parse(storage.getItem(key)), error: '' };
    } catch {
      snapshot = { ...snapshot, error: 'Gallery preferences could not be loaded. Stars and filters will work for this session.' };
    }
  };
  read();
  const emit = () => listeners.forEach(listener => listener());
  const update = (change: (preferences: Preferences) => Preferences) => {
    let current = snapshot.preferences;
    try { if (storage && !snapshot.error) current = parse(storage.getItem(key)); } catch { /* Keep the current session if storage becomes unavailable. */ }
    const next = change(current);
    let error = '';
    try {
      if (!storage) throw new Error('Storage unavailable.');
      storage.setItem(key, JSON.stringify(next));
    } catch { error = 'Gallery preferences could not be saved. Changes may be lost when you leave or refresh.'; }
    snapshot = { preferences: next, error };
    emit();
  };
  return {
    key,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh: () => { read(); emit(); },
    toggleStar: (id: string) => {
      if (!validIds.has(id)) return;
      update(current => ({ ...current, starredIds: current.starredIds.includes(id) ? current.starredIds.filter(value => value !== id) : figureIds.filter(value => value === id || current.starredIds.includes(value)) }));
    },
    toggleStarredOnly: () => update(current => ({ ...current, starredOnly: !current.starredOnly })),
  };
}
