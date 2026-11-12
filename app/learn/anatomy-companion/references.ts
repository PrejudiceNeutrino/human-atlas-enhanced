import lymphoid from '../../../data/learn/lymphoid-anatomy-references.json';
import respiratory from '../../../data/learn/respiratory-anatomy-references.json';
import digestive from '../../../data/learn/digestive-anatomy-references.json';
import type { CanonicalConceptId, ModelId } from '../../identity-contracts';
import type { RegionId } from '../../region-contracts';
import type { SystemId } from '../../anatomy';

export interface AnatomyReference { conceptId: CanonicalConceptId; label: string; sectionId: string; summary: string }
export interface AnatomyLesson {
  subjectId: string;
  excludedPartIds?: string[];
  coverageNote?: string;
  modelIds?: ModelId[];
  modelStructures?: Partial<Record<ModelId, AnatomyReference[]>>;
  visualizeTabId: string;
  referenceArticleId: string;
  primarySystems: SystemId[];
  contextRegionIds: RegionId[];
  contextSystems: SystemId[];
  structures: AnatomyReference[];
}
export const anatomyLessons: AnatomyLesson[] = [digestive as AnatomyLesson, respiratory as AnatomyLesson, lymphoid as AnatomyLesson];
export const anatomyLessonForArticle = (id: string) => anatomyLessons.find(lesson => lesson.referenceArticleId === id);

/** Keep each representation pinned to its actual model-specific canonical identity. */
export const lessonForModel = (lesson: AnatomyLesson, modelId: ModelId): AnatomyLesson => ({...lesson, structures: lesson.modelStructures?.[modelId] ?? lesson.structures});
