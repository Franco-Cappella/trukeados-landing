# Landing de Trukeados: guía para agentes

Proyecto aparte del juego (`../truco3D`). Su único trabajo es presentar el juego y llevar a jugarlo.

## Qué viene del juego (no editar acá)

Se copia con `npm run sync` (lee `../truco3D`, o la ruta que se pase):
- `public/cards/`: cartas WebP.
- `src/game/characters.js`, `theme.js`, `config.js`: personajes en canvas, colores y señas.
- `public/brand/`: logos SVG.
- `src/styles/tokens.css`: tokens de marca, sin el `@import` de Google Fonts.
- `docs/brand/`: documentación de marca para leer.

Para cambiar algo de eso, se cambia en el juego y se vuelve a sincronizar.

## Reglas

- La skill que manda es `web-inmersiva` (nivel 3, mundo de scroll). El trabajo va por fases con checkpoint:
  ver `docs/CONTRATO.md`.
- Marca: `docs/brand/PAGINAS.md` y `docs/brand/BRAND.md`. Colores y medidas en CSS, solo desde `tokens.css`.
  En JS, desde `src/game/theme.js` o `src/three/bar/palette.ts` (espejos de los tokens).
- Textos en español rioplatense, con voseo. No inventar métricas, testimonios, logos de clientes ni citas:
  marcar `TODO(contenido)` y preguntar.
- Sin CDN: fuentes (`@fontsource-variable/archivo`), modelos y pósters, todo local.
- El 3D nunca es el LCP. La landing se lee, y la CTA funciona, sin 3D ni animación.
- Con movimiento reducido, la escena se muestra en su estado final sin recorrido.
- Los commits solo se hacen cuando lo pide la persona.

## Comandos

- `npm run dev`, `npm run build` (incluye `tsc`), `npm run preview`.
- `npm run sync`: copia lo que viene del juego.
- `npm run capture -- estudios`, `landing` o `director`: capturas en `docs/estudios/` y `docs/capturas/`.
  Requiere `npm run build && npm run preview` corriendo en el puerto 4173. `director` además prueba que la
  escena vuelva a su estado al ir, volver y saltar, con movimiento reducido y sin 3D: correrlo después de
  tocar cámaras, `weight` o efectos.
- `npm run encuadres [id]`: dónde cae cada cosa del bar en pantalla con las cámaras de `site.ts`, sin
  renderizar. Sirve para ajustar una cámara antes de sacar capturas.
- `?debug` en la URL: estado del director en pantalla. `?gris`: la escena gris en lugar del bar.

## Estructura

- `src/content/`: textos, cámaras, lente y estados de cada sección (`site.ts`, sin imports: lo leen también los
  scripts), la fuente de cada dato (`sources.ts`) y la URL del juego (`links.ts`).
- `src/scroll/`: scroll suave (Lenis + ticker de GSAP), `rig` (estado continuo de la escena) y el director
  (`useStoryTimeline.ts`), que es lo único que escribe en `rig`.
- `src/state/`: estado discreto (sección, nivel de calidad, versión sin 3D, `?debug`).
- `src/ui/`: capa de contenido (HTML). Nunca importa `three` ni `@react-three/*`.
- `src/three/`: escena 3D, en `lazy()`. `Experience.tsx` (canvas fijo), `CameraRig.tsx` (cámara y encuadre),
  `world/` (el bar del recorrido: escena, personajes y cartas de la trampa), `bar/` (piezas del bar con las
  medidas del juego) y `gray/` (escena gris de la fase 5, con `?gris`).
- `src/studies/`: los tres estudios de dirección (`?estudio=a|b|c`), en un paquete aparte.

## Al cerrar cualquier cambio de interfaz

Build sin errores, recorrido en 1440, 768 y 390, `impeccable` (audit) y `vercel-react-best-practices`.
