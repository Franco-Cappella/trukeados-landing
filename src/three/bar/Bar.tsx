// Piezas del bar: sala, lámpara, mesa, sillas, personajes, caras y cartas. Mismas medidas que el juego.
import { useLayoutEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import {
  BackSide,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  LatheGeometry,
  PerspectiveCamera,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Texture,
  Vector2,
} from 'three';
import { CARD, SCENE } from '../../game/theme.js';
import { CARD_H, CARD_W, CHAR_H, CHAR_W, TABLE_Y, seatAngle, seatDir, type Vec3 } from './geometry';
import {
  burnTexture,
  characterTexture,
  faceTexture,
  feltTexture,
  floorTexture,
  pictureTexture,
  wallTexture,
  woodTexture,
} from './textures';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Plano apoyado en la mesa con su "arriba" hacia `angle` (igual que el juego al girar el objeto). */
export const tiltUp = (angle: number) => new Euler(-Math.PI / 2, angle, 0, 'YXZ');

/** Pone la cámara en una pose fija. Las escenas de estudio no se mueven: solo cambian de pose. */
export function CameraPose({ position, target, fov }: { position: Vec3; target: Vec3; fov: number }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(...position);
    if (camera instanceof PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(...target);
  }, [camera, position, target, fov]);
  return null;
}

