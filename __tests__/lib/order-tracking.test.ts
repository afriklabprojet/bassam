import { describe, expect, it } from 'vitest';
import { orderIdRange, parseOrderRef, phonesMatch, trackingStep } from '@/lib/order-tracking';

describe('parseOrderRef', () => {
  it('accepte le numéro tel qu’il figure sur l’e-mail et la facture, avec ou sans « VIP- »', () => {
    expect(parseOrderRef('VIP-ABCDEF12')).toBe('abcdef12');
    expect(parseOrderRef('  vip-abcdef12 ')).toBe('abcdef12');
    expect(parseOrderRef('ABCDEF12')).toBe('abcdef12');
    expect(parseOrderRef('#VIP ABCDEF12')).toBe('abcdef12');
  });

  it('accepte aussi l’identifiant complet (lien de confirmation)', () => {
    expect(parseOrderRef('abcdef12-0000-4000-8000-000000000001')).toBe('abcdef12');
  });

  it('refuse ce qui ne peut pas être un numéro de commande', () => {
    for (const value of ['', 'VIP-', 'VIP-ABC', 'VIP-GHIJKLMN', 'abcdef1', 'abcdef123']) {
      expect(parseOrderRef(value)).toBeNull();
    }
  });
});

describe('orderIdRange', () => {
  it('couvre tous les identifiants qui commencent par le numéro', () => {
    expect(orderIdRange('abcdef12')).toEqual([
      'abcdef12-0000-0000-0000-000000000000',
      'abcdef12-ffff-ffff-ffff-ffffffffffff',
    ]);
  });
});

describe('phonesMatch', () => {
  it('compare des numéros ivoiriens quelle que soit leur écriture', () => {
    expect(phonesMatch('07 01 02 03 04', '0701020304')).toBe(true);
    expect(phonesMatch('+225 07 01 02 03 04', '0701020304')).toBe(true);
    expect(phonesMatch('2250701020304', '07-01-02-03-04')).toBe(true);
    expect(phonesMatch('701020304', '0701020304')).toBe(true);
  });

  it('accepte le préfixe international 00225, dans les deux sens', () => {
    expect(phonesMatch('00225 07 01 02 03 04', '0701020304')).toBe(true);
    expect(phonesMatch('0701020304', '00225 07 01 02 03 04')).toBe(true);
    expect(phonesMatch('00225 07 01 02 03 04', '+225 07 01 02 03 04')).toBe(true);
    expect(phonesMatch('+2250701020304', '002250701020304')).toBe(true);
  });

  it('compare aussi les numéros étrangers (chiffres seuls)', () => {
    expect(phonesMatch('+33 6 12 34 56 78', '0033612345678')).toBe(true);
    expect(phonesMatch('+33 6 12 34 56 78', '+33 6 12 34 56 79')).toBe(false);
  });

  it('refuse un numéro différent ou vide', () => {
    expect(phonesMatch('0701020304', '0701020305')).toBe(false);
    expect(phonesMatch('', '0701020304')).toBe(false);
    expect(phonesMatch('0701020304', null)).toBe(false);
  });
});

describe('trackingStep', () => {
  it('place chaque statut sur la frise Reçue → Confirmée → Expédiée → Livrée', () => {
    expect(trackingStep('pending')).toBe(0);
    expect(trackingStep('confirmed')).toBe(1);
    expect(trackingStep('shipped')).toBe(2);
    expect(trackingStep('delivered')).toBe(3);
  });

  it('une commande annulée ou au statut inconnu n’est pas sur la frise', () => {
    expect(trackingStep('cancelled')).toBeNull();
    expect(trackingStep('refunded')).toBeNull();
  });
});
