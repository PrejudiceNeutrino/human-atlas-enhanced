import '../app/theme-store';
import {createRoot} from 'react-dom/client';
import {lazy, Suspense,useState,useEffect} from 'react';
import {Analytics} from '@vercel/analytics/react';
import {parseNavigation,navigationSearch} from '../app/area-navigation';
import {modelForRoute} from '../app/model-registry';
import '../app/globals.css';

const AtlasViewer = lazy(() => import('../app/page'));
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const routeModel = modelForRoute(pathname);
const model: 'male'|'female'|null = routeModel?.id === 'female-study-v3' ? 'female' : routeModel?.id === 'bp3d-male-4' ? 'male' : null;

document.title = model
  ? `${model === 'female' ? 'Female' : 'Male'} anatomy · Human Atlas`
  : 'Page not found · Human Atlas';

function AtlasApp(){
 const [activeModel,setActiveModel]=useState(model);
 useEffect(()=>{const back=()=>window.location.reload();window.addEventListener('popstate',back);return()=>window.removeEventListener('popstate',back);},[]);
 return (
  <>
    {activeModel ? (
      <Suspense fallback={<main className="route-loading" role="status">Opening {model} anatomy…</main>}>
        <AtlasViewer model={activeModel} initialRegion={parseNavigation(window.location.search).regionId} initialArea={parseNavigation(window.location.search).areaId} onModelChange={(next,regionId,areaId)=>{if(next!=='male'&&next!=='female')return;window.history.pushState(null,'',`/${next}${navigationSearch(window.location.search,regionId,areaId)}`);document.title=`${next==='female'?'Female':'Male'} anatomy \u00b7 Human Atlas`;setActiveModel(next);}}/>
      </Suspense>
    ) : (
      <main className="route-loading">
        <h1>Page not found</h1>
        <a href="/">Return to Human Atlas</a>
      </main>
    )}
    <Analytics />
  </>
);
}
createRoot(document.getElementById('root')!).render(<AtlasApp/>);
