// Estudio B · Desde arriba. Sin sala ni lámpara: el paño como tablero, las cuatro grandes sobre la mesa,
// y las caras de los jugadores como fichas en su asiento. Es el más gráfico y el más legible.
import { BG } from '../three/bar/palette';
import { CameraPose, Card, FaceToken, Table, tiltUp } from '../three/bar/Bar';
import { TABLE_R, TABLE_Y, type Vec3 } from '../three/bar/geometry';

const N = 4;
const R = TABLE_R[N];
// La cámara se corre a la izquierda para que la mesa quede en la mitad derecha y el texto sobre fondo liso.
const POSE: { position: Vec3; target: Vec3 } = { position: [-0.78, 4.1, 0.6], target: [-0.78, 0.74, 0] };

export function StudyB() {
  return (
    <>
      <CameraPose position={POSE.position} target={POSE.target} fov={40} />
      <color attach="background" args={[BG]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[1.5, 4, 1.2]} intensity={1.3} />
      <Table n={N} R={R} />
      <FaceToken seat={1} n={N} R={R} name="Coca" />
      <FaceToken seat={2} n={N} R={R} name="Cacho" expr="wink" />
      <FaceToken seat={3} n={N} R={R} name="Tito" />
      <Card id="1E" position={[-0.11, TABLE_Y + 0.004, 0.22]} rotation={tiltUp(0.08)} />
      <Card id="1B" position={[0.11, TABLE_Y + 0.006, 0.22]} rotation={tiltUp(-0.1)} />
      <Card id="7E" position={[-0.11, TABLE_Y + 0.008, 0.4]} rotation={tiltUp(-0.06)} />
      <Card id="7O" position={[0.11, TABLE_Y + 0.01, 0.4]} rotation={tiltUp(0.1)} />
      <Card id="4C" burned position={[0.36, TABLE_Y + 0.012, 0.3]} rotation={tiltUp(0.4)} />
    </>
  );
}
