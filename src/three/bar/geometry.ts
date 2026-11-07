// Medidas del bar del juego (public/js/scene.js de truco3D), en metros. Son las mismas del juego para que
// la landing muestre la misma mesa. Sin imports: también las leen los scripts de scripts/.

export type Vec3 = [number, number, number];

export const TABLE_Y = 0.74; // altura del paño
export const EYE_Y = 1.24; // altura de los ojos de quien mira sentado
export const CHAR_H = 1.8; // personaje: del piso a la cabeza (canvas 512 x 1200)
export const CHAR_W = CHAR_H * (512 / 1200);
/** Centro de la cara del personaje: en el canvas está a 250 px de arriba (el recorte de FaceCanvas). */
export const FACE_Y = CHAR_H * (1 - 250 / 1200);
export const CARD_W = 0.1;
export const CARD_H = CARD_W * (788 / 512);
/** En la mesa las cartas son un 30 % más grandes que en la mano (TABLE_CARD_SCALE). */
export const TABLE_CARD = 1.3;

/** Radio de la mesa según la cantidad de jugadores (TableScene.setLayout). */
export const TABLE_R: Record<number, number> = { 2: 0.78, 4: 0.95, 6: 1.18 };
export const PERSON_OUT = 0.3; // el personaje, a R + 0.3 del centro
export const CHAIR_OUT = 0.5; // la silla, a R + 0.5
export const SEAT_EYE_OUT = 0.24; // tus ojos sentado, a R + 0.24 (placeCamera)
export const PLAY_R = 0.62; // las cartas jugadas, a R x 0.62 hacia cada asiento (tablePoses)

/** Ángulo del asiento. El asiento 0 es el de quien mira: está en +z, mirando hacia -z. */
export const seatAngle = (seat: number, n: number) => (seat * Math.PI * 2) / n;

/** Dirección horizontal desde el centro de la mesa hacia el asiento. */
export function seatDir(seat: number, n: number): Vec3 {
  const a = seatAngle(seat, n);
  return [Math.sin(a), 0, Math.cos(a)];
}
