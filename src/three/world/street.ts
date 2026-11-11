// La calle del Barrio Chino del juego (barrio-chino.js, el mismo código: fachadas, portal, faroles, cerezos, la
// ciudad en capas) y el paño de la mesa, el bordó. Se arma una vez, en el paquete 3D.
import { Group, type Light } from 'three';
import { chinatown } from '../../game/barrio-chino.js';
import { updater } from '../../game/paisaje.js';
import { feltTexture } from '../bar/textures';

/** El paño de la mesa: el bordó de la tienda (COSMETIC_LOOK['pano-bordo'] del juego). */
export const PANO = ['#7a2e38', '#62242d', '#4a1a22'] as const;

export type Street = {
  group: Group;
  update: ((now: number, dt: number) => void) | null;
  /** Las luces de la calle (menos el foco sobre la mesa), con su intensidad: "a ciegas" las baja. */
  lights: { light: Light; base: number }[];
  background: string;
  fog: [string, number, number];
};

export function buildStreet(): Street {
  const group = new Group();
  const out = chinatown(group) as { background: string; fog: [string, number, number] };
  // el farol grande sobre la mesa (y su cable) tapa la mesa en las tomas de arriba: la luz de la mesa queda
  for (const o of [...group.children]) {
    const big = Math.abs(o.position.y - 3.05) < 0.01 && o.scale.x > 1.6;
    const cord = Math.abs(o.position.y - 4.1) < 0.01 && (o as { geometry?: { type: string } }).geometry?.type === 'CylinderGeometry';
    if (big || cord) o.visible = false;
  }
  const lights: Street['lights'] = [];
  group.traverse((o) => {
    const l = o as Light & { isSpotLight?: boolean };
    if (l.isLight && !l.isSpotLight) lights.push({ light: l, base: l.intensity });
  });
  return { group, update: updater(group), lights, ...out };
}

/** El paño bordó, liso, con el nombre al medio como el de siempre. */
export const panoTexture = () => feltTexture(PANO);
