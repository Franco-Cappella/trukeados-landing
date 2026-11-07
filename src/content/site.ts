// Contenido de la landing: textos, cámaras y estados de cada sección. Los componentes no escriben texto propio.
// Cada dato sale del juego (ver sources.ts). Medidas del bar en three/bar/geometry.ts.
// Sin imports ni import.meta: también lo lee scripts/encuadres.ts, fuera de Vite.

export type Vec3 = [number, number, number];

/**
 * Un encuadre. La cámara está en `position` y mira a `target`. `frame` dice dónde cae `target` en la pantalla,
 * medido desde el centro en fracciones del ancho y del alto (x hacia la derecha, y hacia arriba): así lo que
 * se mira queda fuera del texto sin torcer la cámara. `fov` es el campo vertical, en grados.
 */
export type Shot = { position: Vec3; target: Vec3; fov?: number; frame?: [number, number] };

/** Lente por defecto. En horizontal el texto va a la izquierda; en vertical, abajo. */
export const lens: Record<'landscape' | 'portrait', { fov: number; frame: [number, number] }> = {
  landscape: { fov: 42, frame: [0.2, 0] },
  portrait: { fov: 62, frame: [0, 0.23] },
};

/** Estados continuos de la escena, de 0 a 1. */
export type SceneFx = {
  dim: number; // las caras quedan en sombra (a ciegas)
  closeup: number; // se ilumina la cara del primer plano
  sena: number; // recorrido por las 11 señas (0 la primera, 1 la última)
  gaze: number; // se ve quién mira a quién
  burn: number; // la carta de arriba se levanta, quemada, y deja ver la de abajo
  six: number; // la mesa pasa de cuatro a seis lugares
  seated: number; // sentado en tu silla: todos te miran
};

export type Section = {
  id: string;
  title: string;
  body: string[];
  weight: number; // cuántas pantallas de scroll dura: 1 de llegada y el resto con el texto fijo
  camera: Shot;
  cameraPortrait: Shot; // en vertical: más lejos y con el objeto más arriba
  fxIn?: Partial<SceneFx>; // lo que cambia mientras la cámara llega
  fx: Partial<SceneFx>; // lo que cambia con el texto fijo (necesita weight > 1)
  figure: { poster: string; alt: string }; // póster para la versión sin 3D (fase 7) y descripción
  extra?: 'senas' | 'trampa' | 'nombre';
  cta?: boolean;
};

