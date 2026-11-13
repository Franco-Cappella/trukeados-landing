// Capturas con Chrome o Edge reales (WebGL por SwiftShader, funciona sin GPU).
// Uso: `npm run build && npm run preview` en otra terminal, y después `npm run capture -- <set>`.
//   sets: landing (escritorio, celular, secciones y versión sin 3D)
//         director (cada sección al final de su tramo en 1440, 768 y 390, y la prueba de ida, vuelta y saltos:
//         el estado de la escena tiene que coincidir con el esperado en cada sección)
//         posters (la escena de cada sección sin el texto, en WebP: los pósters de la versión sin 3D)
//         og (la imagen para compartir, 1200 x 630, y el ícono de iOS, 180 x 180, en public/)
// Opcional: BASE=<url> (por defecto http://localhost:4173) y CHROME=<ruta al ejecutable>.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs');
const base = process.env.BASE ?? 'http://localhost:4173';
const PORT = 9341;

const SETS = {
  landing: [
    { path: '/', file: 'capturas/escritorio-inicio.png' },
    { path: '/', file: 'capturas/escritorio-senas.png', section: 'senas' },
    { path: '/', file: 'capturas/escritorio-sentate.png', section: 'sentate' },
    { path: '/', file: 'capturas/celular-inicio.png', w: 390, h: 844, mobile: true },
    { path: '/', file: 'capturas/celular-senas.png', w: 390, h: 844, mobile: true, section: 'senas' },
    { path: '/', file: 'capturas/acostado-senas.png', w: 844, h: 390, mobile: true, section: 'senas' },
    { path: '/', file: 'capturas/acostado-sentate.png', w: 844, h: 390, mobile: true, section: 'sentate' },
    { path: '/?sin3d', file: 'capturas/sin3d-escritorio.png', full: true },
  ],
};

const VIEWPORTS = [
  { name: 'escritorio', w: 1440, h: 900 },
  { name: 'tablet', w: 768, h: 1024, mobile: true },
  { name: 'celular', w: 390, h: 844, mobile: true },
];

const set = process.argv[2] ?? 'landing';
const shots = ['director', 'posters', 'og'].includes(set) ? [] : SETS[set];
if (!shots) throw new Error(`Set desconocido: ${set}. Opciones: ${Object.keys(SETS).join(', ')}`);

const chromePath = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && fs.existsSync(p));
if (!chromePath) throw new Error('No encuentro Chrome ni Edge. Definí CHROME=<ruta al ejecutable>.');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Hoja de contacto: todas las capturas de un tamaño en una sola imagen, para revisar el recorrido de un vistazo.
async function contactSheet(vp, files) {
  const wide = vp.w > vp.h;
  const cols = wide ? 3 : 4;
  const tw = wide ? 480 : 240;
  const th = Math.round((tw * vp.h) / vp.w);
  const rows = Math.ceil(files.length / cols);
  const html = `<body style="margin:0;background:#000;display:grid;gap:4px;grid-template-columns:repeat(${cols},${tw}px)">${files
    .map((f) => `<img src="${pathToFileURL(f).href}" style="display:block;width:${tw}px;height:${th}px">`)
    .join('')}</body>`;
  const page = path.join(profile, 'hoja.html');
  fs.writeFileSync(page, html);
  await send('Emulation.setDeviceMetricsOverride', { width: cols * tw + (cols - 1) * 4, height: rows * th + (rows - 1) * 4, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(page).href });
  await sleep(1200);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'capturas', 'director', `hoja-${vp.name}.png`), Buffer.from(r.result.data, 'base64'));
}

