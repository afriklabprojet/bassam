# VIP Parfumerie Bar 🌟

Site e-commerce de parfums de luxe pour l'Afrique, construit avec Next.js 15 et Supabase.

## ✨ Design System

Ce projet utilise le design **Premium Vibrant** avec:

- **Dégradé signature**: `#4A5FFF` → `#F5E84D` → `#FF9F45`
- **Typographie Art Déco**: Arial Rounded MT Bold (fallback)
- **Spacing**: Système 8px avec sections spacieuses (80px)
- **Border Radius**: 16px pour les cards
- **Mobile-first**: Optimisé pour 3G/4G, Android prioritaire

## 🚀 Quick Start

### Installation

```bash
# Clone le dépôt
git clone <repo-url>
cd vip-parfumerie-bar

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditez .env.local avec vos credentials Supabase

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📦 Stack Technique

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4.0
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payment**: Jeko Africa (Mobile Money: Orange, MTN, Moov, Wave)
- **PWA**: Service Worker pour l'expérience offline
- **TypeScript**: Pour la sécurité des types

## 🗄️ Configuration Supabase

### 1. Créer un projet Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Récupérez l'URL et les clés API depuis Project Settings > API

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` avec:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=contact@vip-parfumerie-bar.com
NEXT_PUBLIC_WHATSAPP_NUMBER=2250700000000
NEXT_PUBLIC_WHATSAPP_DISPLAY=+225 07 00 00 00 00
NEXT_PUBLIC_SUPPORT_PHONE=2250700000000
NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY=+225 07 00 00 00 00
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/votrecompte
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/votrepage
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@votrecompte
```

### 3. Créer la base de données

Exécutez le script SQL dans l'éditeur SQL de Supabase:

```bash
# Le fichier est disponible dans supabase/schema.sql
```

Ce script crée:
- ✅ Tables (products, categories, orders, newsletter_subscriptions, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Indexes pour la performance
- ✅ Triggers pour les timestamps automatiques
- ✅ Fonction pour créer le profil utilisateur à l'inscription

### 4. Configurer l'authentification

Dans Supabase Dashboard > Authentication > Providers:

**Email/Password**
- ✅ Activé par défaut
- Configurez l'email de confirmation si nécessaire

**Google OAuth**
1. Créez une application OAuth dans Google Cloud Console
2. Ajoutez les Client ID et Secret dans Supabase
3. Configurez le redirect URL: `https://your-project.supabase.co/auth/v1/callback`

**Facebook OAuth**
1. Créez une application dans Facebook Developers
2. Ajoutez l'App ID et Secret dans Supabase
3. Configurez le redirect URL dans Facebook

### 5. Générer les types TypeScript (optionnel)

```bash
# Installer le CLI Supabase
npm install -g supabase

# Se connecter
supabase login

# Générer les types
supabase gen types typescript --project-id your-project-ref > types/database.types.ts
```

## 🎨 Composants Disponibles

### Hero
Section d'accueil avec dégradé signature pleine largeur et CTAs.

```tsx
import Hero from '@/components/Hero';
```

### ProductCard
Carte produit avec image, prix, badges, et hover effects.

```tsx
import ProductCard from '@/components/ProductCard';

<ProductCard
  id="1"
  name="Sauvage Eau de Toilette"
  brand="Dior"
  price={85000}
  image="/images/product.jpg"
  badge="Nouveau"
/>
```

### CollectionCard
Carte collection avec image de fond et overlay effect.

```tsx
import CollectionCard from '@/components/CollectionCard';

<CollectionCard
  name="Parfums Homme"
  description="Des fragrances masculines..."
  image="/images/collection.jpg"
  slug="homme"
/>
```

### AdvantageCard
Icône avec titre et description pour les avantages.

```tsx
import AdvantageCard from '@/components/AdvantageCard';

<AdvantageCard
  icon={<svg>...</svg>}
  title="Authenticité 100%"
  description="Tous nos parfums sont authentiques..."
/>
```

### Newsletter
Formulaire d'inscription newsletter avec validation et intégration Supabase.

```tsx
import Newsletter from '@/components/Newsletter';
```

## 🎯 Structure du Projet

```
vip-parfumerie-bar/
├── app/
│   ├── globals.css          # Design system complet
│   ├── layout.tsx            # Layout global
│   └── page.tsx              # Page d'accueil
├── components/
│   ├── Hero.tsx
│   ├── ProductCard.tsx
│   ├── CollectionCard.tsx
│   ├── AdvantageCard.tsx
│   └── Newsletter.tsx
├── public/
│   └── images/              # Images produits & collections
└── package.json
```

## 🌍 Features Africaines

