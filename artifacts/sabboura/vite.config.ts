import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const here = import.meta.dirname;

export default defineConfig({
  base: '/',
  root: here,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(here, 'src'), '@shared': path.resolve(here, 'shared') },
    dedupe: ['react', 'react-dom'],
  },
  build: { outDir: path.resolve(here, 'dist/public'), emptyOutDir: true },
  server: { host: '0.0.0.0', allowedHosts: true, fs: { allow: [path.resolve(here, '../..')] } },
});
