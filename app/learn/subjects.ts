import digestive from '../../data/learn/digestive-system-why-is-this-cool.json';

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

export interface LearnSubject {
  slug: string;
  label: string;
  title: string;
  href: string;
  sections: EducationalSectionData[];
}

// Subject navigation and pages share one small registry.
export const learnSubjects: LearnSubject[] = [
  {
    slug: 'digestive',
    label: 'Digestive',
    title: 'Digestive System',
    href: '/learn/digestive',
    sections: [digestive],
  },
];

export function subjectForPath(pathname: string) {
  return learnSubjects.find(subject => subject.href === pathname);
}
