import { GAME_URL } from '../content/links';
import { site } from '../content/site';

/** Barra fija: logo, tres enlaces a secciones y la acción principal. Fondo liso, sin vidrio. */
export function Nav() {
  return (
    <header className="nav">
      <a className="nav__logo" href="#inicio">
        <img src="/brand/logo-horizontal.svg" alt="Trukeados" width={214} height={28} />
      </a>
      <nav className="nav__links" aria-label="Secciones">
        {site.nav.map((l) => (
          <a key={l.id} href={`#${l.id}`}>
            {l.label}
          </a>
        ))}
      </nav>
      <a className="btn btn--primary nav__cta" href={GAME_URL}>
        {site.cta.primary}
      </a>
    </header>
  );
}
