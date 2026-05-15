import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import Newsletter from '@/components/Newsletter';
import ScrollAnimations from '@/components/ScrollAnimations';
import Link from 'next/link';

import { getProducts, getProductCountsByGender } from '@/lib/supabase/products';
import { getApprovedReviews } from '@/lib/supabase/reviews';
import { getHomeUnivers } from '@/lib/supabase/home-content';

export const dynamic = 'force-dynamic';

// ─── Contenu éditorial (statique) — descriptions, palettes, notes olfactives
const UNIVERS_META = [
  {
    slug: 'femme',
    name: 'Femme',
    tagline: 'La féminité sublimée',
    description: 'Floraux envoûtants, orientaux profonds, boisés soyeux — les plus grandes maisons pour elle.',
    notes: ['Jasmin', 'Rose', 'Vanille', 'Oud'],
    gradient: 'linear-gradient(135deg,#F9EFE8 0%,#EDD9C8 100%)',
    dot: '#C5A55A',
  },
  {
    slug: 'homme',
    name: 'Homme',
    tagline: 'La force en signature',
    description: 'Fraîcheurs marines, bois nobles, muscs intenses — des fragrances qui définissent le caractère.',
    notes: ['Cèdre', 'Vétiver', 'Bergamote', 'Ambre'],
    gradient: 'linear-gradient(135deg,#EEF1F5 0%,#D6DDE7 100%)',
    dot: '#7896B2',
  },
  {
    slug: 'mixte',
    name: 'Mixte',
    tagline: 'Au-delà des genres',
    description: 'Fragrances unisexes qui transcendent les conventions et les saisons.',
    notes: ['Poivre', 'Santal', 'Iris', 'Patchouli'],
    gradient: 'linear-gradient(135deg,#F3EFE9 0%,#E2D9CB 100%)',
    dot: '#A89B7A',
  },
];



