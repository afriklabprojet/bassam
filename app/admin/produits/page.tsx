'use client';

import React, { useEffect, useRef, useState } from 'react';
import ImageUploadField from '@/components/admin/ImageUploadField';

function getStockStyle(qty: number): { background: string; color: string } {
  if (qty > 5) return { background: 'rgba(34,197,94,0.15)', color: '#22C55E' };
  if (qty > 0) return { background: 'rgba(251,191,36,0.15)', color: '#FBBF24' };
  return { background: 'rgba(239,68,68,0.15)', color: '#EF4444' };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  gender: string | null;
  stockQuantity: number;
  isFeatured: boolean;
  images: string[];
  categoryId: string | null;
  categoryName: string | null;
  concentration: string | null;
  volume: string | null;
  notes: { top: string[]; heart: string[]; base: string[] } | null;
  createdAt: string;
}

interface FormData {
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  gender: string;
  stockQuantity: string;
  isFeatured: boolean;
  concentration: string;
  volume: string;
  notesTete: string;
  notesCoeur: string;
  notesFond: string;
  images: string;
}

const EMPTY_FORM: FormData = {
  name: '', slug: '', brand: '', description: '',
  price: '', originalPrice: '', categoryId: '', gender: '', stockQuantity: '0',
  isFeatured: false, concentration: '', volume: '',
  notesTete: '', notesCoeur: '', notesFond: '',
  images: '',
};

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replaceAll(/[\u0300-\u036f]/gu, '')
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '');
}

function formatCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F';
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#fff',
  fontSize: '0.875rem', outline: 'none',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (modalOpen) { el.showModal(); } else { el.close(); }
  }, [modalOpen]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('q', search);
      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) {
        setError(res.status === 403 ? 'Accès refusé' : 'Erreur');
        return;
      }
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search) params.set('q', search);
        const res = await fetch(`/api/admin/products?${params}`);
        if (!res.ok) {
          setError(res.status === 403 ? 'Accès refusé' : 'Erreur');
          return;
        }
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    })();
  }, [page, search]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, []);

  function openCreate() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      description: p.description ?? '',
      price: String(p.price),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      categoryId: p.categoryId ?? '',
      gender: p.gender ?? '',
      stockQuantity: String(p.stockQuantity),
      isFeatured: p.isFeatured,
      concentration: p.concentration ?? '',
      volume: p.volume ?? '',
      notesTete: p.notes?.top?.join(', ') ?? '',
      notesCoeur: p.notes?.heart?.join(', ') ?? '',
      notesFond: p.notes?.base?.join(', ') ?? '',
      images: p.images.join('\n'),
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      ...(editingProduct === null ? { slug: slugify(name) } : {}),
    }));
  }

  async function handleSave(e: React.SyntheticEvent) {
    e.preventDefault();
    setFormError(null);
    const price = Number.parseFloat(form.price);
    if (!form.name.trim() || !form.slug.trim() || !form.brand.trim() || Number.isNaN(price) || price <= 0) {
      setFormError('Nom, slug, marque et prix sont obligatoires.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      brand: form.brand.trim(),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      price,
      ...(form.originalPrice ? { originalPrice: Number.parseFloat(form.originalPrice) } : {}),
      ...(form.categoryId ? { categoryId: form.categoryId } : { categoryId: null }),
      ...(form.gender ? { gender: form.gender } : {}),
      stockQuantity: Number.parseInt(form.stockQuantity, 10) || 0,
      isFeatured: form.isFeatured,
      ...(form.concentration.trim() ? { concentration: form.concentration.trim() } : {}),
      ...(form.volume.trim() ? { volume: form.volume.trim() } : {}),
      ...((form.notesTete || form.notesCoeur || form.notesFond) ? {
        notes: {
          top: form.notesTete.split(',').map((s: string) => s.trim()).filter(Boolean),
          heart: form.notesCoeur.split(',').map((s: string) => s.trim()).filter(Boolean),
          base: form.notesFond.split(',').map((s: string) => s.trim()).filter(Boolean),
        },
      } : {}),
      images: form.images.split('\n').map((l) => l.trim()).filter(Boolean),
    };
    setSaving(true);
    try {
      const method = editingProduct ? 'PATCH' : 'POST';
      const body = editingProduct ? { id: editingProduct.id, ...payload } : payload;
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error ?? 'Erreur lors de la sauvegarde');
        return;
      }
      closeModal();
      load();
    } catch {
      setFormError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    setActionLoading(id);
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isFeatured: !current }),
    });
    setActionLoading(null);
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer « ${name} » ?`)) return;
    setActionLoading(id);
    await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setActionLoading(null);
    load();
  }

  function renderTableContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(197,165,90,0.2)', borderTopColor: 'var(--gold)' }} />
        </div>
      );
    }
    if (products.length === 0) {
      return <div className="px-6 py-12 text-center" style={{ color: '#666' }}>Aucun produit trouvé</div>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['', 'Produit', 'Marque', 'Prix', 'Stock', 'Genre', 'Vedette', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left" style={{ color: '#666', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stockStyle = getStockStyle(p.stockQuantity);
              const firstImg = p.images[0];
              return (
                <tr key={p.id} className="transition-colors duration-150" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {/* Thumbnail */}
                  <td className="px-3 py-2.5" style={{ width: '52px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div
                        style={{
                          width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {firstImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={firstImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <span style={{ fontSize: '1.1rem', opacity: 0.25 }}>🖼</span>
                        )}
                      </div>
                      {p.images.length > 1 && (
                        <span style={{ fontSize: '0.6rem', color: '#555' }}>+{p.images.length - 1}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div style={{ color: '#fff', fontWeight: 500 }}>{p.name}</div>
                    {p.categoryName && (
                      <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '2px' }}>{p.categoryName}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: '#ccc' }}>{p.brand}</td>
                  <td className="px-5 py-3.5">
                    <span style={{ color: '#fff', fontWeight: 600 }}>{formatCFA(p.price)}</span>
                    {p.originalPrice && (
                      <span style={{ color: '#666', textDecoration: 'line-through', marginLeft: '6px', fontSize: '0.75rem' }}>
                        {formatCFA(p.originalPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={stockStyle}
                    >
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: '#999', textTransform: 'capitalize' }}>
                    {p.gender ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleFeatured(p.id, p.isFeatured)}
                      disabled={actionLoading === p.id}
                      style={{ color: p.isFeatured ? 'var(--gold)' : '#444', cursor: 'pointer' }}
                      title={p.isFeatured ? 'Retirer de la vedette' : 'Mettre en vedette'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={p.isFeatured ? 'var(--gold)' : 'none'} stroke="currentColor" strokeWidth={1.5}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(p)}
                        style={{ color: '#60A5FA', cursor: 'pointer' }}
                        title="Modifier"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={actionLoading === p.id}
                        style={{ color: '#EF4444', opacity: 0.7, cursor: 'pointer' }}
                        title="Supprimer"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="px-6 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          {error}
        </div>
      </div>
    );
  }

  const saveLabel = editingProduct ? 'Enregistrer' : 'Créer le produit';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#fff' }}>
            Produits
          </h1>
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '2px' }}>
            {total} produit{total > 1 ? 's' : ''} au catalogue
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{ background: 'var(--gold)', color: 'var(--noir)', letterSpacing: '0.02em', cursor: 'pointer' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter un produit
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher par nom ou marque…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-80 px-4 py-2.5 rounded-lg outline-none transition-all duration-200"
          style={{
            background: 'var(--noir-card)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#ccc',
            fontSize: '0.875rem',
          }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--noir-card)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {renderTableContent()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#666', fontSize: '0.8125rem' }}>
              Page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#999', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
              >
                ← Préc.
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#999', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Suiv. →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit panel ── */}
      <dialog
        ref={dialogRef}
        aria-label={editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
        className="fixed inset-y-0 right-0 m-0 h-full p-0 border-0 bg-transparent z-50"
        style={{ maxWidth: '520px', width: '100%' }}
        onClose={closeModal}
      >
        {modalOpen && (
          <div
            className="h-full overflow-y-auto"
            style={{
              width: '100%', maxWidth: '520px',
              background: '#111',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: '#111', zIndex: 1 }}
            >
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#fff', fontWeight: 500 }}>
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button onClick={closeModal} style={{ color: '#666', cursor: 'pointer', lineHeight: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="px-6 py-6 space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="field-name" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Nom *</label>
                <input
                  id="field-name"
                  type="text" required value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Bleu de Chanel"
                  style={INPUT_STYLE}
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="field-slug" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Slug *</label>
                <input
                  id="field-slug"
                  type="text" required value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="bleu-de-chanel"
                  style={{ ...INPUT_STYLE, fontFamily: 'monospace', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Brand */}
              <div>
                <label htmlFor="field-brand" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Marque *</label>
                <input
                  id="field-brand"
                  type="text" required value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="Ex: Chanel"
                  style={INPUT_STYLE}
                />
              </div>

              {/* Price + Original */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-price" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Prix (XOF) *</label>
                  <input
                    id="field-price"
                    type="number" required min={0} step={500} value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label htmlFor="field-original-price" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Prix barré (XOF)</label>
                  <input
                    id="field-original-price"
                    type="number" min={0} step={500} value={form.originalPrice}
                    onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Gender + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-gender" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Genre</label>
                  <select
                    id="field-gender"
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                  >
                    <option value="">— Non défini —</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                    <option value="mixte">Mixte</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="field-stock" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Stock</label>
                  <input
                    id="field-stock"
                    type="number" min={0} step={1} value={form.stockQuantity}
                    onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Collection */}
              <div>
                <label htmlFor="field-category" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Collection</label>
                <select
                  id="field-category"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                >
                  <option value="">— Aucune collection —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Concentration + Volume */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="field-concentration" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Concentration</label>
                  <input
                    id="field-concentration"
                    type="text" value={form.concentration}
                    onChange={(e) => setForm((f) => ({ ...f, concentration: e.target.value }))}
                    placeholder="Eau de Parfum"
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label htmlFor="field-volume" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Volume</label>
                  <input
                    id="field-volume"
                    type="text" value={form.volume}
                    onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
                    placeholder="100ml"
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Notes olfactives */}
              <div>
                <p className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#888' }}>Notes olfactives</p>
                <div className="space-y-3">
                  {([
                    { key: 'notesTete', label: '🌸 Tête', placeholder: 'bergamote, citron, mandarine' },
                    { key: 'notesCoeur', label: '❤️ Cœur', placeholder: 'rose, jasmin, iris' },
                    { key: 'notesFond', label: '🌿 Fond', placeholder: 'musc, vanille, santal' },
                  ] as const).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label htmlFor={`field-notes-${key}`} className="block" style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.375rem' }}>{label}</label>
                      <input
                        id={`field-notes-${key}`}
                        type="text"
                        placeholder={placeholder}
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        style={INPUT_STYLE}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ color: '#555', fontSize: '0.7rem', marginTop: '0.5rem' }}>Séparez chaque note par une virgule</p>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
                  style={{
                    position: 'relative', display: 'inline-flex', alignItems: 'center',
                    width: '40px', height: '22px', borderRadius: '11px',
                    background: form.isFeatured ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    left: form.isFeatured ? '20px' : '3px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
                <span style={{ color: '#ccc', fontSize: '0.875rem' }}>Mettre en vedette</span>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="field-description" className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#888' }}>Description</label>
                <textarea
                  id="field-description"
                  rows={3} value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Description du parfum…"
                  style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              {/* Images */}
              <ImageUploadField
                key={editingProduct?.id ?? 'new'}
                value={form.images}
                onChange={(v) => setForm((f) => ({ ...f, images: v }))}
              />

              {/* Form error */}
              {formError && (
                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#999', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: saving ? 'rgba(197,165,90,0.5)' : 'var(--gold)', color: 'var(--noir)', cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Sauvegarde…' : saveLabel}
                </button>
              </div>
            </form>
          </div>

        )}
      </dialog>
    </div>
  );
}


