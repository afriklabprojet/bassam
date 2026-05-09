import type { Product, ProductFilters, ProductsResponse } from '@/types/product.types';

// ─── Mock dataset ────────────────────────────────────────────────────────────
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'dior-sauvage-edt',
    name: 'Sauvage Eau de Toilette',
    brand: 'Dior',
    description:
      "Un parfum masculin emblématique. Frais et minéral avec des notes de bergamote de Calabre, de poivre de Sichuan et d'ambroxan.",
    price: 85000,
    originalPrice: 95000,
    categoryId: 'cat-homme',
    categoryName: 'Parfums Homme',
    gender: 'homme',
    stockQuantity: 15,
    isFeatured: true,
    images: ['/images/products/product-placeholder.svg'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    slug: 'carolina-herrera-good-girl',
    name: 'Good Girl',
    brand: 'Carolina Herrera',
    description:
      'Un parfum féminin audacieux en flacon chaussure iconique. Alliance de jasmin sambac et de cacao torréfié.',
    price: 92000,
    originalPrice: null,
    categoryId: 'cat-femme',
    categoryName: 'Parfums Femme',
    gender: 'femme',
    stockQuantity: 8,
    isFeatured: true,
    images: ['/images/products/product-placeholder.svg'],
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: '3',
    slug: 'ysl-black-opium',
    name: 'Black Opium',
    brand: 'Yves Saint Laurent',
    description:
      'Une addiction gourmande et chic. Les notes de café noir, de vanille blanche et de jasmin créent un sillage envoûtant.',
    price: 88000,
    originalPrice: 98000,
    categoryId: 'cat-femme',
    categoryName: 'Parfums Femme',
    gender: 'femme',
    stockQuantity: 12,
    isFeatured: true,
    images: ['/images/products/product-placeholder.svg'],
    createdAt: '2025-02-01T00:00:00Z',
  },
  {
    id: '4',
    slug: 'tom-ford-oud-wood',
    name: 'Oud Wood',
    brand: 'Tom Ford',
    description:
      'Un bois oud rare adouci de bois de rose, cardamome épicée, santal, vétiver et notes ambrées.',
    price: 185000,
    originalPrice: null,
    categoryId: 'cat-mixte',
    categoryName: 'Parfums Mixtes',
    gender: 'mixte',
    stockQuantity: 5,
    isFeatured: true,
    images: ['/images/products/product-placeholder.svg'],
    createdAt: '2025-02-10T00:00:00Z',
  },
  {
    id: '5',
    slug: 'lancome-la-vie-est-belle',
    name: 'La Vie Est Belle',
    brand: 'Lancôme',
    description:
      "La féminité libre et heureuse. Un bouquet de fleurs blanches sur un fond gourmand d'iris, de praline et de vanille.",
    price: 79000,
    originalPrice: 89000,
    categoryId: 'cat-femme',
    categoryName: 'Parfums Femme',
    gender: 'femme',
    stockQuantity: 20,
    isFeatured: false,
    images: ['/images/products/product-placeholder.svg'],
    createdAt: '2025-03-01T00:00:00Z',
  },
  {
    id: '6',
    slug: 'chanel-bleu-de-chanel',
    name: 'Bleu de Chanel',
    brand: 'Chanel',
    description:
      "La liberté faite fragrance. Frais et boisé, un parfum de caractère pour l'homme qui fait ses propres choix.",
    price: 110000,
    originalPrice: null,
    categoryId: 'cat-homme',
    categoryName: 'Parfums Homme',
    gender: 'homme',
    stockQuantity: 10,
    isFeatured: true,
    images: ['/images/products/product-placeholder.svg'],
    createdAt: '2025-03-15T00:00:00Z',
  },
  {
    id: '7',
    slug: 'jo-malone-peony-blush-suede',
    name: 'Peony & Blush Suede',
    brand: 'Jo Malone London',
    description: 'Pivoine fraîche et suède doux. Un parfum féminin et délicat aux notes florales.',
    price: 125000,
    originalPrice: null,
    categoryId: 'cat-femme',
    categoryName: 'Parfums Femme',
    gender: 'femme',
    stockQuantity: 7,
    isFeatured: false,
    images: ['/images/products/product-placeholder.svg'],
    createdAt: '2025-04-01T00:00:00Z',
  },
  {
    id: '8',
    slug: 'givenchy-gentleman-eau-de-parfum',
    name: 'Gentleman EDP',
    brand: 'Givenchy',
    description:
      "Le raffinement masculin absolu. Iris, bois d'ébène et cuir s'entrelacent dans une fragrance inoubliable.",
    price: 75000,
    originalPrice: 82000,
    categoryId: 'cat-homme',
    categoryName: 'Parfums Homme',
    gender: 'homme',
    stockQuantity: 18,
    isFeatured: false,
    images: ['/images/products/product-placeholder.svg'],
    createdAt: '2025-04-15T00:00:00Z',
  },
];

// ─── Pure filter / sort / paginate logic ─────────────────────────────────────

export function filterProducts(
  source: Product[],
  filters: ProductFilters
): ProductsResponse {
  let products = [...source];

  // 1. Recherche textuelle (nom, marque, description)
  if (filters.q) {
    const q = filters.q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    );
  }

  // 2. Filtre par genre
  if (filters.gender) {
    products = products.filter((p) => p.gender === filters.gender);
  }

  // 3. Filtre par slug de catégorie
  if (filters.category) {
    const slug = filters.category;
    if (['homme', 'femme', 'mixte'].includes(slug)) {
      products = products.filter((p) => p.gender === slug);
    }
  }

  // 4. Plage de prix
  if (filters.minPrice !== undefined) {
    products = products.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    products = products.filter((p) => p.price <= filters.maxPrice!);
  }

  // 5. Promotions
  if (filters.promo) {
    products = products.filter((p) => p.originalPrice !== null);
  }

  // 6. Produits mis en avant
  if (filters.featured) {
    products = products.filter((p) => p.isFeatured);
  }

  // 7. Tri
  switch (filters.tri) {
    case 'prix-asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'prix-desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'nouveautes':
      products.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case 'marque':
      products.sort((a, b) => a.brand.localeCompare(b.brand));
      break;
    default:
      // Par défaut : produits mis en avant d'abord
      products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  // 8. Pagination
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(48, Math.max(1, filters.limit || 12));
  const total = products.length;
  const totalPages = Math.ceil(total / limit);
  const paginated = products.slice((page - 1) * limit, page * limit);

  return { products: paginated, total, page, totalPages };
}
