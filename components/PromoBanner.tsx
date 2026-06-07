import Link from 'next/link';
import { getActiveBanners } from '@/lib/supabase/banners';

export default async function PromoBanner() {
  const banners = await getActiveBanners();
  if (banners.length === 0) return null;

  // Show only the first active banner (highest priority by display_order)
  const banner = banners[0];

  return (
    <div
      role="complementary"
      aria-label="Promotion"
      style={{
        background: banner.bg_color,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background image overlay */}
      {banner.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.image_url}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.25,
          }}
        />
      )}

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1320,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          flexWrap: 'wrap',
          textAlign: 'center',
        }}
      >
        <div>
          <span
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.04em',
              lineHeight: 1.3,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            {banner.title}
          </span>
          {banner.subtitle && (
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.75)',
                marginTop: '2px',
                lineHeight: 1.3,
              }}
            >
              {banner.subtitle}
            </span>
          )}
        </div>

        {banner.cta_text && (
          <Link
            href={banner.cta_link}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textDecoration: 'none',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              flexShrink: 0,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            {banner.cta_text}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
