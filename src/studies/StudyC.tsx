// Estudio C · Caras. Primer plano de una seña: la cámara casi a la altura de la cara, con el resto de la mesa
// a oscuras y una luz de contorno. Es la mecánica del juego en una sola imagen: la seña se ve de cerca.
import { SCENE } from '../game/theme.js';
import { CameraPose, Chair, Lamp, Person, Table } from '../three/bar/Bar';
import { TABLE_R, type Vec3 } from '../three/bar/geometry';

const N = 4;
const R = TABLE_R[N];
// El objetivo se corre a la izquierda de la cara para que la cara quede en la mitad derecha del cuadro.
const POSE: { position: Vec3; target: Vec3 } = { position: [0.45, 1.38, -0.05], target: [-0.3, 1.3, -1.25] };

export function StudyC() {
  return (
    <>
      <CameraPose position={POSE.position} target={POSE.target} fov={38} />
      <color attach="background" args={[SCENE.background]} />
      <fog attach="fog" args={[SCENE.fog, 0.8, 3.4]} />
      <hemisphereLight args={[SCENE.hemiSky, SCENE.hemiGround, 0.3]} />
      <pointLight position={[0.9, 1.9, -2.0]} color={SCENE.lamp} intensity={9} distance={5} decay={1.5} />
      <Lamp intensity={16} />
      <Table n={N} R={R} />
      {[1, 2, 3].map((s) => (
        <Chair key={s} seat={s} n={N} R={R} />
      ))}
      <Person seat={1} n={N} R={R} name="Coca" cards={3} />
      <Person seat={2} n={N} R={R} name="Cacho" expr="wink" cards={3} />
      <Person seat={3} n={N} R={R} name="Tito" cards={3} />
    </>
  );
}
