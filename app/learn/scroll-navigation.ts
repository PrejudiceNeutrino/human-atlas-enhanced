export function learnScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
}

export const LEARN_BACK_TO_TOP_EVENT = 'human-atlas:back-to-learn-top';

/** Learn owns a scroll container; every return-to-top action uses this path. */
export function backToLearnTop() {
  // The floating control owns the motion, including requests from the RMB menu.
  if (!window.dispatchEvent(new Event(LEARN_BACK_TO_TOP_EVENT, { cancelable: true }))) return;
  const shell = document.querySelector<HTMLElement>('.learn-shell');
  shell?.querySelector<HTMLElement>('#learn-content')?.focus({ preventScroll: true });
  shell?.scrollTo({ top: 0, behavior: learnScrollBehavior() });
}
