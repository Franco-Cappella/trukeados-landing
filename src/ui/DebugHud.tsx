// `?debug`: estado del director en pantalla (sección, tramo, cámara y efectos) y, para scripts/capture.mjs,
// `window.__rig` y `window.__expected(i)` (el estado que tiene que haber al terminar la sección i).
// Herramienta de desarrollo: se carga aparte y solo con ?debug.
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import { site } from '../content/site';
import { ZERO, camOf, fxOf, rig } from '../scroll/rig';
import { useUI } from '../state/store';

const r2 = (n: number) => n.toFixed(2);

export default function DebugHud() {
  const out = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__rig = rig;
    w.__expected = (i: number) => ({
      cam: camOf(i, matchMedia('(orientation: portrait)').matches),
      fx: fxOf(i),
    });
    const tick = () => {
      const el = out.current;
      if (!el) return;
      const i = useUI.getState().section;
      const sec = document.querySelectorAll<HTMLElement>('[data-section]')[i];
      let phase = '';
      if (sec) {
        const top = sec.getBoundingClientRect().top;
        const stay = sec.offsetHeight - innerHeight;
        phase = top > 0 ? `llegada ${Math.round((1 - top / innerHeight) * 100)} %` : `estadía ${stay > 0 ? Math.round((-top / stay) * 100) : 100} %`;
      }
      const c = rig.cam;
      // Solo las claves de la escena: GSAP le agrega a cada objeto que anima su propio campo (_gsap).
      const fx = (Object.keys(ZERO) as (keyof typeof ZERO)[]).map((k) => `${k} ${r2(rig.fx[k])}`).join('  ');
      el.textContent =
        `${i + 1}/${site.sections.length} ${site.sections[i]?.id ?? ''} · ${phase}\n` +
        `cam ${r2(c.px)} ${r2(c.py)} ${r2(c.pz)} → ${r2(c.tx)} ${r2(c.ty)} ${r2(c.tz)} · fov ${r2(c.fov)} · cuadro ${r2(c.ox)} ${r2(c.oy)}\n` +
        fx;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return <pre ref={out} className="debug-hud" aria-hidden="true" />;
}
