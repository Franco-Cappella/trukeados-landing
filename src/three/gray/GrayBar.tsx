// Escena gris (fase 5): cajas con las medidas del bar del juego para ajustar tiempos y encuadres antes del
// arte. Cada estado de `rig.fx` se ve de forma simple: caras que se oscurecen, una cara que se ilumina con el
// número de seña, cabezas que giran, la carta de arriba que se levanta, la mesa que pasa de 4 a 6 lugares y,
// al sentarte, todos te miran. En la fase 6 se reemplaza por el bar de verdad (three/bar/).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  BackSide,
  CanvasTexture,
  Color,
  type Group,
  MathUtils,
  type Mesh,
  type MeshLambertMaterial,
  type PointLight,
  type HemisphereLight,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { SENAS } from '../../game/config.js';
import { rig } from '../../scroll/rig';
import {
  CARD_H,
  CARD_W,
  CHAIR_OUT,
  EYE_Y,
  FACE_Y,
  PERSON_OUT,
  PLAY_R,
  SEAT_EYE_OUT,
  TABLE_CARD,
  TABLE_R,
  TABLE_Y,
  seatAngle,
} from '../bar/geometry';
import { CANVAS_FONT } from '../bar/textures';

const { lerp, clamp, smoothstep } = MathUtils;
const R4 = TABLE_R[4];
const R6 = TABLE_R[6];
const KW = CARD_W * TABLE_CARD;
const KH = CARD_H * TABLE_CARD;
const SENA_LIST = Object.values(SENAS) as { label: string }[];

const GRAY = {
  bg: '#141414',
  floor: '#2e2e2e',
  wall: '#262626',
  ceiling: '#1f1f1f',
  wood: '#4a4a4a',
  felt: '#6b6b6b',
  chair: '#3d3d3d',
  body: '#5c5c5c',
  head: new Color('#c9c9c9'),
  headDark: new Color('#262626'),
  card: new Color('#dedede'),
  burnt: new Color('#3b2c24'),
  line: '#f0f0f0',
};

/** Jugadores: ángulo en la mesa de cuatro (null si no está) y en la de seis. Vos sos el asiento 0. */
const PLAYERS: { a4: number | null; a6: number }[] = [
  { a4: seatAngle(1, 4), a6: seatAngle(1, 6) }, // Coca, a tu derecha
  { a4: seatAngle(2, 4), a6: seatAngle(3, 6) }, // Cacho, enfrente: el del primer plano
  { a4: seatAngle(3, 4), a6: seatAngle(5, 6) }, // Tito, a tu izquierda, compañero de Coca
  { a4: null, a6: seatAngle(2, 6) },
  { a4: null, a6: seatAngle(4, 6) },
];
const COCA = 0;
const CACHO = 1;
const TITO = 2;

const tmp = { a: new Vector3(), b: new Vector3(), q: new Quaternion(), up: new Vector3(0, 1, 0) };

/** Giro de cabeza (relativo al cuerpo, que mira al centro) para mirar a `to` desde `from`. */
function headYaw(bodyYaw: number, from: Vector3, to: Vector3) {
  const d = Math.atan2(to.x - from.x, to.z - from.z) - bodyYaw;
  return clamp(Math.atan2(Math.sin(d), Math.cos(d)), -1.3, 1.3);
}

function senaTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return { canvas: c, texture: t, shown: -1 };
}

