import { ChevronDown } from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AnnotationJumpContext } from '../notes/annotation-context';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { EducationalMarkdown } from './educational-markdown';
import type { EducationalEntryData, EducationalSectionData } from './subjects';
import { ReadingLayout } from './section-index';
import { AnnotationHeading } from '../notes/annotation-render';

export function EducationalFacts({ section, enabled, title = section.title, readingIntro }: { section: EducationalSectionData; enabled: boolean; title?: string; readingIntro?: string }) {
  const sections = useMemo(() => section.sections.map(entry => ({ id: `${section.id}-${entry.id}-title`, title: entry.title })), [section]);
  return (
    <section className="learn-section learn-facts" aria-labelledby={`${section.id}-heading`}>
      <header className="learn-article-header">
        <AnnotationHeading as="h2" sourceId={`${section.id}/intro`} id={`${section.id}-heading`} tabIndex={-1}>{title}</AnnotationHeading>
        {readingIntro && <div className="learn-reading-intro"><EducationalMarkdown sourceId={`${section.id}/intro`}>{readingIntro}</EducationalMarkdown></div>}
      </header>
      <ReadingLayout title={title} sections={sections} enabled={enabled}>
        {section.sections.map((entry, index) => <EducationalEntry key={entry.id} sectionId={section.id} entry={entry} index={index} />)}
      </ReadingLayout>
    </section>
  );
}

export function ExpandableExplanation({ entry, id, sourceId }: { entry: EducationalEntryData; id: string; sourceId: string }) {
  const [open,setOpen]=useState(false);
  const requestedDisclosure=useContext(AnnotationJumpContext);
  useEffect(()=>{if(requestedDisclosure===id)setOpen(true);},[requestedDisclosure,id]);
  return (
    <Collapsible className="learn-disclosure" open={open} onOpenChange={setOpen}>
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
          <AnnotationHeading as="h4" sourceId={sourceId} id={`${id}-explanation-title`}>{entry.moreInfoTitle}</AnnotationHeading>
          <EducationalMarkdown headingOffset={2} sourceId={sourceId}>{entry.moreInfoMarkdown}</EducationalMarkdown>
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
        <AnnotationHeading as="h3" sourceId={`${sectionId}/${entry.id}/summary`} id={`${id}-title`} tabIndex={-1}>{entry.title}</AnnotationHeading>
        <EducationalMarkdown sourceId={`${sectionId}/${entry.id}/summary`}>{entry.summary}</EducationalMarkdown>
        <ExpandableExplanation entry={entry} id={id} sourceId={`${sectionId}/${entry.id}/more`} />
      </div>
    </article>
  );
}
