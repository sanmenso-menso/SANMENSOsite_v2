// @ts-check
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';
import sharp from 'sharp';

import {
  assertUniqueOutputTargets,
  buildOutputPlan,
  parseOptimizeOptions,
} from './image-optimization.js';

async function optimizeImage(sourceFile, target, width, format) {
  await mkdir(path.dirname(target), { recursive: true });

  const pipeline = sharp(sourceFile).resize({
    width,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (format === 'webp') {
    await pipeline.webp({ quality: 80 }).toFile(target);
    return;
  }

  if (format === 'png') {
    await pipeline.png({ compressionLevel: 9 }).toFile(target);
    return;
  }

  await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(target);
}

export async function optimizeImages(argv = process.argv.slice(2), env = process.env) {
  const options = parseOptimizeOptions(argv, env, process.cwd());

  try {
    await access(options.sourceDir);
  } catch {
    throw new Error(
      `Input directory does not exist: ${options.sourceDir}. ` +
        'Create it or pass --source <directory>.',
    );
  }

  const sourceFiles = await glob('**/*.{jpg,jpeg,png}', {
    absolute: true,
    cwd: options.sourceDir,
    nodir: true,
  });

  if (sourceFiles.length === 0) {
    const message = `No source images found in ${options.sourceDir}.`;
    if (options.requireInput) throw new Error(message);
    console.log(message);
    return { processed: 0, generated: 0 };
  }

  const plans = sourceFiles.sort().map((sourceFile) => ({
    sourceFile,
    outputs: buildOutputPlan(sourceFile, options),
  }));
  assertUniqueOutputTargets(plans);

  let generated = 0;
  for (const { sourceFile, outputs } of plans) {
    console.log(`Optimizing ${path.relative(options.sourceDir, sourceFile)}...`);

    for (const output of outputs) {
      if (!options.dryRun) {
        await optimizeImage(sourceFile, output.target, output.width, output.format);
      }
      generated += 1;
      console.log(`  -> ${options.dryRun ? '[dry-run] ' : ''}${output.target}`);
    }
  }

  return { processed: sourceFiles.length, generated };
}

const isDirectExecution = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isDirectExecution) {
  optimizeImages().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