// ─── Produits démo (dev uniquement — remplacés dès que la BDD est connectée) ──
const DEV_MOCK_PRODUCTS = process.env.NODE_ENV === 'development' ? [
  { id: 'mock-1', name: 'Sauvage Eau de Parfum', slug: 'sauvage-edp', brand: 'Dior', description: null, price: 85000, originalPrice: 95000, categoryId: null, categoryName: 'Homme', gender: 'homme' as const, stockQuantity: 25, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-2', name: "J'adore Infinissime", slug: 'jadore-infinissime', brand: 'Dior', description: null, price: 92000, originalPrice: null, categoryId: null, categoryName: 'Femme', gender: 'femme' as const, stockQuantity: 18, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-3', name: 'Bleu de Chanel', slug: 'bleu-de-chanel', brand: 'Chanel', description: null, price: 78000, originalPrice: null, categoryId: null, categoryName: 'Homme', gender: 'homme' as const, stockQuantity: 30, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-4', name: 'La Vie est Belle', slug: 'la-vie-est-belle', brand: 'Lancôme', description: null, price: 65000, originalPrice: 72000, categoryId: null, categoryName: 'Femme', gender: 'femme' as const, stockQuantity: 22, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-5', name: 'Aventus', slug: 'aventus', brand: 'Creed', description: null, price: 195000, originalPrice: null, categoryId: null, categoryName: 'Homme', gender: 'homme' as const, stockQuantity: 8, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-6', name: 'Oud Wood', slug: 'oud-wood', brand: 'Tom Ford', description: null, price: 145000, originalPrice: null, categoryId: null, categoryName: 'Mixte', gender: 'mixte' as const, stockQuantity: 12, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-7', name: 'Baccarat Rouge 540', slug: 'baccarat-rouge-540', brand: 'Maison Francis Kurkdjian', description: null, price: 220000, originalPrice: null, categoryId: null, categoryName: 'Mixte', gender: 'mixte' as const, stockQuantity: 5, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-8', name: 'Coco Mademoiselle', slug: 'coco-mademoiselle', brand: 'Chanel', description: null, price: 82000, originalPrice: null, categoryId: null, categoryName: 'Femme', gender: 'femme' as const, stockQuantity: 20, isFeatured: false, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-9', name: 'Black Opium', slug: 'black-opium', brand: 'Yves Saint Laurent', description: null, price: 76000, originalPrice: 88000, categoryId: null, categoryName: 'Femme', gender: 'femme' as const, stockQuantity: 15, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-10', name: 'Acqua di Giò Profondo', slug: 'acqua-di-gio-profondo', brand: 'Giorgio Armani', description: null, price: 71000, originalPrice: null, categoryId: null, categoryName: 'Homme', gender: 'homme' as const, stockQuantity: 28, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-11', name: 'Santal 33', slug: 'santal-33', brand: 'Le Labo', description: null, price: 185000, originalPrice: null, categoryId: null, categoryName: 'Mixte', gender: 'mixte' as const, stockQuantity: 6, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-12', name: 'Flower Bomb', slug: 'flower-bomb', brand: 'Viktor & Rolf', description: null, price: 68000, originalPrice: 75000, categoryId: null, categoryName: 'Femme', gender: 'femme' as const, stockQuantity: 14, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-13', name: '1 Million', slug: '1-million', brand: 'Paco Rabanne', description: null, price: 62000, originalPrice: null, categoryId: null, categoryName: 'Homme', gender: 'homme' as const, stockQuantity: 22, isFeatured: false, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-14', name: "La Nuit de L'Homme", slug: 'la-nuit-de-l-homme', brand: 'Yves Saint Laurent', description: null, price: 59000, originalPrice: 68000, categoryId: null, categoryName: 'Homme', gender: 'homme' as const, stockQuantity: 19, isFeatured: false, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-15', name: 'Rose Oud', slug: 'rose-oud', brand: 'Montale', description: null, price: 112000, originalPrice: null, categoryId: null, categoryName: 'Mixte', gender: 'mixte' as const, stockQuantity: 10, isFeatured: true, images: [], createdAt: new Date().toISOString() },
  { id: 'mock-16', name: 'Miss Dior Chérie', slug: 'miss-dior-cherie', brand: 'Dior', description: null, price: 79000, originalPrice: null, categoryId: null, categoryName: 'Femme', gender: 'femme' as const, stockQuantity: 17, isFeatured: false, images: [], createdAt: new Date().toISOString() },
] : [];

function ProductSectionEmptyState() {
  return (
    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 1rem' }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        La sélection arrive très vite.
      </p>
      <p style={{ marginBottom: '1.5rem' }}>
        Contactez-nous pour connaître les parfums disponibles aujourd&apos;hui.
      </p>
      <Link href="/contact" className="btn-ghost">
        Contacter la boutique
      </Link>
    </div>
  );
}

