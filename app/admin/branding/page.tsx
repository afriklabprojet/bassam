import BrandingPanel from '@/app/admin/parametres/BrandingPanel';
import LogoPanel from './LogoPanel';
import { getSiteSettings } from '@/lib/site-settings';

const GOLD = '#C5A55A';

export default async function BrandingPage() {
  const settings = await getSiteSettings();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            color: '#fff',
            fontSize: 28,
            fontWeight: 300,
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          Design &{' '}
          <span style={{ color: GOLD, fontWeight: 600 }}>Branding</span>
        </h1>
        <p style={{ color: '#666', fontSize: 13 }}>
          Personnalisez les couleurs, les polices et l&apos;identité visuelle du site.
          Les changements s&apos;appliquent immédiatement après sauvegarde.
        </p>
      </div>

      {/* ── Logo & Favicon ── */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ color: GOLD, fontSize: 15, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          Logo &amp; Favicon
        </h2>
        <LogoPanel
          initialLogoUrl={settings.logo_url}
          initialFaviconUrl={settings.favicon_url}
        />
      </section>

      {/* ── Couleurs & Polices ── */}
      <section>
        <h2 style={{ color: GOLD, fontSize: 15, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          Couleurs &amp; Polices
        </h2>
        <BrandingPanel />
      </section>
    </div>
  );
}

