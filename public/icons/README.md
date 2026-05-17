# Génération des icônes PWA

Ce directory contient les icônes pour la Progressive Web App.

Les icônes sont générées depuis `public/images/logo.png` en recadrant l'emblème du logo.

## Icônes requises

- `icon-72x72.png` - Petite icône Android
- `icon-96x96.png` - Icône Android medium
- `icon-128x128.png` - Icône Android large
- `icon-144x144.png` - Icône Windows Tile
- `icon-152x152.png` - Apple Touch Icon
- `icon-180x180.png` - Apple Touch Icon standard iOS
- `icon-192x192.png` - Icône Android standard
- `icon-384x384.png` - Icône Android XL
- `icon-512x512.png` - Icône splash screen
- `maskable-icon-192x192.png` - Icône Android maskable avec marge de sécurité
- `maskable-icon-512x512.png` - Icône Android maskable splash screen
- `favicon.ico` - Favicon navigateur multi-tailles

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

# Depuis la racine du projet
for size in 16 32 72 96 128 144 152 180 192 384 512; do
   magick public/images/logo.png -crop 1100x1100+231+80 +repage \
      -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done

for size in 192 512; do
   inner=$((size * 74 / 100))
   magick public/images/logo.png -crop 1100x1100+231+80 +repage \
      -resize ${inner}x${inner} -background black -gravity center \
      -extent ${size}x${size} public/icons/maskable-icon-${size}x${size}.png
done

magick public/icons/icon-16x16.png public/icons/icon-32x32.png \
   public/icons/icon-180x180.png public/icons/favicon.ico
```

### Option 3: Avec Node.js (sharp)

```bash
npm install sharp

# Créer un script generate-icons.js
node generate-icons.js
```

## Design Guidelines

- **Source**: logo officiel `public/images/logo.png`
- **Recadrage**: emblème circulaire pour rester lisible en favicon
- **Background**: noir du logo officiel
- **Maskable**: marge de sécurité de 26% pour éviter le rognage Android
- **Format**: PNG pour PWA et ICO pour favicon navigateur

## Testing

Une fois les icônes générées:

1. Lancer `npm run build && npm start`
2. Ouvrir Chrome DevTools > Application > Manifest
3. Vérifier que toutes les icônes se chargent correctement
4. Tester l'installation PWA sur mobile
