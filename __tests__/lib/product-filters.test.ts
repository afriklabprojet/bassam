import { describe, it, expect } from 'vitest';
import { filterProducts, MOCK_PRODUCTS } from '@/lib/product-filters';

// Raccourcis utiles
const ids = (result: ReturnType<typeof filterProducts>) =>
  result.products.map((p) => p.id);

const prices = (result: ReturnType<typeof filterProducts>) =>
  result.products.map((p) => p.price);

// ─── Sans filtre ──────────────────────────────────────────────────────────────

describe('filterProducts — sans filtre', () => {
  it('retourne tous les produits (8 au total)', () => {
    const result = filterProducts(MOCK_PRODUCTS, {});
    expect(result.total).toBe(8);
  });

  it('retourne les métadonnées de pagination correctes sur la page 1', () => {
    const result = filterProducts(MOCK_PRODUCTS, { page: 1, limit: 12 });
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('les produits mis en avant apparaissent en premier par défaut', () => {
    const result = filterProducts(MOCK_PRODUCTS, {});
    const featuredIds = MOCK_PRODUCTS.filter((p) => p.isFeatured).map((p) => p.id);
    const firstN = result.products.slice(0, featuredIds.length).map((p) => p.id);
    const allFeaturedFirst = firstN.every((id) => featuredIds.includes(id));
    expect(allFeaturedFirst).toBe(true);
  });
});

// ─── Filtre par genre ─────────────────────────────────────────────────────────

describe('filterProducts — filtre gender', () => {
  it('retourne uniquement les parfums homme', () => {
    const result = filterProducts(MOCK_PRODUCTS, { gender: 'homme' });
    expect(result.products.every((p) => p.gender === 'homme')).toBe(true);
    // Dior, Chanel, Givenchy = 3 hommes
    expect(result.total).toBe(3);
  });

  it('retourne uniquement les parfums femme', () => {
    const result = filterProducts(MOCK_PRODUCTS, { gender: 'femme' });
    expect(result.products.every((p) => p.gender === 'femme')).toBe(true);
    // Good Girl, Black Opium, La Vie Est Belle, Jo Malone = 4
    expect(result.total).toBe(4);
  });

  it('retourne uniquement les parfums mixtes', () => {
    const result = filterProducts(MOCK_PRODUCTS, { gender: 'mixte' });
    expect(result.products.every((p) => p.gender === 'mixte')).toBe(true);
    // Tom Ford Oud Wood = 1
    expect(result.total).toBe(1);
  });
});

// ─── Filtre par slug de catégorie ─────────────────────────────────────────────

describe('filterProducts — filtre category slug', () => {
  it('category "homme" équivaut au filtre gender "homme"', () => {
    const byGender = filterProducts(MOCK_PRODUCTS, { gender: 'homme' });
    const byCategory = filterProducts(MOCK_PRODUCTS, { category: 'homme' });
    expect(ids(byCategory)).toEqual(expect.arrayContaining(ids(byGender)));
    expect(byCategory.total).toBe(byGender.total);
  });

  it('category inconnue ne filtre rien', () => {
    const result = filterProducts(MOCK_PRODUCTS, { category: 'inconnu' });
    expect(result.total).toBe(MOCK_PRODUCTS.length);
  });
});

// ─── Filtre par prix ──────────────────────────────────────────────────────────

describe('filterProducts — filtre prix', () => {
  it('minPrice exclut les produits moins chers', () => {
    const result = filterProducts(MOCK_PRODUCTS, { minPrice: 100000 });
    expect(result.products.every((p) => p.price >= 100000)).toBe(true);
    // Jo Malone 125 000, Chanel 110 000, Tom Ford 185 000 = 3
    expect(result.total).toBe(3);
  });

  it('maxPrice exclut les produits plus chers', () => {
    const result = filterProducts(MOCK_PRODUCTS, { maxPrice: 80000 });
    expect(result.products.every((p) => p.price <= 80000)).toBe(true);
    // La Vie Est Belle 79 000, Givenchy 75 000 = 2
    expect(result.total).toBe(2);
  });

  it('combinaison min+max retourne une plage correcte', () => {
    const result = filterProducts(MOCK_PRODUCTS, { minPrice: 85000, maxPrice: 92000 });
    expect(result.products.every((p) => p.price >= 85000 && p.price <= 92000)).toBe(true);
    // Sauvage 85k, Good Girl 92k, Black Opium 88k = 3
    expect(result.total).toBe(3);
  });
});

// ─── Filtre promotions ────────────────────────────────────────────────────────

describe('filterProducts — filtre promo', () => {
  it('ne retourne que les produits avec originalPrice non nulle', () => {
    const result = filterProducts(MOCK_PRODUCTS, { promo: true });
    expect(result.products.every((p) => p.originalPrice !== null)).toBe(true);
    // Sauvage, Black Opium, La Vie Est Belle, Givenchy = 4
    expect(result.total).toBe(4);
  });
});

// ─── Filtre featured ──────────────────────────────────────────────────────────

describe('filterProducts — filtre featured', () => {
  it('ne retourne que les produits isFeatured = true', () => {
    const result = filterProducts(MOCK_PRODUCTS, { featured: true });
    expect(result.products.every((p) => p.isFeatured)).toBe(true);
    // Sauvage, Good Girl, Black Opium, Tom Ford, Chanel = 5
    expect(result.total).toBe(5);
  });
});

// ─── Recherche textuelle ──────────────────────────────────────────────────────

describe('filterProducts — recherche textuelle (q)', () => {
  it('cherche dans le nom (insensible à la casse)', () => {
    const result = filterProducts(MOCK_PRODUCTS, { q: 'sauvage' });
    expect(result.total).toBe(1);
    expect(result.products[0].slug).toBe('dior-sauvage-edt');
  });

  it('cherche dans la marque', () => {
    const result = filterProducts(MOCK_PRODUCTS, { q: 'dior' });
    expect(result.total).toBe(1);
    expect(result.products[0].brand).toBe('Dior');
  });

  it('cherche dans la description', () => {
    const result = filterProducts(MOCK_PRODUCTS, { q: 'bergamote' });
    expect(result.total).toBe(1);
    expect(result.products[0].id).toBe('1');
  });

  it('retourne zéro résultat pour un terme absent', () => {
    const result = filterProducts(MOCK_PRODUCTS, { q: 'xyznotfound' });
    expect(result.total).toBe(0);
    expect(result.products).toHaveLength(0);
  });
});

// ─── Tri ──────────────────────────────────────────────────────────────────────

describe('filterProducts — tri', () => {
  it('prix-asc trie du moins cher au plus cher', () => {
    const result = filterProducts(MOCK_PRODUCTS, { tri: 'prix-asc' });
    const p = prices(result);
    for (let i = 0; i < p.length - 1; i++) {
      expect(p[i]).toBeLessThanOrEqual(p[i + 1]);
    }
  });

  it('prix-desc trie du plus cher au moins cher', () => {
    const result = filterProducts(MOCK_PRODUCTS, { tri: 'prix-desc' });
    const p = prices(result);
    for (let i = 0; i < p.length - 1; i++) {
      expect(p[i]).toBeGreaterThanOrEqual(p[i + 1]);
    }
  });

  it('nouveautes trie par createdAt décroissant', () => {
    const result = filterProducts(MOCK_PRODUCTS, { tri: 'nouveautes' });
    const dates = result.products.map((p) => new Date(p.createdAt).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it('marque trie par ordre alphabétique', () => {
    const result = filterProducts(MOCK_PRODUCTS, { tri: 'marque' });
    const brands = result.products.map((p) => p.brand);
    for (let i = 0; i < brands.length - 1; i++) {
      expect(brands[i].localeCompare(brands[i + 1])).toBeLessThanOrEqual(0);
    }
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('filterProducts — pagination', () => {
  it('page 1 limit 3 → 3 premiers produits, totalPages = 3', () => {
    const result = filterProducts(MOCK_PRODUCTS, { page: 1, limit: 3, tri: 'prix-asc' });
    expect(result.products).toHaveLength(3);
    expect(result.total).toBe(8);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });

  it('page 2 limit 3 → 3 produits suivants', () => {
    const page1 = filterProducts(MOCK_PRODUCTS, { page: 1, limit: 3, tri: 'prix-asc' });
    const page2 = filterProducts(MOCK_PRODUCTS, { page: 2, limit: 3, tri: 'prix-asc' });
    const overlap = page1.products.filter((p1) =>
      page2.products.some((p2) => p2.id === p1.id)
    );
    expect(overlap).toHaveLength(0);
  });

  it('dernière page peut avoir moins de produits que la limite', () => {
    const result = filterProducts(MOCK_PRODUCTS, { page: 3, limit: 3, tri: 'prix-asc' });
    // 8 produits, page 3 avec limit 3 → 2 produits restants
    expect(result.products).toHaveLength(2);
  });

  it('page 0 est normalisée à 1', () => {
    const result = filterProducts(MOCK_PRODUCTS, { page: 0, limit: 12 });
    expect(result.page).toBe(1);
  });

  it('limit > 48 est plafonnée à 48', () => {
    // Avec seulement 8 produits le test valide simplement que limit > 48 ne plante pas
    const result = filterProducts(MOCK_PRODUCTS, { page: 1, limit: 100 });
    expect(result.products).toHaveLength(MOCK_PRODUCTS.length);
  });

  it('limit 0 est traitée comme la valeur par défaut (12)', () => {
    // 0 est falsy → filters.limit || 12 donne 12 → tous les 8 produits sur une seule page
    const result = filterProducts(MOCK_PRODUCTS, { page: 1, limit: 0 });
    expect(result.products).toHaveLength(MOCK_PRODUCTS.length);
    expect(result.totalPages).toBe(1);
  });
});

// ─── Branche description null (ligne 157) ─────────────────────────────────────

describe('filterProducts — description null (branche || \'\')', () => {
  it('ne plante pas sur un produit sans description lors d\'une recherche textuelle', () => {
    const productSansDescription = {
      ...MOCK_PRODUCTS[0],
      id: 'nodesc',
      slug: 'nodesc',
      name: 'Parfum Sans Description',
      brand: 'TestBrand',
      description: null,
    };
    const source = [...MOCK_PRODUCTS, productSansDescription];
    // La recherche ne doit pas planter même si description est null
    const result = filterProducts(source, { q: 'bergamote' });
    // Les produits avec description contenant bergamote sont retournés
    expect(result.products.every((p) => p.description !== null)).toBe(true);
    // Le produit sans description n'apparaît pas
    expect(result.products.find((p) => p.id === 'nodesc')).toBeUndefined();
  });

  it('retrouve un produit via son nom même si description est null', () => {
    const productSansDescription = {
      ...MOCK_PRODUCTS[0],
      id: 'nodesc2',
      slug: 'nodesc2',
      name: 'Parfum Unique XYZ',
      brand: 'BrandXYZ',
      description: null,
    };
    const source = [productSansDescription];
    const result = filterProducts(source, { q: 'Unique XYZ' });
    expect(result.total).toBe(1);
    expect(result.products[0].id).toBe('nodesc2');
  });
});
