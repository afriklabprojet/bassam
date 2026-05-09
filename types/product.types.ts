// Shared product type used across the app
export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  categoryId: string | null;
  categoryName: string | null;
  gender: 'homme' | 'femme' | 'mixte' | null;
  stockQuantity: number;
  isFeatured: boolean;
  images: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productsCount?: number;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  gender?: 'homme' | 'femme' | 'mixte';
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  featured?: boolean;
  promo?: boolean;
  tri?: 'prix-asc' | 'prix-desc' | 'nouveautes' | 'popularite' | 'marque';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}
