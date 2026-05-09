import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

// ─── GET /api/health ──────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('répond avec un statut HTTP 200', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('retourne { status: "ok" }', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('identifie le service comme "vip-parfumerie-bar"', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.service).toBe('vip-parfumerie-bar');
  });

  it('inclut un timestamp en ISO 8601 valide', async () => {
    const res = await GET();
    const body = await res.json();
    expect(typeof body.timestamp).toBe('string');
    const parsed = new Date(body.timestamp);
    expect(parsed.toString()).not.toBe('Invalid Date');
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('ne contient que les clés attendues', async () => {
    const res = await GET();
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(['service', 'status', 'timestamp'].sort());
  });
});
