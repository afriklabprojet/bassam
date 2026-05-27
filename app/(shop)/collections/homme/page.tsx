import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/product.types';
import { getApprovedReviews } from '@/lib/supabase/reviews';
export const dynamic = 'force-dynamic';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vipparfumeriebar.com';
export const metadata: Metadata = {
title: 'Parfums Homme à Abidjan -- Sauvage, Bleu de Chanel, Tom Ford | VIP Parfumerie Bar',
description: "Collection parfums homme à Abidjan -- Boisés élégants, orientaux intenses, signatures fraîches. Sauvage Dior, Bleu de Chanel, Tom Ford. Livraison Côte d'Ivoire.",
keywords: "parfum homme Abidjan, parfum masculin Côte d'Ivoire, Sauvage Dior Abidjan, Bleu de Chanel Abidjan, Tom Ford homme Abidjan",
alternates: { canonical: `${BASE_URL}/collections/homme` },
openGraph: {
title: 'Parfums Homme | VIP Parfumerie Bar Abidjan',
description: "Les meilleures fragrances masculines disponibles à Abidjan. Livraison Côte d'Ivoire.",
url: `${BASE_URL}/collections/homme`,
type: 'website',
locale: 'fr_CI',
},
};
// ─── Fragrance guides ─────────────────────────────────────────────────────────
const GUIDES = [
{
titre: 'Le Boisé Élégant',
description: "Cèdre, vétiver, santal -- l'arche tempérée du gentleman contemporain. Tenue 8-12h.",
icone: '□',
rep: ['Bleu de Chanel', "Terre d'Hermès", 'Wood & Fresh TF'],
},
{
titre: "L'Oriental Puissant",
description: 'Oud, ambre, résine -- pour ceux qui assument leur présence et laissent un sillage mémorable.',
icone: '◆',
rep: ['Oud Wood TF', 'Sauvage Elixir Dior', 'Roja Enigma'],
},
{
titre: 'Le Fraîcs Aquatique',
description: "Bergamote, cédrat, notes marines -- léger, d'une modernité impeccable. Idéal au bureau.",
icone: '○',
rep: ['Acqua di Giò', "L'Homme YSL", 'Gentleman Givenchy'],
},
{
titre: 'La Signature Chaude',
description: "Vanille, cuir, tabac -- une chaleur sensuelle qui s'intensifie sur la peau.",
icone: '▲',
rep: ['Spicebomb TF', 'A*Men Mugler', 'Dior Homme Intense'],
},
];
async function getHommeProducts(): Promise<Product[]> {
try {
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vipparfumeriebar.com';
const res = await fetch(`${baseUrl}/api/products?gender=homme`, { next: { revalidate: 60 } });
if (!res.ok) return [];
const data = await res.json();
return data.products || [];
} catch {
return [];
}
}
// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HommePage() {
const [products, reviews] = await Promise.all([
getHommeProducts(),
getApprovedReviews(4).catch(() => []),
]);
const productCountSuffix = products.length > 1 ? 's' : '';
const productCountLabel = products.length > 0
? `${products.length} référence${productCountSuffix}`
: 'Sélection disponible en boutique';
return (
<div style={{ minHeight: '100vh', background: 'var(--noir)' }}>
{/* ── Hero ──────────────────────────────────────────────────────────── */}
<section style={{ padding: '6rem 0 0', position: 'relative', overflow: 'hidden' }}>
{/* Gradient ambiance masculine -- bleu nuit + or */}
<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 25%, rgba(80,100,150,0.09) 0%, transparent 55%)' }} aria-hidden="true" />
<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 15% 70%, rgba(197,165,90,0.08) 0%, transparent 50%)' }} aria-hidden="true" />
<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(197,165,90,0.2), transparent)' }} aria-hidden="true" />
<div className="container mx-auto" style={{ position: 'relative' }}>
{/* Breadcrumb */}
<nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em' }}>
<Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Accueil</Link>
<span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
<Link href="/collections" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Collections</Link>
<span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
<span style={{ color: 'var(--gold)' }}>Homme</span>
</nav>
<div className="homme-hero-grid">
{/* Left -- Text */}
<div style={{ paddingBottom: '4.5rem' }}>
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
<svg width="16" height="16" viewBox="0 0 40 40" fill="none" aria-hidden="true">
<circle cx="20" cy="20" r="9" stroke="#C5A55A" strokeWidth="1.5"/>
<path d="M27 13l7-7M34 6h-5M34 6v5" stroke="#C5A55A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
<span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
Collection masculine
</span>
</div>
<h1 style={{
fontFamily: 'var(--font-serif)',
fontSize: 'clamp(3rem, 7vw, 5.5rem)',
fontWeight: 300,
color: 'var(--surface)',
lineHeight: 1,
letterSpacing: '-0.02em',
marginBottom: '1.5rem',
}}>
Homme
</h1>
<p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: 440 }}>
&ldquo;Le parfum, c&rsquo;est la première chose que l&rsquo;on remarque et la dernière dont on se souvient.&rdquo;
</p>
<p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 420, marginBottom: '2.5rem' }}>
Boisés élégants, orientaux intenses, fragrances fraiches -- des signatures masculines qui affirment sans imposer, pour chaque occasion.
</p>
<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
<Link href="#produits" style={{
display: 'inline-flex', alignItems: 'center', gap: 8,
background: 'var(--gold)', color: 'var(--noir)',
padding: '0.8rem 1.75rem',
fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
textDecoration: 'none',
}}>
Voir la collection
</Link>
<Link href="/services/consultation" style={{
display: 'inline-flex', alignItems: 'center', gap: 8,
border: '1px solid rgba(197,165,90,0.3)', color: 'var(--gold)',
padding: '0.8rem 1.5rem',
fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
textDecoration: 'none',
}}>
Conseil expert
</Link>
</div>
</div>
{/* Right -- Manifest card */}
<div style={{ position: 'relative' }}>
<div style={{
position: 'absolute', inset: 0,
background: 'linear-gradient(135deg, rgba(80,100,150,0.07) 0%, rgba(197,165,90,0.04) 100%)',
border: '1px solid rgba(197,165,90,0.12)',
}} />
<div style={{ padding: '2.75rem', position: 'relative' }}>
<div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '2rem' }}>
Programme olfactif
</div>
{[
{ step: '01', label: 'Définissez votre style' },
{ step: '02', label: "Choisissez l'intensité" },
{ step: '03', label: 'Faites le quiz' },
{ step: '04', label: 'Commandez' },
].map((s) => (
<div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(197,165,90,0.07)' }}>
<span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 300, color: 'rgba(197,165,90,0.25)', lineHeight: 1, minWidth: 36 }}>{s.step}</span>
<span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>{s.label}</span>
</div>
))}
<div style={{ marginTop: '1.75rem' }}>
<Link href="/services/quiz-olfactif" style={{
display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
background: 'transparent', border: '1px solid rgba(197,165,90,0.3)',
color: 'var(--gold)', padding: '0.7rem 1rem',
fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
textDecoration: 'none',
}}>
Trouver ma signature
</Link>
</div>
</div>
</div>
</div>
</div>
</section>
{/* ── Guide des familles ────────────────────────────────────────────── */}
<section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.10)', borderBottom: '1px solid rgba(197,165,90,0.10)', padding: '4.5rem 0' }}>
<div className="container mx-auto">
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
<span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
<span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
Guide olfactif
</span>
</div>
<div className="homme-guide-grid">
{GUIDES.map((g) => (
<div key={g.titre} style={{ padding: '2rem', border: '1px solid rgba(197,165,90,0.10)', background: 'var(--noir)' }}>
<div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '0.75rem' }} aria-hidden="true">{g.icone}</div>
<h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 400, color: 'var(--surface)', marginBottom: '0.6rem' }}>{g.titre}</h3>
<p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: '1.25rem' }}>{g.description}</p>
<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
{g.rep.map((r) => (
<span key={r} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
-- {r}
</span>
))}
</div>
</div>
))}
</div>
</div>
</section>
{/* ── Produits ─────────────────────────────────────────────────────── */}
<section id="produits" className="container mx-auto" style={{ padding: '5rem 0' }}>
<div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
<div>
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
<span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
<span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
Parfums Homme
</span>
</div>
<p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
{productCountLabel}
</p>
</div>
<Link href="/produits?gender=homme" style={{
fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase',
color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
}}>
Filtres avancés →
</Link>
</div>
{products.length === 0 ? (
<div style={{ textAlign: 'center', padding: '5rem 0' }}>
<p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)', marginBottom: '2rem' }}>
Chargement de la collection en cours…
</p>
<Link href="/produits?gender=homme" style={{
display: 'inline-flex', alignItems: 'center', gap: 8,
background: 'transparent', border: '1px solid rgba(197,165,90,0.35)',
color: 'var(--gold)', padding: '0.75rem 1.5rem',
fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
textDecoration: 'none',
}}>
Voir tous les parfums homme
</Link>
</div>
) : (
<>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
{products.map((p) => (
<ProductCard
key={p.id}
id={p.slug}
name={p.name}
brand={p.brand}
price={p.price}
originalPrice={p.originalPrice ?? undefined}
image={p.images[0] || '/images/products/product-placeholder.svg'}
category={p.gender || 'homme'}
inStock={p.stockQuantity > 0}
/>
))}
</div>
<div style={{ textAlign: 'center', marginTop: '3rem' }}>
<Link href="/produits?gender=homme" style={{
display: 'inline-flex', alignItems: 'center', gap: 8,
border: '1px solid rgba(197,165,90,0.35)', color: 'var(--gold)',
padding: '0.8rem 2rem',
fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
textDecoration: 'none',
}}>
Voir tous les parfums homme →
</Link>
</div>
</>
)}
</section>
{/* ── Témoignages ──────────────────────────────────────────────────── */}
<section style={{ background: 'var(--noir-soft)', borderTop: '1px solid rgba(197,165,90,0.08)', padding: '4rem 0' }}>
<div className="container mx-auto">
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
<span style={{ display: 'block', width: 20, height: '1px', background: 'var(--gold)' }} />
<span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
Ils en parlent
</span>
</div>
<div className="homme-temo-grid">
{reviews.length === 0 ? (
<p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1', textAlign: 'center' }}>Les premiers avis arrivent bientôt…</p>
) : reviews.map((t) => (
<div key={t.id} style={{ background: 'var(--noir)', padding: '2rem', borderLeft: '2px solid var(--gold)' }}>
<p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: '1.25rem' }}>
&ldquo;{t.texte}&rdquo;
</p>
<div>
<span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 500 }}>{t.name}</span>
<span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{t.ville}</span>
</div>
</div>
))}
</div>
</div>
</section>
{/* ── CTA footer ───────────────────────────────────────────────────── */}
<section style={{ background: 'var(--noir)', borderTop: '1px solid rgba(197,165,90,0.08)', padding: '4rem 0' }}>
<div className="container mx-auto" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
<p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: 'rgba(255,255,255,0.4)' }}>
Besoin d&rsquo;un conseil personnalisé pour trouver votre signature ?
</p>
<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
<Link href="/services/quiz-olfactif" style={{
display: 'inline-flex', alignItems: 'center', gap: 8,
background: 'var(--gold)', color: 'var(--noir)',
padding: '0.75rem 1.5rem',
fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
textDecoration: 'none',
}}>
Quiz olfactif
</Link>
<Link href="/services/consultation" style={{
display: 'inline-flex', alignItems: 'center', gap: 8,
border: '1px solid rgba(197,165,90,0.35)', color: 'var(--gold)',
padding: '0.75rem 1.5rem',
fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase',
textDecoration: 'none',
}}>
Consultation privée
</Link>
</div>
</div>
</section>
<style>{`
.homme-hero-grid {
display: grid;
grid-template-columns: 3fr 2fr;
gap: 4rem;
align-items: start;
}
.homme-guide-grid {
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 1px;
background: rgba(197,165,90,0.08);
}
.homme-temo-grid {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 1.5rem;
}
@media (max-width: 900px) {
.homme-hero-grid  { grid-template-columns: 1fr; gap: 2rem; }
.homme-guide-grid { grid-template-columns: repeat(2, 1fr); }
.homme-temo-grid  { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
.homme-guide-grid { grid-template-columns: 1fr; }
}
`}</style>
</div>
);
}
