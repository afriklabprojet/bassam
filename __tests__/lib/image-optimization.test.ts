import { describe, expect, it } from 'vitest';
import { shouldBypassNextImageOptimization } from '@/lib/image-optimization';

describe('shouldBypassNextImageOptimization', () => {
  it('optimise les URLs Supabase Storage publiques avec Next Image', () => {
    expect(
      shouldBypassNextImageOptimization('https://olpttunchyheradgukdc.supabase.co/storage/v1/object/public/product-images/sample.jpg'),
    ).toBe(false);
  });

  it('bypasse les previews locales data/blob', () => {
    expect(shouldBypassNextImageOptimization('data:image/png;base64,abc')).toBe(true);
    expect(shouldBypassNextImageOptimization('blob:http://localhost:3000/abc')).toBe(true);
  });

  it('garde l optimisation Next pour les assets locaux et les URLs distantes', () => {
    expect(shouldBypassNextImageOptimization('/images/logo.png')).toBe(false);
    expect(shouldBypassNextImageOptimization('https://example.com/storage/v1/object/public/product-images/sample.jpg')).toBe(false);
    expect(shouldBypassNextImageOptimization('https://olpttunchyheradgukdc.supabase.co/auth/v1/token')).toBe(false);
  });
});