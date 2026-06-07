import { describe, it, expect, vi } from 'vitest';

/* ── Mocks ───────────────────────────────────────────────────────────────── */

const mockSelect = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn(() => ({ select: mockSelect, limit: mockLimit, single: mockSingle }));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}));

// chain: .select().limit().single() — each must return the next link
mockSelect.mockReturnValue({ limit: mockLimit });
mockLimit.mockReturnValue({ single: mockSingle });

/* ── Route ───────────────────────────────────────────────────────────────── */

import { GET } from '@/app/api/health/route';

// ─── GET /api/health ──────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('répond avec un statut HTTP 200 quand la DB est OK', async () => {
    mockSingle.mockResolvedValue({ error: null });
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('retourne status "ok" quand la DB répond', async () => {
    mockSingle.mockResolvedValue({ error: null });
    const res = await GET();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('retourne status "degraded" et HTTP 503 quand la DB est en erreur', async () => {
    mockSingle.mockResolvedValue({ error: { code: 'PGRST301', message: 'connection error' } });
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('degraded');
    expect(body.checks.database.status).toBe('degraded');
  });

  it('traite PGRST116 (aucune ligne) comme OK', async () => {
    mockSingle.mockResolvedValue({ error: { code: 'PGRST116', message: 'no rows' } });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('identifie le service comme "vip-parfumerie-bar"', async () => {
    mockSingle.mockResolvedValue({ error: null });
    const res = await GET();
    const body = await res.json();
    expect(body.service).toBe('vip-parfumerie-bar');
  });

  it('inclut un timestamp ISO 8601 valide', async () => {
    mockSingle.mockResolvedValue({ error: null });
    const res = await GET();
    const body = await res.json();
    expect(typeof body.timestamp).toBe('string');
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('inclut les clés latencyMs et checks.database', async () => {
    mockSingle.mockResolvedValue({ error: null });
    const res = await GET();
    const body = await res.json();
    expect(typeof body.latencyMs).toBe('number');
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.database.status).toBe('ok');
    expect(typeof body.checks.database.latencyMs).toBe('number');
  });
});
