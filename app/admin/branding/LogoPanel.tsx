'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

// ── Types ─────────────────────────────────────────────────────────────────────

type AssetType = 'logo' | 'favicon';

interface UploadState {
  loading: boolean;
  success: boolean;
  error: string | null;
  previewUrl: string | null; // URL locale (FileReader) pendant l'upload
  savedUrl: string | null;   // URL Supabase après upload réussi
}

const INITIAL: UploadState = {
  loading: false,
  success: false,
  error: null,
  previewUrl: null,
  savedUrl: null,
};

// ── Utilitaires ────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Composant interne: zone d'upload pour un asset ────────────────────────────

interface AssetCardProps {
  type: AssetType;
  label: string;
  description: string;
  accept: string;
  formats: string;
  currentUrl: string; // URL sauvegardée initialement (depuis SiteSettings)
  fallbackSrc: string;
  circular?: boolean; // affichage circulaire (logo)
}

function AssetCard({
  type,
  label,
  description,
  accept,
  formats,
  currentUrl,
  fallbackSrc,
  circular = false,
}: Readonly<AssetCardProps>) {
  const [state, setState] = useState<UploadState>({
    ...INITIAL,
    savedUrl: currentUrl || null,
  });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = state.previewUrl ?? state.savedUrl ?? fallbackSrc;

  const handleFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, error: null, success: false, loading: true }));

    // Aperçu local immédiat
    try {
      const dataUrl = await fileToDataUrl(file);
      setState((s) => ({ ...s, previewUrl: dataUrl }));
    } catch {
      // pas critique
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);

    try {
      const res = await fetch('/api/admin/logo', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        setState((s) => ({ ...s, loading: false, error: json.error ?? 'Erreur inconnue', previewUrl: null }));
        return;
      }

      setState((s) => ({
        ...s,
        loading: false,
        success: true,
        previewUrl: null,
        savedUrl: json.url,
      }));

      // reset succès après 3 s
      setTimeout(() => setState((s) => ({ ...s, success: false })), 3000);
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Erreur réseau', previewUrl: null }));
    }
  }, [type]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const imgRadius = circular ? '50%' : 8;
  const imgSize = circular ? 80 : 64;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(197,165,90,0.15)',
        borderRadius: 12,
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Header */}
      <div>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {label}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>

      {/* Aperçu + drop zone */}
      <button
        type="button"
        aria-label={`Téléverser ${label}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '16px 20px',
          border: `2px dashed ${dragging ? 'var(--gold)' : 'rgba(197,165,90,0.25)'}`,
          borderRadius: 10,
          background: dragging ? 'rgba(197,165,90,0.05)' : 'transparent',
          transition: 'border-color 0.2s, background 0.2s',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
        onClick={() => inputRef.current?.click()}
      >
        {/* Miniature actuelle */}
        <div
          style={{
            position: 'relative',
            width: imgSize,
            height: imgSize,
            borderRadius: imgRadius,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'rgba(0,0,0,0.12)',
            boxShadow: '0 0 0 1px rgba(197,165,90,0.25)',
          }}
        >
          {state.loading ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner />
            </div>
          ) : (
            <Image
              key={displayUrl}
              src={displayUrl}
              alt={label}
              fill
              unoptimized={displayUrl.startsWith('data:')}
              sizes={`${imgSize}px`}
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = fallbackSrc;
              }}
            />
          )}
        </div>

        {/* Texte drop zone */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {dragging ? 'Déposez ici…' : 'Cliquez ou glissez un fichier'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {formats} — 2 Mo max
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          style={{ display: 'none' }}
        />
      </button>

      {/* Feedback */}
      {state.error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.3)',
          color: '#ef4444',
          fontSize: '0.8125rem',
        }}>
          ⚠ {state.error}
        </div>
      )}
      {state.success && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          color: '#22c55e',
          fontSize: '0.8125rem',
        }}>
          ✓ {label} mis à jour avec succès
        </div>
      )}
      {state.savedUrl && !state.success && !state.error && (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
          Actuel : <span style={{ color: 'var(--gold)' }}>{state.savedUrl.split('/').pop()}</span>
        </p>
      )}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      <circle cx={12} cy={12} r={10} fill="none" stroke="var(--gold)" strokeWidth={2} strokeDasharray="47 16" />
    </svg>
  );
}

// ── Panel principal ───────────────────────────────────────────────────────────

interface LogoPanelProps {
  initialLogoUrl?: string;
  initialFaviconUrl?: string;
}

export default function LogoPanel({
  initialLogoUrl = '',
  initialFaviconUrl = '',
}: Readonly<LogoPanelProps>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Notice */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 8,
        background: 'rgba(197,165,90,0.07)',
        border: '1px solid rgba(197,165,90,0.2)',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        Le logo et l&apos;icône sont stockés dans Supabase Storage. Le changement est immédiat sur tout le site sans redéploiement.
      </div>

      <AssetCard
        type="logo"
        label="Logo du site"
        description="Affiché dans l'en-tête et le pied de page."
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        formats="PNG, JPG, WebP, SVG"
        currentUrl={initialLogoUrl}
        fallbackSrc="/images/logo.png"
        circular
      />

      <AssetCard
        type="favicon"
        label="Favicon / Icône"
        description="Affiché dans l'onglet du navigateur et lors de l'ajout à l'écran d'accueil."
        accept="image/png,image/svg+xml,image/x-icon"
        formats="PNG, SVG, ICO"
        currentUrl={initialFaviconUrl}
        fallbackSrc="/favicon.ico"
        circular={false}
      />
    </div>
  );
}
