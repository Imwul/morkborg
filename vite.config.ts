import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'exclude-private-rulebook-data',
      apply: 'build',
      closeBundle() {
        rmSync(resolve('dist/rules'), { recursive: true, force: true });
      },
    },
  ],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
