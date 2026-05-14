'use client';

import { useEffect, useState } from 'react';
import BrandingPanel from './BrandingPanel';

interface SettingsForm {
  support_phone: string;
  support_phone_display: string;
  support_email: string;
  whatsapp_number: string;
  whatsapp_display: string;
  address_display: string;
  address_detail: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
}

const EMPTY: SettingsForm = {
  support_phone: '',
  support_phone_display: '',
  support_email: '',
  whatsapp_number: '',
  whatsapp_display: '',
  address_display: '',
  address_detail: '',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
};

const GOLD = '#C5A55A';

/* ─── Section wrapper ─────────────────────────────────────────────────────── */
function Section({
  icon,
  title,
  children,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(197,165,90,0.2)',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: GOLD,
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: 20,
        }}
      >
        {icon}
        {title}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* ─── Input field ─────────────────────────────────────────────────────────── */
function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
}: Readonly<{
  label: string;
  name: keyof SettingsForm;
  value: string;
  onChange: (name: keyof SettingsForm, val: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}>) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: '#A0A0A0', fontSize: 12, letterSpacing: '0.04em' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(197,165,90,0.3)',
          borderRadius: 8,
          color: '#fff',
          fontSize: 14,
          padding: '10px 14px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(197,165,90,0.3)')}
      />
      {hint && (
        <span style={{ color: '#666', fontSize: 11 }}>{hint}</span>
      )}
    </label>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function ParametresPage() {
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  /* Load current settings */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json() as { settings: Record<string, string> };
        setForm({ ...EMPTY, ...json.settings });
      } catch {
        setToast({ ok: false, msg: 'Impossible de charger les paramètres.' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleChange = (name: keyof SettingsForm, val: string) =>
    setForm((prev) => ({ ...prev, [name]: val }));

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Erreur');
      }
      setToast({ ok: true, msg: 'Paramètres enregistrés ✓' });
    } catch (err) {
      setToast({ ok: false, msg: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      setSaving(false);
      // Auto-dismiss
      setTimeout(() => setToast(null), 4000);
    }
  };

  if (loading) {
    return (
      <div style={{ color: '#666', padding: 40, textAlign: 'center' }}>
        Chargement…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
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
          Paramètres du site
        </h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          Contact, WhatsApp et réseaux sociaux — modifiez sans redéploiement.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            background: toast.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.ok ? '#86efac' : '#fca5a5',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* 📞 Contact téléphonique */}
      <Section
        icon={
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        }
        title="Téléphone & Email"
      >
        <Field
          label="Numéro (chiffres seulement)"
          name="support_phone"
          value={form.support_phone}
          onChange={handleChange}
          placeholder="22500000000"
          hint="Exemple : 22500000000 (sans le +)"
        />
        <Field
          label="Affichage (format lisible)"
          name="support_phone_display"
          value={form.support_phone_display}
          onChange={handleChange}
          placeholder="+225 00 00 00 00"
          hint="Affiché sur la page Contact"
        />
        <Field
          label="Email de contact"
          name="support_email"
          value={form.support_email}
          onChange={handleChange}
          type="email"
          placeholder="contact@vip-parfumerie.com"
          hint="Affiché sur la page Contact"
        />
      </Section>

      {/* 📍 Adresse */}
      <Section
        icon={
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        }
        title="Adresse"
      >
        <Field
          label="Adresse principale (1 ligne)"
          name="address_display"
          value={form.address_display}
          onChange={handleChange}
          placeholder="Abidjan, Côte d'Ivoire"
          hint="Affiché dans le footer"
        />
        <Field
          label="Détails d'adresse"
          name="address_detail"
          value={form.address_detail}
          onChange={handleChange}
          placeholder="Livraison dans toute l'Afrique de l'Ouest"
          hint="Complément d'adresse (page Contact)"
        />
      </Section>

      {/* 💬 WhatsApp */}
      <Section
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill={GOLD}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        }
        title="WhatsApp"
      >
        <Field
          label="Numéro WhatsApp (chiffres seulement)"
          name="whatsapp_number"
          value={form.whatsapp_number}
          onChange={handleChange}
          placeholder="22600000000"
          hint="Doit être enregistré sur WhatsApp"
        />
        <Field
          label="Affichage WhatsApp"
          name="whatsapp_display"
          value={form.whatsapp_display}
          onChange={handleChange}
          placeholder="+226 00 00 00 00"
          hint="Texte affiché sur le bouton flottant"
        />
      </Section>

      {/* 📱 Réseaux sociaux */}
      <Section
        icon={
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        }
        title="Réseaux sociaux"
      >
        <Field
          label="Instagram (URL complète)"
          name="instagram_url"
          value={form.instagram_url}
          onChange={handleChange}
          type="url"
          placeholder="https://instagram.com/votre-compte"
        />
        <Field
          label="Facebook (URL complète)"
          name="facebook_url"
          value={form.facebook_url}
          onChange={handleChange}
          type="url"
          placeholder="https://facebook.com/votre-page"
        />
        <Field
          label="TikTok (URL complète)"
          name="tiktok_url"
          value={form.tiktok_url}
          onChange={handleChange}
          type="url"
          placeholder="https://tiktok.com/@votre-compte"
        />
      </Section>

      {/* 🎨 Design & Branding */}
      <section
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(197,165,90,0.2)',
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: GOLD,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
          Design &amp; Branding
        </h2>
        <BrandingPanel />
      </section>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            background: saving ? 'rgba(197,165,90,0.4)' : GOLD,
            color: '#0D0D0D',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  );
}
