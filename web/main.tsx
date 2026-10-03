import {createRoot} from 'react-dom/client';
import {lazy, Suspense} from 'react';
import {Analytics} from '@vercel/analytics/react';
import {BODY_REGION,type RegionId} from '../app/region-contracts';
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
        <AtlasViewer model={model} initialRegion={(new URLSearchParams(window.location.search).get('region')??BODY_REGION) as RegionId} onModelChange={(next,regionId) => window.location.assign(`/${next}${regionId===BODY_REGION?'':`?region=${encodeURIComponent(regionId)}`}`)}/>
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
