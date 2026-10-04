import { mkdtemp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { expect, it } from 'vitest';
import config from '../vite.config.js';

it('serves the replacement JSON while the development server stays open', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-dev-'));
  const directory = path.join(root, 'public/data');
  const target = path.join(directory, 'portfolio.json');
  await mkdir(directory, { recursive: true });
  await writeFile(target, JSON.stringify({ version: 0 }));
  const options = config({ command: 'serve', mode: 'development' });
  const server = await createServer({
    ...options,
    configFile: false,
    root,
    cacheDir: path.join(root, '.vite'),
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
    logLevel: 'silent',
    server: { ...options.server, port: 5189, strictPort: false },
  });
  try {
    await server.listen();
    const url = `${server.resolvedUrls.local[0]}data/portfolio.json`;
    for (let version = 0; version < 3; version += 1) {
      const response = await fetch(url);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toEqual({ version });
      const temporary = `${target}.next`;
      await writeFile(temporary, JSON.stringify({ version: version + 1 }));
      await rename(temporary, target);
    }
    const head = await fetch(url, { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
  } finally {
    await server.close();
    await rm(root, { recursive: true, force: true });
  }
}, 10000);
