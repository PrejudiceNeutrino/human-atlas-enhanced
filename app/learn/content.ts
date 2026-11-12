import lymphoidGeneralOverview from '../../data/learn/lymphoid-system-general-overview.json';
import lymphoidDeepDive from '../../data/learn/lymphoid-system-deep-dive.json';
import lymphoidHowItConnects from '../../data/learn/lymphoid-system-how-it-connects.json';
import lymphoidExamCram from '../../data/learn/lymphoid-system-exam-cram.json';
import lymphoidWhoCares from '../../data/learn/lymphoid-system-why-is-this-cool.json';
import respiratoryGeneralOverview from '../../data/learn/respiratory-system-general-overview.json';
import respiratoryDeepDive from '../../data/learn/respiratory-system-deep-dive.json';
import respiratoryHowItConnects from '../../data/learn/respiratory-system-how-it-connects.json';
import respiratoryExamCram from '../../data/learn/respiratory-system-exam-cram.json';
import respiratoryWhoCares from '../../data/learn/respiratory-system-why-is-this-cool.json';
import generalOverview from '../../data/learn/digestive-system-general-overview.json';
import howItConnects from '../../data/learn/digestive-system-how-it-connects.json';
import deepDive from '../../data/learn/digestive-system-deep-dive.json';
import examCram from '../../data/learn/digestive-system-exam-cram.json';
import whyIsThisCool from '../../data/learn/digestive-system-why-is-this-cool.json';
import type { EducationalArticleData, EducationalSectionData } from './subjects';

// Shared renderers and Notes use these stable, subject-owned source records.
// Study banks, images and geometry retain their separate lazy-loading boundaries.
const subjectContent = [
  { subjectId: 'lymphoid', articles: [lymphoidGeneralOverview, lymphoidDeepDive, lymphoidHowItConnects, lymphoidExamCram], facts: [lymphoidWhoCares] },
  { subjectId: 'digestive', articles: [generalOverview, howItConnects, deepDive, examCram], facts: [whyIsThisCool] },
  { subjectId: 'respiratory', articles: [respiratoryGeneralOverview, respiratoryDeepDive, respiratoryHowItConnects, respiratoryExamCram], facts: [respiratoryWhoCares] },
];
export const articles: Record<string, EducationalArticleData> = Object.fromEntries(
  subjectContent.flatMap(subject => subject.articles.map(article => [article.id, article])),
);
export const factSections: Record<string, EducationalSectionData> = Object.fromEntries(
  subjectContent.flatMap(subject => subject.facts.map(section => [section.id, section])),
);
