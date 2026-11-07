// De dónde sale cada dato de la landing (archivos del repositorio truco3D). Sin fuente, no va en la página.
export const sources: Record<string, string> = {
  inicio: 'docs/JUEGO.md §1 y §2 (qué es, gratis, sin cuenta)',
  'a-ciegas': 'Planteo de la landing: no es un dato',
  senas: 'public/js/config.js (SENAS: las 11 señas y su cara)',
  mirada: 'src/truco-room.js (deliverSena: la seña solo le llega a quien te mira) y docs/REGLAS.md',
  trampa: 'docs/REGLAS.md (trampa: dos cartas encimadas, carta quemada, "mostrá las dos")',
  mesas: 'public/js/config.js (MODES, TARGETS, TIMING.afk) y docs/REGLAS.md (sin flor)',
  sentate: 'public/js/characters.js (lookFor: el mismo nombre en el mismo lugar da la misma cara)',
};
