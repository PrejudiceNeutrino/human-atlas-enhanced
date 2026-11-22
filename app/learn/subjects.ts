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
  description: string;
  readingIntro?: string;
} & (
  | { kind: 'article'; presentation: 'overview' | 'reference' | 'cram' }
  | { kind: 'facts' }
  | { kind: 'study-tools' }
  | { kind: 'gallery' }
  | { kind: 'visualize' }
  | { kind: 'coming-soon' }
);

export const learnCategories = ['Anatomy', 'Biology'] as const;
export type LearnCategory = typeof learnCategories[number];

export interface LearnSubject {
  category: LearnCategory;
  slug: string;
  label: string;
  title: string;
  href: string;
  modelShortcut?: { label: string; tabId: string };
  gallery?: { count: number; labelPractice?: boolean };
  tabs: LearnTab[];
}

// Informational previews only; these do not create tabs or routes.
export const upcomingLearningSections: { id: string; title: string; description: string }[] = [];

// Subject navigation and pages share one small registry.
export const learnSubjects: LearnSubject[] = [
  {
    category: 'Anatomy', slug: 'digestive',
    label: 'Digestive',
    title: 'Digestive System',
    href: '/learn/digestive',
    modelShortcut: { label: 'Digestive Model', tabId: 'digestive-system-visualize' },
    gallery: { count: 30, labelPractice: true },
    tabs: [
      { id: 'digestive-system-general-overview', title: 'General Overview', kind: 'article', presentation: 'overview', description: 'Start with an accessible introduction to the subject, covering its fundamental concepts, major components, and essential functions. Ideal for building a foundation before exploring the details.' },
      { id: 'digestive-system-deep-dive', title: 'Deep Dive', kind: 'article', presentation: 'reference', description: 'Explore the subject in greater depth through detailed explanations, terminology, structures, mechanisms, and relationships. Designed for comprehensive understanding and reference.' },
      { id: 'digestive-system-how-it-connects', title: 'How It Connects', kind: 'article', presentation: 'overview', readingIntro: 'Follow a meal from intake to elimination to see how digestive organs, chemical signals, and transport pathways work together. Connect the individual structures and processes into one continuous journey.', description: "Discover how individual concepts work together as part of a larger system. Follow processes step by step and understand the relationships that connect what you've learned." },
      { id: 'digestive-system-why-is-this-cool', title: "Who Cares?", kind: 'facts', readingIntro: 'Discover the surprising science behind your gut’s nerve network, stomach acid, and fat transport. Open “More Info” for the explanation behind each fact.', description: 'Explore fascinating discoveries, surprising phenomena, and interesting applications that reveal what makes the subject worth studying. Expand each explanation to learn the underlying science.' },
      { id: 'digestive-system-visualize', title: 'Visualize', kind: 'visualize', description: 'Explore the subject through interactive 3D anatomy. Rotate, zoom and select structures, compare available model representations, and view surrounding anatomical context.' },
      { id: 'digestive-system-gallery', title: 'Gallery', kind: 'gallery', description: 'Examine curated illustrations, diagrams, photographs, and other visual references that support the educational material. Enlarge images to investigate important details.' },
      { id: 'digestive-system-exam-cram', title: 'Exam Cram', kind: 'article', presentation: 'cram', description: 'Review essential terminology, high-priority concepts, and important relationships in a condensed format. Designed for efficient revision, memorization, and exam preparation.' },
      { id: 'digestive-system-study-tools', title: 'Study Tools', kind: 'study-tools', description: 'Reinforce your understanding through multiple-choice questions, fill-in-the-blank exercises, flashcards, and a searchable glossary. Test your knowledge and identify topics that need further review.' },
    ],
  },
];

// Subjects share the same tab contracts and section-guide descriptions.
learnSubjects.push({
  category: 'Anatomy', slug: 'respiratory', label: 'Respiratory', title: 'Respiratory System', href: '/learn/respiratory',
  modelShortcut: { label: 'Respiratory Model', tabId: 'respiratory-system-visualize' },
  gallery: { count: 29, labelPractice: true },
  tabs: learnSubjects[0].tabs.map(({ readingIntro: _digestiveIntro, ...tab }) => ({
    ...tab, id: tab.id.replace('digestive-system-', 'respiratory-system-'),
  })),
});

learnSubjects.push({
  category: 'Anatomy', slug: 'lymphoid', label: 'Lymphoid', title: 'Lymphoid System and Immunity', href: '/learn/lymphoid',
  modelShortcut: { label: 'Lymphoid Model', tabId: 'lymphoid-system-visualize' },
  gallery: { count: 35, labelPractice: true },
  tabs: learnSubjects[0].tabs.map(({ readingIntro: _digestiveIntro, ...tab }) => ({
    ...tab, id: tab.id.replace('digestive-system-', 'lymphoid-system-'),
  })),
});

learnSubjects.push({
  category: 'Biology',
  slug: 'biology-exam-3',
  label: 'Biology Exam 3',
  title: 'Biology Exam 3',
  href: '/learn/biology-exam-3',
  tabs: [
    ...learnSubjects[0].tabs.filter(tab => tab.kind !== 'visualize').map(({ readingIntro: _digestiveIntro, ...tab }) => ({
      ...tab, id: tab.id.replace('digestive-system-', 'biology-exam-3-'),
    })),
    { id: 'biology-exam-3-campbell-extension', title: 'Campbell Extension', kind: 'article', presentation: 'reference',
      description: 'Explore supplemental Campbell Biology topics beyond the lecture curriculum.' },
  ],
});

export function subjectForPath(pathname: string) {
  return learnSubjects.find(subject => subject.href === pathname);
}
