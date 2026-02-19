# 📱 APK Production Ready - Choose Me

## ✅ APK Généré avec Succès

**Fichier**: `choose-me-release.apk`  
**Taille**: 38 MB  
**Type**: APK Release (non signé)  
**Date**: 28 janvier 2026

---

## 🎯 Fonctionnalités Natives Intégrées

### Plugins Capacitor Installés

✅ **@capacitor/core** (v8.0.2) - Core functionality  
✅ **@capacitor/android** (v8.0.2) - Android platform  
✅ **@capacitor/app** (v8.0.0) - App state & lifecycle  
✅ **@capacitor/camera** (v8.0.0) - Caméra & galerie photos  
✅ **@capacitor/filesystem** (v8.1.0) - Système de fichiers  
✅ **@capacitor/haptics** (v8.0.0) - Vibrations tactiles  
✅ **@capacitor/network** (v8.0.0) - État du réseau  
✅ **@capacitor/share** (v8.0.0) - Partage natif  
✅ **@capacitor/splash-screen** (v8.0.0) - Écran de démarrage  
✅ **@capacitor/status-bar** (v8.0.0) - Barre d'état  
✅ **@capacitor/toast** (v8.0.0) - Notifications toast  

### Permissions Android Configurées

```xml
✅ Internet et réseau
   - INTERNET
   - ACCESS_NETWORK_STATE
   - ACCESS_WIFI_STATE

✅ Caméra et médias
   - CAMERA
   - READ_MEDIA_IMAGES
   - READ_MEDIA_VIDEO
   - READ_EXTERNAL_STORAGE (API ≤32)
   - WRITE_EXTERNAL_STORAGE (API ≤29)

✅ Notifications
   - POST_NOTIFICATIONS
   - VIBRATE

✅ Localisation (optionnel)
   - ACCESS_COARSE_LOCATION
   - ACCESS_FINE_LOCATION

✅ Audio/Vidéo
   - RECORD_AUDIO
   - MODIFY_AUDIO_SETTINGS
```

---

## 📦 Installation de l'APK

### Méthode 1: Via ADB (Développeurs)

```bash
# 1. Activer le mode développeur sur votre téléphone Android
# 2. Activer le débogage USB
# 3. Connecter le téléphone à l'ordinateur

# Vérifier la connexion
adb devices

# Installer l'APK
adb install "choose-me web app/choose-me-release.apk"
```

### Méthode 2: Transfert Direct (Utilisateurs)

1. **Transférer l'APK** sur votre téléphone Android (via USB, email, cloud, etc.)
2. **Ouvrir le fichier** APK depuis le gestionnaire de fichiers
3. **Autoriser l'installation** depuis des sources inconnues si demandé
4. **Installer** l'application

---

## 🔐 Signature de l'APK (Pour Production)

### Pourquoi signer l'APK ?

- ✅ Requis pour publier sur Google Play Store
- ✅ Garantit l'authenticité de l'application
- ✅ Permet les mises à jour de l'application
- ✅ Protège contre les modifications malveillantes

### Étapes de Signature

#### 1. Créer un Keystore

```bash
keytool -genkey -v -keystore choose-me-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias choose-me-key
```

**Informations requises**:
- Mot de passe du keystore (minimum 6 caractères)
- Prénom et nom
- Nom de l'organisation
- Ville, État, Pays

⚠️ **CRITIQUE**: Sauvegarder le fichier `.jks` et les mots de passe en lieu sûr! Si vous les perdez, vous ne pourrez plus mettre à jour votre application sur le Play Store.

#### 2. Configurer Gradle

Créer le fichier `android/keystore.properties`:

```properties
storePassword=VOTRE_MOT_DE_PASSE_KEYSTORE
keyPassword=VOTRE_MOT_DE_PASSE_CLE
keyAlias=choose-me-key
storeFile=../../choose-me-release-key.jks
```

Modifier `android/app/build.gradle`:

