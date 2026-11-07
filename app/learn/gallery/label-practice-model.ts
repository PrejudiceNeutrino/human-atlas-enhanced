import type { GalleryCollection, GalleryFigure } from './model';

export type MaskRegion = { shape: 'rect'; x: number; y: number; width: number; height: number; fill: string } | { shape: 'polygon'; points: [number, number][]; fill: string };
export interface PracticeLabel {
  id: string; label: string; acceptedAnswers: string[]; regions: MaskRegion[];
  reviewStatus: 'verified' | 'needs-review'; hint?: string; conceptId?: string;
  issue?: 'overlaps-anatomy' | 'truncated-source' | 'inadequate-mask';
}
export interface PracticeFigure {
  figureId: string; sourceImageSha256: string; reviewStatus: 'verified' | 'candidate' | 'not-applicable';
  coverage: 'complete' | 'partial' | 'none'; reviewNotes: string; labels: PracticeLabel[];
}
export interface PracticeDataset { schemaVersion: 1; subjectId: string; figures: PracticeFigure[] }

const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const unit = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const text = (value: unknown, maximum = 1000): value is string => typeof value === 'string' && value.length <= maximum;

export function parsePracticeDataset(input: unknown, subjectId: string, gallery?: GalleryCollection): PracticeDataset {
  const data = input as PracticeDataset;
  if (!data || data.schemaVersion !== 1 || data.subjectId !== subjectId || !identifier(subjectId) || !Array.isArray(data.figures) || data.figures.length > 1000) throw new Error('Unsupported label annotation collection.');
  const figures = new Set<string>();
  for (const figure of data.figures) {
    if (!figure || !identifier(figure.figureId) || figures.has(figure.figureId) || (gallery && !gallery.items.some(item => item.id === figure.figureId)) ||
      !/^[a-f0-9]{64}$/.test(figure.sourceImageSha256) || !['verified', 'candidate', 'not-applicable'].includes(figure.reviewStatus) || !['complete', 'partial', 'none'].includes(figure.coverage) ||
      !text(figure.reviewNotes, 4000) || !Array.isArray(figure.labels) || figure.labels.length > 500) throw new Error('Invalid or duplicated annotated figure.');
    figures.add(figure.figureId);
    const labels = new Set<string>();
    for (const label of figure.labels) {
      if (!label || !identifier(label.id) || labels.has(label.id) || !text(label.label, 250) || !label.label.trim() || !['verified', 'needs-review'].includes(label.reviewStatus) ||
        !Array.isArray(label.acceptedAnswers) || label.acceptedAnswers.length > 30 || !label.acceptedAnswers.every(answer => text(answer, 250) && answer.trim()) ||
        (label.hint !== undefined && !text(label.hint)) || (label.conceptId !== undefined && !text(label.conceptId, 250)) ||
        (label.issue !== undefined && !['overlaps-anatomy', 'truncated-source', 'inadequate-mask'].includes(label.issue)) ||
        (label.issue !== undefined && label.reviewStatus === 'verified') || !Array.isArray(label.regions) || !label.regions.length || label.regions.length > 30) throw new Error('Invalid or duplicated practice label.');
      labels.add(label.id);
      for (const region of label.regions) {
        if (!region || !/^#[0-9a-f]{6}$/i.test(region.fill)) throw new Error('Masks require an opaque six-digit color.');
        if (region.shape === 'rect') {
          if (![region.x, region.y, region.width, region.height].every(unit) || region.width <= 0 || region.height <= 0 || region.x + region.width > 1.000001 || region.y + region.height > 1.000001) throw new Error('Mask rectangle lies outside normalized image space.');
        } else if (region.shape === 'polygon') {
          if (!Array.isArray(region.points) || region.points.length < 3 || region.points.length > 64 || !region.points.every(point => Array.isArray(point) && point.length === 2 && point.every(unit))) throw new Error('Invalid normalized mask polygon.');
          const area = region.points.reduce((sum, point, index, points) => { const next = points[(index + 1) % points.length]; return sum + point[0] * next[1] - next[0] * point[1]; }, 0);
          if (Math.abs(area) < .00000001) throw new Error('Mask polygon has no area.');
        } else throw new Error('Unsupported mask shape.');
      }
    }
    if (figure.reviewStatus === 'not-applicable' && (figure.labels.length || figure.coverage !== 'none')) throw new Error('Unlabeled figures cannot publish masks.');
    if (figure.reviewStatus === 'verified' && (!figure.labels.some(label => label.reviewStatus === 'verified') || figure.coverage === 'none')) throw new Error('A reviewed figure needs reviewed labels.');
    if (figure.coverage === 'complete' && figure.labels.some(label => label.reviewStatus !== 'verified')) throw new Error('Incomplete labels cannot be marked complete.');
  }
  return data;
}

export function practiceForFigure(dataset: PracticeDataset | null, figure: GalleryFigure) {
  const entry = dataset?.figures.find(item => item.figureId === figure.id);
  const stale = !!entry && entry.sourceImageSha256 !== figure.sha256;
  return { entry, stale, labels: !stale && entry?.reviewStatus === 'verified' ? entry.labels.filter(label => label.reviewStatus === 'verified' && !label.issue) : [] };
}

export const answerMatches = (label: PracticeLabel, answer: string) => {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  return !!normalize(answer) && [label.label, ...label.acceptedAnswers].some(value => normalize(value) === normalize(answer));
};

export function regionBounds(region: MaskRegion) {
  if (region.shape === 'rect') return region;
  const xs = region.points.map(point => point[0]), ys = region.points.map(point => point[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}
