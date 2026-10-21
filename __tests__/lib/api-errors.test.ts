// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { dbErrorResponse } from '@/lib/api-errors';

const rawMessage = 'duplicate key value violates unique constraint "categories_slug_key"';

describe('dbErrorResponse', () => {
  it.each([
    ['23505', 409, 'Cet élément existe déjà.'],
    ['23503', 409, 'Opération impossible : un élément lié est manquant ou encore utilisé.'],
    ['23502', 400, 'Données invalides : un champ obligatoire est manquant.'],
    ['23514', 400, 'Données invalides.'],
    ['22P02', 400, 'Données invalides.'],
  ])('traduit le code Postgres %s en HTTP %i', async (code, status, message) => {
    const res = dbErrorResponse('API /admin/test', { code, message: rawMessage });

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: message });
  });

  it('renvoie une erreur serveur générique pour tout autre code, sans code ou pour une exception', async () => {
    for (const error of [
      { code: 'PGRST301', message: 'JWT expired' },
      { message: 'The resource already exists' },
      new SyntaxError('Unexpected token < in JSON at position 0'),
      'boom',
      null,
    ]) {
      const res = dbErrorResponse('API /admin/test', error);
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Erreur serveur. Réessayez dans un instant.' });
    }
  });

  it('traduit aussi une erreur Postgres relancée puis attrapée (throw error)', async () => {
    const thrown = Object.assign(new Error(rawMessage), { code: '23505' });
    const res = dbErrorResponse('API /admin/home', thrown);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'Cet élément existe déjà.' });
  });

  it('garde le message brut dans les journaux et jamais dans la réponse', async () => {
    // Outside development, logger writes structured JSON to stdout.
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const res = dbErrorResponse('API /admin/categories', { code: '23505', message: rawMessage });

    expect(JSON.stringify(await res.json())).not.toContain('categories_slug_key');
    expect(spy.mock.calls.flat().join(' ')).toContain('categories_slug_key');
    spy.mockRestore();
  });
});
