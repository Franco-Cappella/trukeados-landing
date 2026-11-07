// Enlaces que dependen del entorno. Aparte de site.ts para que el contenido sea solo datos (lo leen también
// los scripts de scripts/, fuera de Vite).

/** URL del juego: VITE_GAME_URL si está; si no, el juego publicado (o el local con `npm run dev`). */
export const GAME_URL =
  (import.meta.env.VITE_GAME_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:8787' : 'https://game.trukeados.com');
