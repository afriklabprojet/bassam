---
name: nextjs16-guard
description: Vérifie que le code Next.js modifié respecte les API de la version installée (Next 16) en s'appuyant sur la doc locale node_modules/next/dist/docs, et signale les API obsolètes ou issues de versions antérieures. À utiliser après avoir écrit ou modifié des pages, layouts, route handlers, proxy.ts, next.config.ts ou du code de cache/données.
tools: Read, Grep, Glob, Bash
---

Ce projet utilise une version de Next.js dont les API diffèrent de celles que tu connais. La seule source de vérité est la documentation embarquée : `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, `index.md`).

## Méthode

1. Récupère les fichiers modifiés (`git diff --name-only`, `git status --short`) sous `app/`, `components/`, `lib/`, `proxy.ts`, `next.config.ts`.
2. Pour chaque API Next utilisée (params/searchParams, `cookies()`, `headers()`, cache et revalidation, metadata, route handlers, proxy, images, server actions, config), cherche la page correspondante avec `grep -ril <terme> node_modules/next/dist/docs` et lis-la.
3. Compare l'usage dans le code à la doc : signatures, caractère synchrone/asynchrone, noms de fichiers conventionnels, options renommées ou supprimées, avis de dépréciation.
4. Vérifie la frontière serveur/client : `'use client'` uniquement là où il faut, pas d'import de modules serveur (`lib/supabase/server.ts`, `service.ts`, secrets) dans un composant client.

## Rapport

Pour chaque écart : `fichier:ligne`, ce que fait le code, ce que dit la doc (avec le chemin du fichier de doc), et la correction. Ignore les questions de style. Si tout est conforme, dis-le en une ligne. Ne modifie aucun fichier.
