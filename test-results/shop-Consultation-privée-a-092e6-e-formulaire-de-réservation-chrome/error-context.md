# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> Consultation privée >> affiche le formulaire de réservation
- Location: e2e/shop.spec.ts:122:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/services/consultation
Call log:
  - navigating to "http://localhost:3000/services/consultation", waiting until "load"

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
  23  |   });
  24  | });
  25  | 
  26  | test.describe('Page catalogue produits', () => {
  27  |   test('se charge sans erreur', async ({ page }) => {
  28  |     const res = await page.goto('/produits');
  29  |     expect(res?.status()).toBeLessThan(500);
  30  |   });
  31  | 
  32  |   test('affiche un titre h1', async ({ page }) => {
  33  |     await page.goto('/produits');
  34  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
  35  |   });
  36  | 
  37  |   test('contient des filtres (genre / tri)', async ({ page }) => {
  38  |     await page.goto('/produits');
  39  |     const filter = page.locator('select, [role="listbox"], button').first();
  40  |     await expect(filter).toBeVisible({ timeout: 8000 });
  41  |   });
  42  | });
  43  | 
  44  | test.describe('Page panier', () => {
  45  |   test('se charge sans erreur', async ({ page }) => {
  46  |     const res = await page.goto('/panier');
  47  |     expect(res?.status()).toBeLessThan(500);
  48  |   });
  49  | 
  50  |   test('affiche le message "panier vide" si aucun article', async ({ page }) => {
  51  |     await page.goto('/panier');
  52  |     const empty = page.getByRole('heading', { name: /panier est vide/i });
  53  |     await expect(empty).toBeVisible({ timeout: 8000 });
  54  |   });
  55  | 
  56  |   test('contient un lien vers le catalogue', async ({ page }) => {
  57  |     await page.goto('/panier');
  58  |     const link = page.locator('a[href="/produits"]').first();
  59  |     await expect(link).toBeVisible({ timeout: 5000 });
  60  |   });
  61  | });
  62  | 
  63  | test.describe('Page services', () => {
  64  |   test('se charge sans erreur', async ({ page }) => {
  65  |     const res = await page.goto('/services');
  66  |     expect(res?.status()).toBeLessThan(500);
  67  |   });
  68  | 
  69  |   test('affiche un h1', async ({ page }) => {
  70  |     await page.goto('/services');
  71  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
  72  |   });
  73  | 
  74  |   test('contient un lien vers le quiz olfactif', async ({ page }) => {
  75  |     await page.goto('/services');
  76  |     const link = page.locator('main a[href="/services/quiz-olfactif"]').first();
  77  |     await expect(link).toBeVisible({ timeout: 5000 });
  78  |   });
  79  | });
  80  | 
  81  | test.describe('Quiz olfactif', () => {
  82  |   test('se charge sans erreur', async ({ page }) => {
  83  |     const res = await page.goto('/services/quiz-olfactif');
  84  |     expect(res?.status()).toBeLessThan(500);
  85  |   });
  86  | 
  87  |   test('affiche la première question', async ({ page }) => {
  88  |     await page.goto('/services/quiz-olfactif');
  89  |     const question = page.locator('text=/pour qui/i').first();
  90  |     await expect(question).toBeVisible({ timeout: 8000 });
  91  |   });
  92  | 
  93  |   test('le bouton Suivant est désactivé sans sélection', async ({ page }) => {
  94  |     await page.goto('/services/quiz-olfactif');
  95  |     const nextBtn = page.locator('button', { hasText: /suivant/i }).first();
  96  |     if (await nextBtn.isVisible()) {
  97  |       await expect(nextBtn).toBeDisabled();
  98  |     }
  99  |   });
  100 | 
  101 |   test('avance à la question 2 après sélection', async ({ page }) => {
  102 |     await page.goto('/services/quiz-olfactif');
  103 |     const firstChoice = page.locator('button[data-choice], button').filter({ hasText: /elle|lui|genre/i }).first();
  104 |     if (await firstChoice.isVisible({ timeout: 5000 })) {
  105 |       await firstChoice.click();
  106 |       const nextBtn = page.locator('button', { hasText: /suivant/i }).first();
  107 |       if (await nextBtn.isVisible()) {
  108 |         await nextBtn.click();
  109 |         const q2 = page.locator('text=/ambiance/i').first();
  110 |         await expect(q2).toBeVisible({ timeout: 5000 });
  111 |       }
  112 |     }
  113 |   });
  114 | });
  115 | 
  116 | test.describe('Consultation privée', () => {
  117 |   test('se charge sans erreur', async ({ page }) => {
  118 |     const res = await page.goto('/services/consultation');
  119 |     expect(res?.status()).toBeLessThan(500);
  120 |   });
  121 | 
  122 |   test('affiche le formulaire de réservation', async ({ page }) => {
> 123 |     await page.goto('/services/consultation');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/services/consultation
  124 |     const form = page.locator('form').first();
  125 |     await expect(form).toBeVisible({ timeout: 8000 });
  126 |   });
  127 | 
  128 |   test('contient les 3 formules tarifaires', async ({ page }) => {
  129 |     await page.goto('/services/consultation');
  130 |     const formules = page.locator('#formules');
  131 |     await expect(formules.getByRole('heading', { name: 'Découverte' })).toBeVisible({ timeout: 8000 });
  132 |     await expect(formules.getByRole('heading', { name: 'Signature' })).toBeVisible({ timeout: 5000 });
  133 |     await expect(formules.getByRole('heading', { name: 'Cadeau' })).toBeVisible({ timeout: 5000 });
  134 |   });
  135 | });
  136 | 
  137 | test.describe('Création personnalisée', () => {
  138 |   test('se charge sans erreur', async ({ page }) => {
  139 |     const res = await page.goto('/services/creation-personnalisee');
  140 |     expect(res?.status()).toBeLessThan(500);
  141 |   });
  142 | 
  143 |   test('affiche le formulaire de brief créatif', async ({ page }) => {
  144 |     await page.goto('/services/creation-personnalisee');
  145 |     const form = page.locator('form').first();
  146 |     await expect(form).toBeVisible({ timeout: 8000 });
  147 |   });
  148 | });
  149 | 
  150 | test.describe('Page À propos', () => {
  151 |   test('se charge sans erreur', async ({ page }) => {
  152 |     const res = await page.goto('/a-propos');
  153 |     expect(res?.status()).toBeLessThan(500);
  154 |   });
  155 | });
  156 | 
  157 | test.describe('Pages légales', () => {
  158 |   for (const path of ['/cgv', '/mentions', '/confidentialite']) {
  159 |     test(`${path} se charge sans erreur`, async ({ page }) => {
  160 |       const res = await page.goto(path);
  161 |       expect(res?.status()).toBeLessThan(500);
  162 |       await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 });
  163 |     });
  164 |   }
  165 | });
  166 | 
  167 | test.describe('Navigation Header', () => {
  168 |   test('le header est visible sur la page d\'accueil', async ({ page }) => {
  169 |     await page.goto('/');
  170 |     const header = page.locator('header').first();
  171 |     await expect(header).toBeVisible({ timeout: 5000 });
  172 |   });
  173 | 
  174 |   test('le lien panier est présent dans le header', async ({ page }) => {
  175 |     await page.goto('/');
  176 |     const cartButton = page.getByRole('button', { name: /^Panier/ }).first();
  177 |     await expect(cartButton).toBeVisible({ timeout: 5000 });
  178 |   });
  179 | 
  180 |   test('le footer est visible sur la page d\'accueil', async ({ page }) => {
  181 |     await page.goto('/');
  182 |     const footer = page.locator('footer').first();
  183 |     await expect(footer).toBeVisible({ timeout: 8000 });
  184 |   });
  185 | });
  186 | 
  187 | test.describe('API Health', () => {
  188 |   test('GET /api/health retourne status ok', async ({ request }) => {
  189 |     const res = await request.get('/api/health');
  190 |     expect(res.status()).toBe(200);
  191 |     const body = await res.json();
  192 |     expect(body.status).toBe('ok');
  193 |   });
  194 | });
  195 | 
```