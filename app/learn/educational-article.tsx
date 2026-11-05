import { useMemo } from 'react';
import { EducationalMarkdown } from './educational-markdown';
import { ReadingLayout } from './section-index';
import type { EducationalArticleData } from './subjects';
import { AnnotationHeading } from '../notes/annotation-render';

export function articleSectionId(article: EducationalArticleData, sectionId: string) {
  return `${article.id}-${sectionId}`;
}

export function EducationalArticle({ article, presentation, readingIntro }: {
  article: EducationalArticleData;
  presentation: 'overview' | 'reference' | 'cram';
  readingIntro?: string;
}) {
  const sections = useMemo(() => article.sections.map(section => ({ id: articleSectionId(article, section.id), title: section.title })), [article]);
  return (
    <article className={`learn-reading learn-reading--${presentation}`} aria-labelledby={`${article.id}-heading`}>
      <header className="learn-article-header">
        <AnnotationHeading as="h2" sourceId={`${article.id}/intro`} id={`${article.id}-heading`} tabIndex={-1}>{article.title}</AnnotationHeading>
        <EducationalMarkdown headingOffset={2} sourceId={`${article.id}/intro`}>{article.introMarkdown}</EducationalMarkdown>
        {readingIntro && <div className="learn-reading-intro learn-reading-intro--after-opening"><EducationalMarkdown sourceId={`${article.id}/reading-intro`}>{readingIntro}</EducationalMarkdown></div>}
      </header>
      <ReadingLayout title={article.title} sections={sections}>
        {article.sections.map(section => (
          <section className="learn-article-section" key={section.id} aria-labelledby={articleSectionId(article, section.id)}>
            <AnnotationHeading as="h3" sourceId={`${article.id}/${section.id}`} id={articleSectionId(article, section.id)} tabIndex={-1}>{section.title}</AnnotationHeading>
            <EducationalMarkdown headingOffset={1} tableLabel={`${section.title} table`} sourceId={`${article.id}/${section.id}`}>{section.markdown}</EducationalMarkdown>
          </section>
        ))}
      </ReadingLayout>
    </article>
  );
}
