import generalOverview from '../../data/learn/digestive-system-general-overview.json';
import howItConnects from '../../data/learn/digestive-system-how-it-connects.json';
import deepDive from '../../data/learn/digestive-system-deep-dive.json';
import examCram from '../../data/learn/digestive-system-exam-cram.json';
import whyIsThisCool from '../../data/learn/digestive-system-why-is-this-cool.json';
import type { EducationalArticleData, EducationalSectionData } from './subjects';

// Only reading-page components import the full content; the viewer's chooser uses metadata.
export const articles: Record<string, EducationalArticleData> = {
  [generalOverview.id]: generalOverview,
  [howItConnects.id]: howItConnects,
  [deepDive.id]: deepDive,
  [examCram.id]: examCram,
};

export const factSections: Record<string, EducationalSectionData> = {
  [whyIsThisCool.id]: whyIsThisCool,
};
