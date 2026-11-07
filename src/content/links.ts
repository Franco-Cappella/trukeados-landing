// Enlaces que dependen del entorno. Aparte de site.ts para que el contenido sea solo datos (lo leen también
// los scripts de scripts/, fuera de Vite).

/** URL del juego. TODO(contenido): la URL pública. Mientras tanto, el juego en local. */
export const GAME_URL = (import.meta.env.VITE_GAME_URL as string | undefined) || 'http://localhost:8787';
