import { useMemo, useRef, useState } from 'react';
import { Box, ChevronDown, ChevronUp, X } from 'lucide-react';
import { EducationalMarkdown } from './educational-markdown';
import { ReadingLayout } from './section-index';
import type { EducationalArticleData } from './subjects';
import { AnnotationHeading } from '../notes/annotation-render';
import { anatomyLessonForArticle, type AnatomyReference } from './anatomy-companion/references';
import { LearningAnatomyViewer, type AnatomyRequest } from './anatomy-companion/learning-viewer';

export function articleSectionId(article: EducationalArticleData, sectionId: string) {
  return `${article.id}-${sectionId}`;
}

export function EducationalArticle({ article, presentation, readingIntro }: {
  article: EducationalArticleData;
  presentation: 'overview' | 'reference' | 'cram';
  readingIntro?: string;
}) {
  const sections = useMemo(() => article.sections.map(section => ({ id: articleSectionId(article, section.id), title: section.title })), [article]);
  const lesson = anatomyLessonForArticle(article.id);
  const [companion, setCompanion] = useState<AnatomyRequest | null>(null), [collapsed, setCollapsed] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null), companionTitle = useRef<HTMLHeadingElement>(null);
  const openAnatomy = (reference: AnatomyReference, button: HTMLButtonElement) => {
    opener.current = button; setCompanion(previous => ({ conceptId: reference.conceptId, revision: (previous?.revision ?? 0) + 1 })); setCollapsed(false);
    requestAnimationFrame(() => { companionTitle.current?.focus({ preventScroll: true }); if (window.matchMedia('(max-width: 1250px)').matches) companionTitle.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  };
  return (
    <article className={`learn-reading learn-reading--${presentation} ${companion ? 'learn-reading-companion-open' : ''}`} aria-labelledby={`${article.id}-heading`}>
      <header className="learn-article-header">
        <AnnotationHeading as="h2" sourceId={`${article.id}/intro`} id={`${article.id}-heading`} tabIndex={-1}>{article.title}</AnnotationHeading>
        <EducationalMarkdown headingOffset={2} sourceId={`${article.id}/intro`}>{article.introMarkdown}</EducationalMarkdown>
        {readingIntro && <div className="learn-reading-intro learn-reading-intro--after-opening"><EducationalMarkdown sourceId={`${article.id}/reading-intro`}>{readingIntro}</EducationalMarkdown></div>}
      </header>
      <div className={companion ? 'learn-companion-layout' : undefined}>
      <div className="learn-companion-reading">
      <ReadingLayout title={article.title} sections={sections}>
        {article.sections.map(section => (
          <section className="learn-article-section" key={section.id} aria-labelledby={articleSectionId(article, section.id)}>
            <AnnotationHeading as="h3" sourceId={`${article.id}/${section.id}`} id={articleSectionId(article, section.id)} tabIndex={-1}>{section.title}</AnnotationHeading>
            {lesson?.referenceArticleId === article.id && <div className="learn-anatomy-references" role="group" aria-label={`${section.title} anatomy references`} data-annotation-excluded data-atlas-shortcuts="disabled">
              {lesson.structures.filter(reference => reference.sectionId === section.id).map(reference => <button type="button" key={reference.conceptId} onClick={event => openAnatomy(reference, event.currentTarget)}><Box size={14} aria-hidden="true"/>View {reference.label} in 3D</button>)}
            </div>}
            <EducationalMarkdown headingOffset={1} tableLabel={`${section.title} table`} sourceId={`${article.id}/${section.id}`}>{section.markdown}</EducationalMarkdown>
          </section>
        ))}
      </ReadingLayout>
      </div>
      {lesson && companion && <aside className="learn-companion-aside" aria-labelledby="learn-anatomy-companion-title" data-annotation-excluded data-atlas-shortcuts="disabled"><div className="learn-companion-sticky">
        <header className="learn-companion-header"><h3 id="learn-anatomy-companion-title" ref={companionTitle} tabIndex={-1}>Anatomy Companion</h3><button type="button" aria-label={collapsed ? 'Expand Anatomy Companion' : 'Collapse Anatomy Companion'} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? <ChevronDown size={17}/> : <ChevronUp size={17}/>}</button><button type="button" aria-label="Close Anatomy Companion" onClick={() => { setCompanion(null); opener.current?.focus({ preventScroll: true }); }}><X size={17}/></button></header>
        {!collapsed && <LearningAnatomyViewer lesson={lesson} requested={companion} compact/>}
      </div></aside>}
      </div>
    </article>
  );
}
