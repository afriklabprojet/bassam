---
name: verify
description: Lance la vérification complète du projet (types, lint, tests unitaires, éventuellement e2e) et résume les échecs. À utiliser avant un commit, une PR, ou quand l'utilisateur demande "vérifie", "lance les tests", "est-ce que ça passe".
---

# Vérification du projet

Exécute dans cet ordre, depuis la racine du repo, et continue même si une étape échoue :

1. `npx tsc --noEmit` — erreurs de types.
2. `npm run lint` — ESLint (config `eslint.config.mjs`).
3. `npm run test:run` — Vitest (`__tests__/`, config `vitest.config.ts`).
4. Seulement si l'argument `e2e` est passé ou si des fichiers sous `app/` ou `components/` ont changé et que l'utilisateur le demande : `npm run test:e2e` (Playwright, `e2e/`).

Ne lance pas `npm run build` sauf demande explicite : il est lent et nécessite les variables d'environnement.

Ne lance jamais les scripts qui touchent une base réelle (`setup-db`, `apply-migration`, `create-admin`, `test:supabase:test`) dans le cadre de cette vérification.

## Rapport

Un tableau étape → résultat (OK / N erreurs). Pour chaque échec, le fichier et la ligne, le message d'erreur exact, et la cause probable. Si tout passe, une ligne suffit.
