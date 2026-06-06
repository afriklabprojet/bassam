'use client';

import React, { useEffect, useState } from 'react';

interface Task {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Stats { pending: number; in_progress: number; done: number; cancelled: number; critical: number; high: number; medium: number; low: number; }

import { GOLD } from '@/lib/admin-theme';

const CARD_BG = 'rgba(255,255,255,0.04)';
const BORDER = '1px solid rgba(255,255,255,0.07)';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'En attente' },
  in_progress: { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', label: 'En cours' },
  done:        { bg: 'rgba(16,185,129,0.12)',  color: '#10B981', label: 'Terminé' },
  cancelled:   { bg: 'rgba(107,114,128,0.12)', color: '#6B7280', label: 'Annulé' },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', label: 'Critique' },
  high:     { bg: 'rgba(249,115,22,0.12)', color: '#F97316', label: 'Haute' },
  medium:   { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Moyenne' },
  low:      { bg: 'rgba(107,114,128,0.12)',color: '#9CA3AF', label: 'Basse' },
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminMaintenance() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, in_progress: 0, done: 0, cancelled: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState({ type: 'preventive', title: '', description: '', priority: 'medium', assigned_to: '', scheduled_at: '', notes: '' });

  async function load() {
    try {
      const p = new URLSearchParams();
      if (statusFilter) p.set('status', statusFilter);
      if (priorityFilter) p.set('priority', priorityFilter);
      const res = await fetch(`/api/admin/maintenance?${p}`);
      if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
      const d = await res.json();
      setTasks(d.tasks ?? []);
      setStats(d.stats ?? {});
    } catch { setError('Erreur réseau'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    void (async () => {
      try {
        const p = new URLSearchParams();
        if (statusFilter) p.set('status', statusFilter);
        if (priorityFilter) p.set('priority', priorityFilter);
        const res = await fetch(`/api/admin/maintenance?${p}`);
        if (!res.ok) { setError(res.status === 403 ? 'Accès refusé' : 'Erreur'); return; }
        const d = await res.json();
        setTasks(d.tasks ?? []);
        setStats(d.stats ?? {});
      } catch { setError('Erreur réseau'); }
      finally { setLoading(false); }
    })();
  }, [statusFilter, priorityFilter]);

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    await fetch('/api/admin/maintenance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setSaving(null);
    load();
  }

  async function addTask() {
    setSaving('new');
    await fetch('/api/admin/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });
    setSaving(null);
    setShowAdd(false);
    setNewTask({ type: 'preventive', title: '', description: '', priority: 'medium', assigned_to: '', scheduled_at: '', notes: '' });
    load();
  }

  async function deleteTask(id: string) {
    if (!confirm('Supprimer cette tâche ?')) return;
    await fetch(`/api/admin/maintenance?id=${id}`, { method: 'DELETE' });
    load();
  }

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="px-6 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>{error}</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 600, color: '#fff' }}>Maintenance</h1>
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: 2 }}>{tasks.length} tâche{tasks.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#C5A55A,#A68B3E)', color: '#080808' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
          Nouvelle tâche
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'En attente', value: stats.pending, color: '#F59E0B', icon: '⏳' },
          { label: 'En cours', value: stats.in_progress, color: '#3B82F6', icon: '🔧' },
          { label: 'Terminées', value: stats.done, color: '#10B981', icon: '✅' },
          { label: 'Critiques', value: stats.critical, color: '#EF4444', icon: '🚨' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5" style={{ background: CARD_BG, border: BORDER }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 flex-wrap">
          <span style={{ color: '#666', fontSize: '0.75rem', alignSelf: 'center', marginRight: 4 }}>Statut:</span>
          <button onClick={() => setStatusFilter('')} className="px-3 py-1 rounded-lg text-xs transition-all" style={{ background: !statusFilter ? GOLD : CARD_BG, color: !statusFilter ? '#080808' : '#999' }}>Tous</button>
          {Object.entries(STATUS_STYLE).map(([k, v]) => (
            <button key={k} onClick={() => setStatusFilter(k)} className="px-3 py-1 rounded-lg text-xs transition-all" style={{ background: statusFilter === k ? v.bg : CARD_BG, color: statusFilter === k ? v.color : '#999' }}>{v.label}</button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap ml-auto">
          <span style={{ color: '#666', fontSize: '0.75rem', alignSelf: 'center', marginRight: 4 }}>Priorité:</span>
          <button onClick={() => setPriorityFilter('')} className="px-3 py-1 rounded-lg text-xs transition-all" style={{ background: !priorityFilter ? GOLD : CARD_BG, color: !priorityFilter ? '#080808' : '#999' }}>Toutes</button>
          {Object.entries(PRIORITY_STYLE).map(([k, v]) => (
            <button key={k} onClick={() => setPriorityFilter(k)} className="px-3 py-1 rounded-lg text-xs transition-all" style={{ background: priorityFilter === k ? v.bg : CARD_BG, color: priorityFilter === k ? v.color : '#999' }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Task cards */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(197,165,90,0.2)', borderTopColor: GOLD }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-12 text-center" style={{ color: '#666' }}>Aucune tâche</div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((t) => {
            const ss = STATUS_STYLE[t.status] ?? STATUS_STYLE.pending;
            const ps = PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.medium;
            return (
              <div key={t.id} className="rounded-xl p-5" style={{ background: CARD_BG, border: BORDER }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: '#888' }}>{t.type}</span>
                    </div>
                    <div style={{ color: '#fff', fontWeight: 600, marginTop: 4 }}>{t.title}</div>
                    {t.description && <div style={{ color: '#777', fontSize: '0.8125rem', marginTop: 4 }}>{t.description}</div>}
                    <div className="flex flex-wrap gap-4 mt-3" style={{ fontSize: '0.75rem', color: '#555' }}>
                      {t.assigned_to && <span>👤 {t.assigned_to}</span>}
                      {t.scheduled_at && <span>📅 Prévu: {fmtDate(t.scheduled_at)}</span>}
                      {t.completed_at && <span>✅ Terminé: {fmtDate(t.completed_at)}</span>}
                      <span>Créé: {fmtDate(t.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={t.status}
                      onChange={(e) => updateStatus(t.id, e.target.value)}
                      disabled={saving === t.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold outline-none cursor-pointer"
                      style={{ background: ss.bg, color: ss.color, border: 'none' }}
                    >
                      {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button onClick={() => deleteTask(t.id)} style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: '#111', border: `1px solid rgba(197,165,90,0.2)` }}>
            <h2 className="mb-5" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#fff' }}>Nouvelle tâche de maintenance</h2>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Titre *" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
              <textarea placeholder="Description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} rows={3} className="px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div style={{ color: '#555', fontSize: '0.7rem', marginBottom: 4 }}>Type</div>
                  <select value={newTask.type} onChange={(e) => setNewTask({ ...newTask, type: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }}>
                    {['preventive', 'corrective', 'inspection', 'upgrade', 'other'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: '0.7rem', marginBottom: 4 }}>Priorité</div>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }}>
                    {Object.entries(PRIORITY_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <input type="text" placeholder="Assigné à" value={newTask.assigned_to} onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
              <input type="date" placeholder="Date prévue" value={newTask.scheduled_at} onChange={(e) => setNewTask({ ...newTask, scheduled_at: e.target.value })} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: CARD_BG, border: BORDER, color: '#fff' }} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={addTask} disabled={saving === 'new' || !newTask.title} className="flex-1 py-2.5 rounded-xl font-semibold text-sm" style={{ background: `linear-gradient(135deg,${GOLD},#A68B3E)`, color: '#080808' }}>
                {saving === 'new' ? 'Enregistrement…' : 'Créer la tâche'}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl text-sm" style={{ background: CARD_BG, color: '#999', border: BORDER }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