// Pósters de la versión sin 3D: la escena de cada sección al final de su tramo, sin el texto ni la barra.
async function posters() {
  const dir = path.join(root, 'public', 'posters');
  fs.mkdirSync(dir, { recursive: true });
  errors.length = 0;
  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base + '/?debug' });
  await sleep(8000);
  await evaluate(`document.head.insertAdjacentHTML('beforeend', '<style>main, .nav, footer, .debug-hud { visibility: hidden !important; }</style>')`);
  // En qué punto de la estadía se saca cada póster (1 = al final). Las señas, en el guiño (la segunda de 11),
  // que es lo que dice su texto alternativo.
  const AT = { senas: 0.136 };
  const ends = await evaluate(`[...document.querySelectorAll('[data-section]')].map((el) => {
    const top = el.getBoundingClientRect().top + scrollY;
    return { id: el.id, top: Math.round(top), stay: el.offsetHeight - innerHeight };
  })`);
  for (const s of ends) {
    await evaluate(`scrollTo(0, ${Math.round(s.top + s.stay * (AT[s.id] ?? 1))})`);
    await sleep(500);
    // El póster va solo, debajo del texto: el tema al centro, no corrido para dejar lugar al texto. Se toca el
    // encuadre a mano (solo en esta herramienta) y se espera a que la cámara se acomode.
    await evaluate('Object.assign(window.__rig.cam, { ox: 0, oy: 0 })');
    await sleep(2800);
    const r = await send('Page.captureScreenshot', { format: 'webp', quality: 72 });
    const file = path.join(dir, `${s.id}.webp`);
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    console.log(`posters/${s.id}.webp · ${Math.round(fs.statSync(file).size / 1024)} KB`);
  }
  console.log(errors.length ? `errores: ${errors.slice(0, 3).join(' | ')}` : 'sin errores');
}

// La imagen para compartir (Open Graph): la primera pantalla tal cual, con el título y el botón. Y el ícono
// de inicio de iOS, que no acepta SVG: el favicon del juego (ya trae el fondo de la marca, sin esquinas).
async function og() {
  errors.length = 0;
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base + '/' });
  await stageReady();
  let r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  const file = path.join(root, 'public', 'og.jpg');
  fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  console.log(`og.jpg · ${Math.round(fs.statSync(file).size / 1024)} KB`);

  await send('Emulation.setDeviceMetricsOverride', { width: 180, height: 180, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base + '/favicon.svg' });
  await sleep(800);
  await evaluate(`document.documentElement.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#0a0a0a';
    const svg = document.querySelector('svg'); svg.setAttribute('width', 180); svg.setAttribute('height', 180);
    svg.querySelector('rect').removeAttribute('rx')`);
  await sleep(300);
  r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon.png'), Buffer.from(r.result.data, 'base64'));
  console.log('apple-touch-icon.png', errors.length ? `· errores: ${errors.slice(0, 3).join(' | ')}` : '· sin errores');
}

