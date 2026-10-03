import {createRoot} from 'react-dom/client';
import {lazy, Suspense} from 'react';
import {Analytics} from '@vercel/analytics/react';
import {parseNavigation,navigationSearch} from '../app/area-navigation';
import {modelForRoute} from '../app/model-registry';
import '../app/globals.css';

const AtlasViewer = lazy(() => import('../app/page'));
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const routeModel = modelForRoute(pathname);
const model = routeModel?.id === 'female-study-v3' ? 'female' : routeModel?.id === 'bp3d-male-4' ? 'male' : null;

document.title = model
  ? `${model === 'female' ? 'Female' : 'Male'} anatomy · Human Atlas`
  : 'Page not found · Human Atlas';

createRoot(document.getElementById('root')!).render(
  <>
    {model ? (
      <Suspense fallback={<main className="route-loading" role="status">Opening {model} anatomy…</main>}>
        <AtlasViewer model={model} initialRegion={parseNavigation(window.location.search).regionId} initialArea={parseNavigation(window.location.search).areaId} onModelChange={(next,regionId,areaId) => window.location.assign(`/${next}${navigationSearch(window.location.search,regionId,areaId)}`)}/>
      </Suspense>
    ) : (
      <main className="route-loading">
        <h1>Page not found</h1>
        <a href="/">Return to Human Atlas</a>
      </main>
    )}
    <Analytics />
  </>,
);
