import { useLayoutEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EducationalArticle, articleSectionId } from './educational-article';
import { EducationalFacts } from './educational-entry';
import { articles, factSections } from './content';
import type { LearnSubject } from './subjects';
import { AnnotationDocumentContext, AnnotationJumpContext } from '../notes/annotation-context';
import { annotationStore } from '../notes/annotation-store';
import { annotationSources } from '../notes/annotation-content';
import { SectionGuide } from './section-guide';
import { ReadingPageContext } from './section-index';
import { StudyToolsLoader } from './study-tools/loader';
import { GalleryLoader } from './gallery/loader';
import { VisualizePage } from './anatomy-companion/visualize-page';
import { LearnContextMenu } from './context-menu/learn-context-menu';
import { PageSectionsProvider } from './context-menu/page-sections';

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
  const pageNavigation = useRef(false);
  const pendingHashTarget = useRef<string|null>(null);
  const availableTabs = subject.tabs.filter(tab => tab.kind !== 'coming-soon');
  const pageIndex = availableTabs.findIndex(tab => tab.id === activeTab);
  const [requestedDisclosure,setRequestedDisclosure]=useState<string|null>(null);
  const activateTab = (id: string, bookmark = false) => {
    if (!availableTabs.some(tab => tab.id === id) || id === activeTab) return;
    pageNavigation.current = bookmark;
    const linkedTab = tabForHash(subject, window.location.hash);
    if (bookmark) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
    else if (linkedTab && linkedTab.id !== id) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setRequestedDisclosure(null);
    setActiveTab(id);
  };

  useLayoutEffect(()=>{
    const id=new URLSearchParams(window.location.hash.slice(1)).get('annotation');if(!id)return;
    let alive=true;
    void annotationStore.initialize().then(()=>{
      const record=annotationStore.getSnapshot().records.find(item=>item.id===id&&item.target.subjectId===subject.slug);
      if(!alive||!record||!subject.tabs.some(tab=>tab.id===record.target.tabId&&tab.kind!=='coming-soon'))return;
      setActiveTab(record.target.tabId);
      const source=annotationSources.find(item=>item.target.sourceId===record.target.sourceId);
      setRequestedDisclosure(source?.disclosureId??null);
    });return()=>{alive=false;};
  },[subject]);

  useLayoutEffect(() => {
    const followHash = () => {
      const hash=window.location.hash,linked=tabForHash(subject,hash);if(!linked)return;
      const target=hash.slice(1)===linked.id?`${linked.id}-heading`:hash.slice(1);
      pendingHashTarget.current=target;setActiveTab(linked.id);
      const heading=document.getElementById(target);
      if(heading&&!heading.closest('[hidden]')){heading.focus({preventScroll:true});heading.scrollIntoView?.({block:'start',behavior:'instant'});pendingHashTarget.current=null;}
    };
    followHash();window.addEventListener('hashchange',followHash);return()=>window.removeEventListener('hashchange',followHash);
  }, [subject]);

  useLayoutEffect(() => {
    if(pendingHashTarget.current){const heading=document.getElementById(pendingHashTarget.current);
      if(heading&&!heading.closest('[hidden]')){heading.focus({preventScroll:true});heading.scrollIntoView?.({block:'start',behavior:'instant'});pendingHashTarget.current=null;previousTab.current=activeTab;return;}
    }
    if (previousTab.current === activeTab) return;
    previousTab.current = activeTab;
    // Switching while deep in an article starts the next reading at its top.
    if (tabsRef.current && (pageNavigation.current || tabsRef.current.getBoundingClientRect().top < 0)) {
      tabsRef.current.scrollIntoView?.({ block: 'start', behavior: 'instant' });
    }
    if (pageNavigation.current) {
      document.getElementById(`${activeTab}-heading`)?.focus({ preventScroll: true });
      pageNavigation.current = false;
    }
  }, [activeTab]);

  return (
    <PageSectionsProvider>
    <ReadingPageContext value={{
      links: availableTabs,
      previous: availableTabs[pageIndex - 1],
      next: availableTabs[pageIndex + 1],
      onNavigate: id => activateTab(id, true),
    }}>
    <LearnContextMenu subject={subject} activeTab={activeTab} onNavigate={id => activateTab(id, true)}/>
    <Tabs ref={tabsRef} value={activeTab} className="learn-reading-tabs" onValueChange={value => {
      if (typeof value !== 'string') return;
      activateTab(value);
    }}>
      <div className="learn-tab-bar">
        <TabsList className="learn-tab-list" aria-label={`${subject.title} content`} activateOnFocus={false}>
          {subject.tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} disabled={tab.kind === 'coming-soon'} className="learn-tab-trigger">
              <span>{tab.title}</span>
              {(tab.kind === 'gallery' || tab.kind === 'visualize') && <span className="learn-tab-new">New</span>}
              {tab.kind === 'coming-soon' && <span className="learn-coming-soon">Coming Soon</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        <SectionGuide subject={subject} />
      </div>
      {subject.tabs.filter(tab => tab.kind !== 'coming-soon').map(tab => (
        <TabsContent key={tab.id} value={tab.id} keepMounted={tab.kind === 'facts'} className="learn-tab-panel">
          <AnnotationDocumentContext value={{subjectId:subject.slug,tabId:tab.id}}>
          <AnnotationJumpContext value={requestedDisclosure}>
          {tab.kind === 'article' ? (
            <EducationalArticle article={articles[tab.id]} presentation={tab.presentation} readingIntro={tab.readingIntro} />
          ) : tab.kind === 'facts' ? (
            <EducationalFacts section={factSections[tab.id]} title={tab.title} readingIntro={tab.readingIntro} enabled={activeTab === tab.id} />
          ) : tab.kind === 'study-tools' ? (
            <StudyToolsLoader subjectTitle={subject.title} route={subject.href} tabId={tab.id}/>
          ) : tab.kind === 'gallery' ? (
            <GalleryLoader tabId={tab.id} subjectSlug={subject.slug}/>
          ) : tab.kind === 'visualize' ? (
            <VisualizePage tabId={tab.id} subjectId={subject.slug}/>
          ) : null}
          </AnnotationJumpContext></AnnotationDocumentContext>
        </TabsContent>
      ))}
    </Tabs>
    </ReadingPageContext>
    </PageSectionsProvider>
  );
}
