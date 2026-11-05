import { useContext, useMemo, type ElementType } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Root, Paragraph } from 'mdast';
import type { Plugin } from 'unified';
import { AnnotationDocumentContext, AnnotationSourceContext } from '../notes/annotation-context';
import { annotationBlocksPlugin } from '../notes/annotation-model';
import { AnnotatedBlock, AnnotationParagraph, AnnotationListItem, AnnotationTableHeader, AnnotationTableCell } from '../notes/annotation-render';
import { ReadingPageContext } from './section-index';

const EducationalLink: Components['a'] = ({ node: _node, href, ...props }) => {
  const pages = useContext(ReadingPageContext);
  const pageId = href?.startsWith('#') ? href.slice(1) : undefined;
  return <a {...props} href={href} onClick={event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!pageId || !pages?.links.some(page => page.id === pageId)) return;
    event.preventDefault();
    pages.onNavigate(pageId);
  }} />;
};

// The source expresses a sequence as step paragraphs separated by ↓ paragraphs.
// Mark those existing nodes for styling; leave every word and arrow intact.
const transportSequence: Plugin<[], Root> = () => tree => {
  for (let index = 1; index < tree.children.length - 1; index++) {
    const node = tree.children[index];
    if (node.type !== 'paragraph' || node.children.length !== 1 ||
        node.children[0].type !== 'text' || node.children[0].value !== '↓') continue;
    const before = tree.children[index - 1];
    const after = tree.children[index + 1];
    if (before.type !== 'paragraph' || after.type !== 'paragraph') continue;
    const mark = (paragraph: Paragraph, className: string) => {
      paragraph.data = { ...paragraph.data, hProperties: { className: [className] } };
    };
    mark(before, 'learn-transport-step');
    mark(node, 'learn-transport-arrow');
    mark(after, 'learn-transport-step');
  }
};

export function EducationalMarkdown({ children, headingOffset = 0, tableLabel, sourceId }: {
  children: string;
  headingOffset?: number;
  tableLabel?: string;
  sourceId?: string;
}) {
  const documentScope=useContext(AnnotationDocumentContext);
  const components = useMemo(() => {
    const renderers: Components = {
      a: EducationalLink,
      table: ({ node: _node, ...props }) => (
        <div className="learn-table" role={tableLabel ? 'region' : undefined} aria-label={tableLabel} tabIndex={tableLabel ? 0 : undefined}><table {...props} /></div>
      ),
      th: ({ node: _node, ...props }) => <th scope="col" {...props} />,
    };
    renderers.p=AnnotationParagraph;renderers.li=AnnotationListItem;
    renderers.th=AnnotationTableHeader;renderers.td=AnnotationTableCell;
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const Heading = `h${Math.min(level + headingOffset, 6)}` as ElementType;
      renderers[`h${level}`] = ({ node: _node, ...props }) => <AnnotatedBlock tag={Heading as string} {...props} />;
    }
    return renderers;
  }, [headingOffset, tableLabel]);
  return (
    <AnnotationSourceContext value={sourceId}><div className="learn-markdown" data-annotation-source={sourceId} data-annotation-subject={sourceId?documentScope?.subjectId:undefined} data-annotation-tab={sourceId?documentScope?.tabId:undefined}>
      <Markdown remarkPlugins={sourceId?[remarkGfm, transportSequence, annotationBlocksPlugin]:[remarkGfm, transportSequence]} components={components}>
        {children}
      </Markdown>
    </div></AnnotationSourceContext>
  );
}
