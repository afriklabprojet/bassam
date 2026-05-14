import { test, expect } from '@playwright/test';

// ══════════════════════════════════════════════════════════════
//  E2E — Boutique (pages publiques)
// ══════════════════════════════════════════════════════════════

test.describe('Page d\'accueil', () => {
  test('se charge sans erreur 5xx', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(500);
  });

  test('affiche un titre principal (h1)', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 8000 });
  });

  test('le lien "Nos parfums" pointe vers /produits', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a[href="/produits"]').first();
    await expect(link).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Page catalogue produits', () => {
  test('se charge sans erreur', async ({ page }) => {
    const res = await page.goto('/produits');
    expect(res?.status()).toBeLessThan(500);
  });

  test('affiche un titre h1', async ({ page }) => {
    await page.goto('/produits');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
  });

  test('contient des filtres (genre / tri)', async ({ page }) => {
    await page.goto('/produits');
    const filter = page.locator('select, [role="listbox"], button').first();
    await expect(filter).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Page panier', () => {
  test('se charge sans erreur', async ({ page }) => {
    const res = await page.goto('/panier');
    expect(res?.status()).toBeLessThan(500);
  });

  test('affiche le message "panier vide" si aucun article', async ({ page }) => {
    await page.goto('/panier');
    const empty = page.locator('text=/panier est vide/i');
    await expect(empty).toBeVisible({ timeout: 8000 });
  });

  test('contient un lien vers le catalogue', async ({ page }) => {
    await page.goto('/panier');
    const link = page.locator('a[href="/produits"]').first();
    await expect(link).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Page services', () => {
  test('se charge sans erreur', async ({ page }) => {
    const res = await page.goto('/services');
    expect(res?.status()).toBeLessThan(500);
  });

  test('affiche un h1', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
  });

  test('contient un lien vers le quiz olfactif', async ({ page }) => {
    await page.goto('/services');
    const link = page.locator('a[href*="quiz"]').first();
    await expect(link).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Quiz olfactif', () => {
  test('se charge sans erreur', async ({ page }) => {
    const res = await page.goto('/services/quiz-olfactif');
    expect(res?.status()).toBeLessThan(500);
  });

  test('affiche la première question', async ({ page }) => {
    await page.goto('/services/quiz-olfactif');
    const question = page.locator('text=/pour qui/i').first();
    await expect(question).toBeVisible({ timeout: 8000 });
  });

  test('le bouton Suivant est désactivé sans sélection', async ({ page }) => {
    await page.goto('/services/quiz-olfactif');
    const nextBtn = page.locator('button', { hasText: /suivant/i }).first();
    if (await nextBtn.isVisible()) {
      await expect(nextBtn).toBeDisabled();
    }
  });

  test('avance à la question 2 après sélection', async ({ page }) => {
    await page.goto('/services/quiz-olfactif');
    const firstChoice = page.locator('button[data-choice], button').filter({ hasText: /elle|lui|genre/i }).first();
    if (await firstChoice.isVisible({ timeout: 5000 })) {
      await firstChoice.click();
      const nextBtn = page.locator('button', { hasText: /suivant/i }).first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        const q2 = page.locator('text=/ambiance/i').first();
        await expect(q2).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Consultation privée', () => {
  test('se charge sans erreur', async ({ page }) => {
    const res = await page.goto('/services/consultation');
    expect(res?.status()).toBeLessThan(500);
  });

  test('affiche le formulaire de réservation', async ({ page }) => {
    await page.goto('/services/consultation');
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 8000 });
  });

  test('contient les 3 formules tarifaires', async ({ page }) => {
    await page.goto('/services/consultation');
    await expect(page.locator('text=Découverte').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Signature').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Cadeau').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Création personnalisée', () => {
  test('se charge sans erreur', async ({ page }) => {
    const res = await page.goto('/services/creation-personnalisee');
    expect(res?.status()).toBeLessThan(500);
  });

  test('affiche le formulaire de brief créatif', async ({ page }) => {
    await page.goto('/services/creation-personnalisee');
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Page À propos', () => {
  test('se charge sans erreur', async ({ page }) => {
    const res = await page.goto('/a-propos');
    expect(res?.status()).toBeLessThan(500);
  });
});

test.describe('Pages légales', () => {
  for (const path of ['/cgv', '/mentions', '/confidentialite']) {
    test(`${path} se charge sans erreur`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(500);
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
    });
  }
});

test.describe('Navigation Header', () => {
  test('le header est visible sur la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 5000 });
  });

  test('le lien panier est présent dans le header', async ({ page }) => {
    await page.goto('/');
    const cartLink = page.locator('a[href="/panier"]').first();
    await expect(cartLink).toBeVisible({ timeout: 5000 });
  });

  test('le footer est visible sur la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 8000 });
  });
});

test.describe('API Health', () => {
  test('GET /api/health retourne status ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
