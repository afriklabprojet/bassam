'use client';

import React, { useEffect, useState } from 'react';
import { GOLD } from '@/lib/admin-theme';

interface Barcode {
  id: string;
  product_id: string | null;
  barcode: string;
  format: string;
  label: string | null;
  active: boolean;
  created_at: string;
  products?: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
}

const CARD_BG = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.07)';
const FORMATS = ['EAN13', 'CODE128', 'QR', 'UPC', 'EAN8'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminCodesBarres() {
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [filterLinked, setFilterLinked] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({ barcode: '', format: 'EAN13', label: '', product_id: '', auto_generate: false });
  const [copied, setCopied] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingLink, setEditingLink] = useState<string | null>(null); // barcode id being re-linked
  const [linkProductId, setLinkProductId] = useState<string>('');

  async function load() {
    try {
      const p = new URLSearchParams();
      if (activeOnly) p.set('active', 'true');
      const res = await fetch(`/api/admin/barcodes?${p}`);
      if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
      const d = await res.json();
      setBarcodes(d.barcodes ?? []);
      setTotal(d.total ?? 0);
    } catch { setError('Erreur réseau'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void (async () => {
      try {
        const p = new URLSearchParams();
        if (activeOnly) p.set('active', 'true');
        const res = await fetch(`/api/admin/barcodes?${p}`);
        if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
        const d = await res.json();
        setBarcodes(d.barcodes ?? []);
        setTotal(d.total ?? 0);
      } catch { setError('Erreur réseau'); }
      finally { setLoading(false); }
    })();
  }, [activeOnly]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/products?limit=200');
        if (!res.ok) return;
        const d = await res.json();
        setProducts(d.products ?? []);
      } catch { /* ignore */ }
    })();
  }, []);

  async function generateEAN() {
    const res = await fetch('/api/admin/barcodes?generate=ean13');
    const d = await res.json();
    setGenerated(d.barcode);
    setNewCode({ ...newCode, barcode: d.barcode, format: 'EAN13' });
  }

  async function addBarcode() {
    setSaving(true);
    await fetch('/api/admin/barcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newCode, product_id: newCode.product_id || null }),
    });
    setSaving(false);
    setShowAdd(false);
    setGenerated(null);
    setNewCode({ barcode: '', format: 'EAN13', label: '', product_id: '', auto_generate: false });
    load();
  }

  async function linkProduct(id: string, product_id: string | null) {
    setSaving(true);
    await fetch('/api/admin/barcodes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, product_id: product_id || null }),
    });
    setSaving(false);
    setEditingLink(null);
    setLinkProductId('');
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch('/api/admin/barcodes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    });
    load();
  }

  async function deleteCode(id: string) {
    if (!confirm('Supprimer ce code-barres ?')) return;
    await fetch(`/api/admin/barcodes?id=${id}`, { method: 'DELETE' });
    load();
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = barcodes.filter((b) => {
    if (filterLinked === 'linked' && !b.product_id) return false;
    if (filterLinked === 'unlinked' && b.product_id) return false;
    if (!search) return true;
    return b.barcode.includes(search) || (b.label ?? '').toLowerCase().includes(search.toLowerCase()) || (b.products?.name ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const unlinkedCount = barcodes.filter((b) => !b.product_id).length;

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="px-6 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>{error}</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#fff' }}>Codes-barres</h1>
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: 2 }}>{total} code{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateEAN} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all" style={{ background: 'transparent', color: GOLD, border: `1px solid rgba(197,165,90,0.3)` }}>
            🔢 Générer EAN13
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#C5A55A,#A68B3E)', color: '#080808' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Quick generate result */}
      {generated && (
        <div className="flex items-center gap-4 mb-5 px-5 py-4 rounded-xl" style={{ background: 'rgba(197,165,90,0.08)', border: `1px solid rgba(197,165,90,0.2)` }}>
          <div>
            <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: 2 }}>EAN-13 généré</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.15em', color: GOLD }}>{generated}</div>
          </div>
          <button onClick={() => copyToClipboard(generated)} className="ml-auto px-4 py-2 rounded-xl text-sm transition-all" style={{ background: copied === generated ? '#10B981' : CARD_BG, color: copied === generated ? '#fff' : '#999', border: BORDER }}>
            {copied === generated ? '✓ Copié' : '📋 Copier'}
          </button>
          <button onClick={() => setGenerated(null)} style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>✕</button>
        </div>
      )}

      {/* Alert: unlinked barcodes */}
      {unlinkedCount > 0 && (
        <div className="flex items-center gap-3 mb-5 px-5 py-3.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <span style={{ color: '#F59E0B', fontSize: '1rem' }}>⚠️</span>
          <div>
            <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.875rem' }}>{unlinkedCount} code{unlinkedCount > 1 ? 's' : ''} sans produit lié</span>
            <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: 8 }}>— Cliquez sur «&nbsp;Lier&nbsp;» dans la colonne Produit</span>
          </div>
          <button onClick={() => setFilterLinked('unlinked')} className="ml-auto px-3 py-1 rounded-lg text-xs" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
            Voir uniquement
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input type="text" placeholder="Rechercher code, label, produit…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[220px] px-4 py-2 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
        <div className="flex rounded-xl overflow-hidden" style={{ border: BORDER }}>
          {(['all', 'linked', 'unlinked'] as const).map((v) => (
            <button key={v} onClick={() => setFilterLinked(v)} className="px-3 py-2 text-xs font-medium transition-all" style={{ background: filterLinked === v ? 'rgba(197,165,90,0.15)' : CARD_BG, color: filterLinked === v ? GOLD : '#666', borderRight: v !== 'unlinked' ? BORDER : 'none' }}>
              {v === 'all' ? 'Tous' : v === 'linked' ? '🔗 Liés' : '⚠ Non liés'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer select-none" style={{ background: activeOnly ? 'rgba(16,185,129,0.12)' : CARD_BG, color: activeOnly ? '#10B981' : '#999', border: BORDER }}>
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} className="hidden" />
          {activeOnly ? '✓' : '○'} Actifs
        </label>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--noir-card)', border: BORDER }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(197,165,90,0.2)', borderTopColor: GOLD }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center" style={{ color: '#666' }}>Aucun code-barres trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Code', 'Format', 'Label', 'Produit lié', 'Statut', 'Créé', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left" style={{ color: '#555', fontWeight: 500, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', fontSize: '0.9rem' }}>{b.barcode}</span>
                        <button onClick={() => copyToClipboard(b.barcode)} style={{ color: copied === b.barcode ? '#10B981' : '#444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>
                          {copied === b.barcode ? '✓' : '📋'}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#bbb' }}>{b.format}</span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#aaa', fontSize: '0.8rem' }}>{b.label ?? '—'}</td>
                    {/* Produit lié — inline edit */}
                    <td className="px-5 py-3.5" style={{ minWidth: 200 }}>
                      {editingLink === b.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={linkProductId}
                            onChange={(e) => setLinkProductId(e.target.value)}
                            className="flex-1 px-2 py-1 rounded-lg text-xs outline-none"
                            style={{ background: '#1a1a1a', border: `1px solid rgba(197,165,90,0.3)`, color: '#fff' }}
                          >
                            <option value="">— Aucun produit —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} — {p.brand}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => linkProduct(b.id, linkProductId)}
                            disabled={saving}
                            className="px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: `linear-gradient(135deg,${GOLD},#A68B3E)`, color: '#080808', border: 'none', cursor: 'pointer' }}
                          >✓</button>
                          <button
                            onClick={() => { setEditingLink(null); setLinkProductId(''); }}
                            style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                          >✕</button>
                        </div>
                      ) : b.products?.name ? (
                        <div className="flex items-center gap-2 group">
                          <span className="flex items-center gap-1.5">
                            <span style={{ color: '#10B981', fontSize: '0.65rem' }}>●</span>
                            <span style={{ color: '#fff', fontSize: '0.8rem' }}>{b.products.name}</span>
                          </span>
                          <button
                            onClick={() => { setEditingLink(b.id); setLinkProductId(b.product_id ?? ''); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded text-xs"
                            style={{ color: '#666', background: CARD_BG, border: BORDER }}
                          >Changer</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingLink(b.id); setLinkProductId(''); }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:border-yellow-500/40"
                          style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
                          Lier un produit
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleActive(b.id, b.active)} className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all" style={{ background: b.active ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)', color: b.active ? '#10B981' : '#6B7280', cursor: 'pointer', border: 'none' }}>
                        {b.active ? '● Actif' : '○ Inactif'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#555', fontSize: '0.75rem' }}>{fmtDate(b.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => deleteCode(b.id)} style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#111', border: `1px solid rgba(197,165,90,0.2)` }}>
            <h2 className="mb-5" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#fff' }}>Nouveau code-barres</h2>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input type="text" placeholder="Valeur du code *" value={newCode.barcode} onChange={(e) => setNewCode({ ...newCode, barcode: e.target.value })} className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff', fontFamily: 'monospace' }} />
                <button onClick={generateEAN} className="px-3 py-2 rounded-xl text-xs" style={{ background: CARD_BG, color: GOLD, border: `1px solid rgba(197,165,90,0.2)` }}>Auto EAN13</button>
              </div>
              <div>
                <div style={{ color: '#555', fontSize: '0.7rem', marginBottom: 4 }}>Format</div>
                <select value={newCode.format} onChange={(e) => setNewCode({ ...newCode, format: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }}>
                  {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <input type="text" placeholder="Label (ex: Chanel No.5 50ml)" value={newCode.label} onChange={(e) => setNewCode({ ...newCode, label: e.target.value })} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
              <div>
                <div style={{ color: '#555', fontSize: '0.7rem', marginBottom: 4 }}>Produit associé <span style={{ color: '#444' }}>(optionnel)</span></div>
                <select
                  value={newCode.product_id}
                  onChange={(e) => setNewCode({ ...newCode, product_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: CARD_BG, border: newCode.product_id ? `1px solid rgba(197,165,90,0.35)` : BORDER, color: newCode.product_id ? '#fff' : '#555' }}
                >
                  <option value="">— Sélectionner un produit —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.brand}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={addBarcode} disabled={saving || !newCode.barcode} className="flex-1 py-2.5 rounded-xl font-semibold text-sm" style={{ background: `linear-gradient(135deg,${GOLD},#A68B3E)`, color: '#080808' }}>
                {saving ? 'Enregistrement…' : 'Ajouter'}
              </button>
              <button onClick={() => { setShowAdd(false); setGenerated(null); }} className="px-5 py-2.5 rounded-xl text-sm" style={{ background: CARD_BG, color: '#999', border: BORDER }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
