import { GAME_URL } from '../content/links';
import { site } from '../content/site';

/** Las dos acciones. Las dos van al menú del juego hasta que el juego acepte parámetros (ALINEACION.md §3). */
export function Cta() {
  return (
    <div className="cta">
      <a className="btn btn--primary btn--big" href={GAME_URL}>
        {site.cta.primary}
      </a>
      <a className="btn btn--secondary btn--big" href={GAME_URL}>
        {site.cta.secondary}
      </a>
    </div>
  );
}
