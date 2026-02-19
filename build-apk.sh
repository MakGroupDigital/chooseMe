#!/bin/bash

echo "🚀 Génération de l'APK Choose Me - Production"
echo "=============================================="

# 1. Build de l'application React
echo ""
echo "📦 Étape 1/4: Build de l'application React..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build React"
    exit 1
fi

echo "✅ Build React terminé"

# 2. Synchronisation avec Capacitor
echo ""
echo "🔄 Étape 2/4: Synchronisation Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la synchronisation Capacitor"
    exit 1
fi

echo "✅ Synchronisation terminée"

# 3. Build de l'APK Android
echo ""
echo "🔨 Étape 3/4: Build de l'APK Android..."
cd android
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build Android"
    cd ..
    exit 1
fi

cd ..
echo "✅ Build Android terminé"

# 4. Copie de l'APK dans le dossier racine
echo ""
echo "📋 Étape 4/4: Copie de l'APK..."
cp android/app/build/outputs/apk/release/app-release-unsigned.apk ./choose-me-release.apk

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la copie de l'APK"
    exit 1
fi

echo "✅ APK copié"

# Afficher les informations
echo ""
echo "=============================================="
echo "✅ APK généré avec succès!"
echo ""
echo "📱 Fichier: choose-me-release.apk"
echo "📍 Emplacement: $(pwd)/choose-me-release.apk"
echo "📦 Taille: $(du -h choose-me-release.apk | cut -f1)"
echo ""
echo "⚠️  Note: Cet APK n'est pas signé."
echo "Pour le publier sur le Play Store, vous devez:"
echo "1. Créer un keystore"
echo "2. Signer l'APK"
echo "3. Aligner l'APK avec zipalign"
echo ""
echo "Ou utilisez: ./gradlew bundleRelease pour générer un AAB signé"
echo "=============================================="