- **Mobile Money**: Jeko Africa (Orange Money, MTN Money, Moov Money, Wave)
- **Cash on Delivery**: 70% des paiements prévus en paiement à la livraison
- **3G/4G Optimized**: <1MB pages, <150KB images
- **WhatsApp Business**: Support client intégré
- **Livraison rapide**: 24-48h à Ouagadougou

## 📱 PWA (Progressive Web App)

Le site est configuré comme une PWA complète avec:

### Features PWA

✅ **Installation sur l'écran d'accueil**
- Bannière d'installation automatique
- Icônes adaptées pour toutes les résolutions (72px à 512px)
- Mode standalone (sans barre d'URL)

✅ **Fonctionnement hors ligne**
- Service Worker avec stratégie de cache
- Page offline personnalisée
- Cache des assets statiques et des pages visitées

✅ **Performance optimisée**
- Cache intelligent (Network First pour API, Cache First pour assets)
- Background sync pour les actions offline (newsletter, commandes)
- Push notifications prêtes

### Tester le PWA localement

```bash
# Build production (requis pour PWA)
npm run build
npm start

# Ouvrir dans Chrome/Edge
# 1. Aller sur localhost:3000
# 2. Ouvrir DevTools > Application > Service Workers
# 3. Vérifier que le SW est enregistré
# 4. Tester offline mode (Network throttling)
# 5. Voir la bannière "Installer l'application"
```

### Fichiers PWA

- `public/manifest.json` - Configuration de l'app
- `public/sw.js` - Service Worker
- `public/offline.html` - Page hors ligne
- `components/PWAInstaller.tsx` - Bannière d'installation

## 🔐 Pages d'Authentification

✅ **Login** (`/auth/login`)
- Email/Password
- Google OAuth
- Facebook OAuth
- Lien "Mot de passe oublié"

✅ **Signup** (`/auth/signup`)
- Création de compte avec email/password
- OAuth Google/Facebook
- Vérification par email

✅ **Reset Password** (`/auth/reset-password`)
- Envoi d'email de réinitialisation
- Lien sécurisé avec token

✅ **Update Password** (`/auth/update-password`)
- Nouveau mot de passe après reset
- Validation (min 6 caractères)

## 🛠 Scripts Disponibles

```bash
npm run dev      # Serveur de développement (localhost:3000)
npm run build    # Build production optimisé
npm run start    # Serveur production (avec PWA)
npm run lint     # ESLint check
```

## 📈 Statut d'Implémentation

### ✅ Complété

- [x] Configuration Next.js 15 + TypeScript
- [x] Design system Tailwind complet (gradients, typography, utilities)
- [x] 5 composants React (Hero, ProductCard, CollectionCard, AdvantageCard, Newsletter)
- [x] Homepage complète avec toutes les sections
- [x] Supabase setup (clients SSR, middleware, types)
- [x] Authentification complète (login, signup, reset password, OAuth)
- [x] Newsletter avec server action + validation Zod
- [x] Base de données schema SQL (produits, commandes, utilisateurs, RLS)
- [x] PWA complète (manifest, service worker, offline, installation)
- [x] Métadonnées SEO et Open Graph
- [x] Documentation complète

### ⏳ À Développer

- [ ] Pages produits détaillées
- [ ] Système de panier d'achat
- [ ] Checkout et intégration paiement Jeko Africa
- [ ] Dashboard utilisateur (profil, commandes, favoris)
- [ ] Dashboard admin (gestion produits, commandes)
- [ ] Système de recherche et filtres
- [ ] Avis clients et ratings
- [ ] Système de recommandations
- [ ] Tests E2E avec Playwright
- [ ] CI/CD pipeline

## 🚀 Déploiement

### Vercel (recommandé)

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel

# 4. Configurer les variables d'environnement dans Vercel Dashboard
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### Variables d'environnement Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://vip-parfumerie-bar.com
NEXT_PUBLIC_SUPPORT_EMAIL=contact@vip-parfumerie-bar.com
NEXT_PUBLIC_WHATSAPP_NUMBER=2250700000000
NEXT_PUBLIC_WHATSAPP_DISPLAY=+225 07 00 00 00 00
NEXT_PUBLIC_SUPPORT_PHONE=2250700000000
NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY=+225 07 00 00 00 00
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/votrecompte
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/votrepage
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@votrecompte
```

## 🎨 Design Reference

Le design est basé sur le **Variant A - Premium Vibrant** approuvé:
- Dégradé signature dominant sur hero
- Typographie Art Déco bold pour tous les headings
- Cards produits avec borders dégradés au hover 
- Sections généreuses (80px padding)
- Energy vibrante et dynamique
- Mobile-first avec grandes zones touch (56px min)

Voir `/designs/homepage-*/variant-A.html` pour la référence wireframe complète.

## 📝 License

Propriétaire - VIP Parfumerie Bar © 2025

## 🤝 Support

Pour toute question: contact@vipperfumeriebar.com
