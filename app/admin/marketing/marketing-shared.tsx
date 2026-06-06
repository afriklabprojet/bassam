'use client';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string;
  image_url: string | null;
  bg_color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  phone: string | null;
  subscribed_at: string;
  source: string | null;
  is_active: boolean;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  preview_text: string | null;
  recipients_count: number;
  status: 'sent' | 'draft' | 'failed';
  sent_at: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

export const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  padding: '10px 14px',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

export const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '6px',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getCampaignStatusLabel(status: string): string {
  if (status === 'sent') return 'Envoyée';
  if (status === 'failed') return 'Échec';
  return 'Brouillon';
}

export function campaignStatusColor(status: string): string {
  if (status === 'sent') return '#4ade80';
  if (status === 'failed') return '#f87171';
  return '#facc15';
}

export function campaignStatusBg(status: string): string {
  if (status === 'sent') return 'rgba(34,197,94,0.15)';
  if (status === 'failed') return 'rgba(239,68,68,0.15)';
  return 'rgba(250,204,21,0.15)';
}

// ─── Modal wrapper ──────────────────────────────────────────────────────────

export function Modal({ onClose, title, children }: Readonly<{ onClose: () => void; title: string; children: React.ReactNode }>) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
