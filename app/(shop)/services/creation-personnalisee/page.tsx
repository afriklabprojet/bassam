import { SITE_URL as BASE_URL } from '@/lib/site-config';
import type { Metadata } from 'next';
import Link from 'next/link';
import CreationConfigurator from '@/components/CreationConfigurator';
import { fetchCreationConfig } from '@/lib/custom-creation';

export const dynamic = 'force-dynamic';


export const metadata: Metadata = {
  title: 'Parfum Personnalisé sur Mesure à Abidjan | VIP Parfumerie Bar',
  description: "Faites créer votre parfum unique à Abidjan : accord sur-mesure, flacon gravé, coffret luxe numéroté. La fragrance exclusive signée à votre nom en Côte d'Ivoire.",
  keywords: "parfum sur mesure Abidjan, création parfum personnalisé Côte d'Ivoire, parfum unique Abidjan, parfumeur Abidjan",
  alternates: { canonical: `${BASE_URL}/services/creation-personnalisee` },
  openGraph: {
    title: 'Parfum Personnalisé sur Mesure | VIP Parfumerie Bar Abidjan',
    description: "Créez votre parfum unique à Abidjan — accord sur-mesure, flacon gravé, coffret luxe.",
    url: `${BASE_URL}/services/creation-personnalisee`,
    type: 'website',
    locale: 'fr_CI',
  },
};

/* ─── Data ───────────────────────────────────────────────── */

const etapes = [
  {
    num: '01',
    titre: "Votre brief créatif",
    description:
      "Vous nous décrivez votre vision : inspirations, émotions recherchées, occasions. Plus votre brief est précis, plus le résultat sera juste.",
    duree: "2–3 jours",
  },
  {
    num: '02',
    titre: "Formulation & accords",
    description:
      "Notre master-parfumeur sélectionne les meilleures matières premières et compose 3 propositions olfactives distinctes selon votre brief.",
    duree: "7–10 jours",
  },
  {
    num: '03',
    titre: "Sélection & affinage",
    description:
      "Vous testez les 3 accords. Nous affinons ensemble jusqu'à atteindre exactement ce que vous imaginiez. Jusqu'à 2 cycles de retouches inclus.",
    duree: "3–5 jours",
  },
  {
    num: '04',
    titre: "Production & livraison",
    description:
      "Votre formule est produite en exclusivité, embouteillée dans votre flacon gravé, présentée dans le coffret luxe VIP Parfumerie Bar.",
    duree: "5–7 jours",
  },
];

const familles = [
  { nom: 'Floral', notes: 'Rose de Grasse, Jasmin Sambac, Pivoine, Tubéreuse', icone: '✦' },
  { nom: 'Oriental', notes: 'Oud Méditerranée, Vanille Bourbon, Ambre, Benjoin', icone: '◈' },
  { nom: 'Boisé', notes: "Santal Mysore, Vétiver d'Haïti, Cèdre, Patchouli", icone: '◉' },
  { nom: 'Frais', notes: "Bergamote, Thé vert, Aldéhydes, Fleur d'oranger", icone: '◇' },
  { nom: 'Gourmand', notes: 'Caramel, Praliné, Miel sauvage, Cacao fin', icone: '◆' },
  { nom: 'Cuir & Fumé', notes: 'Encens, Tabac blond, Birch tar, Iris poudré', icone: '◻' },
];

/* ─── Page ───────────────────────────────────────────────── */

