// @ts-check
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { handleContact } from './server/contact.js';

/** @type {false | 'hidden'} */
const sourceMap = process.env.GENERATE_SOURCEMAP === 'true' ? 'hidden' : false;

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'portfolio-contact-dev',
      configureServer(server) {
        const localEnv = { ...loadEnv(mode, server.config.root, ''), ...process.env };
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== '/api/contact') return next();
          try {
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
            }
            const body = [];
            let length = 0;
            for await (const chunk of req) {
              length += chunk.length;
              if (length > 24000) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '入力内容が長すぎます。' }));
                return;
              }
              body.push(chunk);
            }
            const request = new Request(`http://${req.headers.host}${req.url}`, {
              method: req.method,
              headers,
              ...(body.length ? { body: Buffer.concat(body) } : {}),
            });
            const response = await handleContact(request, localEnv);
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch (error) {
            next(error);
          }
        });
      },
    },
    {
      name: 'portfolio-json-dev',
      configureServer(server) {
        // Close the file before sending the response so Windows can atomically
        // replace the generated JSON while the preview is open.
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.split('?')[0] !== '/data/portfolio.json') return next();
          if (req.method !== 'GET' && req.method !== 'HEAD') return next();
          try {
            const bytes = await readFile(path.join(server.config.publicDir, 'data/portfolio.json'));
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(req.method === 'HEAD' ? undefined : bytes);
          } catch (error) {
            next(error);
          }
        });
      },
    },
  ],
  server: {
    host: '127.0.0.1',
    strictPort: true,
    // Generated static files are read on page reload, not imported as modules.
    watch: {
      ignored: ['**/public/data/portfolio.json', '**/public/images/portfolio/**'],
    },
    cors: {
      origin: /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    },
  },
  preview: {
    host: '127.0.0.1',
    strictPort: true,
  },
  build: {
    reportCompressedSize: true,
    sourcemap: sourceMap,
  },
}));
