import images from '../generated/portfolio-images.json';

/** Unknown/new data stays compatible with the original URL until the next build. */
export function responsiveImage(source, sizes) {
  const image = images[source];
  return image ? { ...image, sizes } : { src: source };
}
