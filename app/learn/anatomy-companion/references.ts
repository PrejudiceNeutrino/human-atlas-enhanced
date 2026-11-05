import digestive from '../../../data/learn/digestive-anatomy-references.json';
import type { CanonicalConceptId } from '../../identity-contracts';
import type { RegionId } from '../../region-contracts';
import type { SystemId } from '../../anatomy';

export interface AnatomyReference { conceptId: CanonicalConceptId; label: string; sectionId: string; summary: string }
export interface AnatomyLesson {
  subjectId: string;
  visualizeTabId: string;
  referenceArticleId: string;
  primarySystems: SystemId[];
  contextRegionIds: RegionId[];
  contextSystems: SystemId[];
  structures: AnatomyReference[];
}
export const anatomyLessons: AnatomyLesson[] = [digestive as AnatomyLesson];
export const anatomyLessonForArticle = (id: string) => anatomyLessons.find(lesson => lesson.referenceArticleId === id);