/** Techo oscuro: tapa el borde de las paredes cuando la cámara está de pie. */
export function Ceiling() {
  return (
    <mesh position={[0, 4.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[6, 48]} />
      <meshLambertMaterial color={SCENE.wallBase} />
    </mesh>
  );
}

export function Room() {
  const floor = useMemo(() => floorTexture(), []);
  const wall = useMemo(() => wallTexture(), []);
  const pics = useMemo(() => SCENE.pictures.map(([t, bg, fg]) => pictureTexture(t, bg, fg)), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshLambertMaterial map={floor} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[6, 6, 4.2, 48, 1, true]} />
        <meshLambertMaterial map={wall} side={BackSide} />
      </mesh>
      {pics.map((tex, i) => {
        const a = Math.PI * 0.25 + i * (Math.PI / 2);
        return (
          <mesh key={i} position={[Math.sin(a) * 5.9, 2.0, Math.cos(a) * 5.9]} rotation={[0, a + Math.PI, 0]}>
            <planeGeometry args={[1.2, 0.9]} />
            <meshLambertMaterial map={tex} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Lámpara colgante con su luz cálida. */
export function Lamp({ intensity = 34 }: { intensity?: number }) {
  return (
    <group>
      <spotLight
        position={[0, 2.55, 0]}
        color={SCENE.lamp}
        intensity={intensity}
        distance={7}
        angle={Math.PI / 3.2}
        penumbra={0.55}
        decay={1.6}
      />
      <mesh position={[0, 2.62, 0]}>
        <coneGeometry args={[0.34, 0.26, 32, 1, true]} />
        <meshStandardMaterial color={SCENE.lampShade} side={DoubleSide} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshBasicMaterial color={SCENE.bulb} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 1.2]} />
        <meshBasicMaterial color={SCENE.cord} />
      </mesh>
    </group>
  );
}

/** Polígono con los lados de frente a cada asiento (igual que TableScene.setLayout). */
function polyShape(sides: number, apothem: number, round: number) {
  const shape = new Shape();
  const rv = apothem / Math.cos(Math.PI / sides);
  const pts: Vector2[] = [];
  for (let k = 0; k < sides; k++) {
    const a = (k * Math.PI * 2) / sides + Math.PI / sides;
    pts.push(new Vector2(Math.sin(a) * rv, -Math.cos(a) * rv));
  }
  for (let k = 0; k < sides; k++) {
    const p0 = pts[(k + sides - 1) % sides];
    const p1 = pts[k];
    const p2 = pts[(k + 1) % sides];
    const a = p1.clone().lerp(p0, round);
    const b = p1.clone().lerp(p2, round);
    if (k === 0) shape.moveTo(a.x, a.y);
    else shape.lineTo(a.x, a.y);
    shape.quadraticCurveTo(p1.x, p1.y, b.x, b.y);
  }
  shape.closePath();
  return shape;
}

const LEG = [
  [0, 0],
  [0.032, 0],
  [0.034, 0.03],
  [0.026, 0.08],
  [0.03, 0.3],
  [0.04, 0.36],
  [0.03, 0.42],
  [0.034, TABLE_Y - 0.14],
  [0.038, TABLE_Y - 0.13],
  [0, TABLE_Y - 0.13],
].map(([x, y]) => new Vector2(x, y));

const BOTTLE = [
  [0, 0],
  [0.04, 0],
  [0.04, 0.2],
  [0.015, 0.26],
  [0.014, 0.32],
  [0, 0.32],
].map(([x, y]) => new Vector2(x, y));

/** Mesa de bar con marco de madera, paño, faldón, patas y los objetos de la mesa. */
export function Table({ n, R, felt: painted }: { n: number; R: number; felt?: Texture }) {
  const sides = n === 6 ? 6 : 4;
  const felt = useMemo(() => painted ?? feltTexture(), [painted]);
  const wood = useMemo(() => woodTexture(), []);
  const geo = useMemo(() => {
    const feltGeo = new ShapeGeometry(polyShape(sides, R, 0.16), 24);
    const span = (R / Math.cos(Math.PI / sides)) * 2;
    const pos = feltGeo.attributes.position;
    const uv = feltGeo.attributes.uv;
    for (let k = 0; k < pos.count; k++) uv.setXY(k, pos.getX(k) / span + 0.5, pos.getY(k) / span + 0.5);
    const outer = polyShape(sides, R + 0.09, 0.18);
    outer.holes.push(polyShape(sides, R - 0.002, 0.16));
    const frame = new ExtrudeGeometry(outer, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.016,
      bevelSegments: 4,
      curveSegments: 24,
    });
    const skirt = new ExtrudeGeometry(polyShape(sides, R - 0.02, 0.18), {
      depth: 0.09,
      bevelEnabled: false,
      curveSegments: 16,
    });
    const leg = new LatheGeometry(LEG, 16);
    return { feltGeo, frame, skirt, leg };
  }, [sides, R]);
  const legs = useMemo(() => {
    const legR = (R - 0.07) / Math.cos(Math.PI / sides);
    return Array.from({ length: sides }, (_, k) => {
      const a = (k * Math.PI * 2) / sides + Math.PI / sides;
      return [Math.sin(a) * legR * 0.92, Math.cos(a) * legR * 0.92] as const;
    });
  }, [sides, R]);

  return (
    <group>
      <mesh geometry={geo.feltGeo} position={[0, TABLE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshLambertMaterial map={felt} />
      </mesh>
      <mesh geometry={geo.frame} position={[0, TABLE_Y - 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial map={wood} roughness={0.38} metalness={0.03} />
      </mesh>
      <mesh geometry={geo.skirt} position={[0, TABLE_Y - 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial map={wood} color={SCENE.woodDark} roughness={0.5} />
      </mesh>
      {legs.map(([x, z], i) => (
        <mesh key={i} geometry={geo.leg} position={[x, 0, z]}>
          <meshStandardMaterial color={SCENE.woodDark} roughness={0.5} />
        </mesh>
      ))}
      <TableProps R={R} />
    </group>
  );
}

/** Vaso de vino, botella y mate, como en el juego. */
function TableProps({ R }: { R: number }) {
  return (
    <group>
      <mesh position={[-R * 0.55, TABLE_Y + 0.05, R * 0.5]}>
        <cylinderGeometry args={[0.03, 0.026, 0.1, 20, 1, true]} />
        <meshStandardMaterial color={SCENE.glass} roughness={0.05} transparent opacity={0.3} />
      </mesh>
      <mesh position={[-R * 0.55, TABLE_Y + 0.026, R * 0.5]}>
        <cylinderGeometry args={[0.027, 0.025, 0.05, 20]} />
        <meshStandardMaterial color={SCENE.wine} roughness={0.2} />
      </mesh>
      <mesh position={[-R * 0.66, TABLE_Y, -R * 0.5]}>
        <latheGeometry args={[BOTTLE, 20]} />
        <meshStandardMaterial color={SCENE.bottle} roughness={0.15} metalness={0.1} />
      </mesh>
      <group position={[R * 0.62, TABLE_Y, -R * 0.42]}>
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.045, 20, 16, 0, Math.PI * 2, 0.35, Math.PI * 0.7]} />
          <meshStandardMaterial color={SCENE.mate} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.083, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.038, 20]} />
          <meshLambertMaterial color={SCENE.yerba} />
        </mesh>
        <mesh position={[0.012, 0.11, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.004, 0.004, 0.16]} />
          <meshStandardMaterial color={SCENE.bombilla} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/** Silla de madera del asiento `seat`, detrás del personaje. */
export function Chair({ seat, n, R }: { seat: number; n: number; R: number }) {
  const [dx, , dz] = seatDir(seat, n);
  const r = R + 0.5;
  return (
    <group position={[dx * r, 0, dz * r]} rotation={[0, seatAngle(seat, n), 0]}>
      <ChairModel />
    </group>
  );
}

/** La silla sola, en el origen y con el respaldo hacia +z (afuera de la mesa). */
export function ChairModel() {
  const legs: [number, number][] = [
    [-0.2, -0.19],
    [0.2, -0.19],
    [-0.2, 0.19],
    [0.2, 0.19],
  ];
  return (
    <group>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[0.46, 0.05, 0.44]} />
        <meshStandardMaterial color={SCENE.chair} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.8, 0.22]}>
        <boxGeometry args={[0.46, 0.62, 0.04]} />
        <meshStandardMaterial color={SCENE.chair} roughness={0.6} />
      </mesh>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.23, z]}>
          <boxGeometry args={[0.04, 0.46, 0.04]} />
          <meshStandardMaterial color={SCENE.chair} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

type SeatProps = { seat: number; n: number; R: number };

/** Personaje sentado, dibujado con characters.js sobre un plano. Gira el cuerpo hacia la mesa, como el juego. */
export function Person({
  seat,
  n,
  R,
  name,
  expr = 'neutral',
  cards = 0,
  down = 0,
}: SeatProps & { name: string; expr?: string; cards?: number; down?: number }) {
  const [dx, , dz] = seatDir(seat, n);
  const r = R + 0.3;
  const bodyYaw = clamp(Math.atan2(-dx, -dz), -1.3, 1.3);
  const headYaw = bodyYaw * 0.7;
  const tex = useMemo(
    () => characterTexture(name, seat, { expr, cards, down, bodyYaw, headYaw }),
    [name, seat, expr, cards, down, bodyYaw, headYaw],
  );
  return (
    <mesh position={[dx * r, CHAR_H / 2, dz * r]}>
      <planeGeometry args={[CHAR_W, CHAR_H]} />
      <meshLambertMaterial map={tex} alphaTest={0.5} side={DoubleSide} />
    </mesh>
  );
}

/** Cara de un personaje sobre el paño, vista desde arriba: una "ficha", derecha para quien mira. */
export function FaceToken({ seat, n, R, name, expr = 'neutral' }: SeatProps & { name: string; expr?: string }) {
  const [dx, , dz] = seatDir(seat, n);
  const r = R * 0.78;
  const tex = useMemo(() => faceTexture(name, seat, expr), [name, seat, expr]);
  return (
    <mesh position={[dx * r, TABLE_Y + 0.006, dz * r]} rotation={tiltUp(0)}>
      <circleGeometry args={[0.2, 48]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

function useCardTexture(file: string) {
  const t = useTexture(`/cards/${file}.webp`) as Texture;
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Carta con frente y dorso. Quemada: oscurecida, con bordes carbonizados (como en el juego). */
export function Card({
  id,
  position,
  rotation,
  burned = false,
}: {
  id: string;
  position: Vec3;
  rotation?: Euler;
  burned?: boolean;
}) {
  const front = useCardTexture(id);
  const back = useCardTexture('back');
  const burn = useMemo(() => (burned ? burnTexture() : null), [burned]);
  const tint = burned ? CARD.burnTint : '#ffffff';
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0.0003]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshLambertMaterial map={front} color={tint} alphaTest={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.0003]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshLambertMaterial map={back} color={tint} alphaTest={0.5} />
      </mesh>
      {burn && (
        <mesh position={[0, 0, 0.0006]}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshLambertMaterial map={burn} transparent depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
