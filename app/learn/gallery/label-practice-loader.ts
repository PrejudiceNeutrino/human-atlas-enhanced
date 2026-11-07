import { useEffect, useState } from 'react';
import type { GalleryCollection } from './model';
import { parsePracticeDataset, type PracticeDataset } from './label-practice-model';

/** Optional sidecars are fetched only when a figure opens; a missing file never breaks Gallery. */
export function usePracticeDataset(assetBase: string, subjectId: string, gallery: GalleryCollection, enabled: boolean) {
  const [result, setResult] = useState<{ dataset: PracticeDataset | null; error: string; done: boolean }>({ dataset: null, error: '', done: false });
  useEffect(() => {
    if (!enabled || result.done) return;
    const controller = new AbortController();
    void fetch(`${assetBase}/label-practice.json`, { signal: controller.signal, credentials: 'same-origin' }).then(async response => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Label annotations are unavailable. Reload Gallery to retry.');
      return parsePracticeDataset(await response.json(), subjectId, gallery);
    }).then(dataset => { if (!controller.signal.aborted) setResult({ dataset, error: '', done: true }); })
      .catch(error => { if (!controller.signal.aborted) setResult({ dataset: null, error: error instanceof Error ? error.message : 'Label annotations are unavailable.', done: true }); });
    return () => controller.abort();
  }, [assetBase, subjectId, gallery, enabled, result.done]);
  return result;
}
