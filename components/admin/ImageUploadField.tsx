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

import { useCallback, useMemo, useRef, useState } from 'react';
import { GOLD } from '@/lib/admin-theme';

/* ── Constantes ──────────────────────────────────────────────────────────── */
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
  maxImages?: number;
}

/* ── Composant principal ─────────────────────────────────────────────────── */

export default function ImageUploadField({
  value,
  onChange,
  label = 'Images du produit',
  disabled = false,
  maxImages,
}: Readonly<Props>) {
  /* uploadItems = in-progress / errored uploads only */
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Derive persisted items from the value prop — no effect needed */
  const persistedItems = useMemo<UploadItem[]>(
    () => splitUrls(value).map((url) => ({ id: url, url })),
    [value],
  );

  /* Merge persisted + in-flight for display */
  const items = useMemo<UploadItem[]>(
    () => [...persistedItems, ...uploadItems],
    [persistedItems, uploadItems],
  );

  /* Synchronise vers le parent à chaque modification */
  const syncUp = useCallback(
    (nextPersisted: UploadItem[]) => {
      const urls = nextPersisted.filter((i) => !i.uploading && !i.error).map((i) => i.url);
      onChange(joinUrls(urls));
    },
    [onChange],
  );

  /* Supprimer une image */
  const remove = (id: string) => {
    const isUpload = uploadItems.some((i) => i.id === id);
    if (isUpload) {
      setUploadItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      const next = persistedItems.filter((i) => i.id !== id);
      syncUp(next);
    }
  };

  /* Uploader un fichier (File) via l'API route */
  const uploadFile = useCallback(
    async (file: File) => {
      const tempId = `tmp-${Date.now()}-${Math.random()}`;
      const placeholder: UploadItem = { id: tempId, url: '', uploading: true };

      setUploadItems((prev) => (maxImages === 1 ? [placeholder] : [...prev, placeholder]));

      try {
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Erreur upload');
        }

        const url: string = json.url;

        /* Remove from uploadItems and add the new URL to the parent value */
        setUploadItems((prev) => prev.filter((i) => i.id !== tempId));
        const nextPersisted = [...splitUrls(value), url].map((u) => ({ id: u, url: u }));
        syncUp(nextPersisted);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setUploadItems((prev) =>
          prev.map((i) =>
            i.id === tempId ? { ...i, uploading: false, error: message } : i,
          ),
        );
      }
    },
    [maxImages, syncUp, value],
  );

  /* Gérer les fichiers sélectionnés (input ou drop) */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const currentCount = items.filter((item) => !item.uploading && !item.error).length;
      const availableSlots = maxImages ? Math.max(0, maxImages - currentCount) : Infinity;
      const selectedFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const filesToUpload = maxImages === 1 ? selectedFiles.slice(0, 1) : selectedFiles.slice(0, availableSlots);

      filesToUpload.forEach((f) => {
        if (f.type.startsWith('image/')) uploadFile(f);
      });
    },
    [items, maxImages, uploadFile],
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

  const uploadedCount = items.reduce((count, item) => (item.uploading || item.error ? count : count + 1), 0);

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
      </div>

      {/* Zone drag & drop */}
      <button
        type="button"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={disabled ? undefined : onDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        disabled={disabled}
        style={{
          width: '100%',
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
          multiple={maxImages !== 1}
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
      </button>

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
      {uploadedCount > 0 && (
        <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '6px' }}>
          {uploadedCount} image
          {uploadedCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

/* ── Tuile individuelle ──────────────────────────────────────────────────── */

function ImageTile({
  item,
  onRemove,
}: Readonly<{
  item: UploadItem;
  onRemove: () => void;
}>) {
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

function RemoveBtn({ onClick }: Readonly<{ onClick: () => void }>) {
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
