// El Gato Melón: el personaje 3D de la tienda del juego (models.js, el mismo lector y la misma pose sentada), con
// sus tres cartas de dorso en la mano. Se sienta a tu derecha, donde estaba Coca.
import { DoubleSide, Group, Mesh, MeshLambertMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector3 } from 'three';
import { loadModel, Rig } from '../../game/models.js';
import { CARD_H, CARD_W, TABLE_Y } from '../bar/geometry';

/** COSMETIC_LOOK['gato-melon'].model del juego. */
const SPEC = { url: '/models/gato-melon.glb', scale: 0.62 };
/** Cuánto más atrás del borde de la mesa se sientan los personajes 3D (RIG_BACK de scene.js). */
export const RIG_BACK = 0.42;
const HEAD_RATE = 9;

type RigT = InstanceType<typeof Rig>;
export type Gato = { rig: RigT; cards: Group; mats: MeshLambertMaterial[]; hy: number; hd: number };

export async function loadGato(): Promise<Gato> {
  const tpl = await loadModel(SPEC.url);
  const rig = new Rig(tpl, { scale: SPEC.scale });
  const back = new TextureLoader().load('/cards/back.webp');
  back.colorSpace = SRGBColorSpace;
  const cardMat = new MeshLambertMaterial({ map: back, side: DoubleSide });
  const cards = new Group();
  for (let i = 0; i < 3; i++) {
    const a = (1 - i) * 0.28;
    const m = new Mesh(new PlaneGeometry(CARD_W, CARD_H), cardMat);
    m.position.set(-Math.sin(a) * 0.05, Math.cos(a) * 0.05, i * 0.002);
    m.rotation.z = a;
    cards.add(m);
  }
  rig.root.add(cards);
  return { rig, cards, mats: [rig.mesh.material as MeshLambertMaterial, cardMat], hy: 0, hd: 1 };
}

const tmp = new Vector3();

/**
 * Sentado en el ángulo `a` de una mesa de radio `R`, mirando al centro. `look` (con peso `w`, de 0 a 1): a quién
 * gira la cabeza; con w = 0 mira la mesa.
 */
export function poseGato(g: Gato, a: number, R: number, look: Vector3 | null, w: number, dt: number, now: number) {
  const r = g.rig;
  r.root.position.set(Math.sin(a) * (R + RIG_BACK), 0, Math.cos(a) * (R + RIG_BACK));
  r.root.rotation.y = Math.atan2(-Math.sin(a), -Math.cos(a));
  r.root.updateMatrixWorld(true);
  let yaw = 0;
  if (look && w > 0) {
    const l = r.root.worldToLocal(tmp.copy(look));
    yaw = Math.atan2(l.x, l.z) * w;
  }
  const k = 1 - Math.exp(-HEAD_RATE * dt);
  g.hy += (yaw - g.hy) * k;
  g.hd += ((1 - w) * 0.45 - g.hd) * k; // un gato no se queda mirando el paño: levanta la cabeza
  r.pose({ tableY: TABLE_Y, headYaw: g.hy, headDown: g.hd, breathe: Math.sin(now / 900) });
  g.cards.position.copy(r.root.worldToLocal(r.at('LeftHand'))).add(tmp.set(0, 0.04, 0.02)).add(r.cardsOffset);
  g.cards.rotation.set(-0.35, 0, 0);
}

/** Dónde va su placa de nombre: apenas arriba de la cabeza. */
export const gatoPlate = (g: Gato, out: Vector3) => g.rig.at('Head', out).add(tmp.set(0, 0.32, 0));
