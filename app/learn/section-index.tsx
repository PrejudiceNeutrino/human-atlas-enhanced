import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ReadingSectionLink { id: string; title: string }

function SectionLinks({ title, sections, current }: {
  title: string;
  sections: ReadingSectionLink[];
  current: string;
}) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const scroller = nav.current?.closest<HTMLElement>('.learn-index-sticky');
    const link = nav.current?.querySelector<HTMLElement>('[aria-current]');
    if (!scroller || !link || !scroller.clientHeight) return;
    const outer = scroller.getBoundingClientRect(), inner = link.getBoundingClientRect();
    if (inner.top < outer.top) scroller.scrollTop += inner.top - outer.top;
    else if (inner.bottom > outer.bottom) scroller.scrollTop += inner.bottom - outer.bottom;
  }, [current]);
  return (
    <nav ref={nav} aria-label={`${title} contents`}>
      <ol>
        {sections.map(section => (
          <li key={section.id}>
            <a href={`#${section.id}`} aria-current={current === section.id ? 'location' : undefined}
              onClick={() => document.getElementById(section.id)?.focus({ preventScroll: true })}>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Track the reading viewport, including accordion reflow, rather than only link clicks. */
export function ReadingLayout({ title, sections, enabled = true, children }: {
  title: string;
  sections: ReadingSectionLink[];
  enabled?: boolean;
  children: ReactNode;
}) {
  const layout = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(sections[0]?.id ?? '');
  useEffect(() => {
    const element = layout.current, shell = element?.closest<HTMLElement>('.learn-shell');
    if (!enabled || !element || !shell) return;
    const headings = sections.map(section => document.getElementById(section.id));
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = shell.querySelector('.learn-tab-bar');
      const threshold = (bar?.getBoundingClientRect().bottom ?? shell.getBoundingClientRect().top) + 20;
      let active = sections[0]?.id ?? '';
      headings.forEach((heading, index) => {
        if (heading && heading.getBoundingClientRect().top <= threshold) active = sections[index].id;
      });
      if (shell.scrollTop > 0 && shell.scrollHeight - shell.clientHeight - shell.scrollTop <= 2) active = sections.at(-1)?.id ?? active;
      setCurrent(previous => previous === active ? previous : active);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    shell.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      shell.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
    };
  }, [enabled, sections]);
  return (
    <div className="learn-article-layout" ref={layout}>
      <aside className="learn-index-desktop">
        <div className="learn-index-sticky">
          <p className="learn-index-label">On this page</p>
          <SectionLinks title={title} sections={sections} current={current} />
        </div>
      </aside>
      <details className="learn-index-mobile">
        <summary>On this page<ChevronDown size={16} aria-hidden="true" /></summary>
        <SectionLinks title={title} sections={sections} current={current} />
      </details>
      <div className="learn-article-sections">{children}</div>
    </div>
  );
}
