'use client';

/**
 * ImageUploadField — champ image admin avec drag-and-drop + upload Supabase.
 *
 * Props:
 *   value    – URLs séparées par \n (même format que le textarea précédent)
 *   onChange – callback avec la nouvelle valeur \n-joined
 *   label    – optionnel, défaut "Images du produit"
 *   disabled – optionnel
 */

import { useCallback, useRef, useState } from 'react';

/* ── Constantes ──────────────────────────────────────────────────────────── */

const GOLD = '#C5A55A';
const BORDER_IDLE = 'rgba(255,255,255,0.1)';
const BORDER_DRAG = GOLD;
const BG_ZONE = 'rgba(255,255,255,0.03)';
const BG_ZONE_DRAG = 'rgba(197,165,90,0.08)';

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function splitUrls(value: string): string[] {
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function joinUrls(urls: string[]): string {
  return urls.join('\n');
}

/* ── Types ───────────────────────────────────────────────────────────────── */

interface UploadItem {
  id: string;
  url: string;
  uploading?: boolean;
  error?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  disabled?: boolean;
}

/* ── Composant principal ─────────────────────────────────────────────────── */

export default function ImageUploadField({
  value,
  onChange,
  label = 'Images du produit',
  disabled = false,
}: Props) {
  /* Items = liste des images affichées (depuis value + uploads en cours) */
  const [items, setItems] = useState<UploadItem[]>(() =>
    splitUrls(value).map((url) => ({ id: url, url })),
  );
  const [dragging, setDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Synchronise vers le parent à chaque modification */
  const syncUp = useCallback(
    (nextItems: UploadItem[]) => {
      const urls = nextItems.filter((i) => !i.uploading && !i.error).map((i) => i.url);
      onChange(joinUrls(urls));
    },
    [onChange],
  );

  /* Supprimer une image */
  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    syncUp(next);
  };

  /* Uploader un fichier (File) via l'API route */
  const uploadFile = useCallback(
    async (file: File) => {
      const tempId = `tmp-${Date.now()}-${Math.random()}`;
      const placeholder: UploadItem = { id: tempId, url: '', uploading: true };

      setItems((prev) => {
        const next = [...prev, placeholder];
        return next;
      });

      try {
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Erreur upload');
        }

        const url: string = json.url;

        setItems((prev) => {
          const next = prev.map((i) =>
            i.id === tempId ? { id: url, url, uploading: false } : i,
          );
          syncUp(next);
          return next;
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setItems((prev) =>
          prev.map((i) =>
            i.id === tempId ? { ...i, uploading: false, error: message } : i,
          ),
        );
      }
    },
    [syncUp],
  );

  /* Gérer les fichiers sélectionnés (input ou drop) */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((f) => {
        if (f.type.startsWith('image/')) uploadFile(f);
      });
    },
    [uploadFile],
  );

  /* Drag events */
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /* Ajouter une URL manuelle */
  const addManualUrl = () => {
    const url = manualUrl.trim();
    if (!url || items.some((i) => i.url === url)) {
      setManualUrl('');
      return;
    }
    const next = [...items, { id: url, url }];
    setItems(next);
    syncUp(next);
    setManualUrl('');
    setShowUrlInput(false);
  };

  /* ── Rendu ─────────────────────────────────────────────────────────────── */

  return (
    <div>
      {/* Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <label
          className="block text-xs font-medium uppercase tracking-wide"
          style={{ color: '#888' }}
        >
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput((v) => !v)}
          style={{
            fontSize: '0.7rem',
            color: GOLD,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            opacity: 0.8,
            padding: 0,
          }}
        >
          + URL manuelle
        </button>
      </div>

      {/* Zone drag & drop */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={disabled ? undefined : onDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? BORDER_DRAG : BORDER_IDLE}`,
          borderRadius: '10px',
          background: dragging ? BG_ZONE_DRAG : BG_ZONE,
          padding: '20px 16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
          // Reset value so on peut re-sélectionner le même fichier
          onClick={(e) => ((e.target as HTMLInputElement).value = '')}
        />

        {/* Icône */}
        <div style={{ fontSize: '1.75rem', marginBottom: '6px' }}>🖼️</div>
        <div style={{ fontSize: '0.75rem', color: '#666' }}>
          {dragging ? (
            <span style={{ color: GOLD }}>Déposez vos images ici</span>
          ) : (
            <>
              <span style={{ color: GOLD }}>Cliquer</span> ou glisser-déposer
              <br />
              <span style={{ color: '#555' }}>JPEG · PNG · WebP · AVIF — max 5 Mo</span>
            </>
          )}
        </div>
      </div>

      {/* Input URL manuelle */}
      {showUrlInput && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: '8px',
          }}
        >
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualUrl())}
            placeholder="https://…/image.jpg"
            autoFocus
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e5e7eb',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={addManualUrl}
            style={{
              background: GOLD,
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => { setShowUrlInput(false); setManualUrl(''); }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#888',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Grille des images */}
      {items.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '8px',
            marginTop: '12px',
          }}
        >
          {items.map((item) => (
            <ImageTile key={item.id} item={item} onRemove={() => remove(item.id)} />
          ))}
        </div>
      )}

      {/* Compteur */}
      {items.filter((i) => !i.uploading && !i.error).length > 0 && (
        <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '6px' }}>
          {items.filter((i) => !i.uploading && !i.error).length} image
          {items.filter((i) => !i.uploading && !i.error).length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

/* ── Tuile individuelle ──────────────────────────────────────────────────── */

function ImageTile({
  item,
  onRemove,
}: {
  item: UploadItem;
  onRemove: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  if (item.uploading) {
    return (
      <div
        style={{
          aspectRatio: '1',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}
      >
        <Spinner />
        <span style={{ fontSize: '0.6rem', color: '#666' }}>Upload…</span>
      </div>
    );
  }

  if (item.error) {
    return (
      <div
        style={{
          aspectRatio: '1',
          borderRadius: '8px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '1rem' }}>⚠️</span>
        <span
          style={{
            fontSize: '0.55rem',
            color: '#EF4444',
            textAlign: 'center',
            marginTop: '2px',
            lineHeight: 1.2,
          }}
        >
          {item.error}
        </span>
        <RemoveBtn onClick={onRemove} />
      </div>
    );
  }

  return (
    <div
      style={{
        aspectRatio: '1',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'default',
      }}
    >
      {imgErr ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}
        >
          🖼
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt=""
          onError={() => setImgErr(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
      <RemoveBtn onClick={onRemove} />
    </div>
  );
}

/* ── Bouton supprimer ────────────────────────────────────────────────────── */

function RemoveBtn({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Supprimer"
      style={{
        position: 'absolute',
        top: '3px',
        right: '3px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: hover ? '#EF4444' : 'rgba(0,0,0,0.65)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.6rem',
        lineHeight: '18px',
        textAlign: 'center',
        padding: 0,
        transition: 'background 0.15s',
      }}
    >
      ✕
    </button>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */

function Spinner() {
  return (
    <div
      style={{
        width: '18px',
        height: '18px',
        border: '2px solid rgba(197,165,90,0.2)',
        borderTopColor: '#C5A55A',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
