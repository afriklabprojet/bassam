import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '@/lib/json-ld';

describe('serializeJsonLd', () => {
  it('échappe < pour qu une valeur ne puisse pas fermer la balise script', () => {
    const out = serializeJsonLd({ name: 'Oud</script><script>alert(1)</script>' });

    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<');
  });

  it('reste du JSON qui redonne exactement les mêmes données', () => {
    const data = { '@type': 'Product', name: 'Bleu <édition> & Co', price: 45000 };

    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});
