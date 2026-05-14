import { test, expect } from '@playwright/test';

const ADMIN_URL = '/admin';
const LOGIN_URL = '/admin/login';

// ══════════════════════════════════════════════════════════════
//  E2E — Admin : authentification & protection des routes
// ══════════════════════════════════════════════════════════════

test.describe('Authentification admin', () => {
  test('redirige vers /admin/login si non authentifié', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('page de connexion affiche le formulaire email + password', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('affiche un heading reconnaissable sur la page login', async ({ page }) => {
    await page.goto(LOGIN_URL);
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('affiche une erreur avec des identifiants invalides', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.fill('input[type="email"]', 'mauvais@exemple.com');
    await page.fill('input[type="password"], input[name="password"]', 'mauvaismdp');
    await page.click('button[type="submit"]');
    const error = page.locator('text=Identifiants incorrects');
    await expect(error).toBeVisible({ timeout: 8000 });
  });

  test('page login répond < 500', async ({ page }) => {
    const res = await page.goto(LOGIN_URL);
    expect(res?.status()).toBeLessThan(500);
  });
});

// ══════════════════════════════════════════════════════════════
//  E2E — Protection de toutes les routes admin sensibles
// ══════════════════════════════════════════════════════════════

const PROTECTED_ROUTES = [
  '/admin/produits',
  '/admin/commandes',
  '/admin/clients',
  '/admin/avis',
  '/admin/inventaire',
  '/admin/marketing',
  '/admin/paiements',
  '/admin/remboursements',
  '/admin/alertes-stock',
  '/admin/categories',
  '/admin/codes-barres',
  '/admin/maintenance',
  '/admin/branding',
  '/admin/parametres',
  '/admin/contenu/accueil',
  '/admin/contenu/collections',
  '/admin/contenu/services',
  '/admin/contenu/a-propos',
];

for (const route of PROTECTED_ROUTES) {
  test(`${route} redirige vers login si non authentifié`, async ({ page }) => {
    await page.goto(route);
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });
}

// ══════════════════════════════════════════════════════════════
//  E2E — API admin : protection 403 sans session
// ══════════════════════════════════════════════════════════════

const PROTECTED_API_ROUTES = [
  '/api/admin/stats',
  '/api/admin/products',
  '/api/admin/orders',
  '/api/admin/customers',
  '/api/admin/inventory',
  '/api/admin/payments',
  '/api/admin/categories',
  '/api/admin/settings',
];

test.describe('API admin — protection sans session', () => {
  for (const apiRoute of PROTECTED_API_ROUTES) {
    test(`GET ${apiRoute} retourne 401 ou 403`, async ({ request }) => {
      const res = await request.get(apiRoute);
      expect([401, 403]).toContain(res.status());
    });
  }

  test('POST /api/admin/products retourne 401 ou 403', async ({ request }) => {
    const res = await request.post('/api/admin/products', {
      data: { name: 'Test', slug: 'test' },
    });
    expect([401, 403]).toContain(res.status());
  });
});
