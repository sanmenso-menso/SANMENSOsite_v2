// @ts-check
import { rm } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const distDirectory = path.resolve(projectRoot, 'dist');

if (path.dirname(distDirectory) !== projectRoot) {
  throw new Error(`Refusing to remove an unexpected build directory: ${distDirectory}`);
}

await rm(distDirectory, {
  force: true,
  maxRetries: 5,
  recursive: true,
  retryDelay: 200,
});
