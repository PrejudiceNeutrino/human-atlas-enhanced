// Adapted from Engineering Club context-menu/context-target.ts (MIT).
/** Keep selection, links, editors, media, dialogs and interactive study controls native. */
export function eligibleContextTarget(event: MouseEvent | KeyboardEvent): HTMLElement | null {
  if (event.defaultPrevented || event.shiftKey && event.type !== 'keydown') return null;
  if (event.type === 'contextmenu' && ((event as MouseEvent).button !== 2 ||
      ('pointerType' in event && event.pointerType === 'touch'))) return null;
  const target = event.composedPath()[0];
  if (!(target instanceof HTMLElement) || !target.closest('.learn-shell')) return null;
  if (document.querySelector('dialog[open],[aria-modal="true"]:not([hidden]):not([data-closed])')) return null;
  if (window.getSelection()?.toString().trim()) return null;
  if (target.closest('a[href],input,textarea,select,option,button,summary,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="searchbox"],[role="slider"],[role="spinbutton"],[role="listbox"],[role="tree"],[role="grid"],[role="menu"],[role="tab"],[role="switch"],[role="button"],[data-annotation-id],.monaco-editor,.cm-editor,img,picture,video,audio,canvas,iframe,object,embed,svg,dialog,[role="dialog"],.appearance-popover,.annotation-toolbar,.annotation-target,.notes-editor,.learn-anatomy,.learn-companion-aside,[data-context-menu="native"]')) return null;
  return target;
}

export function positionMenu(
  point: { x: number; y: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  anchor?: { left: number; right: number },
) {
  const gap = 8;
  let x = point.x;
  if (anchor) {
    x = anchor.right + 3;
    if (x + size.width > viewport.width - gap) x = anchor.left - size.width - 3;
  }
  return {
    x: Math.max(gap, Math.min(x, viewport.width - size.width - gap)),
    y: Math.max(gap, Math.min(point.y, viewport.height - size.height - gap)),
  };
}
