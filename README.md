# Choose-Me Web App 🏆

Plateforme de recrutement sportif d'élite - Application web React moderne avec algorithme de recommandation type TikTok.

## 🚀 Fonctionnalités

### 🎯 Feed Intelligent
- Algorithme de recommandation type TikTok
- Mélange contenu populaire et nouvelles découvertes
- Boost pour les nouveaux créateurs
- Détection de contenu viral
- Personnalisation basée sur les abonnements

### 👤 Profils Utilisateurs
- Profils athlètes, recruteurs, clubs, presse
- Vidéos de performance
- Statistiques et informations détaillées
- Système de follow/unfollow

### 🎥 Vidéos
- Lecteur vidéo personnalisé
- Upload et traitement de vidéos
- Partage dynamique avec métadonnées
- Likes, commentaires, partages

### 🎮 Matchs Live & Pronostics
- Matchs en direct
- Système de pronostics
- Wallet virtuel
- Classement des joueurs

### 🔐 Authentification
- Connexion email/mot de passe
- Connexion Google (OAuth)
- Gestion des sessions Firebase

## 🛠️ Technologies

- **React 19** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS v4** - Styling moderne
- **Firebase** - Backend (Auth, Firestore, Storage)
- **Lucide React** - Icônes
- **React Router** - Navigation

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview
```

## 🔧 Configuration

### Firebase
Configurez vos credentials Firebase dans `services/firebase.ts` :

```typescript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};
```

### Variables d'environnement
Créez un fichier `.env.local` :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 📁 Structure du Projet

```
choose-me web app/
├── components/          # Composants réutilisables
├── features/           # Features par domaine
│   ├── auth/          # Authentification
│   ├── home/          # Feed et dashboards
│   ├── profile/       # Profils utilisateurs
│   ├── content/       # Création de contenu
│   ├── live_match/    # Matchs et pronostics
│   └── wallet/        # Portefeuille virtuel
├── services/          # Services (Firebase, API)
├── utils/             # Utilitaires
├── types.ts           # Types TypeScript
└── App.tsx            # Composant principal
```

## 🎨 Algorithme de Feed

L'algorithme de recommandation utilise plusieurs critères :

- **Engagement** (0-50 pts) : Likes, commentaires, partages
- **Fraîcheur** (0-30 pts) : Boost pour contenu récent
- **Viral** (0-50 pts) : Détection de contenu qui monte
- **Diversité** (-20 à +15 pts) : Évite la monotonie
- **Abonnements** (+25 pts) : Boost pour créateurs suivis
- **Aléatoire** (0-10 pts) : Découverte de nouveaux contenus

Voir [ALGORITHME_FEED_TIKTOK.md](./ALGORITHME_FEED_TIKTOK.md) pour plus de détails.

## 🔥 Firestore Collections

- `users` - Profils utilisateurs
- `users/{userId}/performances` - Vidéos de performance
- `users/{userId}/publication` - Publications (legacy)
- `matches` - Matchs en direct
- `pronostics` - Pronostics des utilisateurs
- `wallets` - Portefeuilles virtuels
- `reportage` - Reportages

## 🚀 Déploiement

### Firebase Hosting

```bash
# Build
npm run build

# Déployer
firebase deploy --only hosting
```

### Autres plateformes

Le projet peut être déployé sur :
- Vercel
- Netlify
- AWS Amplify
- Google Cloud Run

## 📱 PWA & Mobile

L'application est optimisée pour mobile et peut être installée comme PWA :
- Manifest.json configuré
- Favicons et icônes générés
- Support offline (via Firebase)
- Optimisations tactiles

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence privée - Tous droits réservés.

## 👥 Équipe

Développé avec ❤️ par l'équipe Choose-Me

## 📞 Support

Pour toute question ou support, contactez-nous à : support@choose-me.app

---

**Choose-Me** - Révolutionnez le recrutement sportif 🏆