const sections: Section[] = [
  {
    id: 'inicio',
    title: 'Truco de verdad.',
    body: ['Trukeados es truco argentino online, en 3D, en la mesa de un bar. Gratis y sin cuenta.'],
    weight: 1.2,
    // De pie en la puerta: la lámpara, la mesa y tu silla arriba; el título abajo (estudio A).
    camera: { position: [0, 2.0, 5.0], target: [0, 1.3, 0], fov: 50, frame: [0, 0.12] },
    cameraPortrait: { position: [0, 2.2, 5.6], target: [0, 1.4, 0], fov: 66, frame: [0, 0.2] },
    fx: {},
    figure: {
      poster: '',
      alt: 'El bar de Trukeados visto desde la puerta: una mesa de paño verde bajo una lámpara, tres jugadores con cartas y una silla vacía.',
    },
    cta: true,
  },
  {
    id: 'a-ciegas',
    title: 'Online, nadie te mira a la cara.',
    body: ['Jugar a distancia es jugar a ciegas: no sabés si el otro se achica ni qué le pasó su compañero.'],
    weight: 1,
    // Se acerca desde la derecha: Cacho y Coca a oscuras; Tito queda del lado del texto.
    camera: { position: [1.1, 1.62, 2.9], target: [0.25, 1.15, -0.5], fov: 46, frame: [0.22, 0] },
    // En vertical, más a la derecha y más alto, para que tu silla vacía no tape la mesa.
    cameraPortrait: { position: [1.3, 2.0, 3.0], target: [0.1, 1.15, -0.4], frame: [0, 0.2] },
    fxIn: { dim: 1 },
    fx: {},
    figure: { poster: '', alt: 'La mesa más de cerca, con las caras de los jugadores en sombra.' },
  },
  {
    id: 'senas',
    title: 'Las señas se hacen con la cara.',
    body: ['Once señas: cejas arriba, el ancho de espada; un guiño, el de basto; la boca torcida, un siete.'],
    weight: 2,
    // Primer plano de Cacho, enfrente (estudio C). El resto sigue a oscuras.
    camera: { position: [0.22, 1.47, 0], target: [0, 1.425, -1.25], fov: 32, frame: [0.22, 0] },
    cameraPortrait: { position: [0.06, 1.47, 0.38], target: [0, 1.425, -1.25], fov: 50 },
    fxIn: { closeup: 1 },
    fx: { sena: 1 },
    figure: { poster: '', alt: 'Primer plano de Cacho guiñando un ojo: la seña del ancho de basto.' },
    extra: 'senas',
  },
  {
    id: 'mirada',
    title: 'Solo la ve quien te está mirando.',
    body: [
      'El servidor le manda tu seña únicamente a quien te mira en ese momento.',
      'Si te cazan, te cazaron.',
    ],
    weight: 1.5,
    // En diagonal y desde arriba: se ven las cuatro cabezas y hacia dónde mira cada una.
    camera: { position: [2.7, 2.9, 2.7], target: [0, 1.0, 0] },
    cameraPortrait: { position: [3.0, 3.5, 3.4], target: [0, 1.0, 0], frame: [0, 0.17] },
    fxIn: { dim: 0, closeup: 0 },
    fx: { gaze: 1 },
    figure: { poster: '', alt: 'La mesa vista en diagonal: Coca mira a Tito, y Tito mira a su compañero.' },
  },
  {
    id: 'trampa',
    title: 'Acá también se puede hacer trampa.',
    body: [
      'Tirás dos encimadas: la de abajo juega y la de arriba queda quemada.',
      'Cualquier rival te puede pedir que muestres las dos.',
    ],
    weight: 1.5,
    // Baja casi a pique sobre tus cartas jugadas (vista cenital del estudio B).
    camera: { position: [0.1, 1.42, 0.98], target: [0, 0.745, 0.589], fov: 38 },
    cameraPortrait: { position: [0.034, 1.33, 0.973], target: [0, 0.745, 0.589], fov: 56, frame: [0, 0.22] },
    fxIn: { gaze: 0 },
    fx: { burn: 1 },
    figure: {
      poster: '',
      alt: 'Dos cartas encimadas sobre el paño: la de arriba, quemada, con los bordes carbonizados.',
    },
    extra: 'trampa',
  },
  {
    id: 'mesas',
    title: 'De a dos, de a cuatro o de a seis.',
    body: [
      '1 vs 1, 2 vs 2 y 3 vs 3. A 15 o a 30 puntos, sin flor.',
      'Si se te corta, un bot juega por vos hasta que volvés.',
    ],
    weight: 1.5,
    // Sube casi hasta el techo: la mesa entera, entera a la derecha del texto.
    camera: { position: [0.6, 3.95, 3.4], target: [0, 0.9, 0], fov: 56, frame: [0.25, 0.02] },
    cameraPortrait: { position: [0, 3.95, 3.0], target: [0, 1.0, 0], fov: 80, frame: [0, 0.2] },
    fxIn: { burn: 0 },
    fx: { six: 1 },
    figure: { poster: '', alt: 'La mesa vista desde arriba, con lugar para seis jugadores.' },
  },
  {
    id: 'sentate',
    title: 'La mesa está servida.',
    body: ['Poné tu nombre y mirá cómo te ven. Después, a jugar.'],
    weight: 1.4,
    // Tu silla: la misma vista del juego (ojos a R + 0.24, mirando 0.2 rad hacia abajo, FOV 70 / 84). Como en
    // el inicio, el texto va abajo y la vista queda entera.
    camera: { position: [0, 1.24, 1.19], target: [0, 1.0, 0.01], fov: 70, frame: [0, 0.04] },
    cameraPortrait: { position: [0, 1.24, 1.19], target: [0, 1.0, 0.01], fov: 84, frame: [0, 0.16] },
    fxIn: { six: 0 },
    fx: { seated: 1 },
    figure: { poster: '', alt: 'La mesa vista desde tu silla, igual que en el juego: tres jugadores te miran.' },
    extra: 'nombre',
    cta: true,
  },
];

export const site = {
  name: 'Trukeados',
  tagline: 'Truco argentino online, en 3D.',
  cta: { primary: 'Jugar ahora', secondary: 'Practicar con bots' },
  nav: [
    { id: 'senas', label: 'Señas' },
    { id: 'trampa', label: 'Trampa' },
    { id: 'mesas', label: 'Mesas' },
  ],
  sections,
};
