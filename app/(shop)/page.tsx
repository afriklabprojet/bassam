import { SITE_URL as BASE_URL } from '@/lib/site-config';
import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import Newsletter from '@/components/Newsletter';
import ScrollAnimations from '@/components/ScrollAnimations';
import Link from 'next/link';
import Image from 'next/image';

import { getProducts, getProductCountsByCategory } from '@/lib/supabase/products';
import { getApprovedReviews } from '@/lib/supabase/reviews';
import { getHomeUnivers } from '@/lib/supabase/home-content';
import { getHomeHero } from '@/lib/supabase/home-hero';

export const dynamic = 'force-dynamic';


export const metadata: Metadata = {
  title: 'VIP Parfumerie Bar — Parfums de Luxe Authentiques à Abidjan, Côte d\'Ivoire',
  description: 'Boutique de parfums de luxe authentiques à Abidjan. Chanel, Dior, YSL, Tom Ford livrés partout en Côte d\'Ivoire et en Afrique de l\'Ouest. Paiement Mobile Money.',
  keywords: 'parfum luxe Abidjan, parfumerie Côte d\'Ivoire, parfum authentique Abidjan, boutique parfum Abidjan, parfum Dior Abidjan, parfum Chanel Abidjan, livraison parfum Côte d\'Ivoire, Mobile Money parfum',
  alternates: { canonical: BASE_URL },
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    url: BASE_URL,
    siteName: 'VIP Parfumerie Bar',
    title: 'VIP Parfumerie Bar — Parfums de Luxe à Abidjan',
    description: 'Boutique de parfums de luxe authentiques à Abidjan. Livraison en Côte d\'Ivoire et Afrique de l\'Ouest.',
    images: [{ url: `${BASE_URL}/og-image.svg`, width: 1200, height: 630, alt: 'VIP Parfumerie Bar — Parfums de Luxe Abidjan' }],
  },
};

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
  const [{ products: rawNewArrivals }, { products: rawFeatured }, categoryCounts, reviews, universDB, homeHero] = await Promise.all([
    getProducts({ tri: 'nouveautes', limit: 8 }).catch(() => ({ products: [], total: 0, page: 1, totalPages: 0 })),
    getProducts({ featured: true, limit: 8 }).catch(() => ({ products: [], total: 0, page: 1, totalPages: 0 })),
    getProductCountsByCategory().catch(() => ({} as Record<string, number>)),
    getApprovedReviews(6).catch(() => []),
    getHomeUnivers().catch(() => []),
    getHomeHero(),
  ]);

  const newArrivals = rawNewArrivals;
  const featuredProducts = rawFeatured;
  const effectiveCounts = categoryCounts;
  // Fusionner textes + image DB sur les métadonnées statiques (gradient, dot, name restent fixes)
  const UNIVERS = UNIVERS_META.map((u) => {
    const db = universDB.find((d) => d.slug === u.slug);
    return {
      ...u,
      ...(db ? { tagline: db.tagline, description: db.description, notes: db.notes } : {}),
      image: db?.image_url || '',
      productsCount: effectiveCounts[u.slug] ?? 0,
    };
  });
  // ─── JSON-LD : LocalBusiness + Organization + WebSite ────────────────────
  const localBusinessLd = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Store'],
    '@id': `${BASE_URL}/#local-business`,
    name: 'VIP Parfumerie Bar',
    url: BASE_URL,
    logo: `${BASE_URL}/icons/icon-192x192.png`,
    image: `${BASE_URL}/og-image.svg`,
    description: 'Boutique de parfums de luxe authentiques à Abidjan. Chanel, Dior, YSL, Tom Ford. Livraison partout en Côte d\'Ivoire et Afrique de l\'Ouest.',
    priceRange: '$$',
    telephone: process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY || '',
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Abidjan',
      addressCountry: 'CI',
      addressRegion: 'Abidjan',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 5.3484,
      longitude: -4.0107,
    },
    areaServed: [
      { '@type': 'Country', name: 'Côte d\'Ivoire' },
      { '@type': 'Country', name: 'Burkina Faso' },
      { '@type': 'Country', name: 'Sénégal' },
      { '@type': 'Country', name: 'Mali' },
    ],
    currenciesAccepted: 'XOF',
    paymentAccepted: 'Orange Money, MTN Money, Wave, Moov Money, Djamo',
    sameAs: [
      process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
    ].filter(Boolean),
  };

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'VIP Parfumerie Bar',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/icons/icon-192x192.png`,
      width: 192,
      height: 192,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['French'],
    },
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name: 'VIP Parfumerie Bar',
    inLanguage: 'fr-CI',
    publisher: { '@id': `${BASE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/produits?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      {/* Animations de scroll automatiques */}
      <ScrollAnimations />
      
      {/* ══ HERO — sombre, identité de marque ══ */}
      <Hero content={homeHero} />

      {/* ══ BANDE OR — confiance immédiate ══ */}
      <div style={{ background: 'var(--gold)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            padding: '0.75rem 1.5rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {['Authenticité 100% garantie', 'Livraison sous 24h à Abidjan', 'Paiement Mobile Money accepté', '+500 clients satisfaits'].map((t) => (
            <span
              key={t}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff', flexShrink: 0 }}
            >
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'inline-block', flexShrink: 0 }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ══ SECTION 1 — nos nouveautés ══ */}
      <section id="nouveautes" className="section-sm" style={{ background: '#fff' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="label">Nos nouveautés</span>
              <h2
                className="heading-display"
                style={{ marginTop: '0.625rem', fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}
              >
                Dernières arrivées
              </h2>
            </div>
            <Link href="/collections/nouveautes" className="btn-ghost" style={{ flexShrink: 0 }}>
              Voir toutes les nouveautés
            </Link>
          </div>

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
                  category={p.category ?? 'mixte'}
                  inStock={p.stockQuantity > 0}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ══ SECTION 2 — sélection de la semaine ══ */}
      <section className="section-sm" style={{ background: 'var(--offwhite)' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="label">Coup de cœur</span>
              <h2
                className="heading-display"
                style={{ marginTop: '0.625rem', fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}
              >
                Sélection de la semaine
              </h2>
            </div>
            <Link href="/produits?filtre=vedettes" className="btn-ghost" style={{ flexShrink: 0 }}>
              Voir toute la sélection
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {featuredProducts.length === 0 ? (
              <ProductSectionEmptyState />
            ) : (
              featuredProducts.map((p) => (
                <ProductCard
                  key={p.slug}
                  id={p.slug}
                  name={p.name}
                  brand={p.brand}
                  price={p.price}
                  originalPrice={p.originalPrice ?? undefined}
                  image={p.images[0] ?? '/images/products/product-placeholder.svg'}
                  category={p.category ?? 'mixte'}
                  inStock={p.stockQuantity > 0}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 — tout le catalogue ══ */}
      <section className="section-sm" style={{ background: '#fff' }}>
        <div className="container mx-auto">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <span className="label">Voir tout notre catalogue</span>
              <h2
                className="heading-display"
                style={{ marginTop: '0.625rem', fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: 'var(--text-primary)', lineHeight: 1.1 }}
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
                {/* Visuel */}
                <div className="univers-card-visual" style={{ height: '10rem', background: u.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {u.image ? (
                    <>
                      <Image
                        src={u.image}
                        alt={u.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        style={{ objectFit: 'cover' }}
                      />
                      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }} />
                      <span
                        className="heading-display"
                        style={{ position: 'absolute', bottom: '0.75rem', left: '1rem', fontSize: 'clamp(1.5rem,3vw,2rem)', fontStyle: 'italic', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
                      >
                        {u.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div aria-hidden style={{ position: 'absolute', bottom: '-3rem', right: '-3rem', width: '9rem', height: '9rem', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', transition: 'transform 0.6s ease' }} />
                      <span
                        className="heading-display"
                        style={{ fontSize: 'clamp(3rem,5vw,4rem)', fontStyle: 'italic', color: 'rgba(0,0,0,0.1)', userSelect: 'none', position: 'relative' }}
                      >
                        {u.name}
                      </span>
                    </>
                  )}
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

      {/* ══ SECTION 4 — avis clients et témoignages ══ */}
      <section className="testimonials-section">
        <div className="container mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="label">Avis clients</span>
            <h2
              className="heading-display"
              style={{ marginTop: '0.625rem', fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', color: 'var(--text-primary)' }}
            >
              Témoignages
            </h2>
          </div>
          <div className="testimonials-track grid md:grid-cols-3 gap-5" aria-label="Avis clients">
            {reviews.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 1rem' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Les premiers témoignages seront publiés très bientôt.
                </p>
                <p>Partagez votre expérience après votre prochaine commande.</p>
              </div>
            ) : reviews.map((t) => (
              <div
                key={t.id}
                className="testimonial-card testimonial-slide"
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

      {/* ══ NEWSLETTER — sombre, cadre final ══ */}
      <Newsletter />
    </>
  );
}
