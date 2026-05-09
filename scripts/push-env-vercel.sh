#!/usr/bin/env bash
# Push toutes les variables de .env.local vers Vercel production
set -e

ENV_FILE=".env.local"
ENVIRONMENT="production"

echo "📦 Push des variables d'environnement vers Vercel ($ENVIRONMENT)..."

while IFS= read -r line || [ -n "$line" ]; do
  # Ignorer les lignes vides et les commentaires
  [[ -z "$line" || "$line" == \#* ]] && continue

  # Extraire clé et valeur
  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Ignorer si clé vide
  [[ -z "$KEY" ]] && continue

  echo "  → $KEY"
  echo "$VALUE" | vercel env add "$KEY" "$ENVIRONMENT" --force 2>/dev/null || \
    echo "$VALUE" | vercel env add "$KEY" "$ENVIRONMENT" 2>/dev/null || \
    echo "    ⚠️  Erreur pour $KEY (peut déjà exister)"

done < "$ENV_FILE"

echo ""
echo "✅ Variables poussées. Vérification..."
vercel env ls production 2>/dev/null | head -40
