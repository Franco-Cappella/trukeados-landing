import { lens, site, type SceneFx, type Shot } from '../content/site';

// Estado CONTINUO de la escena. Solo el director de scroll (useStoryTimeline) lo escribe, con GSAP; las
// escenas lo leen en useFrame. Nunca pasa por React. No importa three: la capa DOM también lo usa.

export const ZERO: SceneFx = { dim: 0, closeup: 0, sena: 0, gaze: 0, burn: 0, six: 0, seated: 0 };

/** Cámara aplanada para tweenear: posición, objetivo, campo vertical y dónde cae el objetivo en pantalla. */
export type Cam = { px: number; py: number; pz: number; tx: number; ty: number; tz: number; fov: number; ox: number; oy: number };

const flat = (s: Shot, portrait: boolean): Cam => {
  const L = portrait ? lens.portrait : lens.landscape;
  const [ox, oy] = s.frame ?? L.frame;
  return {
    px: s.position[0],
    py: s.position[1],
    pz: s.position[2],
    tx: s.target[0],
    ty: s.target[1],
    tz: s.target[2],
    fov: s.fov ?? L.fov,
    ox,
    oy,
  };
};

export const camOf = (i: number, portrait = false) => {
  const s = site.sections[i];
  return flat(portrait ? s.cameraPortrait : s.camera, portrait);
};

/** Efectos al terminar la sección i: se acumulan los cambios (llegada y estadía) de las secciones anteriores. */
export const fxOf = (i: number): SceneFx =>
  site.sections.slice(0, i + 1).reduce<SceneFx>((acc, s) => ({ ...acc, ...s.fxIn, ...s.fx }), { ...ZERO });

/** Efectos al terminar la llegada de la sección i, antes de su estadía. */
export const fxInOf = (i: number): SceneFx => ({ ...fxOf(i - 1), ...site.sections[i].fxIn });

export const rig = { cam: camOf(0), fx: fxOf(0), snap: false, requestFrame: () => {} };