// Recorre las secciones con ?debug: captura cada una al final de su tramo y compara window.__rig con
// window.__expected(i). Después vuelve hacia atrás y salta, y compara de nuevo: así se prueba la reversibilidad.
async function director() {
  let fails = 0;
  for (const vp of VIEWPORTS) {
    errors.length = 0;
    await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: !!vp.mobile });
    await send('Page.navigate', { url: base + '/?debug' });
    await sleep(8000);
    const ends = await evaluate(`[...document.querySelectorAll('[data-section]')].map((el) => {
      const top = el.getBoundingClientRect().top + scrollY;
      return { id: el.id, end: Math.round(top + el.offsetHeight - innerHeight), mid: Math.round(top + (el.offsetHeight - innerHeight) / 2) };
    })`);
    // Espera a que el estado se asiente (hasta 2,5 s): con WebGL por software un cuadro puede tardar más que la
    // espera fija. Si después de eso no coincide, es un error de verdad.
    const check = async (i, tag) => {
      const bad = await evaluate(`(async () => {
        let out = [];
        for (let t = 0; t < 2500; t += 125) {
          const r = window.__rig, e = window.__expected(${i});
          out = [];
          for (const [k, v] of Object.entries(e.cam)) if (Math.abs(r.cam[k] - v) > 0.005) out.push('cam.' + k + ' ' + r.cam[k].toFixed(3) + '≠' + v.toFixed(3));
          for (const [k, v] of Object.entries(e.fx)) if (Math.abs(r.fx[k] - v) > 0.005) out.push('fx.' + k + ' ' + r.fx[k].toFixed(3) + '≠' + v.toFixed(3));
          if (!out.length) break;
          await new Promise((res) => setTimeout(res, 125));
        }
        return out;
      })()`);
      if (bad.length) {
        fails++;
        console.log(`  ✗ ${vp.name} ${tag} ${ends[i].id}: ${bad.join(', ')}`);
      }
    };
    const files = [];
    const cost = { calls: 0, tris: 0 };
    // Ida: captura y prueba cada sección.
    for (const [i, s] of ends.entries()) {
      await evaluate(`scrollTo(0, ${s.end})`);
      await sleep(2600);
      await check(i, 'ida');
      const info = await evaluate('window.__gl ? { calls: __gl.info.render.calls, tris: __gl.info.render.triangles } : null');
      if (info) {
        cost.calls = Math.max(cost.calls, info.calls);
        cost.tris = Math.max(cost.tris, info.tris);
      }
      const r = await send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(outDir, 'capturas', 'director', `${vp.name}-${i + 1}-${s.id}.png`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      files.push(file);
    }
    // A mitad de las señas: la cara va por la seña del medio.
    const senas = ends.findIndex((s) => s.id === 'senas');
    if (senas >= 0) {
      await evaluate(`scrollTo(0, ${ends[senas].mid})`);
      await sleep(2600);
      const r = await send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(outDir, 'capturas', 'director', `${vp.name}-3-senas-mitad.png`);
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      files.splice(senas + 1, 0, file);
    }
    // Vuelta: de la última a la primera.
    for (let i = ends.length - 1; i >= 0; i--) {
      await evaluate(`scrollTo(0, ${ends[i].end})`);
      await sleep(250);
      await check(i, 'vuelta');
    }
    // Saltos: al fondo, arriba de golpe, y al medio.
    await evaluate('scrollTo(0, document.documentElement.scrollHeight)');
    await sleep(300);
    await evaluate('scrollTo(0, 0)');
    await sleep(300);
    await check(0, 'salto arriba');
    const mid = Math.floor(ends.length / 2);
    await evaluate(`scrollTo(0, ${ends[mid].end})`);
    await sleep(300);
    await check(mid, 'salto al medio');
    console.log(`director ${vp.name}: ${ends.length} secciones · máx. ${cost.calls} draw calls y ${Math.round(cost.tris / 1000)} k triángulos`, errors.length ? `· errores: ${errors.slice(0, 3).join(' | ')}` : '· sin errores');
    await contactSheet(vp, files);
  }
  // Costo de redibujar los personajes con la CPU 4 veces más lenta (como un celular medio), scrolleando de
  // punta a punta como lo haría una persona.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: base + '/?debug' });
  await sleep(8000);
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const cast = await evaluate(`(async () => {
    Object.assign(window.__cast, { draws: 0, ms: 0, max: 0, hi: { draws: 0, ms: 0, max: 0 } });
    const t0 = performance.now();
    let frames = 0;
    const total = document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= total; y += 24) {
      scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => r()));
      frames++;
    }
    const c = window.__cast;
    return { draws: c.draws, avg: c.draws ? c.ms / c.draws : 0, max: c.max, frames, secs: (performance.now() - t0) / 1000,
      hi: { draws: c.hi.draws, avg: c.hi.draws ? c.hi.ms / c.hi.draws : 0, max: c.hi.max } };
  })()`);
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log(`redibujos (CPU x4, 390 x 844): ${cast.draws} en ${cast.frames} cuadros · promedio ${cast.avg.toFixed(1)} ms · máximo ${cast.max.toFixed(1)} ms · de alta resolución: ${cast.hi.draws}, promedio ${cast.hi.avg.toFixed(1)} ms, máximo ${cast.hi.max.toFixed(1)} ms`);

  // Movimiento reducido: la cámara salta de sección en sección (canvas a pedido) y cada estado es el final.
  errors.length = 0;
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: base + '/?debug' });
  await stageReady();
  const reduced = await evaluate(`(async () => {
    const out = [];
    const secs = [...document.querySelectorAll('[data-section]')];
    for (const [i, el] of secs.entries()) {
      const top = el.getBoundingClientRect().top + scrollY;
      scrollTo(0, Math.round(top + el.offsetHeight - innerHeight));
      await new Promise((r) => setTimeout(r, 400));
      const r = window.__rig, e = window.__expected(i);
      for (const [k, v] of Object.entries(e.cam)) if (Math.abs(r.cam[k] - v) > 0.005) out.push(el.id + ' cam.' + k);
      for (const [k, v] of Object.entries(e.fx)) if (Math.abs(r.fx[k] - v) > 0.005) out.push(el.id + ' fx.' + k);
      if (!r.snap) out.push(el.id + ' sin snap');
    }
    return out;
  })()`);
  {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'capturas', 'director', 'reducido-escritorio-7-sentate.png'), Buffer.from(r.result.data, 'base64'));
  }
  await send('Emulation.setEmulatedMedia', { features: [] });
  if (reduced.length) fails++;
  console.log('movimiento reducido:', reduced.length ? '✗ ' + reduced.join(', ') : 'cada sección salta a su estado final', errors.length ? `· errores: ${errors.slice(0, 3).join(' | ')}` : '· sin errores');

  // Versión sin 3D: no se monta la escena (ni se baja su paquete).
  errors.length = 0;
  await send('Page.navigate', { url: base + '/?sin3d' });
  await sleep(4000);
  const flat = await evaluate(`({ stage: !!document.querySelector('.stage'), three: performance.getEntriesByType('resource').some((e) => /Experience|textures/.test(e.name)) })`);
  if (flat.stage || flat.three) fails++;
  console.log('sin 3D:', flat.stage || flat.three ? `✗ escena montada: ${JSON.stringify(flat)}` : 'sin escena y sin el paquete 3D', errors.length ? `· errores: ${errors.slice(0, 3).join(' | ')}` : '· sin errores');

  console.log(fails ? `${fails} estados no coinciden` : 'ida, vuelta, saltos, movimiento reducido y sin 3D: todo coincide');
}

