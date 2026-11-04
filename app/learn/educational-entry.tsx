import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { EducationalMarkdown } from './educational-markdown';
import type { EducationalEntryData, EducationalSectionData } from './subjects';
import { ReadingLayout } from './section-index';

export function EducationalFacts({ section, enabled, title = section.title }: { section: EducationalSectionData; enabled: boolean; title?: string }) {
  const sections = useMemo(() => section.sections.map(entry => ({ id: `${section.id}-${entry.id}-title`, title: entry.title })), [section]);
  return (
    <section className="learn-section learn-facts" aria-labelledby={`${section.id}-heading`}>
      <h2 id={`${section.id}-heading`}>{title}</h2>
      <ReadingLayout title={title} sections={sections} enabled={enabled}>
        {section.sections.map((entry, index) => <EducationalEntry key={entry.id} sectionId={section.id} entry={entry} index={index} />)}
      </ReadingLayout>
    </section>
  );
}

export function ExpandableExplanation({ entry, id }: { entry: EducationalEntryData; id: string }) {
  return (
    <Collapsible className="learn-disclosure">
      <CollapsibleTrigger
        id={`${id}-trigger`}
        className="learn-more-trigger"
        aria-controls={`${id}-explanation`}
        aria-describedby={`${id}-title`}
      >
        {entry.moreInfoLabel}<ChevronDown size={16} aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent
        keepMounted
        className="learn-more-panel"
        id={`${id}-explanation`}
        role="region"
        aria-labelledby={`${id}-explanation-title`}
      >
        <div className="learn-explanation">
          <h4 id={`${id}-explanation-title`}>{entry.moreInfoTitle}</h4>
          <EducationalMarkdown headingOffset={2}>{entry.moreInfoMarkdown}</EducationalMarkdown>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function EducationalEntry({ entry, index, sectionId }: {
  entry: EducationalEntryData;
  index: number;
  sectionId: string;
}) {
  const id = `${sectionId}-${entry.id}`;
  return (
    <article className="learn-entry" id={id} aria-labelledby={`${id}-title`}>
      <span className="learn-entry-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div className="learn-entry-copy">
        <h3 id={`${id}-title`} tabIndex={-1}>{entry.title}</h3>
        <EducationalMarkdown>{entry.summary}</EducationalMarkdown>
        <ExpandableExplanation entry={entry} id={id} />
      </div>
    </article>
  );
}
