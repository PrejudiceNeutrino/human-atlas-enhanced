import { useEffect, useState } from 'react';

export const OPEN_NOTES_EVENT = 'human-atlas:open-notes';

export function openNotes(opener: HTMLElement | null = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
  window.dispatchEvent(new window.CustomEvent(OPEN_NOTES_EVENT, { detail: { opener } }));
}

/** Reading and annotation jumps observe the same hash, including in-place revisits. */
export function useReadingHash() {
  const [location, setLocation] = useState(() => ({ hash: window.location.hash }));
  useEffect(() => {
    const update = () => setLocation({ hash: window.location.hash });
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return location;
}

export function revisitReading(href: string) {
  const url = new URL(href, window.location.href);
  if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search) {
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    window.dispatchEvent(new window.Event('hashchange'));
  } else window.location.assign(url.href);
}
