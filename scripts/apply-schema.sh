#!/bin/bash
# =============================================================================
# VIP Parfumerie Bar — Appliquer le schéma Supabase
# =============================================================================
# Usage:
#   ./scripts/apply-schema.sh [DB_PASSWORD]
#
# Si DB_PASSWORD n'est pas fourni, il sera demandé interactivement.
#
# Le mot de passe se trouve dans :
#   Supabase Dashboard → Projet olpttunchyheradgukdc → Settings → Database
# =============================================================================

set -e

PROJECT_REF="olpttunchyheradgukdc"
DB_HOST="aws-0-eu-central-1.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.${PROJECT_REF}"
DB_NAME="postgres"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/../supabase/setup-all.sql"

# Vérifier que psql est installé
if ! command -v psql &>/dev/null; then
  echo "❌ psql non trouvé. Installer PostgreSQL :"
  echo "   brew install postgresql"
  exit 1
fi

# Vérifier que le fichier SQL existe
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Fichier SQL introuvable : $SQL_FILE"
  exit 1
fi

# Obtenir le mot de passe
if [ -n "$1" ]; then
  DB_PASSWORD="$1"
elif [ -n "$SUPABASE_DB_PASSWORD" ]; then
  DB_PASSWORD="$SUPABASE_DB_PASSWORD"
else
  echo ""
  echo "🔐 Mot de passe de la base de données Supabase"
  echo "   → Supabase Dashboard → olpttunchyheradgukdc → Settings → Database"
  echo ""
  read -rsp "Entrez le mot de passe DB : " DB_PASSWORD
  echo ""
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Mot de passe requis"
  exit 1
fi

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo ""
echo "🔌 Test de la connexion à Supabase..."
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" &>/dev/null; then
  echo "❌ Connexion impossible. Vérifiez le mot de passe."
  echo "   Hôte  : $DB_HOST:$DB_PORT"
  echo "   User  : $DB_USER"
  exit 1
fi
echo "✅ Connexion réussie !"

echo ""
echo "📦 Application du schéma SQL..."
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -v ON_ERROR_STOP=0 \
  -f "$SQL_FILE"

echo ""
echo "✅ Schéma appliqué avec succès !"
echo ""
echo "🌱 Démarrage du seed de données..."
cd "${SCRIPT_DIR}/.." && npx tsx scripts/setup-database.ts

echo ""
echo "🎉 Configuration terminée ! La base de données est prête."
echo "   → Relancer le serveur : npm run dev"
