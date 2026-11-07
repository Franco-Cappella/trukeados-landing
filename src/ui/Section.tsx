import type { CSSProperties } from 'react';
import type { Section as SectionData } from '../content/site';
import { useUI } from '../state/store';
import { Cta } from './Cta';
import { NameFace } from './NameFace';
import { SenasList } from './SenasList';
import { TrampaCartas } from './TrampaCartas';

/** Una sección: dura `weight` pantallas y su texto queda fijo mientras la escena cambia detrás. */
export function Section({ s, i }: { s: SectionData; i: number }) {
  const flat = useUI((st) => st.no3d || st.tier === 'static');
  const Heading = i === 0 ? 'h1' : 'h2';
  return (
    <section
      id={s.id}
      data-section={i}
      className={`section section--${s.id}`}
      style={{ '--weight': s.weight } as CSSProperties}
      aria-labelledby={`${s.id}-title`}
    >
      <div className="section__sticky">
        <article className="panel">
          <Heading id={`${s.id}-title`}>{s.title}</Heading>
          {s.body.map((p, k) => (
            <p key={k}>{p}</p>
          ))}
          {s.extra === 'senas' && <SenasList />}
          {s.extra === 'trampa' && flat && <TrampaCartas />}
          {s.extra === 'nombre' && <NameFace />}
          {s.cta && <Cta />}
        </article>
        {flat && s.figure.poster && (
          <figure className="section__figure">
            <img src={s.figure.poster} alt={s.figure.alt} width={1600} height={900} loading="lazy" />
          </figure>
        )}
      </div>
    </section>
  );
}
