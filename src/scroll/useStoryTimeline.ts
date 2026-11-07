import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';
import { site, type SceneFx } from '../content/site';
import { useUI } from '../state/store';
import { camOf, fxInOf, fxOf, rig } from './rig';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Solo las claves que cambian entre dos estados: cada tween toca lo suyo y nada más. */
function diff(a: SceneFx, b: SceneFx) {
  const keys = (Object.keys(b) as (keyof SceneFx)[]).filter((k) => a[k] !== b[k]);
  const pick = (s: SceneFx) => Object.fromEntries(keys.map((k) => [k, s[k]]));
  return { from: pick(a), to: pick(b), any: keys.length > 0 };
}

if (import.meta.env.DEV) {
  for (const s of site.sections) {
    if (s.weight <= 1 && Object.keys(s.fx).length) {
      console.warn(`[director] "${s.id}" cambia fx con el texto fijo pero dura ${s.weight} pantalla: no hay estadía.`);
    }
  }
}

/**
 * El director de scroll: el único que escribe en `rig`.
 * Sección i > 0
 *  - LLEGADA ('top bottom' → 'top top'): la cámara viaja de i-1 a i. Los `fxIn` cambian en el primer 60 % del
 *    viaje, así la escena ya cambió cuando la cámara se acomoda.
 *  - ESTADÍA ('top top' → 'bottom bottom'): con el texto fijo, cambian los `fx`.
 * fromTo con valores explícitos e immediateRender: false: es reversible y no depende del orden.
 * Con movimiento reducido, la cámara y los efectos saltan de sección en sección.
 */
export function useStoryTimeline(scope: RefObject<HTMLElement | null>, scene: boolean) {
  const setSection = useUI((s) => s.setSection);

  useGSAP(
    () => {
      const els = gsap.utils.toArray<HTMLElement>('[data-section]');
      els.forEach((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => self.isActive && setSection(i),
        }),
      );
      if (!scene) return; // versión sin 3D: no hay escena que dirigir

      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduce: '(prefers-reduced-motion: reduce)',
          portrait: '(orientation: portrait)',
        },
        (ctx) => {
          const { reduce, portrait } = ctx.conditions as Record<string, boolean>;
          const cam = (i: number) => camOf(i, portrait);
          rig.snap = reduce;
          Object.assign(rig.cam, cam(0));
          Object.assign(rig.fx, fxOf(0));
          rig.requestFrame();

          if (reduce) {
            els.forEach((el, i) =>
              ScrollTrigger.create({
                trigger: el,
                start: 'top center',
                end: 'bottom center',
                onToggle: (self) => {
                  if (!self.isActive) return;
                  Object.assign(rig.cam, cam(i));
                  Object.assign(rig.fx, fxOf(i));
                  rig.requestFrame();
                },
              }),
            );
            return;
          }

          els.forEach((el, i) => {
            if (i === 0) return;
            const scrub = (start: string, end: string) => ({ trigger: el, start, end, scrub: true });
            gsap.fromTo(rig.cam, cam(i - 1), {
              ...cam(i),
              ease: 'power2.inOut',
              immediateRender: false,
              scrollTrigger: scrub('top bottom', 'top top'),
            });
            const arrive = diff(fxOf(i - 1), fxInOf(i));
            if (arrive.any) {
              gsap.fromTo(rig.fx, arrive.from, {
                ...arrive.to,
                ease: 'none',
                immediateRender: false,
                scrollTrigger: scrub('top bottom', 'top 40%'),
              });
            }
            const stay = diff(fxInOf(i), fxOf(i));
            if (stay.any) {
              gsap.fromTo(rig.fx, stay.from, {
                ...stay.to,
                ease: 'none',
                immediateRender: false,
                scrollTrigger: scrub('top top', 'bottom bottom'),
              });
            }
          });
        },
      );
    },
    { scope, dependencies: [scene], revertOnUpdate: true }, // la versión sin 3D cambia el layout
  );
}
