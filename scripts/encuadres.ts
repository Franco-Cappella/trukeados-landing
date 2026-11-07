// Dónde cae cada cosa del bar en la pantalla, para cada sección y cada tamaño, sin renderizar: sirve para
// ajustar las cámaras de src/content/site.ts antes de sacar capturas.
// Uso: node scripts/encuadres.ts [id de sección]   (Node 23.6+ ejecuta TypeScript directo)
// Marca "texto" si el punto cae debajo del texto y "fuera" si queda fuera del cuadro.
import { PerspectiveCamera, Vector3 } from 'three';
import { lens, site, type SceneFx, type Shot, type Vec3 } from '../src/content/site.ts';
import { FACE_Y, PERSON_OUT, PLAY_R, TABLE_R, TABLE_Y, seatDir } from '../src/three/bar/geometry.ts';

const SCREENS = [
  { name: '1440x900', w: 1440, h: 900 },
  { name: '768x1024', w: 768, h: 1024 },
  { name: '390x844', w: 390, h: 844 },
];

/** En vertical, dónde empieza el panel de texto de cada sección (% del alto, desde arriba). */
const PANEL_TOP: Record<string, number> = {
  inicio: 55,
  'a-ciegas': 66,
  senas: 57,
  mirada: 65,
  trampa: 62,
  mesas: 65,
  sentate: 50,
};

const only = process.argv[2];

const fxAfter = (i: number) =>
  site.sections
    .slice(0, i + 1)
    .reduce<Partial<SceneFx>>((acc, s) => ({ ...acc, ...s.fxIn, ...s.fx }), {});

function points(i: number): [string, Vec3][] {
  const n = (fxAfter(i).six ?? 0) > 0.5 ? 6 : 4;
  const R = TABLE_R[n];
  const out: [string, Vec3][] = [];
  for (let s = 1; s < n; s++) {
    const [dx, , dz] = seatDir(s, n);
    out.push([`cara${s}`, [dx * (R + PERSON_OUT), FACE_Y, dz * (R + PERSON_OUT)]]);
  }
  const rv = (R + 0.1) / Math.cos(Math.PI / n);
  for (let k = 0; k < n; k++) {
    const a = (k * Math.PI * 2) / n + Math.PI / n;
    out.push([`mesa${k}`, [Math.sin(a) * rv, TABLE_Y, Math.cos(a) * rv]]);
  }
  out.push(['silla0', [0, 1.1, R + 0.5]]);
  out.push(['lampara', [0, 2.62, 0]]);
  out.push(['cartas', [0, TABLE_Y, R * PLAY_R]]);
  return out;
}

const cam = new PerspectiveCamera();
const v = new Vector3();

for (const [i, s] of site.sections.entries()) {
  if (only && s.id !== only) continue;
  console.log(`\n## ${s.id}`);
  for (const sc of SCREENS) {
    const portrait = sc.h > sc.w;
    const shot: Shot = portrait ? s.cameraPortrait : s.camera;
    const L = portrait ? lens.portrait : lens.landscape;
    const fov = shot.fov ?? L.fov;
    const [fx, fy] = shot.frame ?? L.frame;
    cam.fov = fov;
    cam.near = 0.02;
    cam.far = 60;
    cam.position.set(...shot.position);
    cam.lookAt(...shot.target);
    cam.setViewOffset(sc.w, sc.h, -fx * sc.w, fy * sc.h, sc.w, sc.h);
    cam.updateMatrixWorld();
    const dist = cam.position.distanceTo(v.set(...shot.target));
    // Zona del texto: en horizontal, la columna izquierda (inicio y sentate, abajo); en vertical, abajo, desde
    // donde empieza el panel de cada sección (medido en las capturas de 390 x 844).
    const underText = (x: number, y: number) =>
      portrait ? y > (PANEL_TOP[s.id] ?? 50) : s.id === 'inicio' ? y > 58 : s.id === 'sentate' ? y > 69 : x < 49;
    const row = points(i).map(([name, p]) => {
      v.set(...p).project(cam);
      const x = Math.round(((v.x + 1) / 2) * 100);
      const y = Math.round(((1 - v.y) / 2) * 100);
      const off = v.z > 1 || x < 0 || x > 100 || y < 0 || y > 100;
      const tag = off ? ' fuera' : underText(x, y) ? ' texto' : '';
      return `${name} ${x},${y}${tag}`;
    });
    console.log(`${sc.name.padEnd(9)} fov ${fov}, a ${dist.toFixed(2)} m · ${row.join(' · ')}`);
  }
}
