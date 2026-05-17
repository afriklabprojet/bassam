import { describe, expect, it } from 'vitest';
import { DEFAULT_HOME_HERO, toHomeHeroDbRow } from '@/lib/supabase/home-hero';

describe('home hero content mapping', () => {
  it('maps admin content to the Supabase row shape', () => {
    const row = toHomeHeroDbRow(DEFAULT_HOME_HERO);

    expect(row).toMatchObject({
      id: 'home',
      eyebrow: DEFAULT_HOME_HERO.eyebrow,
      title: DEFAULT_HOME_HERO.title,
      title_accent: DEFAULT_HOME_HERO.titleAccent,
      primary_cta_label: DEFAULT_HOME_HERO.primaryCtaLabel,
      primary_cta_href: DEFAULT_HOME_HERO.primaryCtaHref,
      secondary_cta_label: DEFAULT_HOME_HERO.secondaryCtaLabel,
      secondary_cta_href: DEFAULT_HOME_HERO.secondaryCtaHref,
      showcase_eyebrow: DEFAULT_HOME_HERO.showcaseEyebrow,
      showcase_title: DEFAULT_HOME_HERO.showcaseTitle,
      scroll_label: DEFAULT_HOME_HERO.scrollLabel,
    });
    expect(row.trust_items).toEqual(DEFAULT_HOME_HERO.trustItems);
    expect(row.stats).toEqual(DEFAULT_HOME_HERO.stats);
    expect(row.product_visuals).toEqual(DEFAULT_HOME_HERO.productVisuals);
    expect(row.collection_links).toEqual(DEFAULT_HOME_HERO.collectionLinks);
    expect(row.brand_ticker).toEqual(DEFAULT_HOME_HERO.brandTicker);
    expect(Date.parse(row.updated_at)).not.toBeNaN();
  });
});
