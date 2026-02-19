# Guide de Création des Logos et Favicons

## Fichiers à créer

### 1. Favicon pour le navigateur

Utilisez un outil en ligne comme [favicon.io](https://favicon.io/) ou [realfavicongenerator.net](https://realfavicongenerator.net/)

**Fichiers nécessaires :**
- `public/favicon.ico` (16x16, 32x32, 48x48)
- `public/favicon.svg` (version vectorielle)
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/apple-touch-icon.png` (180x180)
- `public/android-chrome-192x192.png`
- `public/android-chrome-512x512.png`

### 2. Logo pour Capacitor (Android)

**Fichiers nécessaires :**
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

## Commandes pour générer les logos

### Option 1 : Utiliser ImageMagick (si installé)

```bash
# Depuis le logo existant
cd "choose-me web app"

# Créer favicon.ico
convert public/assets/images/app_launcher_icon.png -resize 32x32 public/favicon.ico

# Créer les différentes tailles
convert public/assets/images/app_launcher_icon.png -resize 16x16 public/favicon-16x16.png
convert public/assets/images/app_launcher_icon.png -resize 32x32 public/favicon-32x32.png
convert public/assets/images/app_launcher_icon.png -resize 180x180 public/apple-touch-icon.png
convert public/assets/images/app_launcher_icon.png -resize 192x192 public/android-chrome-192x192.png
convert public/assets/images/app_launcher_icon.png -resize 512x512 public/android-chrome-512x512.png
```

### Option 2 : Utiliser un service en ligne

1. Allez sur https://realfavicongenerator.net/
2. Uploadez `/assets/images/app_launcher_icon.png`
3. Téléchargez le package généré
4. Extrayez les fichiers dans `public/`

### Option 3 : Utiliser un outil Node.js

```bash
npm install -g sharp-cli

# Générer les favicons
sharp -i public/assets/images/app_launcher_icon.png -o public/favicon-16x16.png resize 16 16
sharp -i public/assets/images/app_launcher_icon.png -o public/favicon-32x32.png resize 32 32
sharp -i public/assets/images/app_launcher_icon.png -o public/apple-touch-icon.png resize 180 180
sharp -i public/assets/images/app_launcher_icon.png -o public/android-chrome-192x192.png resize 192 192
sharp -i public/assets/images/app_launcher_icon.png -o public/android-chrome-512x512.png resize 512 512
```

## Après création des fichiers

Mettez à jour `index.html` avec les liens vers les favicons (voir ci-dessous).
