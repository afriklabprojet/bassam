# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Authentification admin >> page de connexion affiche le formulaire email + password
- Location: e2e/admin.spec.ts:17:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/admin/login
Call log:
  - navigating to "http://localhost:3000/admin/login", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "Ce site est inaccessible" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: n'autorise pas la connexion.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Voici quelques conseils :"
      - list [ref=e12]:
        - listitem [ref=e13]: Vérifier la connexion
        - listitem [ref=e14]:
          - link "Vérifier le proxy et le pare-feu" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Actualiser" [ref=e19] [cursor=pointer]
    - button "Détails" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const ADMIN_URL = '/admin';
  4   | const LOGIN_URL = '/admin/login';
  5   | 
  6   | // ══════════════════════════════════════════════════════════════
  7   | //  E2E — Admin : authentification & protection des routes
  8   | // ══════════════════════════════════════════════════════════════
  9   | 
  10  | test.describe('Authentification admin', () => {
  11  |   test('redirige vers /admin/login si non authentifié', async ({ page }) => {
  12  |     await page.goto(ADMIN_URL);
  13  |     await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
  14  |     await expect(page).toHaveURL(/\/admin\/login/);
  15  |   });
  16  | 
  17  |   test('page de connexion affiche le formulaire email + password', async ({ page }) => {
> 18  |     await page.goto(LOGIN_URL);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/admin/login
  19  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  20  |     await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  21  |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  22  |   });
  23  | 
  24  |   test('affiche un heading reconnaissable sur la page login', async ({ page }) => {
  25  |     await page.goto(LOGIN_URL);
  26  |     const heading = page.locator('h1, h2').first();
  27  |     await expect(heading).toBeVisible({ timeout: 5000 });
  28  |   });
  29  | 
  30  |   test('affiche une erreur avec des identifiants invalides', async ({ page }) => {
  31  |     await page.goto(LOGIN_URL);
  32  |     await page.fill('input[type="email"]', 'mauvais@exemple.com');
  33  |     await page.fill('input[type="password"], input[name="password"]', 'mauvaismdp');
  34  |     await page.click('button[type="submit"]');
  35  |     const error = page.locator('text=Identifiants incorrects');
  36  |     await expect(error).toBeVisible({ timeout: 8000 });
  37  |   });
  38  | 
  39  |   test('page login répond < 500', async ({ page }) => {
  40  |     const res = await page.goto(LOGIN_URL);
  41  |     expect(res?.status()).toBeLessThan(500);
  42  |   });
  43  | });
  44  | 
  45  | // ══════════════════════════════════════════════════════════════
  46  | //  E2E — Protection de toutes les routes admin sensibles
  47  | // ══════════════════════════════════════════════════════════════
  48  | 
  49  | const PROTECTED_ROUTES = [
  50  |   '/admin/produits',
  51  |   '/admin/commandes',
  52  |   '/admin/clients',
  53  |   '/admin/avis',
  54  |   '/admin/inventaire',
  55  |   '/admin/marketing',
  56  |   '/admin/paiements',
  57  |   '/admin/remboursements',
  58  |   '/admin/alertes-stock',
  59  |   '/admin/categories',
  60  |   '/admin/codes-barres',
  61  |   '/admin/maintenance',
  62  |   '/admin/branding',
  63  |   '/admin/parametres',
  64  |   '/admin/contenu/accueil',
  65  |   '/admin/contenu/collections',
  66  |   '/admin/contenu/services',
  67  |   '/admin/contenu/a-propos',
  68  | ];
  69  | 
  70  | for (const route of PROTECTED_ROUTES) {
  71  |   test(`${route} redirige vers login si non authentifié`, async ({ page }) => {
  72  |     await page.goto(route);
  73  |     await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
  74  |     await expect(page).toHaveURL(/\/admin\/login/);
  75  |   });
  76  | }
  77  | 
  78  | // ══════════════════════════════════════════════════════════════
  79  | //  E2E — API admin : protection 403 sans session
  80  | // ══════════════════════════════════════════════════════════════
  81  | 
  82  | const PROTECTED_API_ROUTES = [
  83  |   '/api/admin/stats',
  84  |   '/api/admin/products',
  85  |   '/api/admin/orders',
  86  |   '/api/admin/customers',
  87  |   '/api/admin/inventory',
  88  |   '/api/admin/payments',
  89  |   '/api/admin/categories',
  90  |   '/api/admin/settings',
  91  | ];
  92  | 
  93  | test.describe('API admin — protection sans session', () => {
  94  |   for (const apiRoute of PROTECTED_API_ROUTES) {
  95  |     test(`GET ${apiRoute} retourne 401 ou 403`, async ({ request }) => {
  96  |       const res = await request.get(apiRoute);
  97  |       expect([401, 403]).toContain(res.status());
  98  |     });
  99  |   }
  100 | 
  101 |   test('POST /api/admin/products retourne 401 ou 403', async ({ request }) => {
  102 |     const res = await request.post('/api/admin/products', {
  103 |       data: { name: 'Test', slug: 'test' },
  104 |     });
  105 |     expect([401, 403]).toContain(res.status());
  106 |   });
  107 | });
  108 | 
```