import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense, useCallback, useState } from 'react';
import { SplashVideo, shouldShowSplash } from '@/components/SplashVideo';

// The whole homepage (3D scene, journey, panels) is its own chunk. With the splash, it only starts loading
// 0.5 s after the video starts playing, so the video is never competing with it for the phone's attention.
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
  const loadSite = useCallback(() => setSiteOn(true), []);
  return <>
    {splash && <SplashVideo onDone={() => setSplash(false)} onLoadSite={loadSite} />}
    {siteOn && <Suspense fallback={<div className="scene-loading" />}><HomePage splash={splash} /></Suspense>}
  </>;
}
