import { describe, it, expect } from 'vitest';
import { parseBearer } from '@/lib/supabase/bearer';

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJl';

describe('parseBearer', () => {
  it('retourne none sans en-tête', () => {
    expect(parseBearer(null)).toEqual({ kind: 'none' });
    expect(parseBearer(undefined)).toEqual({ kind: 'none' });
    expect(parseBearer('')).toEqual({ kind: 'none' });
    expect(parseBearer('   ')).toEqual({ kind: 'none' });
  });

  it('extrait un jeton de forme JWT', () => {
    expect(parseBearer(`Bearer ${JWT}`)).toEqual({ kind: 'token', token: JWT });
  });

  it('accepte le schéma sans tenir compte de la casse et des espaces autour', () => {
    expect(parseBearer(`  bearer   ${JWT}  `)).toEqual({ kind: 'token', token: JWT });
  });

  it('ignore les autres schémas (retour aux cookies)', () => {
    expect(parseBearer('Basic dXNlcjpwYXNz')).toEqual({ kind: 'none' });
    expect(parseBearer(JWT)).toEqual({ kind: 'none' });
  });

  it('marque invalide un Bearer vide ou mal formé', () => {
    expect(parseBearer('Bearer')).toEqual({ kind: 'invalid' });
    expect(parseBearer('Bearerx')).toEqual({ kind: 'none' });
    expect(parseBearer('Bearer abc')).toEqual({ kind: 'invalid' });
    expect(parseBearer('Bearer a.b')).toEqual({ kind: 'invalid' });
    expect(parseBearer('Bearer a.b.c d')).toEqual({ kind: 'invalid' });
    expect(parseBearer('Bearer null')).toEqual({ kind: 'invalid' });
  });
});