export default async function CreationPersonnalisee() {
  const creationConfig = await fetchCreationConfig();
  return (
    <main>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section style={{
        background: 'var(--noir)',
        paddingTop: 120,
        paddingBottom: 80,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(197,165,90,0.09) 0%, transparent 60%)', pointerEvents: 'none' }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.3 }} aria-hidden="true" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <Link href="/services" style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Services</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6875rem' }}>/</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Création Personnalisée</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 64, alignItems: 'center' }} className="hero-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 24, height: '1px', background: 'var(--gold)' }} />
                <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Sur-mesure exclusif</span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.25rem, 5vw, 4rem)',
                fontWeight: 300,
                color: '#fff',
                lineHeight: 1.05,
                margin: '0 0 22px',
                letterSpacing: '-0.015em',
              }}>
                Un parfum<br />
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>uniquement le vôtre.</em>
              </h1>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, maxWidth: 500, margin: '0 0 40px' }}>
                Nous composons pour vous une fragrance exclusive — accord artisanal,
                flacon gravé, numéroté. Un objet de luxe signé à votre nom
                que personne d&rsquo;autre au monde ne portera.
              </p>
              <a href="#commander" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 48, padding: '0 28px', background: 'var(--gold)', color: 'var(--noir)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 3 }}>
                Créer mon parfum
              </a>
            </div>

            {/* Ornement flacon */}
            <div style={{ display: 'flex', justifyContent: 'center' }} className="hero-ornement">
              <div style={{
                width: 220, height: 300,
                border: '1px solid rgba(197,165,90,0.2)',
                borderRadius: 3,
                background: 'var(--noir-card)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(197,165,90,0.12) 0%, transparent 70%)' }} aria-hidden="true" />
                <div style={{ position: 'absolute', top: 12, left: 12, width: 24, height: 24, borderTop: '1px solid rgba(197,165,90,0.35)', borderLeft: '1px solid rgba(197,165,90,0.35)' }} aria-hidden="true" />
                <div style={{ position: 'absolute', bottom: 12, right: 12, width: 24, height: 24, borderBottom: '1px solid rgba(197,165,90,0.35)', borderRight: '1px solid rgba(197,165,90,0.35)' }} aria-hidden="true" />
                <svg width={40} height={40} fill="none" stroke="rgba(197,165,90,0.7)" strokeWidth={1} viewBox="0 0 24 24" style={{ position: 'relative', zIndex: 1 }} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', position: 'relative', zIndex: 1, lineHeight: 1.5, padding: '0 16px' }}>
                  Votre nom.<br />Votre fragrance.
                </p>
                <div style={{ width: 30, height: '1px', background: 'rgba(197,165,90,0.3)', position: 'relative', zIndex: 1 }} aria-hidden="true" />
                <p style={{ fontSize: '0.5625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(197,165,90,0.5)', position: 'relative', zIndex: 1 }}>N° 001 / 001</p>
              </div>
            </div>
          </div>
        </div>
      </section>

        <CreationConfigurator config={creationConfig} />

      {/* ══════════════════════════════════════════════════
          PALETTE OLFACTIVE
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--offwhite)', padding: '80px 0', borderBottom: '1px solid var(--line-light)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
                <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Palette de création</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                Nos familles olfactives
              </h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 340, lineHeight: 1.7, margin: 0 }}>
              Nous travaillons avec les meilleures matières premières — naturelles et synthétiques
              d&rsquo;exception — pour une fragrance qui dure et rayonne.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }} className="familles-grid">
            {familles.map((f) => (
              <div key={f.nom} style={{ background: '#fff', padding: '28px 24px', borderTop: '2px solid var(--line-light)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--gold)', opacity: 0.6 }}>{f.icone}</span>
                  <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{f.nom}</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-pale)', lineHeight: 1.6, margin: 0 }}>{f.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PROCESSUS
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--surface)', padding: '88px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
              <span style={{ fontSize: '0.5625rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Comment ça fonctionne</span>
              <div style={{ width: 20, height: '1px', background: 'var(--gold)' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              De votre idée à{' '}
              <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>votre flacon.</em>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {etapes.map((e, i) => (
              <div key={e.num} style={{
                background: i % 2 === 0 ? '#fff' : 'var(--offwhite)',
                padding: '36px 40px',
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '32px',
                alignItems: 'center',
                borderLeft: '3px solid transparent',
              }} className="etape-row">
                <div>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '3.5rem', fontWeight: 300, color: 'rgba(0,0,0,0.06)', lineHeight: 1 }}>{e.num}</span>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>{e.titre}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, maxWidth: 600 }}>{e.description}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.5625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-pale)', margin: '0 0 4px' }}>Délai</p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--gold)', margin: 0, fontWeight: 400 }}>{e.duree}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '16px 20px', background: 'rgba(197,165,90,0.08)', border: '1px solid rgba(197,165,90,0.2)', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width={16} height={16} fill="none" stroke="var(--gold)" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              Délai total estimé : <strong style={{ color: 'var(--text-primary)' }}>17 à 25 jours ouvrés</strong> — expédié dans toute l&rsquo;Afrique de l&rsquo;Ouest.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA bas
      ══════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--noir)', padding: '56px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.375rem', fontWeight: 300, color: '#fff', margin: '0 0 6px' }}>
              Besoin d&rsquo;aide pour vous décider ?
            </p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Réservez une consultation privée avec notre experte.
            </p>
          </div>
          <Link
            href="/services/consultation"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 24px', background: 'transparent', color: 'var(--gold)', border: '1px solid rgba(197,165,90,0.35)', textDecoration: 'none', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, borderRadius: 3, flexShrink: 0 }}
          >
            Consultation privée →
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 767px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-ornement { display: none; }
          .familles-grid { grid-template-columns: 1fr 1fr !important; }
          .etape-row { grid-template-columns: 60px 1fr !important; }
          .etape-row > :last-child { display: none; }
        }
        @media (max-width: 540px) {
          .familles-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
