# Landing de Trukeados: guía para agentes

Proyecto aparte del juego (el repositorio `TRUKEADOS`). Su único trabajo es presentar el juego y llevar a jugarlo.

## Qué viene del juego (no editar acá)

Se copia con `npm run sync` (lee `../TRUKEADOS`, o la ruta que se pase):
- `public/cards/`: cartas WebP.
- `src/game/characters.js`, `theme.js`, `config.js`: personajes en canvas, colores y señas (quedan como están: ver
  `scripts/sync-game.mjs`).
- `src/game/barrio-chino.js`, `paisaje.js`, `draw3d.js`: la calle del Barrio Chino. `models.js` y
  `public/models/gato-melon.glb`: el Gato Melón.
- `public/brand/`: logos SVG.
- `src/styles/tokens.css`: tokens de marca, sin el `@import` de Google Fonts.
- `brand/` y `DESIGN.md`: documentación de diseño, igual que en TRUKEADOS (`npm run diseno:sync`, ver DESIGN.md).

Para cambiar algo de eso, se cambia en el juego y se vuelve a sincronizar.

## Reglas

- La skill que manda es `web-inmersiva` (nivel 3, mundo de scroll). Cada cambio se revisa antes de cerrarlo; el contrato y su estado están en `docs/CONTRATO.md`.
- Marca: `brand/PAGINAS.md` y `brand/BRAND.md`. Colores y medidas en CSS, solo desde `tokens.css`.
  En JS, desde `src/game/theme.js` (espejo de los tokens).
- Textos en español rioplatense, con voseo. No inventar métricas, testimonios, logos de clientes ni citas:
  marcar `TODO(contenido)` y preguntar.
- Sin CDN: fuentes (`@fontsource-variable/archivo`), modelos y pósters, todo local.
- El 3D nunca es el LCP. La landing se lee, y la CTA funciona, sin 3D ni animación.
- Con movimiento reducido, la escena se muestra en su estado final sin recorrido.
- Los commits solo se hacen cuando lo pide la persona.

## Buscadores e IAs

`index.html` lleva título, descripción, datos estructurados (VideoGame, WebSite, Organization y FAQPage) y un
`<noscript>` con texto. Además `public/robots.txt` (buscadores y asistentes de IA permitidos), `sitemap.xml` y
`llms.txt` (copia del juego, con el enlace a esta página). Se entra al juego con cuenta (Google o mail): no
escribir "sin cuenta".

## Comandos

- `npm run dev`, `npm run build` (incluye `tsc`), `npm run preview`. `VITE_GAME_URL` y `VITE_SITE_URL` son
  opcionales: por defecto, `https://game.trukeados.com` y `https://trukeados.com/` (ver `.env.example`).
- Publicación: Vercel, en cada push a `main` (`npm run build`, carpeta `dist/`; caché en `vercel.json`). El juego,
  aparte, en Cloudflare Workers.
- `npm run sync`: copia lo que viene del juego.
- `npm run capture -- landing` o `director`: capturas en `docs/capturas/`.
  Requiere `npm run build && npm run preview` corriendo en el puerto 4173. `director` además prueba que la
  escena vuelva a su estado al ir, volver y saltar, con movimiento reducido y sin 3D: correrlo después de
  tocar cámaras, `weight` o efectos.
- `npm run capture -- posters`: los pósters de la versión sin 3D (`public/posters/`). Volver a sacarlos si cambia
  una escena o una cámara.
- `npm run capture -- og`: la imagen para compartir (`public/og.jpg`) y el ícono de iOS. Volver a sacarla si
  cambia la primera pantalla.
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
  `world/` (el recorrido: la mesa en la calle del Barrio Chino del juego, `street.ts`, con el paño bordó; los
  personajes, con el Gato Melón en 3D a tu derecha, `gato.ts`; y las cartas de la trampa), `bar/` (piezas del bar con las
  medidas del juego) y `gray/` (escena gris de la fase 5, con `?gris`).

## Al cerrar cualquier cambio de interfaz

Build sin errores, recorrido en 1440, 768 y 390, `impeccable` (audit) y `vercel-react-best-practices`.
