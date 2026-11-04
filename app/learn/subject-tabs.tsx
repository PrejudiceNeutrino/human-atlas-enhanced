import { useLayoutEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EducationalArticle, articleSectionId } from './educational-article';
import { EducationalFacts } from './educational-entry';
import { articles, factSections } from './content';
import type { LearnSubject } from './subjects';

// A bookmarked section belongs to its existing subject page, not another route.
function tabForHash(subject: LearnSubject, hash: string) {
  return subject.tabs.find(tab => tab.kind !== 'coming-soon' && (
    hash === `#${tab.id}` || (tab.kind === 'article' && articles[tab.id].sections.some(
      section => hash === `#${articleSectionId(articles[tab.id], section.id)}`,
    )) || (tab.kind === 'facts' && factSections[tab.id].sections.some(entry => (
      hash === `#${tab.id}-${entry.id}-title` || hash === `#${tab.id}-${entry.id}`
    )))
  ));
}

export function SubjectTabs({ subject }: { subject: LearnSubject }) {
  const [activeTab, setActiveTab] = useState(() => tabForHash(subject, window.location.hash)?.id ?? subject.tabs[0].id);
  const tabsRef = useRef<HTMLDivElement>(null);
  const previousTab = useRef(activeTab);

  useLayoutEffect(() => {
    const hash = window.location.hash;
    if (tabForHash(subject, hash)) document.getElementById(hash.slice(1))?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }, [subject]);

  useLayoutEffect(() => {
    if (previousTab.current === activeTab) return;
    previousTab.current = activeTab;
    // Switching while deep in an article starts the next reading at its top.
    if (tabsRef.current && tabsRef.current.getBoundingClientRect().top < 0) {
      tabsRef.current.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [activeTab]);

  return (
    <Tabs ref={tabsRef} value={activeTab} className="learn-reading-tabs" onValueChange={value => {
      if (typeof value !== 'string') return;
      const linkedTab = tabForHash(subject, window.location.hash);
      if (linkedTab && linkedTab.id !== value) window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setActiveTab(value);
    }}>
      <div className="learn-tab-bar">
        <TabsList className="learn-tab-list" aria-label={`${subject.title} content`} activateOnFocus={false}>
          {subject.tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} disabled={tab.kind === 'coming-soon'} className="learn-tab-trigger">
              <span>{tab.title}</span>
              {tab.kind === 'coming-soon' && <span className="learn-coming-soon">Coming Soon</span>}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {subject.tabs.filter(tab => tab.kind !== 'coming-soon').map(tab => (
        <TabsContent key={tab.id} value={tab.id} keepMounted={tab.kind === 'facts'} className="learn-tab-panel">
          {tab.kind === 'article' ? (
            <EducationalArticle article={articles[tab.id]} presentation={tab.presentation} />
          ) : tab.kind === 'facts' ? (
            <EducationalFacts section={factSections[tab.id]} title={tab.title} enabled={activeTab === tab.id} />
          ) : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}
