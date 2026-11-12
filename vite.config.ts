import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Lo que el HTML necesita saber del build:
 * - Precarga de Hanken Grotesk (latín): sin esto la página se pinta con la fuente de respaldo y, al llegar la fuente, el
 *   panel del inicio cambia de altura (CLS 0.086 en Lighthouse celular).
 * - La URL pública del sitio (VITE_SITE_URL) para la imagen de Open Graph y la canónica, que tienen que ser
 *   absolutas. Sin ella quedan relativas (sirve para probar, no para compartir) y el build lo avisa.
 */
function html(site: string): Plugin {
  return {
    name: 'trukeados-html',
    transformIndexHtml: {
      order: 'post',
      handler(page, ctx) {
        const abs = (p: string) => (site ? new URL(p, site).href : p);
        let out = page.replaceAll('%SITE%', abs('/')).replaceAll('%OG_IMAGE%', abs('/og.jpg'));
        if (!site) out = out.replace(/\s*<link rel="canonical"[^>]*>/, '');
        const font = Object.keys(ctx.bundle ?? {}).find((f) => /hanken-grotesk-latin-wght-normal.*\.woff2$/.test(f));
        if (font) {
          out = out.replace(
            '</title>',
            `</title>\n    <link rel="preload" href="/${font}" as="font" type="font/woff2" crossorigin />`,
          );
        }
        return out;
      },
    },
    buildStart() {
      if (!site) this.warn('Falta VITE_SITE_URL: la imagen de Open Graph queda con una URL relativa.');
    },
  };
}

export default defineConfig(({ mode }) => {
  // Sin VITE_SITE_URL, el build de producción usa el dominio publicado.
  const site = loadEnv(mode, '.', 'VITE_').VITE_SITE_URL || (mode === 'production' ? 'https://trukeados.com/' : '');
  return {
    plugins: [react(), html(site)],
    server: { port: 5173 },
    preview: { port: 4173 },
    // El paquete 3D (three + R3F + drei) pesa unos 920 KB sin comprimir y 245 KB con gzip: va aparte, con lazy(),
    // y su límite real es el de la skill (350 KB gzip). El aviso por defecto de Vite (500 KB sin comprimir) no aplica.
    build: { chunkSizeWarningLimit: 1000 },
  };
});
