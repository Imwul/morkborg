import { rmSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
import { publishedMiddleware } from './server/publishedMiddleware.ts';
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-rulebook-service',
      configureServer(server) {
        server.middlewares.use(
          publishedMiddleware(() => {
            let key = process.env.MORKBORG_DATA_KEY;
            if (!key) {
              try {
                const local: unknown = JSON.parse(
                  readFileSync(
                    resolve('outputs/private-update-publisher.json'),
                    'utf8',
                  ),
                );
                if (
                  local &&
                  typeof local === 'object' &&
                  'key' in local &&
                  typeof local.key === 'string'
                )
                  key = local.key;
              } catch {
                /* The API reports a generic unavailable response. */
              }
            }
            return { root: process.cwd(), key };
          }, false),
        );
      },
      configurePreviewServer(server) {
        server.middlewares.use(
          publishedMiddleware(() => ({
            root: process.cwd(),
            key: process.env.MORKBORG_DATA_KEY,
          })),
        );
      },
    },
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