export default async function HomePage() {
  // ─── Fetch Supabase data en parallèle ────────────────────────────────────
  const [{ products: rawBestSellers }, genderCounts, reviews, universDB] = await Promise.all([
    getProducts({ featured: true, limit: 8 }).catch(() => ({ products: [], total: 0, page: 1, totalPages: 0 })),
    getProductCountsByGender().catch(() => ({} as Record<string, number>)),
    getApprovedReviews(6).catch(() => []),
    getHomeUnivers().catch(() => []),
  ]);

  // Si aucun produit featured en DB → fallback : 8 derniers produits
  const { products: fallbackProducts } = rawBestSellers.length === 0
    ? await getProducts({ limit: 8 }).catch(() => ({ products: [], total: 0, page: 1, totalPages: 0 }))
    : { products: [] };

  // Si BDD vide ou indisponible → produits démo (dev uniquement)
  const dbProducts = rawBestSellers.length > 0 ? rawBestSellers : fallbackProducts;
  const bestSellers = dbProducts.length > 0 ? dbProducts : DEV_MOCK_PRODUCTS;
  const newArrivals = DEV_MOCK_PRODUCTS.length > 8 ? DEV_MOCK_PRODUCTS.slice(8) : bestSellers;

  // Fusionner les compteurs réels avec le contenu éditorial
  // En dev sans BDD : compter depuis les mocks pour affichage cohérent
  const mockCountsByGender = DEV_MOCK_PRODUCTS.reduce((acc, p) => {
    if (p.gender) acc[p.gender] = (acc[p.gender] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const effectiveCounts = Object.keys(genderCounts).length > 0 ? genderCounts : mockCountsByGender;
  // Fusionner textes DB sur les métadonnées statiques (gradient, dot, name restent fixes)
  const UNIVERS = UNIVERS_META.map((u) => {
    const db = universDB.find((d) => d.slug === u.slug);
    return {
      ...u,
      ...(db ? { tagline: db.tagline, description: db.description, notes: db.notes } : {}),
      productsCount: effectiveCounts[u.slug] ?? 0,
    };
  });
  return (
    <>
      {/* Animations de scroll automatiques */}
      <ScrollAnimations />
      
      {/* ══ HERO — sombre, identité de marque ══ */}
      <Hero />

      {/* ══ BANDE OR — confiance immédiate ══ */}
      <div style={{ background: 'var(--gold)', padding: '0.875rem 0' }}>
        <div
          className="container mx-auto"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem 2.5rem' }}
        >
          {['Authenticité 100% garantie', 'Livraison sous 24h à Abidjan', 'Paiement Mobile Money accepté', '+500 clients satisfaits'].map((t) => (
            <span
              key={t}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff' }}
            >
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'inline-block' }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ══ NOS UNIVERS — fond blanc, cartes chaudes ══ */}
      <section style={{ background: '#fff', padding: '8rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '4rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="label">Nos univers</span>
              <h2
                style={{ marginTop: '0.625rem', fontSize: 'clamp(2rem,4vw,3rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}
              >
                Trouvez votre<br />
                <em style={{ color: 'var(--gold)' }}>signature olfactive</em>
              </h2>
            </div>
            <Link href="/collections" className="btn-ghost" style={{ flexShrink: 0 }}>
              Voir toutes les collections
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {UNIVERS.map((u) => (
              <Link
                key={u.slug}
                href={`/collections/${u.slug}`}
                className="group univers-card"
                style={{ display: 'block', textDecoration: 'none', borderRadius: 'var(--r-lg)', border: '1px solid var(--line-light)', overflow: 'hidden', background: '#fff' }}
              >
                {/* Visuel couleur */}
                <div className="univers-card-visual" style={{ height: '10rem', background: u.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div aria-hidden style={{ position: 'absolute', bottom: '-3rem', right: '-3rem', width: '9rem', height: '9rem', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', transition: 'transform 0.6s ease' }} />
                  <span
                    className="heading-display"
                    style={{ fontSize: 'clamp(3rem,5vw,4rem)', fontStyle: 'italic', color: 'rgba(0,0,0,0.1)', userSelect: 'none', position: 'relative' }}
                  >
                    {u.name}
                  </span>
                </div>
                {/* Corps de la carte */}
                <div style={{ padding: '1.5rem', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: u.dot, flexShrink: 0 }} />
                    <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {u.tagline}
                    </p>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {u.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.125rem' }}>
                    {u.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.125rem' }}>
                    {u.notes.map((n) => (
                      <span
                        key={n}
                        style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', background: 'var(--offwhite)', color: 'var(--text-secondary)', border: '1px solid var(--line-light)' }}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--line-light)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: u.dot }}>
                      {u.productsCount} parfums
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Découvrir
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BESTSELLERS — fond crème ══ */}
      <section id="top-ventes" style={{ background: 'var(--offwhite)', padding: '8rem 0' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="label">Nouveautés</span>
              <h2
                className="heading-display"
                style={{ marginTop: '0.625rem', fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}
              >
                Nos dernières arrivées
              </h2>
            </div>
            <Link href="/produits" className="btn-ghost" style={{ flexShrink: 0 }}>
              Voir toutes les nouveautés
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {bestSellers.length === 0 ? (
              <ProductSectionEmptyState />
            ) : (
              bestSellers.map((p) => (
                <ProductCard
                  key={p.slug}
                  id={p.slug}
                  name={p.name}
                  brand={p.brand}
                  price={p.price}
                  originalPrice={p.originalPrice ?? undefined}
                  image={p.images[0] ?? '/images/products/product-placeholder.svg'}
                  category={p.gender ?? 'mixte'}
                  inStock={p.stockQuantity > 0}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ══ NOUVEAUTÉS 2 — sélection de la semaine ══ */}
      <section style={{ background: '#fff', padding: '8rem 0' }}>
        <div className="container mx-auto">

          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="label">Nouveautés</span>
              <h2
                className="heading-display"
                style={{ marginTop: '0.625rem', fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}
              >
                La sélection de la semaine
              </h2>
            </div>
            <Link href="/produits" className="btn-ghost" style={{ flexShrink: 0 }}>
              Explorer tout le catalogue
            </Link>
          </div>

          {/* Grille produits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {newArrivals.length === 0 ? (
              <ProductSectionEmptyState />
            ) : (
              newArrivals.map((p) => (
                <ProductCard
                  key={p.slug}
                  id={p.slug}
                  name={p.name}
                  brand={p.brand}
                  price={p.price}
                  originalPrice={p.originalPrice ?? undefined}
                  image={p.images[0] ?? '/images/products/product-placeholder.svg'}
                  category={p.gender ?? 'mixte'}
                  inStock={p.stockQuantity > 0}
                />
              ))
            )}
          </div>

        </div>
      </section>

      {/* ══ TÉMOIGNAGES — fond crème, humain ══ */}
      <section style={{ background: 'var(--offwhite)', padding: '6rem 0' }}>
        <div className="container mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="label">Avis clients</span>
            <h2
              className="heading-display"
              style={{ marginTop: '0.625rem', fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: 'var(--text-primary)' }}
            >
              Ils nous font confiance
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.map((t) => (
              <div
                key={t.id}
                className="testimonial-card"
                style={{ background: '#fff', borderRadius: 'var(--r-lg)', padding: '2rem', border: '1px solid var(--line-light)', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}
              >
                {/* Étoiles */}
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <svg key={n} width="13" height="13" viewBox="0 0 24 24" fill={n <= t.rating ? 'var(--gold)' : 'none'} stroke={n <= t.rating ? 'none' : 'var(--text-secondary)'} strokeWidth="1.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                {/* Témoignage */}
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'var(--font-serif)', flex: 1 }}>
                  &ldquo;{t.texte}&rdquo;
                </p>
                {/* Auteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--line-light)' }}>
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{t.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.ville}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CITATION ÉDITORIALE — fond blanc ══ */}
      <section style={{ background: '#fff', padding: '6rem 0', borderTop: '1px solid var(--line-light)', borderBottom: '1px solid var(--line-light)' }}>
        <div className="container mx-auto" style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto' }}>
          <div style={{ width: 48, height: 1, background: 'var(--gold)', margin: '0 auto 2.5rem' }} />
          <blockquote
            className="heading-display"
            style={{ fontSize: 'clamp(1.625rem,3vw,2.5rem)', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.3 }}
          >
            &ldquo;Un parfum n&apos;est pas seulement un accessoire &mdash; c&apos;est la mémoire que vous laissez derrière vous.&rdquo;
          </blockquote>
          <div style={{ width: 48, height: 1, background: 'var(--gold)', margin: '2.5rem auto 1.5rem' }} />
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            VIP Parfumerie Bar &mdash; Abidjan
          </p>
        </div>
      </section>

      {/* ══ NEWSLETTER — sombre, cadre final ══ */}
      <Newsletter />
    </>
  );
}
