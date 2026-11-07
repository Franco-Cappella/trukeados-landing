import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { drawCharacter, lookFor, W, H } from '../../game/characters.js';
import { CARD, SCENE } from '../../game/theme.js';

// La misma familia que FONT de theme.js, con el nombre con que la registra fontsource (autoalojada).
export const CANVAS_FONT = "'Archivo Variable', 'Archivo', system-ui, sans-serif";

/** Textura de canvas con el espacio de color correcto. Crearla con useMemo, una vez por componente. */
export function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number],
) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, count: number) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
}

/** Paño: verde con trama, círculo central y el nombre (como en el juego, con el nombre de la marca). */
export function feltTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const grd = ctx.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, w / 2);
    grd.addColorStop(0, SCENE.felt[0]);
    grd.addColorStop(0.8, SCENE.felt[1]);
    grd.addColorStop(1, SCENE.felt[2]);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#000';
    for (let y = 0; y < h; y += 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    grain(ctx, w, h, 9000);
    ctx.strokeStyle = SCENE.feltInk;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = SCENE.feltInk;
    ctx.font = `600 46px ${CANVAS_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('Trukeados', w / 2, h / 2 + 14);
  });
}

/** Madera con veta (marco y patas). */
export function woodTexture() {
  return canvasTexture(
    512,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = SCENE.wood;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 46; i++) {
        const y = Math.random() * h;
        ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(30,15,5,0.3)' : 'rgba(140,90,50,0.25)';
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 50 + i) * 4);
        ctx.stroke();
      }
      grain(ctx, w, h, 2000);
    },
    [6, 1],
  );
}

/** Piso de tablas. */
export function floorTexture() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      for (let i = 0; i < 8; i++) {
        const tone = 70 + Math.random() * 30;
        ctx.fillStyle = `rgb(${tone + 40},${tone + 10},${tone - 20})`;
        ctx.fillRect(0, (i * h) / 8, w, h / 8);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0, (i * h) / 8, w, 2);
        ctx.fillRect(Math.random() * w, (i * h) / 8, 2, h / 8);
      }
      grain(ctx, w, h, 6000);
    },
    [6, 6],
  );
}

/** Paredes con zócalo, como en el juego. */
export function wallTexture() {
  return canvasTexture(
    256,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = SCENE.wall;
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) {
        ctx.fillStyle = x % 64 ? 'rgba(255,220,180,0.05)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(x, 0, 32, h * 0.7);
      }
      ctx.fillStyle = SCENE.wallBase;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
      ctx.fillStyle = SCENE.wallTrim;
      ctx.fillRect(0, h * 0.7, w, 6);
      grain(ctx, w, h, 4000);
    },
    [10, 1],
  );
}

/** Cuadros de la pared (los mismos cuatro del juego). */
export function pictureTexture(text: string, bg: string, fg: string) {
  return canvasTexture(256, 192, (ctx, w, h) => {
    ctx.fillStyle = SCENE.frame;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = fg;
    ctx.font = `700 28px ${CANVAS_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h / 2 + 10);
  });
}

/** Carta quemada: bordes carbonizados y manchas fijas (las mismas en todas las vistas). */
export function burnTexture() {
  return canvasTexture(128, 197, (ctx, w, h) => {
    const edge = ctx.createRadialGradient(64, 98, 30, 64, 98, 112);
    edge.addColorStop(0, 'rgba(0,0,0,0)');
    edge.addColorStop(0.55, CARD.burnEmber);
    edge.addColorStop(0.75, CARD.burnChar);
    edge.addColorStop(1, CARD.burnChar);
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);
    for (const [x, y, rad] of [[20, 30, 22], [110, 60, 18], [96, 170, 26], [30, 150, 16], [70, 12, 14]]) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, rad);
      g.addColorStop(0, CARD.burnChar);
      g.addColorStop(0.7, CARD.burnEmber);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Personaje entero dibujado con el código del juego (characters.js). */
export function characterTexture(name: string, seat: number, state: Record<string, unknown>) {
  const look = lookFor(name, seat);
  return canvasTexture(W, H, (ctx) => {
    drawCharacter(ctx, look, state);
  });
}

// Recorte de la cara en el lienzo de 512 x 1200 (el mismo que usa el juego para el menú de señas).
const FACE = { x: 106, y: 100, size: 300 };

/** Solo la cara, recortada en círculo: la "ficha" que se ve desde arriba. */
export function faceTexture(name: string, seat: number, expr: string) {
  const look = lookFor(name, seat);
  const full = document.createElement('canvas');
  full.width = W;
  full.height = H;
  drawCharacter(full.getContext('2d')!, look, { expr, cards: 0 });
  return canvasTexture(256, 256, (ctx) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#262626';
    ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(full, FACE.x, FACE.y, FACE.size, FACE.size, 0, 0, 256, 256);
    ctx.restore();
  });
}
