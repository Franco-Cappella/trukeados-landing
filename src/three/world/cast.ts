// Personajes del bar: recortes 2D dibujados con characters.js del juego. Como en scene.js, el recorte mira
// siempre a la cámara (gira solo en Y), el cuerpo apunta al centro de la mesa y la cabeza a quien mira; los
// ángulos se calculan igual que viewYaw/poseFor. Cada uno se redibuja solo cuando cambia su pose o su cara.
import { CanvasTexture, MathUtils, SRGBColorSpace, Vector3 } from 'three';
import { drawCharacter, lookFor, W, H } from '../../game/characters.js';

const HEAD_RATE = 9; // suavizado del giro de cabeza (el mismo del juego)
/** Tope de redibujos por cuadro: con la cámara en viaje cambian todos a la vez. En el nivel bajo, uno. */
export const castConfig = { budget: 2 };
/** Cuánto cuesta dibujar (lo lee scripts/capture.mjs con ?debug). */
export const castStats = { draws: 0, ms: 0, max: 0, hi: { draws: 0, ms: 0, max: 0 } };

export type Actor = {
  name: string;
  /** Lo dibujado: canvas propio, a `scale` x 512 x 1200 (el del primer plano va al doble). */
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: CanvasTexture;
  look: ReturnType<typeof lookFor>;
  scale: number;
  /** Dónde está (centro del recorte) y la pose actual. */
  pos: Vector3;
  pose: { bodyYaw: number; headYaw: number; down: number; expr: string };
  drawn: { bodyYaw: number; headYaw: number; down: number; expr: string };
};

/** `seat` decide la cara (lookFor): se fija al crearlo, así la cara no cambia si cambia de asiento. */
export function createActor(name: string, seat: number, scale = 1): Actor {
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const actor: Actor = {
    name,
    canvas,
    ctx,
    texture,
    look: lookFor(name, seat),
    scale,
    pos: new Vector3(),
    pose: { bodyYaw: 0, headYaw: 0, down: 1, expr: 'neutral' },
    drawn: { bodyYaw: 99, headYaw: 99, down: 99, expr: '' },
  };
  draw(actor);
  return actor;
}

function draw(a: Actor) {
  const t0 = performance.now();
  a.ctx.setTransform(a.scale, 0, 0, a.scale, 0, 0);
  drawCharacter(a.ctx, a.look, { ...a.pose, cards: 3 });
  a.texture.needsUpdate = true;
  a.drawn = { ...a.pose };
  const ms = performance.now() - t0;
  const st = a.scale > 1 ? castStats.hi : castStats;
  st.draws++;
  st.ms += ms;
  st.max = Math.max(st.max, ms);
}

const toCam = new Vector3();
const right = new Vector3();
const dir = new Vector3();

/** Ángulo, visto desde la cámara, de una dirección en la que apunta el personaje: 0 = hacia la cámara,
 *  positivo = hacia la derecha de la imagen (viewYaw de scene.js). */
export function viewYaw(a: Actor, cam: Vector3, to: Vector3) {
  toCam.set(cam.x - a.pos.x, 0, cam.z - a.pos.z).normalize();
  right.set(toCam.z, 0, -toCam.x);
  dir.set(to.x - a.pos.x, 0, to.z - a.pos.z).normalize();
  return Math.atan2(dir.dot(right), dir.dot(toCam));
}

/** Hacia dónde mira cada uno, de 0 a 1: a la mesa (lo de siempre), a otro personaje o a la cámara (a vos). */
export type Gaze = { at: Vector3 | null; atWeight: number; camWeight: number; expr: string };

const center = new Vector3();

/** Calcula la pose que corresponde y la acerca con suavidad. Devuelve true si hay que redibujar. */
export function updatePose(a: Actor, cam: Vector3, g: Gaze, dt: number) {
  center.set(0, a.pos.y, 0);
  const body = viewYaw(a, cam, center);
  let head = body * 0.9; // mirando la mesa (poseFor: sin objetivo)
  if (g.at && g.atWeight > 0) head = MathUtils.lerp(head, viewYaw(a, cam, g.at), g.atWeight);
  head = MathUtils.lerp(head, 0, g.camWeight); // a la cámara = de frente
  const down = 1 - Math.max(g.at ? g.atWeight : 0, g.camWeight);
  const k = 1 - Math.exp(-HEAD_RATE * dt);
  a.pose.bodyYaw = body;
  a.pose.headYaw += (head - a.pose.headYaw) * k;
  a.pose.down += (down - a.pose.down) * k;
  a.pose.expr = g.expr;
  // Umbrales: unos 3° de diferencia no se notan en un recorte 2D y ahorran un tercio de los redibujos
  // (medido con la CPU 4 veces más lenta: cada redibujo cuesta unos 8 ms).
  const d = a.drawn;
  return (
    d.expr !== a.pose.expr ||
    Math.abs(d.bodyYaw - a.pose.bodyYaw) > 0.06 ||
    Math.abs(d.headYaw - a.pose.headYaw) > 0.05 ||
    Math.abs(d.down - a.pose.down) > 0.08
  );
}

let cursor = 0;

/** Redibuja los que lo necesitan, como mucho castConfig.budget por cuadro (empieza por uno distinto cada vez). */
export function redraw(actors: Actor[], needs: boolean[]) {
  let budget = castConfig.budget;
  for (let k = 0; k < actors.length && budget > 0; k++) {
    const i = (cursor + k) % actors.length;
    if (!needs[i]) continue;
    draw(actors[i]);
    budget--;
  }
  cursor = (cursor + 1) % actors.length;
}
