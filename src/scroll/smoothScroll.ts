import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

// Un solo loop: el ticker de GSAP mueve Lenis y cada scroll de Lenis actualiza ScrollTrigger.
// Lenis respeta prefers-reduced-motion por defecto (sin suavizado). En táctil, el scroll es nativo.
export function initSmoothScroll() {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000); // el ticker va en segundos; Lenis, en milisegundos
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.2 });
  else el.scrollIntoView();
}
