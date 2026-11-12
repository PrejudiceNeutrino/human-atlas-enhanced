import { useCallback, useEffect, useState } from 'react';
import type { ExamCramMode } from './exam-cram-content';

export const examCramPreferenceKey = (subjectId: string) => `human-atlas-exam-cram:v1:${subjectId}`;
export function readExamCramMode(value: string | null): ExamCramMode {
  try {
    const data = JSON.parse(value ?? 'null');
    if (data?.version === 1 && (data.mode === 'quick-scan' || data.mode === 'detailed-review')) return data.mode;
  } catch { /* An invalid preference must never prevent reading. */ }
  return 'quick-scan';
}

export function useExamCramMode(subjectId: string, articleId?: string, canonicalMode: ExamCramMode = 'detailed-review') {
  const key = examCramPreferenceKey(subjectId);
  const [mode, showMode] = useState<ExamCramMode>(() => {
    // Canonical bookmarks and Study Tools references always open the original text.
    if (!articleId || window.location.hash === `#${articleId}` || window.location.hash.startsWith(`#${articleId}-`)) return canonicalMode;
    try { return readExamCramMode(window.localStorage.getItem(key)); } catch { return 'quick-scan'; }
  });
  const [savingError, setSavingError] = useState(false);
  const chooseMode = useCallback((next: ExamCramMode) => {
    showMode(next);
    try { window.localStorage.setItem(key, JSON.stringify({ version: 1, mode: next })); setSavingError(false); }
    catch { setSavingError(true); }
  }, [key]);
  useEffect(() => {
    if (!articleId) return;
    const update = (event: StorageEvent) => {
      if (event.key === key || event.key === null) showMode(readExamCramMode(event.newValue));
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, [articleId, key]);
  return { mode, showMode, chooseMode, savingError };
}
