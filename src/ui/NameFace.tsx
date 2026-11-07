import { useState } from 'react';
import { MAX_NAME } from '../game/config.js';
import { FaceCanvas } from './FaceCanvas';

/** Lo interactivo: escribís tu nombre y aparece tu cara, la misma que te va a dar el juego en tu lugar.
 *  Es el "Así te ven" del juego. El nombre todavía no viaja al juego (ALINEACION.md §3). */
export function NameFace() {
  const [name, setName] = useState('');
  const typed = name.trim();
  const shown = typed || 'Vos';
  return (
    <div className="nombre" data-ui>
      <label className="nombre__campo">
        <span>¿Cómo te llaman en la mesa?</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
          maxLength={MAX_NAME}
          autoComplete="nickname"
          placeholder="Tu nombre"
        />
      </label>
      <figure className="nombre__cara">
        <FaceCanvas
          name={shown}
          seat={0}
          size={152}
          label={typed ? `Así te ven en la mesa con el nombre ${typed}` : 'Así te ven en la mesa'}
        />
        <figcaption aria-live="polite">{typed ? `Así te ven, ${typed}.` : 'Así te ven.'}</figcaption>
      </figure>
    </div>
  );
}
