import { site } from '../content/site';
import { useUI } from '../state/store';

/** Cierre: el nombre a todo el ancho, el cambio de versión y los créditos obligatorios. */
export function Footer() {
  const no3d = useUI((s) => s.no3d);
  const toggleNo3d = useUI((s) => s.toggleNo3d);
  return (
    <footer className="pie">
      <img className="pie__palabra" src="/brand/palabra.svg" alt={site.name} width={835} height={69} loading="lazy" />
      <div className="pie__fila">
        <p>{site.tagline}</p>
        <button type="button" className="pie__boton" onClick={toggleNo3d} aria-pressed={no3d}>
          {no3d ? 'Ver con 3D' : 'Ver sin 3D'}
        </button>
      </div>
      <p className="pie__legal">
        Cartas: diseño “Naipes Libres” de Basquetteur (Wikimedia Commons),{' '}
        <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">
          CC BY-SA 3.0
        </a>
        , vectorizadas por gjenkins20. Tipografía: Archivo, de Omnibus-Type (OFL).
      </p>
    </footer>
  );
}
