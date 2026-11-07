import 'lenis/dist/lenis.css';
import './styles/landing.css';
import { Suspense, lazy, useEffect, useRef } from 'react';
import { site } from './content/site';
import { initSmoothScroll } from './scroll/smoothScroll';
import { useStoryTimeline } from './scroll/useStoryTimeline';
import { initUIFromBrowser, useUI } from './state/store';
import { Footer } from './ui/Footer';
import { Nav } from './ui/Nav';
import { Section } from './ui/Section';

// La escena 3D va en su propio paquete: esta capa (HTML real) nunca importa three ni @react-three/*.
const Experience = lazy(() => import('./three/Experience'));
const DebugHud = lazy(() => import('./ui/DebugHud'));

export function App() {
  const main = useRef<HTMLElement>(null);
  const booted = useUI((s) => s.booted);
  const flat = useUI((s) => s.no3d || s.tier === 'static');
  const debug = useUI((s) => s.debug);
  const scene = booted && !flat; // se decide después de leer el navegador y del primer pintado

  useEffect(() => {
    initUIFromBrowser();
    return initSmoothScroll();
  }, []);

  useStoryTimeline(main, scene);

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      {scene && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      <Nav />
      <main id="contenido" ref={main} data-no3d={flat ? 'true' : 'false'}>
        {site.sections.map((s, i) => (
          <Section key={s.id} s={s} i={i} />
        ))}
      </main>
      <Footer />
      {debug && (
        <Suspense fallback={null}>
          <DebugHud />
        </Suspense>
      )}
    </>
  );
}
