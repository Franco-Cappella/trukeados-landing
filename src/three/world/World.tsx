// La escena del recorrido: la mesa en la calle del Barrio Chino del juego (street.ts), con el paño bordó. Todo lo que cambia lee `rig.fx` en un solo useFrame y se muta por ref. La mesa, las sillas y las
// cartas son las de three/bar, con las medidas de scene.js; los personajes son los recortes del juego (cast.ts) y
// el Gato Melón, el personaje 3D de la tienda (gato.ts).
import { useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import {
  DoubleSide,
  type Group,
  type HemisphereLight,
  MathUtils,
  type Mesh,
  type MeshLambertMaterial,
  type PointLight,
  Vector3,
} from 'three';
import { SENAS } from '../../game/config.js';
import { SCENE } from '../../game/theme.js';
import { site } from '../../content/site';
import { rig } from '../../scroll/rig';
import { useUI } from '../../state/store';
import { ChairModel, Table } from '../bar/Bar';
import { CHAIR_OUT, CHAR_H, CHAR_W, PERSON_OUT, TABLE_R, seatAngle } from '../bar/geometry';
import { castConfig, createActor, redraw, updatePose, type Gaze } from './cast';
import { TrickCards } from './TrickCards';
import { gatoPlate, loadGato, poseGato, type Gato } from './gato';
import { buildStreet, panoTexture } from './street';

const { clamp, lerp, smoothstep } = MathUtils;
const R4 = TABLE_R[4];
const R6 = TABLE_R[6];
const SENA_EXPR = Object.values(SENAS).map((s) => (s as { expr: string }).expr);

/** Quién está en la mesa (los mismos nombres que los textos alternativos de content/site.ts). `seat` fija la
 *  cara; a4/a6: ángulo en la mesa de cuatro (null si no está) y de seis; team: 0 es tu equipo (azul), 1 el otro. */
const CAST = [
  { name: 'Gato Melón', seat: 1, a4: seatAngle(1, 4), a6: seatAngle(1, 6), scale: 1, team: 1 }, // a tu derecha, en 3D (gato.ts)
  { name: 'Cacho', seat: 2, a4: seatAngle(2, 4), a6: seatAngle(3, 6), scale: 2, team: 0 }, // enfrente, tu compañero: el del primer plano
  { name: 'Tito', seat: 3, a4: seatAngle(3, 4), a6: seatAngle(5, 6), scale: 1, team: 1 }, // a tu izquierda, compañero de Coca
  { name: 'Mirta', seat: 2, a4: null, a6: seatAngle(2, 6), scale: 1, team: 0 }, // llegan con la mesa de seis
  { name: 'Chacho', seat: 4, a4: null, a6: seatAngle(4, 6), scale: 1, team: 1 },
] as const;
const GATO = 0;
const CACHO = 1;
const TITO = 2;
const PLATES = [GATO, CACHO, TITO]; // los que te miran al final
const PLATE_Y = 1.74; // la placa, apenas arriba de la cabeza (la cabeza dibujada termina en ~1,65 m)
// La placa se ubica por su centro: arriba, la barra (hasta 64 px), 8 px de aire y la mitad de la placa (unos 15 px).
const PLATE_MARGIN = { x: 76, top: 88, bottom: 24 }; // la placa nunca se sale de la pantalla ni queda bajo la barra
const plateAt = new Vector3();

/** Las placas son HTML sobre el canvas (como en el juego): se crean a mano dentro del escenario y se ubican en
 *  cada cuadro. Siempre dentro de la pantalla: desde tu silla, Coca y Tito quedan en los bordes (y en celular,
 *  fuera del cuadro) y su placa igual tiene que verse. */
function createPlates(host: Element) {
  return PLATES.map((who) => {
    const el = document.createElement('div');
    el.className = `placa placa--t${CAST[who].team}`;
    const chip = document.createElement('span');
    chip.className = 'placa__chip';
    chip.textContent = site.teMira;
    el.append(CAST[who].name, chip);
    el.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;opacity:0';
    host.append(el);
    return el;
  });
}

export function World() {
  const tier = useUI((s) => s.tier);
  useEffect(() => {
    castConfig.budget = tier === 'low' ? 1 : 2;
  }, [tier]);
  const actors = useMemo(() => CAST.map((c) => createActor(c.name, c.seat, c.scale)), []);
  const gazes = useMemo<Gaze[]>(() => CAST.map(() => ({ at: null, atWeight: 0, camWeight: 0, expr: 'neutral' })), []);
  const needs = useMemo(() => CAST.map(() => false), []);
  const people = useRef<(Mesh | null)[]>([]);
  const mats = useRef<(MeshLambertMaterial | null)[]>([]);
  const chairs = useRef<(Group | null)[]>([]);
  const myChair = useRef<Group>(null);
  const table4 = useRef<Group>(null);
  const table6 = useRef<Group>(null);
  const hemi = useRef<HemisphereLight>(null);
  const fill = useRef<PointLight>(null);
  const front = useRef<PointLight>(null);
  const key = useRef<PointLight>(null);
  const plates = useRef<HTMLDivElement[]>([]);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const host = gl.domElement.closest('.stage') ?? gl.domElement.parentElement;
    if (!host) return;
    const els = createPlates(host);
    plates.current = els;
    return () => els.forEach((el) => el.remove());
  }, [gl]);
  const cam = useMemo(() => new Vector3(), []);
  const street = useMemo(() => buildStreet(), []);
  const felt = useMemo(() => panoTexture(), []);
  const gatoHost = useRef<Group>(null);
  const gato = useRef<Gato | null>(null);
  useEffect(() => {
    let alive = true;
    loadGato()
      .then((g) => {
        if (!alive || !gatoHost.current) return;
        gato.current = g;
        gatoHost.current.add(g.rig.root);
      })
      .catch((e) => console.warn('Gato Melón', e));
    return () => {
      alive = false;
      gato.current?.rig.dispose();
      gato.current = null;
    };
  }, []);

  useFrame((state, delta) => {
    const fx = rig.fx;
    const dt = Math.min(delta, 0.1);
    cam.copy(state.camera.position);
    street.update?.(performance.now(), dt);

    // Mesa: de cuatro a seis lugares. Cambia de forma a mitad de camino, con un pulso que lo hace notar.
    const six = fx.six;
    const R = lerp(R4, R6, six);
    const pulse = 1 - 0.1 * Math.sin(Math.PI * six);
    if (table4.current && table6.current) {
      table4.current.visible = six < 0.5;
      table6.current.visible = six >= 0.5;
      table4.current.scale.set(pulse, 1, pulse);
      table6.current.scale.set(pulse, 1, pulse);
    }
    myChair.current?.position.set(0, 0, R + CHAIR_OUT);

    // Lugares: cada uno se corre al suyo en la mesa de seis; los dos nuevos aparecen.
    CAST.forEach((c, i) => {
      const a = c.a4 === null ? c.a6 : lerp(c.a4, c.a6, six);
      const s = c.a4 === null ? smoothstep(six, 0.35, 1) : 1;
      const p = people.current[i];
      const ch = chairs.current[i];
      actors[i].pos.set(Math.sin(a) * (R + PERSON_OUT), CHAR_H / 2, Math.cos(a) * (R + PERSON_OUT));
      if (p) {
        p.position.copy(actors[i].pos);
        p.rotation.y = Math.atan2(cam.x - p.position.x, cam.z - p.position.z); // billboard, como el juego
        p.scale.setScalar(Math.max(s, 0.001));
        p.visible = s > 0.01 && i !== GATO; // el del gato es 3D: su recorte no se ve
      }
      if (ch) {
        ch.position.set(Math.sin(a) * (R + CHAIR_OUT), 0, Math.cos(a) * (R + CHAIR_OUT));
        ch.rotation.y = a;
        ch.scale.setScalar(Math.max(s, 0.001));
        ch.visible = s > 0.01;
      }
    });

    // Miradas y caras:
    // - señas: Cacho, tu compañero, te mira y pasa por las 11 señas;
    // - mirada: Coca y Tito se miran y Tito le hace una seña; Cacho mira la mesa y no la ve;
    // - sentado: los tres te miran.
    const senaIdx = Math.min(SENA_EXPR.length - 1, Math.floor(fx.sena * SENA_EXPR.length));
    gazes.forEach((g) => {
      g.at = null;
      g.atWeight = 0;
      g.camWeight = fx.seated;
      g.expr = 'neutral';
    });
    gazes[CACHO].camWeight = Math.max(fx.closeup, fx.seated);
    gazes[CACHO].expr = fx.closeup > 0.5 ? SENA_EXPR[senaIdx] : 'neutral';
    gazes[GATO].at = actors[TITO].pos;
    gazes[GATO].atWeight = fx.gaze;
    gazes[TITO].at = actors[GATO].pos;
    gazes[TITO].atWeight = fx.gaze;
    gazes[TITO].expr = fx.gaze > 0.6 ? 'wink' : 'neutral';

    const g = gato.current;
    if (g) {
      const a = lerp(CAST[GATO].a4, CAST[GATO].a6, six);
      // de entrada te mira de reojo (es un gato); en "mirada" mira a Tito; sentado, te mira de frente
      const tito = fx.gaze > 0.01 && fx.seated < 0.01;
      const w = tito ? fx.gaze : Math.max(0.4, fx.seated);
      poseGato(g, a, R, tito ? actors[TITO].pos : cam, w, dt, state.clock.elapsedTime * 1000);
      g.mats.forEach((m) => m.color.setScalar(lerp(1, 0.3, fx.dim)));
    }

    actors.forEach((a, i) => {
      needs[i] = (people.current[i]?.visible ?? false) && updatePose(a, cam, gazes[i], dt);
      // A ciegas: las caras quedan en sombra. En el primer plano, la de Cacho vuelve a la luz.
      const shadow = fx.dim * (1 - (i === CACHO ? fx.closeup : 0));
      const m = mats.current[i];
      m?.color.setScalar(lerp(1, 0.26, shadow));
      // Un piso de luz propia: los recortes miran a la cámara y la lámpara suele quedarles detrás.
      m?.emissive.setScalar(0.2 * (1 - shadow));
    });
    redraw(actors, needs);

    // Sentado: aparecen las placas de nombre del juego con "te mira" en oro. Es el instante dorado.
    const plate = smoothstep(fx.seated, 0.55, 0.95);
    const { width: w, height: h } = state.size;
    PLATES.forEach((who, k) => {
      const el = plates.current[k];
      if (!el) return;
      if (who === GATO && g) gatoPlate(g, plateAt);
      else plateAt.set(actors[who].pos.x, PLATE_Y, actors[who].pos.z);
      plateAt.project(state.camera);
      const show = plate > 0.01 && plateAt.z < 1; // z > 1: detrás de la cámara
      el.style.visibility = show ? 'visible' : 'hidden';
      if (!show) return;
      const x = clamp((plateAt.x + 1) * (w / 2), PLATE_MARGIN.x, w - PLATE_MARGIN.x);
      const y = clamp((1 - plateAt.y) * (h / 2), PLATE_MARGIN.top, h - PLATE_MARGIN.bottom);
      el.style.opacity = String(plate);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    });

    // Luz: a ciegas baja todo menos la lámpara sobre el paño; en el primer plano, una luz cálida en la cara.
    if (hemi.current) hemi.current.intensity = lerp(0.35, 0.1, fx.dim);
    for (const { light, base } of street.lights) light.intensity = base * lerp(1, 0.2, fx.dim);
    if (fill.current) fill.current.intensity = lerp(6, 1.2, fx.dim);
    if (front.current) front.current.intensity = lerp(4, 0.8, fx.dim);
    if (key.current) key.current.intensity = 6 * fx.closeup;
  });

  return (
    <group>
      <color attach="background" args={[street.background]} />
      <fog attach="fog" args={street.fog} />
      <hemisphereLight ref={hemi} args={[SCENE.hemiSky, SCENE.hemiGround, 0.35]} />
      <pointLight ref={fill} position={[-2.5, 2.2, -2]} color={SCENE.fill} intensity={6} distance={9} decay={1.4} />
      <pointLight ref={front} position={[0, 2.2, 2.6]} color={SCENE.lamp} intensity={4} distance={6} decay={1.5} />
      <pointLight ref={key} position={[0.35, 1.75, -0.3]} color={SCENE.lamp} intensity={0} distance={2.4} decay={1.5} />
      <primitive object={street.group} />

      <group ref={table4}>
        <Table n={4} R={R4} felt={felt} />
      </group>
      <group ref={table6} visible={false}>
        <Table n={6} R={R6} felt={felt} />
      </group>

      {/* tu silla, vacía hasta que te sentás */}
      <group ref={myChair}>
        <ChairModel />
      </group>
      {CAST.map((c, i) => (
        <group key={`silla-${c.name}`} ref={(el) => void (chairs.current[i] = el)}>
          <ChairModel />
        </group>
      ))}

      {CAST.map((c, i) => (
        <mesh key={c.name} ref={(el) => void (people.current[i] = el)}>
          <planeGeometry args={[CHAR_W, CHAR_H]} />
          <meshLambertMaterial
            ref={(el) => void (mats.current[i] = el)}
            map={actors[i].texture}
            emissiveMap={actors[i].texture}
            alphaTest={0.5}
            side={DoubleSide}
          />
        </mesh>
      ))}

      <group ref={gatoHost} />

      <Suspense fallback={null}>
        <TrickCards />
      </Suspense>
    </group>
  );
}
