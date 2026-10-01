import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useState } from 'react';
import { SplashVideo, shouldShowSplash } from '@/components/SplashVideo';

// The whole homepage (3D scene, journey, panels) is its own chunk. With the splash, the code is fetched as soon as the
// splash appears and the page mounts the instant the video starts playing, so everything is ready when the video ends.
const HomePage = lazy(() => import('@/components/HomePage').then(m => ({ default: m.HomePage })));

export const Route = createFileRoute('/')({
  ssr: false,
  head: () => ({ meta: [
    { title: 'The Style Van | Beauty on the way' },
    { name: 'description', content: 'Picture a luxury beauty salon at your door: salon, barber, nails and lashes, with bridal and event looks. Just one call and beauty is on the way.' },
    { property: 'og:title', content: 'The Style Van | Beauty on the way' },
    { property: 'og:description', content: 'Beauty on the way. Salon, barber, nails and lashes at your door. Just one call and beauty is on the way.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Home,
});

function Home() {
  const [splash, setSplash] = useState(shouldShowSplash);
  const [siteOn, setSiteOn] = useState(() => !splash);
  const [siteReady, setSiteReady] = useState(() => !splash);
  const markReady = useCallback(() => setSiteReady(true), []);
  const loadSite = useCallback(() => setSiteOn(true), []);
  return <>
    {splash && <SplashVideo onDone={() => setSplash(false)} onLoadSite={loadSite} siteReady={siteReady} />}
    {siteOn && <Suspense fallback={<div className="scene-loading" />}><HomePage splash={splash} onSceneReady={markReady} /></Suspense>}
  </>;
}
