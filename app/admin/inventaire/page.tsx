'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { shouldBypassNextImageOptimization } from '@/lib/image-optimization';

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  images: string[];
  sku?: string | null;
}

interface InventoryItem {
  id: string;
  product_id: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  low_stock_threshold: number;
  unit_cost: number | null;
  location: string | null;
  last_updated: string;
  is_low_stock: boolean;
  products: { name: string; images: string[] } | null;
}

interface Stats {
  total: number;
  low_stock: number;
  out_of_stock: number;
  total_value: number;
}

type NewItem = {
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
  unit_cost: number;
  location: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}
function fmtCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F';
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

import { GOLD } from '@/lib/admin-theme';

const CARD_BG = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.07)';

const EMPTY_NEW: NewItem = { product_id: '', name: '', sku: '', quantity: 0, low_stock_threshold: 5, unit_cost: 0, location: '' };

export default function AdminInventaire() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, low_stock: 0, out_of_stock: 0, total_value: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>(EMPTY_NEW);

  // Product picker state
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch('/api/admin/inventory');
      if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
      const d = await res.json();
      setItems(d.items ?? []);
      setStats(d.stats ?? {});
    } catch { setError('Erreur réseau'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/inventory');
        if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
        const d = await res.json();
        setItems(d.items ?? []);
        setStats(d.stats ?? {});
      } catch { setError('Erreur réseau'); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!showAdd) return;
    void (async () => {
      try {
        const res = await fetch('/api/admin/products?limit=200');
        if (!res.ok) return;
        const d = await res.json();
        setAllProducts(d.products ?? []);
      } catch { /* ignore */ }
    })();
  }, [showAdd]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowProductDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  function selectProduct(p: ProductOption) {
    setSelectedProduct(p);
    setNewItem((prev) => ({
      ...prev,
      product_id: p.id,
      name: p.name,
      sku: p.sku ?? prev.sku,
    }));
    setProductSearch(p.name);
    setShowProductDrop(false);
  }

  function clearProduct() {
    setSelectedProduct(null);
    setProductSearch('');
    setNewItem((prev) => ({ ...prev, product_id: '', name: '', sku: '' }));
  }

  const filtered = items.filter((i) => {
    if (filter === 'low' && !i.is_low_stock) return false;
    if (filter === 'out' && i.quantity !== 0) return false;
    const displayName = i.products?.name ?? i.name;
    if (search && !displayName.toLowerCase().includes(search.toLowerCase()) && !(i.sku ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function saveQty(id: string) {
    setSaving(true);
    await fetch('/api/admin/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, quantity: Number.parseInt(editQty) }),
    });
    setSaving(false);
    setEditId(null);
    load();
  }

  async function addItem() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: newItem.name,
      sku: newItem.sku || undefined,
      quantity: newItem.quantity,
      low_stock_threshold: newItem.low_stock_threshold,
      unit_cost: newItem.unit_cost || undefined,
      location: newItem.location || undefined,
    };
    if (newItem.product_id) payload.product_id = newItem.product_id;

    await fetch('/api/admin/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setShowAdd(false);
    setNewItem(EMPTY_NEW);
    setSelectedProduct(null);
    setProductSearch('');
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm('Supprimer cet article ?')) return;
    await fetch(`/api/admin/inventory?id=${id}`, { method: 'DELETE' });
    load();
  }

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="px-6 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>{error}</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#fff' }}>Inventaire</h1>
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: 2 }}>{stats.total} article{stats.total > 1 ? 's' : ''} en stock</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: 'linear-gradient(135deg,#C5A55A,#A68B3E)', color: '#080808' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
          Ajouter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total articles', value: fmt(stats.total), icon: '📦', color: GOLD },
          { label: 'Stock faible', value: fmt(stats.low_stock), icon: '⚠️', color: '#F59E0B' },
          { label: 'Rupture', value: fmt(stats.out_of_stock), icon: '🚫', color: '#EF4444' },
          { label: 'Valeur totale', value: fmtCFA(stats.total_value), icon: '💰', color: '#10B981' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5" style={{ background: CARD_BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Rechercher nom / SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-50 px-4 py-2 rounded-xl text-sm outline-none"
          style={{ background: CARD_BG, border: BORDER, color: '#fff' }}
        />
        {(['all', 'low', 'out'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm transition-all"
            style={{
              background: filter === f ? GOLD : CARD_BG,
              color: filter === f ? '#080808' : '#999',
              fontWeight: filter === f ? 600 : 400,
              border: BORDER,
            }}
          >
            {f === 'all' && 'Tout'}{f === 'low' && '⚠️ Stock faible'}{f === 'out' && '🚫 Rupture'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--noir-card)', border: BORDER }}>
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(197,165,90,0.2)', borderTopColor: GOLD }} />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center" style={{ color: '#666' }}>Aucun article trouvé</div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Produit', 'SKU', 'Quantité', 'Seuil alerte', 'Coût unit.', 'Emplacement', 'Màj', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left" style={{ color: '#555', fontWeight: 500, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const displayName = item.products?.name ?? item.name;
                  const thumb = item.products?.images?.[0] ?? null;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail */}
                          <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.04)', border: BORDER }}>
                            {thumb ? (
                              <Image src={thumb} alt={displayName} fill sizes="40px" className="object-cover" unoptimized={shouldBypassNextImageOptimization(thumb)} />
                            ) : (
                              <div className="flex items-center justify-center h-full" style={{ color: '#333', fontSize: '1rem' }}>🧴</div>
                            )}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 500 }}>{displayName}</div>
                            {item.products ? (
                              <Link href={`/produits/${item.product_id}`} target="_blank"
                                style={{ color: GOLD, fontSize: '0.7rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                Voir le produit
                              </Link>
                            ) : (
                              <div style={{ color: '#444', fontSize: '0.7rem', marginTop: 1 }}>Sans produit lié</div>
                            )}
                            {item.is_low_stock && <div style={{ color: item.quantity === 0 ? '#EF4444' : '#F59E0B', fontSize: '0.7rem', marginTop: 1 }}>{item.quantity === 0 ? '● Rupture' : '● Stock faible'}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: '#666', fontFamily: 'monospace' }}>{item.sku ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        {editId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min={0}
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg text-sm outline-none"
                              style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${GOLD}`, color: '#fff' }}
                            />
                            <button onClick={() => saveQty(item.id)} disabled={saving} className="px-2 py-1 rounded-lg text-xs" style={{ background: GOLD, color: '#080808', fontWeight: 600 }}>OK</button>
                            <button onClick={() => setEditId(null)} className="px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#999' }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditId(item.id); setEditQty(String(item.quantity)); }} style={{ color: item.quantity === 0 ? '#EF4444' : '#fff', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
                            {fmt(item.quantity)}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: '#666' }}>{item.low_stock_threshold}</td>
                      <td className="px-5 py-3.5" style={{ color: '#999' }}>{item.unit_cost === null ? '—' : fmtCFA(item.unit_cost)}</td>
                      <td className="px-5 py-3.5" style={{ color: '#666' }}>{item.location ?? '—'}</td>
                      <td className="px-5 py-3.5" style={{ color: '#555', fontSize: '0.75rem' }}>{fmtDate(item.last_updated)}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => deleteItem(item.id)} style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer' }} title="Supprimer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#111', border: `1px solid rgba(197,165,90,0.2)` }}>
            <h2 className="mb-5" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#fff' }}>Nouvel article d&apos;inventaire</h2>
            <div className="flex flex-col gap-3">

              {/* Product picker */}
              <div>
                <div style={{ color: '#666', fontSize: '0.7rem', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Produit lié *</div>
                <div ref={dropRef} className="relative">
                  <div className="flex items-center gap-2">
                    {selectedProduct && (
                      <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: 36, height: 36, background: CARD_BG, border: BORDER }}>
                        {selectedProduct.images?.[0] ? (
                          <Image src={selectedProduct.images[0]} alt={selectedProduct.name} fill sizes="36px" className="object-cover" unoptimized={shouldBypassNextImageOptimization(selectedProduct.images[0])} />
                        ) : <div className="flex items-center justify-center h-full" style={{ color: '#555' }}>🧴</div>}
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Rechercher un produit…"
                      value={productSearch}
                      onChange={(e) => { setProductSearch(e.target.value); setShowProductDrop(true); if (!e.target.value) clearProduct(); }}
                      onFocus={() => setShowProductDrop(true)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: CARD_BG, border: selectedProduct ? `1px solid ${GOLD}` : BORDER, color: '#fff' }}
                    />
                    {selectedProduct && (
                      <button onClick={clearProduct} className="px-2 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#666', border: BORDER }}>✕</button>
                    )}
                  </div>

                  {showProductDrop && filteredProducts.length > 0 && (
                    <div className="absolute left-0 right-0 z-10 mt-1 rounded-xl overflow-hidden overflow-y-auto" style={{ background: '#1a1a1a', border: `1px solid rgba(197,165,90,0.15)`, maxHeight: 220 }}>
                      {filteredProducts.slice(0, 20).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectProduct(p)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                          style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(197,165,90,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div className="relative shrink-0 rounded-md overflow-hidden" style={{ width: 32, height: 32, background: CARD_BG }}>
                            {p.images?.[0] ? (
                              <Image src={p.images[0]} alt={p.name} fill sizes="32px" className="object-cover" unoptimized={shouldBypassNextImageOptimization(p.images[0])} />
                            ) : <div className="flex items-center justify-center h-full" style={{ color: '#444', fontSize: '0.75rem' }}>🧴</div>}
                          </div>
                          <span style={{ color: '#ddd', fontSize: '0.8rem' }}>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!selectedProduct && (
                  <p style={{ color: '#444', fontSize: '0.7rem', marginTop: 4 }}>Sélectionnez un produit pour le lier automatiquement</p>
                )}
              </div>

              {/* Name (auto-filled or manual) */}
              <input
                type="text"
                placeholder="Nom de l'article *"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: CARD_BG, border: BORDER, color: '#fff', opacity: selectedProduct ? 0.7 : 1 }}
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="SKU"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  className="px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: CARD_BG, border: BORDER, color: '#fff' }}
                />
                <input
                  type="text"
                  placeholder="Emplacement"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: CARD_BG, border: BORDER, color: '#fff' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['quantity', 'low_stock_threshold', 'unit_cost'] as const).map((f) => (
                  <div key={f}>
                    <div style={{ color: '#555', fontSize: '0.7rem', marginBottom: 4 }}>{f === 'quantity' && 'Qté *'}{f === 'low_stock_threshold' && 'Seuil alerte'}{f === 'unit_cost' && 'Coût unit.'}</div>
                    <input
                      type="number" min={0}
                      value={newItem[f]}
                      onChange={(e) => setNewItem({ ...newItem, [f]: Number.parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: CARD_BG, border: BORDER, color: '#fff' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addItem}
                disabled={saving || !newItem.name}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: `linear-gradient(135deg,${GOLD},#A68B3E)`, color: '#080808', opacity: saving || !newItem.name ? 0.5 : 1 }}
              >
                {saving ? 'Enregistrement…' : 'Ajouter à l\'inventaire'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewItem(EMPTY_NEW); setSelectedProduct(null); setProductSearch(''); }}
                className="px-5 py-2.5 rounded-xl text-sm"
                style={{ background: CARD_BG, color: '#999', border: BORDER }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
