import { rmSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
import { handlePublishedRequest } from './server/publishedRulebook';
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-rulebook-service',
      configureServer(server) {
        server.middlewares.use('/api/rulebook-data', (request, response) => {
          let key = process.env.MORKBORG_DATA_KEY;
          if (!key) {
            try {
              key = JSON.parse(
                readFileSync(
                  resolve('outputs/private-update-publisher.json'),
                  'utf8',
                ),
              ).key;
            } catch {
              /* The handler returns a generic unavailable response. */
            }
          }
          void handlePublishedRequest(request, response, {
            root: process.cwd(),
            key,
          });
        });
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
