# Génération des icônes PWA

Ce directory contient les icônes pour la Progressive Web App.

## Icônes requises

- `icon-72x72.png` - Petite icône Android
- `icon-96x96.png` - Icône Android medium
- `icon-128x128.png` - Icône Android large
- `icon-144x144.png` - Icône Windows Tile
- `icon-152x152.png` - Apple Touch Icon
- `icon-192x192.png` - Icône Android standard
- `icon-384x384.png` - Icône Android XL
- `icon-512x512.png` - Icône splash screen

## Comment générer les icônes

### Option 1: Avec un outil en ligne

1. Allez sur https://realfavicongenerator.net/
2. Uploadez votre logo VIP Parfumerie Bar (512x512px minimum)
3. Configurez:
   - Background: Gradient `#4A5FFF` → `#F5E84D` → `#FF9F45`
   - Border radius: 16px
4. Téléchargez le package
5. Placez les fichiers dans ce dossier

### Option 2: Avec ImageMagick (CLI)

```bash
# Installer ImageMagick
brew install imagemagick  # macOS
sudo apt install imagemagick  # Linux

# Depuis une image source 512x512
convert logo-512.png -resize 72x72 icon-72x72.png
convert logo-512.png -resize 96x96 icon-96x96.png
convert logo-512.png -resize 128x128 icon-128x128.png
convert logo-512.png -resize 144x144 icon-144x144.png
convert logo-512.png -resize 152x152 icon-152x152.png
convert logo-512.png -resize 192x192 icon-192x192.png
convert logo-512.png -resize 384x384 icon-384x384.png
cp logo-512.png icon-512x512.png
```

### Option 3: Avec Node.js (sharp)

```bash
npm install sharp

# Créer un script generate-icons.js
node generate-icons.js
```

## Design Guidelines

- **Background**: Gradient `#4A5FFF` → `#F5E84D` → `#FF9F45` (diagonal 135deg)
- **Logo**: VIP Parfumerie Bar logo en blanc au centre
- **Border Radius**: 16px pour un look moderne
- **Padding**: 10% de marge intérieure
- **Format**: PNG avec transparence pour maskable

## Testing

Une fois les icônes générées:

1. Lancer `npm run build && npm start`
2. Ouvrir Chrome DevTools > Application > Manifest
3. Vérifier que toutes les icônes se chargent correctement
4. Tester l'installation PWA sur mobile
