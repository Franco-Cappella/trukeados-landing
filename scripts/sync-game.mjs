// Copia de lo que la landing toma del juego. Uso: `npm run sync` (o `node scripts/sync-game.mjs <ruta al juego>`).
// Por defecto el juego está en ../truco3D. Nunca se edita la copia: se cambia el juego y se vuelve a sincronizar.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = path.resolve(process.argv[2] ?? path.join(root, '..', 'truco3D'));
const out = (...p) => path.join(root, ...p);

const need = (p) => {
  if (!fs.existsSync(p)) throw new Error(`No encuentro ${p}. Pasá la ruta del juego como argumento.`);
  return p;
};
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(need(from), to);
  console.log('  ', path.relative(root, to));
};
const header = (src) => `// COPIA de ${src} (truco3D). No editar acá: cambiar el juego y correr "npm run sync".\n`;

console.log('Sincronizando desde', game);

// 1. Cartas WebP
for (const f of fs.readdirSync(need(path.join(game, 'public', 'cards')))) {
  if (f.endsWith('.webp')) copy(path.join(game, 'public', 'cards', f), out('public', 'cards', f));
}

// 2. Código del juego que se reutiliza tal cual (no toca el DOM al importarse)
for (const f of ['characters.js', 'theme.js', 'config.js']) {
  const to = out('src', 'game', f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, header(`public/js/${f}`) + fs.readFileSync(need(path.join(game, 'public', 'js', f)), 'utf8'));
  console.log('  ', path.relative(root, to));
}

// 3. Logos SVG
for (const f of fs.readdirSync(need(path.join(game, 'brand', 'logo')))) {
  if (f.endsWith('.svg')) copy(path.join(game, 'brand', 'logo', f), out('public', 'brand', f));
}

// 4. Tokens de marca. Se quita el @import de Google Fonts: las fuentes se autoalojan.
{
  const css = fs
    .readFileSync(need(path.join(game, 'brand', 'tokens.css')), 'utf8')
    .replace(/^@import url\([^)]*\);\s*$/m, '');
  const to = out('src', 'styles', 'tokens.css');
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, header('brand/tokens.css').replace('// COPIA', '/* COPIA').replace(/\n$/, ' */\n') + css);
  console.log('  ', path.relative(root, to));
}

// 5. Documentación de marca, para leer al diseñar
for (const f of ['BRAND.md', 'COMPONENTES.md', 'RECURSOS.md', 'VOZ.md', 'PAGINAS.md']) {
  copy(path.join(game, 'brand', f), out('docs', 'brand', f));
}
copy(path.join(game, 'DESIGN.md'), out('docs', 'brand', 'DESIGN.md'));

console.log('Listo.');