// Espera a que la escena esté armada (la calle del Barrio Chino y el Gato Melón tardan): hasta que aparece el
// escenario y 3 segundos más, para que termine de bajar y compilar el gato 3D.
async function stageReady() {
  for (let t = 0; t < 30000; t += 500) {
    if (await evaluate(`!!document.querySelector('.stage[data-listo]')`)) break;
    await sleep(500);
  }
  await sleep(3000);
}

// Espera a que el servidor (npm run preview) responda.
let up = false;
for (let i = 0; i < 120 && !up; i++) {
  try {
    up = (await fetch(base)).ok;
  } catch {
    await sleep(250);
  }
}
if (!up) throw new Error(`No responde ${base}. Corré "npm run build && npm run preview" antes.`);

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'trukeados-'));
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--no-first-run',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let targets;
for (let i = 0; i < 80 && !targets; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  } catch {
    await sleep(250);
  }
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let seq = 0;
const waiting = new Map();
const errors = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && waiting.has(m.id)) {
    waiting.get(m.id)(m);
    waiting.delete(m.id);
    return;
  }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    errors.push(d.exception?.description ?? d.text);
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    errors.push(`${m.params.entry.text} ${m.params.entry.url ?? ''}`.trim());
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++seq;
    waiting.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');

for (const shot of shots) {
  const w = shot.w ?? 1440;
  const h = shot.h ?? 900;
  errors.length = 0;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!shot.mobile });
  await send('Page.navigate', { url: base + shot.path });
  await sleep(shot.wait ?? 6000); // texturas, fuente y primer cuadro

  if (shot.section) {
    // Entra en la parte fija de la sección (un 30 % de pantalla adentro).
    await evaluate(`(() => {
      const el = document.getElementById(${JSON.stringify(shot.section)});
      if (!el) return;
      const top = el.getBoundingClientRect().top + scrollY;
      scrollTo(0, top + Math.max(0, Math.min(el.offsetHeight - innerHeight, innerHeight * 0.3)));
    })()`);
    await sleep(1500);
  }

  const target = path.join(outDir, shot.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (shot.full) {
    // Recorre la página para que carguen las imágenes diferidas (loading="lazy") y vuelve arriba.
    await evaluate(`(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
      scrollTo(0, 0);
    })()`);
    await sleep(1000);
    // Página entera en tramos del alto de la pantalla: archivo-0.png, archivo-1.png…
    const total = await evaluate('document.documentElement.scrollHeight');
    let n = 0;
    for (let y = 0; y < total; y += h, n++) {
      const r = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y, width: w, height: Math.min(h, total - y), scale: 1 },
        captureBeyondViewport: true,
      });
      fs.writeFileSync(target.replace(/\.png$/, `-${n}.png`), Buffer.from(r.result.data, 'base64'));
    }
    console.log(`${shot.file} (${n} tramos, ${total}px)`, errors.length ? `· errores: ${errors.slice(0, 3).join(' | ')}` : '· sin errores');
  } else {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(target, Buffer.from(r.result.data, 'base64'));
    console.log(shot.file, errors.length ? `· errores: ${errors.slice(0, 3).join(' | ')}` : '· sin errores');
  }
}

if (set === 'director') await director();
if (set === 'posters') await posters();
if (set === 'og') await og();

ws.close();
chrome.kill();
await Promise.race([new Promise((r) => chrome.once('exit', r)), sleep(3000)]);
try {
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch {
  // En Windows Chrome puede retener el perfil unos segundos: queda en la carpeta temporal del sistema.
}
process.exit(0);
