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

Les scripts qui écrivent dans Supabase (`apply-migration`, `setup-database`, `create-admin`) sont protégés par
`scripts/lib/target-guard.ts` : **simulation par défaut**, cible déclarée (`--target test|production`) et confirmée en
retapant l'hôte (`--confirm-host`), comparée au registre de production du dépôt, vérifiée à distance en lecture seule avant
toute écriture (`--apply`). `.env.local` n'est jamais chargé implicitement. Le jeu de démonstration (`setup-database`)
est réservé aux bases de **test**. Les variables viennent de l'environnement du processus (jamais en argument) ou de
`--env-file` (`.env.test*` pour un test).

```bash
# Base de TEST : simulation, puis écriture (variables NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY du projet de test)
npx tsx scripts/setup-database.ts --target test --confirm-host <ref-test>.supabase.co
npx tsx scripts/setup-database.ts --target test --confirm-host <ref-test>.supabase.co --apply

# Migration (SUPABASE_ACCESS_TOKEN du projet concerné)
npm run apply-migration -- supabase/migrations/<fichier>.sql --target test --confirm-host <ref-test>.supabase.co --apply

# Créer un compte admin (aucun mot de passe n'est défini par le script :
# la personne le choisit via « Mot de passe oublié » sur /admin/login)
npm run create-admin -- email@exemple.com admin --target test --confirm-host <ref-test>.supabase.co --apply
```

Écrire en **production** exige en plus `--confirm-ref`, la variable `BASSAM_PRODUCTION_CONFIRM` (= hôte) et, pour une migration,
`--confirm-name` : voir l'en-tête de chaque script. `scripts/apply-schema.sh` est désactivé.

## Tests

```bash
npm test          # Vitest (unitaires)
npm run test:e2e  # Playwright (E2E)
```
