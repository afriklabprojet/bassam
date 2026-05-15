export const PRODUCT_PLACEHOLDER_IMAGE = '/images/products/product-placeholder.svg';

const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  '1-million.jpg': '/images/products/1-million.svg',
  '1-million.jpeg': '/images/products/1-million.svg',
  'black-opium.jpg': '/images/products/black-opium.svg',
  'black-opium.jpeg': '/images/products/black-opium.svg',
  'bleu-de-chanel.jpg': '/images/products/bleu-de-chanel.svg',
  'bleu-de-chanel.jpeg': '/images/products/bleu-de-chanel.svg',
  'coco-mademoiselle.jpg': '/images/products/coco-mademoiselle.svg',
  'coco-mademoiselle.jpeg': '/images/products/coco-mademoiselle.svg',
  'good-girl.jpg': '/images/products/good-girl.svg',
  'good-girl.jpeg': '/images/products/good-girl.svg',
  'la-vie-est-belle.jpg': '/images/products/la-vie-est-belle.svg',
  'la-vie-est-belle.jpeg': '/images/products/la-vie-est-belle.svg',
  'oud-wood.jpg': '/images/products/oud-wood.svg',
  'oud-wood.jpeg': '/images/products/oud-wood.svg',
  'sauvage-edp.jpg': '/images/products/dior-sauvage.svg',
  'sauvage-edp.jpeg': '/images/products/dior-sauvage.svg',
};

export function normalizeProductImage(image?: string | null): string {
  if (!image) return PRODUCT_PLACEHOLDER_IMAGE;

  const normalizedImage = image.trim();
  if (!normalizedImage) return PRODUCT_PLACEHOLDER_IMAGE;

  const fileName = normalizedImage.split('/').pop()?.toLowerCase();
  if (fileName && PRODUCT_IMAGE_OVERRIDES[fileName]) {
    return PRODUCT_IMAGE_OVERRIDES[fileName];
  }

  if (normalizedImage.startsWith('/images/products/') && /\.(jpe?g)$/i.test(normalizedImage)) {
    return PRODUCT_PLACEHOLDER_IMAGE;
  }

  return normalizedImage;
}