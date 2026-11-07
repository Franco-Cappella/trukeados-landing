// La trampa: tus dos cartas encimadas en el paño. Caen cuando llegás a la sección (fx.played) y, con el
// texto fijo, la de arriba se levanta, se quema y deja ver la de abajo, que es la que juega (fx.burn).
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, DoubleSide, type Group, type MeshLambertMaterial, SRGBColorSpace, type Texture } from 'three';
import { CARD } from '../../game/theme.js';
import { rig } from '../../scroll/rig';
import { CARD_H, CARD_W, PLAY_R, TABLE_CARD, TABLE_R, TABLE_Y } from '../bar/geometry';
import { charredTexture } from '../bar/textures';

const KW = CARD_W * TABLE_CARD;
const KH = CARD_H * TABLE_CARD;
const WHITE = new Color('#ffffff');
const BURNT = new Color(CARD.burnTint);

function useCard(file: string) {
  const t = useTexture(`/cards/${file}.webp`) as Texture;
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function TrickCards() {
  const bottomFront = useCard('7O'); // la de abajo: juega
  const topFront = useCard('4C'); // la de arriba: queda quemada
  const back = useCard('back');
  const burn = useMemo(() => charredTexture(), []);
  const all = useRef<Group>(null);
  const bottom = useRef<Group>(null);
  const top = useRef<Group>(null);
  const topMat = useRef<MeshLambertMaterial>(null);
  const topBackMat = useRef<MeshLambertMaterial>(null);
  const burnMat = useRef<MeshLambertMaterial>(null);

  useFrame(() => {
    const { played: p, burn: b, six } = rig.fx;
    if (!all.current || !bottom.current || !top.current) return;
    all.current.visible = p > 0.01;
    if (!all.current.visible) return;
    const kz = MathLerp(TABLE_R[4], TABLE_R[6], six) * PLAY_R;
    const drop = (1 - p) * 0.4; // caen desde arriba y se asientan
    bottom.current.position.set(0, TABLE_Y + 0.002 + drop, kz);
    bottom.current.rotation.set(-Math.PI / 2, 0.04, 0, 'YXZ');
    // Encimada casi alineada (como tablePoses del juego); al quemarse se levanta, se corre y se inclina.
    top.current.position.set(
      0.004 + 0.09 * b,
      TABLE_Y + 0.005 + drop * 1.15 + 0.05 * b + 0.05 * Math.sin(Math.PI * b),
      kz - 0.003 - 0.06 * b,
    );
    top.current.rotation.set(-Math.PI / 2 + 0.3 * b, 0.06 - 0.3 * b, 0.18 * b, 'YXZ');
    topMat.current?.color.copy(WHITE).lerp(BURNT, b);
    topBackMat.current?.color.copy(WHITE).lerp(BURNT, b);
    if (burnMat.current) burnMat.current.opacity = b;
  });

  return (
    <group ref={all} visible={false}>
      <group ref={bottom}>
        <mesh position={[0, 0, 0.0003]}>
          <planeGeometry args={[KW, KH]} />
          <meshLambertMaterial map={bottomFront} alphaTest={0.5} />
        </mesh>
        <mesh position={[0, 0, -0.0003]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[KW, KH]} />
          <meshLambertMaterial map={back} alphaTest={0.5} />
        </mesh>
      </group>
      <group ref={top}>
        <mesh position={[0, 0, 0.0003]}>
          <planeGeometry args={[KW, KH]} />
          <meshLambertMaterial ref={topMat} map={topFront} alphaTest={0.5} />
        </mesh>
        <mesh position={[0, 0, -0.0003]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[KW, KH]} />
          <meshLambertMaterial ref={topBackMat} map={back} alphaTest={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.0007]}>
          <planeGeometry args={[KW, KH]} />
          <meshLambertMaterial ref={burnMat} map={burn} transparent opacity={0} depthWrite={false} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

const MathLerp = (a: number, b: number, t: number) => a + (b - a) * t;
