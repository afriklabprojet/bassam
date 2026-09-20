import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductCard } from '@/app/(shop)/services/quiz-olfactif/quiz-ui';

describe('image des recommandations du quiz', () => {
  it('utilise une image Next dimensionnée pour la carte', () => {
    render(
      <ProductCard
        index={0}
        product={{
          id: 'product-1',
          name: 'Parfum test',
          brand: 'Maison test',
          slug: 'parfum-test',
          price: 25000,
          images: ['https://demo.supabase.co/storage/v1/object/public/product-images/test.webp'],
        }}
      />,
    );

    const image = screen.getByRole('img', { name: 'Parfum test' });
    expect(image).toHaveAttribute('sizes', '120px');
    expect(image).toHaveAttribute('data-nimg', 'fill');
  });
});