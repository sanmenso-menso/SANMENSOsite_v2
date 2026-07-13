// @ts-check
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  assertUniqueOutputTargets,
  buildOutputPlan,
  parseOptimizeOptions,
  parseSizes,
} from '../scripts/image-optimization.js';

describe('parseSizes', () => {
  it('deduplicates and sorts configured widths', () => {
    expect(parseSizes('1280, 800, 800')).toEqual([800, 1280]);
  });

  it.each(['0', '-1', 'abc', '800,abc', '800px'])('rejects invalid widths: %s', (value) => {
    expect(() => parseSizes(value)).toThrow('Invalid image sizes');
  });
});

describe('parseOptimizeOptions', () => {
  it('resolves explicit directories without depending on the caller shell', () => {
    const options = parseOptimizeOptions(
      ['--source', 'input', '--output', 'output', '--sizes', '640', '--dry-run'],
      {},
      path.resolve('workspace'),
    );

    expect(options.sourceDir).toBe(path.resolve('workspace', 'input'));
    expect(options.outputDir).toBe(path.resolve('workspace', 'output'));
    expect(options.sizes).toEqual([640]);
    expect(options.dryRun).toBe(true);
  });

  it('rejects flags without values', () => {
    expect(() => parseOptimizeOptions(['--source'], {}, process.cwd())).toThrow(
      '--source requires a value',
    );
  });

  it('rejects output directories inside the source tree', () => {
    expect(() =>
      parseOptimizeOptions(
        ['--source', 'images', '--output', 'images/generated'],
        {},
        path.resolve('workspace'),
      ),
    ).toThrow('must not be inside');
  });
});

describe('assertUniqueOutputTargets', () => {
  it('rejects source files that would overwrite the same generated target', () => {
    const target = path.resolve('workspace', 'output', 'same-800w.webp');
    expect(() =>
      assertUniqueOutputTargets([
        { sourceFile: 'same.jpg', outputs: [{ target }] },
        { sourceFile: 'same.jpeg', outputs: [{ target }] },
      ]),
    ).toThrow('Output collision');
  });
});

describe('buildOutputPlan', () => {
  const sourceDir = path.resolve('workspace', 'input');
  const outputDir = path.resolve('workspace', 'output');

  it('preserves subdirectories and emits webp plus the source format', () => {
    const plan = buildOutputPlan(path.join(sourceDir, 'covers', 'sample.png'), {
      sourceDir,
      outputDir,
      sizes: [800],
    });

    expect(plan).toEqual([
      {
        width: 800,
        format: 'webp',
        target: path.join(outputDir, 'covers', 'sample-800w.webp'),
      },
      {
        width: 800,
        format: 'png',
        target: path.join(outputDir, 'covers', 'sample-800w.png'),
      },
    ]);
  });

  it('prevents files outside the configured source directory', () => {
    expect(() =>
      buildOutputPlan(path.resolve('workspace', 'outside.jpg'), {
        sourceDir,
        outputDir,
        sizes: [800],
      }),
    ).toThrow('outside the input directory');
  });
});
