# Guide: Génération APK Android avec Capacitor

## 📋 Prérequis

### 1. Android Studio
- Télécharger et installer [Android Studio](https://developer.android.com/studio)
- Installer Android SDK (API 33 minimum recommandé)
- Configurer les variables d'environnement:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

### 2. Java JDK
- Java 17 ou supérieur requis
- Vérifier: `java -version`

## 🚀 Génération de l'APK

### Méthode 1: Script automatique (Recommandé)

```bash
cd "choose-me web app"
./build-apk.sh
```

Ce script va:
1. ✅ Builder l'application React
2. ✅ Synchroniser avec Capacitor
3. ✅ Générer l'APK Android
4. ✅ Copier l'APK dans le dossier racine

**Résultat**: `choose-me-release.apk`

### Méthode 2: Commandes manuelles

```bash
# 1. Build React
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build APK
cd android
./gradlew assembleRelease
cd ..

# 4. Récupérer l'APK
cp android/app/build/outputs/apk/release/app-release-unsigned.apk ./choose-me-release.apk
```

## 🔐 Signature de l'APK (Pour Production)

### 1. Créer un Keystore

```bash
keytool -genkey -v -keystore choose-me-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias choose-me-key
```

**Informations à fournir**:
- Mot de passe du keystore (à retenir!)
- Nom, organisation, ville, pays
- Mot de passe de la clé (peut être le même)

⚠️ **IMPORTANT**: Sauvegarder le fichier `.jks` et les mots de passe en lieu sûr!

### 2. Configurer Gradle pour la signature

Éditer `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("../../choose-me-release-key.jks")
            storePassword "VOTRE_MOT_DE_PASSE"
            keyAlias "choose-me-key"
            keyPassword "VOTRE_MOT_DE_PASSE"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Générer l'APK signé

```bash
cd android
./gradlew assembleRelease
cd ..
```

**Résultat**: `android/app/build/outputs/apk/release/app-release.apk` (signé)

## 📦 Générer un AAB (Android App Bundle) - Recommandé pour Play Store

```bash
cd android
./gradlew bundleRelease
cd ..
```

**Résultat**: `android/app/build/outputs/bundle/release/app-release.aab`

## 🔍 Vérifier la signature

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

## 📱 Installer l'APK sur un appareil

### Via ADB (Android Debug Bridge)

```bash
# Activer le mode développeur sur votre téléphone
# Activer le débogage USB

# Vérifier la connexion
adb devices

# Installer l'APK
adb install choose-me-release.apk
```

### Via fichier

1. Transférer l'APK sur le téléphone
2. Ouvrir le fichier
3. Autoriser l'installation depuis des sources inconnues
4. Installer

## 🎨 Personnalisation

### Icône de l'application

Les icônes sont déjà configurées dans:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`

Pour les mettre à jour:
```bash
cp public/android-chrome-192x192.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp public/android-chrome-512x512.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

### Nom de l'application

Éditer `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Choose Me</string>
```

### Version de l'application

Éditer `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

## 🔧 Permissions configurées

L'application a les permissions suivantes:
- ✅ Internet et réseau
- ✅ Caméra
- ✅ Galerie photos/vidéos
- ✅ Notifications
- ✅ Localisation (optionnel)
- ✅ Audio/Vidéo
- ✅ Vibration

Toutes les permissions sont dans `android/app/src/main/AndroidManifest.xml`

## 🐛 Dépannage

### Erreur: SDK not found
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### Erreur: Java version
```bash
# Installer Java 17
brew install openjdk@17
```

### Erreur: Gradle build failed
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### APK trop volumineux
- Activer ProGuard (minification)
- Générer un AAB au lieu d'un APK
- Utiliser des images optimisées

## 📊 Tailles approximatives

- **APK non signé**: ~15-20 MB
- **APK signé**: ~15-20 MB
- **AAB**: ~12-15 MB (optimisé pour Play Store)

## 🚀 Publication sur Google Play Store

1. Créer un compte développeur Google Play (25$ unique)
2. Générer un AAB signé
3. Créer une nouvelle application
4. Uploader l'AAB
5. Remplir les informations (description, captures d'écran, etc.)
6. Soumettre pour révision

## 📝 Checklist avant publication

- [ ] APK/AAB signé avec un keystore de production
- [ ] Version code et version name mis à jour
- [ ] Icônes de toutes les tailles générées
- [ ] Permissions justifiées dans la description
- [ ] Testé sur plusieurs appareils Android
- [ ] Captures d'écran préparées
- [ ] Description de l'app rédigée
- [ ] Politique de confidentialité publiée

## 🔗 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide Android Publishing](https://developer.android.com/studio/publish)
- [Google Play Console](https://play.google.com/console)
