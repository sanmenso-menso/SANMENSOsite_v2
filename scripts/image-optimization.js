// @ts-check
import path from 'node:path';

const DEFAULT_SIZES = [800, 1280];
const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

export function parseSizes(value) {
  if (!value) return [...DEFAULT_SIZES];

  const values = value.split(',').map((item) => item.trim());
  if (values.some((item) => !/^\d+$/.test(item))) {
    throw new Error(`Invalid image sizes: ${value}`);
  }

  const sizes = [...new Set(values.map((item) => Number.parseInt(item, 10)))];
  if (sizes.length === 0 || sizes.some((size) => !Number.isInteger(size) || size <= 0)) {
    throw new Error(`Invalid image sizes: ${value}`);
  }

  return sizes.sort((left, right) => left - right);
}

function readFlag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
}

export function parseOptimizeOptions(argv, env, cwd) {
  const source = readFlag(argv, '--source') ?? env.IMAGE_SOURCE_DIR ?? 'src/assets/images_original';
  const output = readFlag(argv, '--output') ?? env.IMAGE_OUTPUT_DIR ?? 'public/images';
  const sizes = parseSizes(readFlag(argv, '--sizes') ?? env.IMAGE_SIZES);

  const sourceDir = path.resolve(cwd, source);
  const outputDir = path.resolve(cwd, output);
  const outputRelativeToSource = path.relative(sourceDir, outputDir);
  if (
    outputRelativeToSource === '' ||
    (!outputRelativeToSource.startsWith('..') && !path.isAbsolute(outputRelativeToSource))
  ) {
    throw new Error('Output directory must not be inside the input directory.');
  }

  return {
    sourceDir,
    outputDir,
    sizes,
    dryRun: argv.includes('--dry-run'),
    requireInput: argv.includes('--require-input'),
  };
}

export function assertUniqueOutputTargets(plans) {
  const owners = new Map();
  for (const { sourceFile, outputs } of plans) {
    for (const output of outputs) {
      const normalizedTarget = path.resolve(output.target).toLowerCase();
      const previousSource = owners.get(normalizedTarget);
      if (previousSource) {
        throw new Error(
          `Output collision: ${previousSource} and ${sourceFile} both produce ${output.target}`,
        );
      }
      owners.set(normalizedTarget, sourceFile);
    }
  }
}

export function buildOutputPlan(sourceFile, options) {
  const absoluteSource = path.resolve(sourceFile);
  const relative = path.relative(options.sourceDir, absoluteSource);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Source file is outside the input directory: ${sourceFile}`);
  }

  const extension = path.extname(relative).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported image extension: ${extension || '(none)'}`);
  }

  const relativeDirectory = path.dirname(relative);
  const basename = path.basename(relative, extension);
  const originalFormat = extension === '.png' ? 'png' : 'jpg';
  const outputs = [];

  for (const width of options.sizes) {
    for (const format of ['webp', originalFormat]) {
      outputs.push({
        width,
        format,
        target: path.join(options.outputDir, relativeDirectory, `${basename}-${width}w.${format}`),
      });
    }
  }

  return outputs;
}
