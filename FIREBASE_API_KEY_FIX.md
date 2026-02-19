# Fix: Firebase API Key sur Firebase App Hosting

## Problème
L'application affichait une page blanche avec l'erreur:
```
Uncaught Error: An API Key must be set when running in a browser
```

## Cause
Les clés Firebase étaient codées en dur dans `services/firebase.ts`. Sur Firebase App Hosting, les variables d'environnement ne sont pas injectées automatiquement dans le code client.

## Solution implémentée

### 1. Modification de `services/firebase.ts`
Ajout d'une fonction `getFirebaseConfig()` qui:
- Vérifie si `window.FIREBASE_WEBAPP_CONFIG` existe (injecté par le serveur)
- Utilise cette config si disponible
- Sinon utilise la config en dur pour le développement local

### 2. Modification de `server.js`
Le serveur Express:
- Lit le fichier `index.html` au démarrage
- Récupère `FIREBASE_WEBAPP_CONFIG` depuis les variables d'environnement
- Injecte un script dans le `<head>` qui définit `window.FIREBASE_WEBAPP_CONFIG`
- Sert le HTML modifié pour toutes les routes

## Comment ça fonctionne

1. Firebase App Hosting définit automatiquement `FIREBASE_WEBAPP_CONFIG` comme variable d'environnement
2. Le serveur Express lit cette variable au démarrage
3. Le serveur injecte la config dans le HTML via un tag `<script>`
4. Le code client lit `window.FIREBASE_WEBAPP_CONFIG` et l'utilise pour initialiser Firebase

## Avantages

- ✅ Fonctionne sur Firebase App Hosting (utilise les env vars)
- ✅ Fonctionne en local (utilise la config en dur)
- ✅ Pas besoin de rebuild pour changer les clés
- ✅ Sécurisé (les clés ne sont pas exposées dans le code source en production)

## Test

Après le déploiement, l'application devrait:
1. Charger correctement
2. Initialiser Firebase avec les bonnes clés
3. Permettre la connexion Google
4. Accéder à Firestore

## Déploiement

Firebase App Hosting va automatiquement détecter le commit et redéployer l'application.

## Alternative recommandée

**Firebase Hosting reste la meilleure option** pour cette application:
- Plus simple (pas besoin de serveur)
- Plus rapide (CDN global)
- Moins cher
- Déjà fonctionnel: https://choose-me-l1izsi.web.app
