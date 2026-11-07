import { useEffect, useRef, type CSSProperties } from 'react';
import { drawCharacter, lookFor, W, H } from '../game/characters.js';

// Recorte de la cara sobre el lienzo de 512 x 1200 (el mismo que usa el juego en el menú de señas y el espejo).
const CROP = { x: 106, y: 100, size: 300 };
let scratch: HTMLCanvasElement | null = null;

/** Cara de un personaje dibujada con el código del juego. Canvas 2D: no usa three.
 *  `size` es la resolución; el tamaño en pantalla lo puede cambiar el CSS con --face-size. */
export function FaceCanvas({
  name,
  seat,
  expr = 'neutral',
  size,
  label,
}: {
  name: string;
  seat: number;
  expr?: string;
  size: number;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = Math.round(size * dpr);
    scratch ??= document.createElement('canvas');
    scratch.width = W;
    scratch.height = H;
    drawCharacter(scratch.getContext('2d')!, lookFor(name, seat), { expr, cards: 0 });
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(scratch, CROP.x, CROP.y, CROP.size, CROP.size, 0, 0, c.width, c.height);
  }, [name, seat, expr, size]);
  return <canvas ref={ref} className="face" role="img" aria-label={label} style={{ '--face-default': `${size}px` } as CSSProperties} />;
}
