import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import { BOT_NAMES, SENAS } from '../game/config.js';
import { rig } from '../scroll/rig';
import { FaceCanvas } from './FaceCanvas';

const ENTRIES = Object.entries(SENAS);

/** Las 11 señas del juego, con la cara que pone cada una. Es la leyenda de la sección: mientras la cara del
 *  primer plano hace las señas, se marca la que está haciendo (lee `rig`, no re-renderiza). */
export function SenasList() {
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let shown = -2;
    const tick = () => {
      const el = list.current;
      if (!el) return;
      const idx = rig.fx.closeup > 0.5 ? Math.min(ENTRIES.length - 1, Math.floor(rig.fx.sena * ENTRIES.length)) : -1;
      if (idx === shown) return;
      shown = idx;
      const items = el.querySelectorAll<HTMLLIElement>('li');
      items.forEach((li, i) => {
        li.toggleAttribute('data-activa', i === idx);
        if (i === idx) li.setAttribute('aria-current', 'true');
        else li.removeAttribute('aria-current');
      });
      // En la tira que se desliza de costado (celular), la seña activa queda a la vista.
      const li = items[idx];
      if (li && el.scrollWidth > el.clientWidth) {
        el.scrollTo({ left: li.offsetLeft - el.offsetLeft, behavior: reduce.matches ? 'auto' : 'smooth' });
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <ul ref={list} className="senas" data-ui>
      {ENTRIES.map(([id, s], i) => {
        const name = BOT_NAMES[i % BOT_NAMES.length];
        return (
          <li key={id} className="senas__item" data-sena={id}>
            <FaceCanvas name={name} seat={i} expr={s.expr} size={44} label={`${name}: ${s.desc.toLowerCase()}`} />
            <span>
              <b>{s.label}</b>
              <small>{s.desc}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
