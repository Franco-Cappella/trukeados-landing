// Estudio A · La puerta. Cámara de pie, de frente a la mesa, un poco alta: se ve el paño por encima de tu
// silla vacía y la lámpara encima. Es el primer paso de la historia: entrás al bar. El final de la landing
// sería la vista de esa silla, la misma del juego.
import { SCENE } from '../game/theme.js';
import { CameraPose, Card, Ceiling, Chair, Lamp, Person, Room, Table, tiltUp } from '../three/bar/Bar';
import { TABLE_R, TABLE_Y, type Vec3 } from '../three/bar/geometry';

const N = 4;
const R = TABLE_R[N];
const POSE: { position: Vec3; target: Vec3 } = { position: [0, 2.35, 4.9], target: [0, -0.35, -0.4] };

export function StudyA() {
  return (
    <>
      <CameraPose position={POSE.position} target={POSE.target} fov={50} />
      <color attach="background" args={[SCENE.background]} />
      <fog attach="fog" args={[SCENE.fog, 6, 15]} />
      <hemisphereLight args={[SCENE.hemiSky, SCENE.hemiGround, 0.9]} />
      <pointLight position={[-2.5, 2.2, -2]} color={SCENE.fill} intensity={6} distance={9} decay={1.4} />
      <pointLight position={[0, 2.2, 2.6]} color={SCENE.lamp} intensity={4} distance={6} decay={1.5} />
      <Room />
      <Ceiling />
      <Lamp intensity={34} />
      <Table n={N} R={R} />
      {[0, 1, 2, 3].map((s) => (
        <Chair key={s} seat={s} n={N} R={R} />
      ))}
      <Person seat={1} n={N} R={R} name="Coca" cards={3} />
      <Person seat={2} n={N} R={R} name="Cacho" expr="wink" cards={3} />
      <Person seat={3} n={N} R={R} name="Tito" cards={3} />
      <Card id="4C" burned position={[0.02, TABLE_Y + 0.004, 0.22]} rotation={tiltUp(0.3)} />
    </>
  );
}
