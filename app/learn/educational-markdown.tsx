import { useMemo, type ElementType } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Root, Paragraph } from 'mdast';
import type { Plugin } from 'unified';

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

export function EducationalMarkdown({ children, headingOffset = 0, tableLabel }: {
  children: string;
  headingOffset?: number;
  tableLabel?: string;
}) {
  const components = useMemo(() => {
    const renderers: Components = {
      table: ({ node: _node, ...props }) => (
        <div className="learn-table" role={tableLabel ? 'region' : undefined} aria-label={tableLabel} tabIndex={tableLabel ? 0 : undefined}><table {...props} /></div>
      ),
      th: ({ node: _node, ...props }) => <th scope="col" {...props} />,
    };
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      const Heading = `h${Math.min(level + headingOffset, 6)}` as ElementType;
      renderers[`h${level}`] = ({ node: _node, ...props }) => <Heading {...props} />;
    }
    return renderers;
  }, [headingOffset, tableLabel]);
  return (
    <div className="learn-markdown">
      <Markdown remarkPlugins={[remarkGfm, transportSequence]} components={components}>
        {children}
      </Markdown>
    </div>
  );
}
