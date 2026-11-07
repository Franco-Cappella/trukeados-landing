import { BOT_NAMES, SENAS } from '../game/config.js';
import { FaceCanvas } from './FaceCanvas';

/** Las 11 señas del juego, con la cara que pone cada una. Es la leyenda de la sección; en la fase 6 se marca
 *  la que está haciendo la cara del primer plano. */
export function SenasList() {
  return (
    <ul className="senas" data-ui>
      {Object.entries(SENAS).map(([id, s], i) => {
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
