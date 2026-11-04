import { useMemo } from 'react';
import { EducationalMarkdown } from './educational-markdown';
import { ReadingLayout } from './section-index';
import type { EducationalArticleData } from './subjects';

export function articleSectionId(article: EducationalArticleData, sectionId: string) {
  return `${article.id}-${sectionId}`;
}

export function EducationalArticle({ article, presentation }: {
  article: EducationalArticleData;
  presentation: 'overview' | 'reference' | 'cram';
}) {
  const sections = useMemo(() => article.sections.map(section => ({ id: articleSectionId(article, section.id), title: section.title })), [article]);
  return (
    <article className={`learn-reading learn-reading--${presentation}`} aria-labelledby={`${article.id}-heading`}>
      <header className="learn-article-header">
        <h2 id={`${article.id}-heading`}>{article.title}</h2>
        <EducationalMarkdown headingOffset={2}>{article.introMarkdown}</EducationalMarkdown>
      </header>
      <ReadingLayout title={article.title} sections={sections}>
        {article.sections.map(section => (
          <section className="learn-article-section" key={section.id} aria-labelledby={articleSectionId(article, section.id)}>
            <h3 id={articleSectionId(article, section.id)} tabIndex={-1}>{section.title}</h3>
            <EducationalMarkdown headingOffset={1} tableLabel={`${section.title} table`}>{section.markdown}</EducationalMarkdown>
          </section>
        ))}
      </ReadingLayout>
    </article>
  );
}