```gradle
// Avant android {
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
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

#### 3. Générer l'APK Signé

```bash
cd "choose-me web app/android"
./gradlew assembleRelease
```

**Résultat**: `android/app/build/outputs/apk/release/app-release.apk` (signé)

#### 4. Vérifier la Signature

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

---

## 📊 Générer un AAB (Recommandé pour Play Store)

### Pourquoi AAB ?

- ✅ Taille de téléchargement réduite (optimisation par appareil)
- ✅ Format requis pour les nouvelles applications sur Play Store
- ✅ Google gère la signature automatiquement
- ✅ Mises à jour plus rapides

### Commande

```bash
cd "choose-me web app/android"
./gradlew bundleRelease
```

**Résultat**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🚀 Publication sur Google Play Store

### Prérequis

1. **Compte développeur Google Play** (25$ unique)
2. **AAB signé** avec un keystore de production
3. **Captures d'écran** (minimum 2 par type d'appareil)
4. **Icône de l'application** (512x512 px)
5. **Description** de l'application
6. **Politique de confidentialité** (URL publique)

### Étapes

1. **Créer une application** sur [Google Play Console](https://play.google.com/console)
2. **Uploader l'AAB** dans la section "Production"
3. **Remplir les informations**:
   - Titre de l'application
   - Description courte et longue
   - Captures d'écran
   - Icône et bannière
   - Catégorie
   - Politique de confidentialité
4. **Configurer le contenu**:
   - Classification du contenu
   - Public cible
   - Pays de distribution
5. **Soumettre pour révision** (délai: 1-7 jours)

---

## 🔧 Commandes Utiles

### Build Complet

```bash
# Script automatique (recommandé)
cd "choose-me web app"
./build-apk.sh
```

### Build Manuel

```bash
# 1. Build React
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build APK
cd android
./gradlew assembleRelease
cd ..

# 4. Copier l'APK
cp android/app/build/outputs/apk/release/app-release-unsigned.apk ./choose-me-release.apk
```

### Nettoyage

```bash
cd "choose-me web app/android"
./gradlew clean
```

### Ouvrir dans Android Studio

```bash
npx cap open android
```

---

## 🎨 Personnalisation

### Icône de l'Application

Les icônes sont dans: `android/app/src/main/res/mipmap-*/`

Pour les mettre à jour:
```bash
# Copier vos icônes
cp public/android-chrome-192x192.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp public/android-chrome-512x512.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Resync
npx cap sync android
```

### Nom de l'Application

Modifier `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Choose Me</string>
```

### Version

Modifier `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 2
        versionName "1.1.0"
    }
}
```

### Couleur du Splash Screen

Modifier `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    backgroundColor: '#020202',
    spinnerColor: '#19DB8A'
  }
}
```

---

## 🐛 Dépannage

### Erreur: SDK not found

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Erreur: Java version incompatible

```bash
# Installer Java 17
brew install openjdk@17

# Vérifier
java -version
```

### Erreur: Gradle build failed

```bash
cd "choose-me web app/android"
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### APK trop volumineux

1. **Activer ProGuard** (minification du code)
2. **Générer un AAB** au lieu d'un APK
3. **Optimiser les images** (WebP, compression)
4. **Supprimer les dépendances inutilisées**

### L'application crash au démarrage

1. **Vérifier les logs**:
   ```bash
   adb logcat | grep -i "chooseme"
   ```
2. **Vérifier Firebase** (clés API, configuration)
3. **Tester en mode debug** d'abord

---

## 📋 Checklist Avant Publication

- [ ] APK/AAB signé avec keystore de production
- [ ] Keystore sauvegardé en lieu sûr
- [ ] Version code et version name mis à jour
- [ ] Icônes de toutes les tailles générées
- [ ] Splash screen configuré
- [ ] Permissions justifiées dans la description
- [ ] Testé sur plusieurs appareils Android (différentes versions)
- [ ] Testé avec/sans connexion internet
- [ ] Captures d'écran préparées (téléphone + tablette)
- [ ] Description de l'app rédigée (FR + EN)
- [ ] Politique de confidentialité publiée
- [ ] Conditions d'utilisation rédigées
- [ ] Firebase configuré pour production
- [ ] Analytics configuré
- [ ] Crash reporting activé

---

## 📊 Informations Techniques

### Configuration Actuelle

```json
{
  "appId": "com.chooseme.app",
  "appName": "Choose Me",
  "versionCode": 1,
  "versionName": "1.0",
  "minSdkVersion": 22,
  "targetSdkVersion": 34,
  "compileSdkVersion": 34
}
```

### Tailles

- **APK non signé**: ~38 MB
- **APK signé**: ~38 MB
- **AAB**: ~30-35 MB (optimisé)
- **Téléchargement utilisateur**: ~25-30 MB (avec AAB)

### Compatibilité

- **Android minimum**: 5.1 (API 22)
- **Android cible**: 14 (API 34)
- **Architectures**: armeabi-v7a, arm64-v8a, x86, x86_64

---

## 🔗 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide Android Publishing](https://developer.android.com/studio/publish)
- [Google Play Console](https://play.google.com/console)
- [Firebase Console](https://console.firebase.google.com)
- [Android Studio](https://developer.android.com/studio)

---

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs: `adb logcat`
2. Consulter la documentation Capacitor
3. Vérifier les issues GitHub du projet

---

**Dernière mise à jour**: 28 janvier 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
