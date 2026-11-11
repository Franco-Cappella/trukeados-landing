import { extras, vitrina } from '../content/site';
import { Cta } from './Cta';

/**
 * Después del recorrido: lo que se ve y se elige en el juego (personajes, lugares, paños y dorsos) y todo lo
 * demás que trae. Es HTML con imágenes, tapa la escena 3D (fondo liso) y se lee igual con o sin 3D.
 */
export function Vitrina() {
  return (
    <div className="vitrina">
      {vitrina.map((b) => (
        <section key={b.id} id={b.id} className={`vitrina__bloque vitrina__bloque--${b.kind}`} aria-labelledby={`${b.id}-title`}>
          <header className="vitrina__texto">
            <h2 id={`${b.id}-title`}>{b.title}</h2>
            {b.body.map((p, k) => (
              <p key={k}>{p}</p>
            ))}
          </header>
          <ul className={`galeria galeria--${b.kind}`}>
            {b.items.map((it) => (
              <li key={it.src}>
                <figure>
                  <img src={it.src} alt={it.name} width={it.w} height={it.h} loading="lazy" decoding="async" />
                  {b.kind !== 'personajes' || it.name.includes('3D') ? <figcaption>{it.name}</figcaption> : null}
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section id="mas" className="vitrina__bloque vitrina__bloque--mas" aria-labelledby="mas-title">
        <header className="vitrina__texto">
          <h2 id="mas-title">{extras.title}</h2>
        </header>
        <dl className="extras">
          {extras.items.map((x) => (
            <div key={x.name}>
              <dt>{x.name}</dt>
              <dd>{x.text}</dd>
            </div>
          ))}
        </dl>
        <Cta />
      </section>
    </div>
  );
}
