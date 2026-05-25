'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import type { Product, ProductFilters } from '@/types/product.types';

const SORT_OPTIONS = [
  { value: '', label: 'Pertinence' },
  { value: 'nouveautes', label: 'Nouveautés' },
  { value: 'prix-asc', label: 'Prix croissant' },
  { value: 'prix-desc', label: 'Prix décroissant' },
  { value: 'marque', label: 'Marque A-Z' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'femme', label: 'Femme' },
  { value: 'homme', label: 'Homme' },
  { value: 'mixte', label: 'Mixte' },
];

function ProduitsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Derive filters from URL
  const currentFilters: ProductFilters = {
    q: searchParams.get('q') || undefined,
    gender: (searchParams.get('gender') as ProductFilters['gender']) || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    tri: (searchParams.get('tri') as ProductFilters['tri']) || undefined,
    filtre: searchParams.get('filtre') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  } as ProductFilters;

  const searchKey = searchParams.toString();

  useEffect(() => {
    let cancelled = false;
    const sp = new URLSearchParams(searchKey);
    const params = new URLSearchParams();
    const q = sp.get('q');
    const gender = sp.get('gender');
    const minPrice = sp.get('minPrice');
    const maxPrice = sp.get('maxPrice');
    const tri = sp.get('tri');
    const filtre = sp.get('filtre');
    const page = sp.get('page');
    if (q) params.set('q', q);
    if (gender) params.set('gender', gender);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (tri) params.set('tri', tri);
    if (filtre) params.set('filtre', filtre);
    if (page && Number(page) > 1) params.set('page', page);

    void (async () => {
      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        if (cancelled) return;
        if (!res.ok) throw new Error('Erreur chargement');
        const data = await res.json();
        if (cancelled) return;
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [searchKey]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // reset to page 1 on filter change
    router.push(`/produits?${params.toString()}`);
  };

  const pageTitle = currentFilters.q
    ? `Résultats pour "${currentFilters.q}"`
    : searchParams.get('filtre') === 'promo'
    ? 'Promotions en cours'
    : 'Tous nos parfums';

  return (
    <div className="min-h-screen" style={{ background: 'var(--offwhite)' }}>
      {/* Page header */}
      <div style={{ background: 'var(--noir)', paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="container mx-auto">
          <span className="label" style={{ color: 'var(--gold)' }}>Catalogue</span>
          <h1 className="heading-lg text-white mt-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}>{pageTitle}</h1>
          {!loading && (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 300 }}>{total} produit{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto py-10">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Gender filter pills */}
            <div className="flex gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter('gender', opt.value)}
                  className="px-4 py-2 rounded text-xs font-medium border transition-all"
                  style={{
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    ...(currentFilters.gender || '') === opt.value
                      ? { background: 'var(--noir)', color: '#fff', borderColor: 'var(--noir)' }
                      : { background: '#fff', color: 'var(--text-secondary)', borderColor: 'var(--line-light)' }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Filters toggle (mobile) */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded border border-line bg-white text-txt2 text-xs font-medium hover:border-txt2 transition-colors" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-sm text-txt2 whitespace-nowrap">Trier par :</label>
            <select
              id="sort"
              value={currentFilters.tri || ''}
              onChange={(e) => updateFilter('tri', e.target.value)}
              className="input" style={{ height: '38px', fontSize: '0.8125rem', width: 'auto', padding: '0 12px' }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Extended filters panel */}
        {filtersOpen && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Prix minimum (XOF)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="ex: 50000"
                  defaultValue={currentFilters.minPrice || ''}
                  onBlur={(e) => updateFilter('minPrice', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Prix maximum (XOF)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="ex: 200000"
                  defaultValue={currentFilters.maxPrice || ''}
                  onBlur={(e) => updateFilter('maxPrice', e.target.value)}
                  className="input"
                />
              </div>
              <div className="col-span-2 flex items-end">
                <button
                  onClick={() => {
                    router.push('/produits');
                    setFiltersOpen(false);
                  }}
                  className="px-4 py-2 text-sm hover:text-red-600 transition-colors underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--r-md)', marginBottom: '0.75rem' }} />
                <div className="skeleton" style={{ height: '10px', width: '40%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '14px', width: '70%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '14px', width: '30%' }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div style={{ width: '64px', height: '64px', marginBottom: '1.5rem', border: '1px solid var(--line-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '28px', height: '28px', color: 'var(--text-pale)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Aucun produit trouvé</h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Essayez de modifier vos filtres ou votre recherche.</p>
            <button
              onClick={() => router.push('/produits')}
              className="btn-primary"
            >
              Voir tous les parfums
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.slug}
                  productId={product.id}
                  name={product.name}
                  brand={product.brand}
                  price={product.price}
                  originalPrice={product.originalPrice ?? undefined}
                  image={product.images[0] || '/images/products/product-placeholder.svg'}
                  category={product.gender || 'mixte'}
                  inStock={product.stockQuantity > 0}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => updateFilter('page', String(p))}
                      className={`w-10 h-10 rounded text-sm font-medium transition-all ${
                        p === (currentFilters.page || 1)
                          ? 'text-white'
                          : 'bg-white border border-line text-txt2 hover:border-txt2'
                      }`}
                      style={
                        p === (currentFilters.page || 1)
                          ? { background: 'var(--noir)' }
                          : {}
                      }
                      aria-label={`Page ${p}`}
                      aria-current={p === (currentFilters.page || 1) ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProduitsClient() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--line-light)', borderTopColor: 'var(--gold)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <ProduitsContent />
    </Suspense>
  );
}
