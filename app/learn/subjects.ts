export interface EducationalEntryData {
  id: string;
  title: string;
  summary: string;
  moreInfoLabel: string;
  moreInfoTitle: string;
  moreInfoMarkdown: string;
}

export interface EducationalSectionData {
  id: string;
  title: string;
  sections: EducationalEntryData[];
}

export interface EducationalArticleData {
  id: string;
  title: string;
  subject: string;
  subtitle?: string;
  introMarkdown: string;
  sourceFiles?: string[];
  sections: {
    id: string;
    title: string;
    markdown: string;
    slideReferences?: Record<string, number[] | undefined>;
  }[];
}

export type LearnTab = {
  id: string;
  title: string;
} & (
  | { kind: 'article'; presentation: 'overview' | 'reference' | 'cram' }
  | { kind: 'facts' }
  | { kind: 'coming-soon' }
);

export interface LearnSubject {
  slug: string;
  label: string;
  title: string;
  href: string;
  tabs: LearnTab[];
}

// Subject navigation and pages share one small registry.
export const learnSubjects: LearnSubject[] = [
  {
    slug: 'digestive',
    label: 'Digestive',
    title: 'Digestive System',
    href: '/learn/digestive',
    tabs: [
      { id: 'digestive-system-general-overview', title: 'General Overview', kind: 'article', presentation: 'overview' },
      { id: 'digestive-system-deep-dive', title: 'Deep Dive', kind: 'article', presentation: 'reference' },
      { id: 'digestive-system-how-it-connects', title: 'How It Connects', kind: 'article', presentation: 'overview' },
      { id: 'digestive-system-why-is-this-cool', title: "Why's This Cool?", kind: 'facts' },
      { id: 'digestive-system-exam-cram', title: 'Exam Cram', kind: 'article', presentation: 'cram' },
      { id: 'digestive-system-quizzes', title: 'Quizzes', kind: 'coming-soon' },
    ],
  },
];

export function subjectForPath(pathname: string) {
  return learnSubjects.find(subject => subject.href === pathname);
}
