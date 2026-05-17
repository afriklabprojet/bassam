#!/bin/bash
# Script helper pour créer des admins en production
# Usage: ./scripts/create-admins-prod.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Création d'admins en PRODUCTION 🚀      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que nous sommes en production
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Variables d'environnement manquantes${NC}"
  echo ""
  echo "Chargez d'abord les variables de production:"
  echo "  source .env.production.local"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ Variables d'environnement chargées${NC}"
echo "  URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Menu interactif
echo -e "${YELLOW}Que voulez-vous faire ?${NC}"
echo "  1. Créer un admin standard"
echo "  2. Créer un super admin"
echo "  3. Créer plusieurs admins (batch)"
echo ""
read -p "Choix (1-3): " choice

case $choice in
  1)
    read -p "Email de l'admin: " email
    pnpm tsx scripts/create-admin-prod.ts "$email" admin
    ;;
  2)
    read -p "Email du super admin: " email
    pnpm tsx scripts/create-admin-prod.ts "$email" super_admin
    ;;
  3)
    echo ""
    echo -e "${YELLOW}Entrez les emails (un par ligne, terminez avec une ligne vide):${NC}"
    emails=()
    while IFS= read -r line; do
      [[ -z "$line" ]] && break
      emails+=("$line")
    done

    read -p "Niveau admin (admin/super_admin): " level
    level=${level:-admin}

    echo ""
    echo -e "${YELLOW}Création de ${#emails[@]} admin(s)...${NC}"
    for email in "${emails[@]}"; do
      echo ""
      echo -e "${BLUE}→ $email${NC}"
      pnpm tsx scripts/create-admin-prod.ts "$email" "$level"
    done
    ;;
  *)
    echo -e "${RED}Choix invalide${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✨ Terminé!${NC}"
