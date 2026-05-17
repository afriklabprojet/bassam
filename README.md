# VIP Parfumerie Bar

Boutique e-commerce de parfums de luxe — Côte d'Ivoire.

## Stack

- **Next.js 16** (App Router, ISR)
- **Supabase** (auth, base de données, storage)
- **TailwindCSS 4**
- **Jeko Africa** (paiement Mobile Money — Orange, MTN, Wave)
- **Resend** (newsletter)

## Démarrage rapide

```bash
cp .env.example .env.local
# Remplir les variables dans .env.local

npm install
npm run dev
```

## Configuration initiale

```bash
# Créer les tables Supabase
npx tsx scripts/setup-database.ts

# Créer le compte admin
npx tsx scripts/create-admin.ts
```

## Tests

```bash
npm test          # Vitest (unitaires)
npm run test:e2e  # Playwright (E2E)
```
