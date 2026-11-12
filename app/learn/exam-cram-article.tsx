import { useLayoutEffect, useRef } from 'react';
import { EducationalArticle } from './educational-article';
import type { EducationalArticleData } from './subjects';
import type { ExamCramMode } from './exam-cram-content';

export function ExamCramArticle({ detailed, quickScan, anchorId, mode, onModeChange, savingError, readingIntro }: {
  detailed: EducationalArticleData; quickScan: EducationalArticleData; anchorId: string; mode: ExamCramMode;
  onModeChange: (mode: ExamCramMode) => void; savingError: boolean; readingIntro?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const position = useRef<{ id: string; top: number } | null>(null);
  useLayoutEffect(() => {
    const previous = position.current; position.current = null;
    if (!previous) return;
    const heading = document.getElementById(previous.id), shell = root.current?.closest<HTMLElement>('.learn-shell');
    if (heading && shell) shell.scrollTop += heading.getBoundingClientRect().top - previous.top;
  }, [mode]);
  const choose = (next: ExamCramMode) => {
    if (next === mode) return;
    const shell = root.current?.closest<HTMLElement>('.learn-shell');
    const threshold = (shell?.querySelector('.learn-tab-bar')?.getBoundingClientRect().bottom ?? 0) + 24;
    const heading = [...root.current?.querySelectorAll<HTMLElement>('.learn-article-section > h3') ?? []].filter(item => item.getBoundingClientRect().top <= threshold).at(-1);
    if (heading) position.current = { id: heading.id, top: heading.getBoundingClientRect().top };
    window.getSelection()?.removeAllRanges();
    onModeChange(next);
  };
  return <div ref={root} className="learn-exam-cram" data-reading-mode={mode}>
    <EducationalArticle article={mode === 'quick-scan' ? quickScan : detailed} anchorId={anchorId} presentation="cram" readingIntro={readingIntro}
      readingControls={<div className="learn-exam-mode-controls" data-annotation-excluded>
        <fieldset className="learn-exam-mode"><legend className="sr-only">Exam Cram reading mode</legend>
          {([['quick-scan', 'Quick Scan'], ['detailed-review', 'Detailed Review']] as const).map(([value, label]) => <label key={value}>
            <input type="radio" name={`${anchorId}-mode`} value={value} checked={mode === value} onChange={() => choose(value)}/><span>{label}</span>
          </label>)}
        </fieldset>
        <span className="sr-only" role="status">{mode === 'quick-scan' ? 'Quick Scan' : 'Detailed Review'} selected</span>
        {savingError && <p className="learn-exam-mode-error" role="status">Your reading mode works for this session but could not be saved in this browser.</p>}
      </div>}/>
  </div>;
}
