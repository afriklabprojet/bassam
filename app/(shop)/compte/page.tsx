'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getLightOrderStatusStyle, getOrderStatusLabel } from '@/lib/order-status-theme';
import { buildWhatsAppHref, hasWhatsAppSupport } from '@/lib/site-config';
import type { User } from '@supabase/supabase-js';

type Tab = 'commandes' | 'wishlist' | 'fidelite' | 'profil';

interface ProfileData {
  fullName: string | null;
  phone: string | null;
  email: string | null;
  preferences: Record<string, unknown>;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: { name: string; brand: string; slug: string; images: string[] };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItem[];
}

interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  price: number;
}

const LOYALTY_LEVELS = [
  { name: 'Bronze', min: 0,      max: 50000,   perks: ['2 échantillons/commande', 'Accès promotions early'] },
  { name: 'Argent', min: 50000,  max: 150000,  perks: ['4 échantillons/commande', 'Livraison -50%', 'Remise 5%'] },
  { name: 'Or',     min: 150000, max: Infinity, perks: ['Livraison gratuite', 'Remise 10%', 'Services VIP'] },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

function isTabValue(value: string | null): value is Tab {
  return value === 'commandes' || value === 'wishlist' || value === 'fidelite' || value === 'profil';
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>('commandes');

  // Profile edit form
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone]       = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { router.replace('/auth/login'); return; }
      setUser(user);

      const [profileRes, ordersRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/orders'),
      ]);

      if (cancelled) return;
      if (profileRes.ok) {
        const { profile: p } = await profileRes.json() as { profile: ProfileData };
        setProfile(p);
        setEditFullName(p.fullName ?? '');
        setEditPhone(p.phone ?? '');
      }
      if (ordersRes.ok) {
        const { orders: o } = await ordersRes.json() as { orders: Order[] };
        setOrders(o ?? []);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  // router is intentionally omitted: this effect must run once on mount only.
  // Including router would create an infinite loop because router.replace()
  // updates the AppRouter context, which changes the router reference,
  // which would re-trigger the effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const requestedTab = new URLSearchParams(window.location.search).get('tab');

    if (isTabValue(requestedTab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(requestedTab);
    }
  }, []);

  const wishlist: WishlistItem[] =
    (profile?.preferences?.wishlist as WishlistItem[] | undefined) ?? [];

  const totalSpent = orders
    .filter((o) => ['delivered', 'shipped', 'confirmed'].includes(o.status))
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const currentLevel = LOYALTY_LEVELS.find((l) => totalSpent >= l.min && totalSpent < l.max) ?? LOYALTY_LEVELS[0];
  const nextLevel    = LOYALTY_LEVELS[LOYALTY_LEVELS.indexOf(currentLevel) + 1];
  const progressToNext = nextLevel
    ? ((totalSpent - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: editFullName, phone: editPhone }),
    });
    if (res.ok) {
      const { profile: p } = await res.json() as { profile: ProfileData };
      setProfile(p);
      setProfileMsg({ type: 'success', text: 'Profil mis à jour avec succès' });
    } else {
      const { error } = await res.json() as { error: string };
      setProfileMsg({ type: 'error', text: error ?? 'Erreur lors de la mise à jour' });
    }
    setProfileSaving(false);
  }

  async function removeFromWishlist(itemId: string) {
    const newWishlist = wishlist.filter((w) => w.id !== itemId);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { ...profile?.preferences, wishlist: newWishlist } }),
    });
    if (res.ok) {
      const { profile: p } = await res.json() as { profile: ProfileData };
      setProfile(p);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  function selectTab(nextTab: Tab) {
    setTab(nextTab);

    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    params.set('tab', nextTab);
    router.replace(`/compte?${params.toString()}`, { scroll: false });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'commandes', label: 'Commandes' },
    { key: 'wishlist',  label: 'Wishlist'  },
    { key: 'fidelite',  label: 'Fidélité'  },
    { key: 'profil',    label: 'Profil'    },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--offwhite)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--gold)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--offwhite)' }}>
      <div className="container mx-auto py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          <Link href="/" className="hover:text-gray-800" style={{ color: 'var(--text-secondary)' }}>Accueil</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>Mon Compte</span>
        </nav>

        {/* Header */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ padding: '2rem', background: 'var(--noir)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold)', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--noir)' }}>
                  {(profile?.fullName ?? user?.email ?? 'VB').substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, color: '#fff' }}>
                  Bonjour{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''} !
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', marginTop: '0.125rem', fontWeight: 300 }}>
                  Membre {currentLevel.name} · {formatPrice(totalSpent)} dépensés
                </p>
              </div>
              <button
                onClick={handleSignOut}
                style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', background: 'none', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.5rem' }}
              >
                Déconnexion
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', overflowX: 'auto', borderTop: '1px solid var(--line-light)' }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => selectTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '1rem 1.25rem',
                  fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap',
                  borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
                  color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: 'none', cursor: 'pointer',
                  letterSpacing: '0.04em', transition: 'color 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Commandes */}
        {tab === 'commandes' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p className="text-gray-500" style={{ color: 'var(--text-secondary)' }}>Aucune commande pour le moment.</p>
                <Link href="/produits" className="btn-primary mt-4 inline-block">Découvrir nos parfums</Link>
              </div>
            ) : (
              orders.map((order) => {
                const badge = getLightOrderStatusStyle(order.status);
                const shortId = `VIP-${order.id.substring(0, 8).toUpperCase()}`;
                return (
                  <div key={order.id} className="card" style={{ padding: '1.25rem' }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{shortId}</p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {order.items?.map((item) => (
                            <span key={item.id} style={{ fontSize: '0.6875rem', background: 'var(--offwhite)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '2px', border: '1px solid var(--line-light)' }}>
                              {item.product?.name ?? `Article ×${item.quantity}`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '3px 10px', borderRadius: '2px', background: badge.bg, color: badge.color }}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                        <p className="font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{formatPrice(order.totalAmount)}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line-light)', display: 'flex', gap: '0.75rem' }}>
                      {hasWhatsAppSupport() ? (
                        <a
                          href={buildWhatsAppHref(`Suivi commande ${shortId}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium"
                          style={{ color: 'var(--gold-dark)' }}
                        >
                          Suivre via WhatsApp
                        </a>
                      ) : (
                        <Link
                          href="/contact"
                          className="text-sm font-medium"
                          style={{ color: 'var(--gold-dark)' }}
                        >
                          Contacter le service client
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Wishlist */}
        {tab === 'wishlist' && (
          <div className="space-y-4">
            {wishlist.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p className="text-gray-500" style={{ color: 'var(--text-secondary)' }}>Votre liste de souhaits est vide.</p>
                <Link href="/produits" className="btn-primary mt-4 inline-block">Parcourir les parfums</Link>
              </div>
            ) : (
              wishlist.map((item) => (
                <div key={item.id} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{item.brand}</p>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
                    <p className="font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/produits/${item.id}`} className="btn-primary text-sm px-4 py-2">
                      Voir
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="text-sm hover:text-red-500 transition-colors px-3 py-2"
                      style={{ color: 'var(--text-pale)' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Fidélité */}
        {tab === 'fidelite' && (
          <div className="space-y-6">
            {/* Current level card */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div
                style={{ padding: '1.5rem', background: 'var(--gold-muted)', borderBottom: '1px solid var(--line-light)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    style={{ width: '52px', height: '52px', borderRadius: '4px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--noir)', fontSize: '1rem' }}>{currentLevel.name.substring(0, 2)}</span>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 500 }}>
                      Membre {currentLevel.name}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatPrice(totalSpent)} dépensés au total</p>
                  </div>
                </div>

                {nextLevel && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>Progression vers {nextLevel.name}</span>
                      <span className="font-medium">{formatPrice(nextLevel.min - totalSpent)} restants</span>
                    </div>
                    <div style={{ height: '2px', background: 'var(--line-light)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div
                        style={{ height: '100%', borderRadius: '1px', transition: 'width 0.5s ease', width: `${progressToNext}%`, background: 'var(--gold)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Perks */}
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, marginBottom: '0.75rem' }}>Vos avantages</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentLevel.perks.map((perk) => (
                    <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 300 }}>
                      <svg width="14" height="14" fill="none" stroke="var(--gold)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* All levels */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, marginBottom: '1.25rem' }}>Programme de fidélité</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {LOYALTY_LEVELS.map((level) => (
                  <div
                    key={level.name}
                    style={{ borderRadius: 'var(--r-md)', padding: '1rem', border: `1px solid ${currentLevel.name === level.name ? 'var(--gold)' : 'var(--line-light)'}`, background: currentLevel.name === level.name ? 'var(--gold-muted)' : 'transparent' }}
                  >
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400, color: 'var(--text-primary)' }}>{level.name}</p>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {level.max === Infinity ? `À partir de ${formatPrice(level.min)}` : `${formatPrice(level.min)} – ${formatPrice(level.max)}`}
                    </p>
                    <ul className="space-y-1">
                      {level.perks.map((p) => (
                        <li key={p} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.375rem', fontWeight: 300 }}>
                          <span style={{ color: 'var(--gold)', marginTop: '1px', flexShrink: 0 }}>•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Profil */}
        {tab === 'profil' && (
          <div className="card" style={{ padding: '2rem', maxWidth: '480px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 400, marginBottom: '1.5rem' }}>
              Mes informations
            </h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="input"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Votre nom complet"
                  className="input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+225 07 XX XX XX XX"
                  className="input"
                />
              </div>
              {profileMsg && (
                <p style={{ fontSize: '0.8125rem', color: profileMsg.type === 'success' ? 'var(--gold)' : '#ef4444' }}>
                  {profileMsg.text}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={profileSaving}
                style={{ width: '100%', opacity: profileSaving ? 0.7 : 1 }}
              >
                {profileSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