export function GrayBar() {
  const people = useRef<(Group | null)[]>([]);
  const heads = useRef<(Group | null)[]>([]);
  const headMats = useRef<(MeshLambertMaterial | null)[]>([]);
  const chairs = useRef<(Group | null)[]>([]);
  const myChair = useRef<Group>(null);
  const table4 = useRef<Mesh>(null);
  const table6 = useRef<Mesh>(null);
  const label = useRef<Mesh>(null);
  const line = useRef<Mesh>(null);
  const lineMat = useRef<MeshLambertMaterial>(null);
  const cardTop = useRef<Mesh>(null);
  const cardTopMat = useRef<MeshLambertMaterial>(null);
  const cardBottom = useRef<Mesh>(null);
  const hemi = useRef<HemisphereLight>(null);
  const lamp = useRef<PointLight>(null);
  const sena = useMemo(senaTexture, []);
  const headPos = useMemo(() => PLAYERS.map(() => new Vector3()), []);
  const you = useMemo(() => new Vector3(0, EYE_Y, R4 + SEAT_EYE_OUT), []);
  const center = useMemo(() => new Vector3(0, FACE_Y, 0), []);

  useFrame(() => {
    const fx = rig.fx;
    const six = fx.six;
    const R = lerp(R4, R6, six);

    // Mesa: cuadrada → hexagonal (cambia de forma a mitad de camino, con un pulso para que se note).
    const pulse = 1 - 0.12 * Math.sin(Math.PI * six);
    if (table4.current && table6.current) {
      table4.current.visible = six < 0.5;
      table6.current.visible = six >= 0.5;
      table4.current.scale.set(pulse, 1, pulse);
      table6.current.scale.set(pulse, 1, pulse);
    }
    myChair.current?.position.set(0, 0, R + CHAIR_OUT);

    // Jugadores y sillas: se corren a su lugar de la mesa de seis; los dos nuevos aparecen.
    PLAYERS.forEach((p, i) => {
      const a = p.a4 === null ? p.a6 : lerp(p.a4, p.a6, six);
      const s = p.a4 === null ? smoothstep(six, 0.35, 1) : 1;
      const g = people.current[i];
      const ch = chairs.current[i];
      if (g) {
        g.position.set(Math.sin(a) * (R + PERSON_OUT), 0, Math.cos(a) * (R + PERSON_OUT));
        g.rotation.y = a + Math.PI;
        g.scale.setScalar(Math.max(s, 0.001));
        g.visible = s > 0.01;
        headPos[i].set(g.position.x, FACE_Y, g.position.z);
      }
      if (ch) {
        ch.position.set(Math.sin(a) * (R + CHAIR_OUT), 0, Math.cos(a) * (R + CHAIR_OUT));
        ch.rotation.y = a;
        ch.scale.setScalar(Math.max(s, 0.001));
        ch.visible = s > 0.01;
      }
    });

    // Cabezas: miran al centro; en "mirada", Coca y Tito se miran; sentado, todos te miran a vos.
    PLAYERS.forEach((p, i) => {
      const h = heads.current[i];
      const g = people.current[i];
      if (!h || !g) return;
      const body = g.rotation.y;
      let yaw = headYaw(body, headPos[i], center);
      if (i === COCA || i === TITO) yaw = lerp(yaw, headYaw(body, headPos[i], headPos[i === COCA ? TITO : COCA]), fx.gaze);
      yaw = lerp(yaw, headYaw(body, headPos[i], you), fx.seated);
      h.rotation.y = yaw;
      const m = headMats.current[i];
      if (m) {
        const shadow = fx.dim * (1 - (i === CACHO ? fx.closeup : 0));
        m.color.copy(GRAY.head).lerp(GRAY.headDark, shadow);
        m.emissive.setScalar(i === CACHO ? 0.22 * fx.closeup : 0);
      }
    });

    // Número de seña sobre la cara de Cacho (solo en la maqueta: en la fase 6 cambia la cara).
    if (label.current) {
      label.current.visible = fx.closeup > 0.3;
      const idx = Math.min(SENA_LIST.length - 1, Math.floor(fx.sena * SENA_LIST.length));
      if (idx !== sena.shown) {
        const ctx = sena.canvas.getContext('2d')!;
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = '#f5f5f5';
        ctx.font = `700 46px ${CANVAS_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${idx + 1}/11 · ${SENA_LIST[idx].label}`, 256, 66);
        sena.texture.needsUpdate = true;
        sena.shown = idx;
      }
    }

    // Línea de mirada entre Coca y Tito.
    if (line.current && lineMat.current) {
      line.current.visible = fx.gaze > 0.01;
      const a = headPos[COCA];
      const b = headPos[TITO];
      tmp.a.addVectors(a, b).multiplyScalar(0.5);
      line.current.position.copy(tmp.a);
      tmp.b.subVectors(b, a);
      line.current.scale.set(1, tmp.b.length(), 1);
      line.current.quaternion.copy(tmp.q.setFromUnitVectors(tmp.up, tmp.b.normalize()));
      lineMat.current.opacity = fx.gaze;
    }

    // Trampa: la carta de arriba se levanta, se corre y se quema; la de abajo queda en el paño.
    const b = fx.burn;
    const kz = R * PLAY_R;
    const drop = (1 - fx.played) * 0.4; // caen al paño al llegar a la trampa
    if (cardBottom.current) cardBottom.current.visible = fx.played > 0.01;
    if (cardTop.current) cardTop.current.visible = fx.played > 0.01;
    cardBottom.current?.position.set(0, TABLE_Y + 0.002 + drop, kz);
    if (cardTop.current && cardTopMat.current) {
      // Se corre poco de costado (en celular el cuadro es angosto) y más hacia el fondo, que en pantalla es arriba.
      cardTop.current.position.set(0.09 * b, TABLE_Y + 0.006 + drop * 1.15 + 0.05 * b + 0.05 * Math.sin(Math.PI * b), kz - 0.06 * b);
      cardTop.current.rotation.set(0, -0.3 * b, 0.35 * b);
      cardTopMat.current.color.copy(GRAY.card).lerp(GRAY.burnt, b);
    }

    // Luz: a ciegas baja la general; la lámpara sigue sobre el paño.
    if (hemi.current) hemi.current.intensity = lerp(1.1, 0.22, fx.dim);
    if (lamp.current) lamp.current.intensity = lerp(14, 8, fx.dim);
  });

  return (
    <group>
      <color attach="background" args={[GRAY.bg]} />
      <fog attach="fog" args={[GRAY.bg, 6.5, 15]} />
      <hemisphereLight ref={hemi} args={['#d6d6d6', '#1a1a1a', 1.1]} />
      <pointLight ref={lamp} position={[0, 2.5, 0]} color="#fff1dc" intensity={14} distance={7} decay={1.5} />
      <directionalLight position={[3, 5, 4]} intensity={0.5} />

      {/* sala */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshLambertMaterial color={GRAY.floor} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[6, 6, 4.2, 32, 1, true]} />
        <meshLambertMaterial color={GRAY.wall} side={BackSide} />
      </mesh>
      <mesh position={[0, 4.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 32]} />
        <meshLambertMaterial color={GRAY.ceiling} />
      </mesh>

      {/* lámpara */}
      <mesh position={[0, 2.62, 0]}>
        <coneGeometry args={[0.34, 0.26, 16, 1, true]} />
        <meshLambertMaterial color="#555555" side={BackSide} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshBasicMaterial color="#fff6e8" />
      </mesh>

      {/* mesa: de cuatro (lados de frente a cada asiento) y de seis */}
      {[
        { ref: table4, n: 4, R: R4 },
        { ref: table6, n: 6, R: R6 },
      ].map(({ ref, n, R }) => (
        <mesh key={n} ref={ref} position={[0, TABLE_Y - 0.03, 0]} rotation={[0, Math.PI / n, 0]}>
          <cylinderGeometry args={[(R + 0.09) / Math.cos(Math.PI / n), (R + 0.09) / Math.cos(Math.PI / n), 0.06, n]} />
          <meshLambertMaterial attach="material-0" color={GRAY.wood} />
          <meshLambertMaterial attach="material-1" color={GRAY.felt} />
          <meshLambertMaterial attach="material-2" color={GRAY.wood} />
        </mesh>
      ))}
      <mesh position={[0, (TABLE_Y - 0.06) / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.1, TABLE_Y - 0.06, 12]} />
        <meshLambertMaterial color={GRAY.wood} />
      </mesh>

      {/* tu silla, vacía */}
      <group ref={myChair}>
        <ChairBox />
      </group>

      {PLAYERS.map((_, i) => (
        <group key={`silla${i}`} ref={(el) => void (chairs.current[i] = el)}>
          <ChairBox />
        </group>
      ))}

      {PLAYERS.map((_, i) => (
        <group key={`jugador${i}`} ref={(el) => void (people.current[i] = el)}>
          <mesh position={[0, 0.86, 0]}>
            <boxGeometry args={[0.56, 0.78, 0.22]} />
            <meshLambertMaterial color={GRAY.body} />
          </mesh>
          <group ref={(el) => void (heads.current[i] = el)} position={[0, FACE_Y, 0]}>
            <mesh>
              <boxGeometry args={[0.34, 0.44, 0.3]} />
              <meshLambertMaterial ref={(el) => void (headMats.current[i] = el)} color={GRAY.head} />
            </mesh>
            {/* nariz: para ver hacia dónde mira */}
            <mesh position={[0, -0.02, 0.18]}>
              <boxGeometry args={[0.06, 0.08, 0.08]} />
              <meshLambertMaterial color="#8a8a8a" />
            </mesh>
            {i === CACHO && (
              <mesh ref={label} position={[0, -0.12, 0.16]}>
                <planeGeometry args={[0.44, 0.11]} />
                <meshBasicMaterial map={sena.texture} toneMapped={false} />
              </mesh>
            )}
          </group>
        </group>
      ))}

      {/* línea de mirada */}
      <mesh ref={line} visible={false}>
        <cylinderGeometry args={[0.012, 0.012, 1, 8]} />
        <meshLambertMaterial ref={lineMat} color={GRAY.line} emissive={GRAY.line} emissiveIntensity={0.6} transparent />
      </mesh>

      {/* trampa: dos cartas encimadas en tu lugar */}
      <mesh ref={cardBottom}>
        <boxGeometry args={[KW, 0.003, KH]} />
        <meshLambertMaterial color={GRAY.card} />
      </mesh>
      <mesh ref={cardTop}>
        <boxGeometry args={[KW, 0.003, KH]} />
        <meshLambertMaterial ref={cardTopMat} color={GRAY.card} />
      </mesh>

    </group>
  );
}

/** Silla mirando a la mesa (el respaldo del lado de afuera). */
function ChairBox() {
  return (
    <group>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[0.46, 0.05, 0.44]} />
        <meshLambertMaterial color={GRAY.chair} />
      </mesh>
      <mesh position={[0, 0.8, 0.22]}>
        <boxGeometry args={[0.46, 0.62, 0.04]} />
        <meshLambertMaterial color={GRAY.chair} />
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <boxGeometry args={[0.4, 0.46, 0.38]} />
        <meshLambertMaterial color={GRAY.chair} />
      </mesh>
    </group>
  );
}
