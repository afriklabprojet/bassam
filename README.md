# VIP Parfumerie Bar

Boutique e-commerce de parfums de luxe — Côte d'Ivoire.

## Stack

- **Next.js 16** (App Router, ISR)
- **Supabase** (auth, base de données, storage)
- **TailwindCSS 4**
- **Jeko Africa** (paiement Mobile Money — Orange, MTN, Wave)
- **Resend** (newsletter)

Configuration des e-mails de production : [docs/production-mail.md](docs/production-mail.md)

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

# Créer un compte admin (aucun mot de passe n'est défini par le script :
# la personne le choisit via « Mot de passe oublié » sur /admin/login)
npm run create-admin -- email@exemple.com admin
```

## Tests

```bash
npm test          # Vitest (unitaires)
npm run test:e2e  # Playwright (E2E)
```
