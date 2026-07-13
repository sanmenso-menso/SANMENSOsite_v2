// @ts-check
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** @type {false | 'hidden'} */
const sourceMap = process.env.GENERATE_SOURCEMAP === 'true' ? 'hidden' : false;

export default defineConfig(() => ({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    strictPort: true,
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
