import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  // El paquete 3D (three + R3F + drei) pesa unos 920 KB sin comprimir y 245 KB con gzip: va aparte, con lazy(),
  // y su límite real es el de la skill (350 KB gzip). El aviso por defecto de Vite (500 KB sin comprimir) no aplica.
  build: { chunkSizeWarningLimit: 1000 },
});
