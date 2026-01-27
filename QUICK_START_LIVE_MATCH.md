# 🚀 Guide de Démarrage Rapide - Matchs Live

## Installation en 5 minutes

### Étape 1: Vérifier les dépendances

Assurez-vous que ces packages sont installés :

```bash
cd "choose-me web app"
npm install
```

Les dépendances nécessaires (déjà dans package.json) :
- `firebase` - Pour Firestore
- `react-router-dom` - Pour la navigation
- `lucide-react` - Pour les icônes

### Étape 2: Configurer Firestore

#### A. Créer les collections

Dans la console Firebase, créez ces collections :
- `matches`
- `pronostics`

#### B. Ajouter les règles de sécurité

Copiez ces règles dans `firestore.rules` :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Matches - Lecture publique
    match /matches/{matchId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Pronostics - Authentification requise
    match /pronostics/{pronosticId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.resource.data.user_ref == /databases/$(database)/documents/users/$(request.auth.uid);
      allow update, delete: if false;
    }
  }
}
```

Déployez les règles :
```bash
firebase deploy --only firestore:rules
```

#### C. Créer les index

Dans la console Firebase > Firestore > Index, créez :

1. **Index pour matches**
   - Collection: `matches`
   - Champs: `start_time` (Ascending), `status` (Ascending)

2. **Index pour pronostics**
   - Collection: `pronostics`
   - Champs: `user_ref` (Ascending), `match_ref` (Ascending)

### Étape 3: Ajouter les routes

Dans votre fichier de routes principal (ex: `App.tsx` ou `router.tsx`), ajoutez :

```typescript
import LiveMatchesPage from './features/live_match/LiveMatchesPage';
import MatchDetailPage from './features/live_match/MatchDetailPage';

// Dans vos routes
<Route path="/live-match" element={<LiveMatchesPage />} />
<Route path="/live-match/:matchId" element={<MatchDetailPage />} />
```

### Étape 4: Ajouter la navigation

Dans votre menu de navigation, ajoutez un lien :

```typescript
import { Trophy } from 'lucide-react';

<Link to="/live-match" className="nav-link">
  <Trophy size={20} />
  <span>Matchs Live</span>
</Link>
```

### Étape 5: Tester

1. Démarrez l'application :
```bash
npm run dev
```

2. Naviguez vers `/live-match`

3. Cliquez sur le bouton de synchronisation (icône refresh)

4. Les matchs du jour devraient apparaître !

## 🎯 Test rapide

### Tester avec des données de test

Si aucun match réel n'est disponible, l'application utilisera automatiquement des données de test. Vous verrez :
- Real Madrid vs Barcelona
- Manchester United vs Liverpool
- Bayern Munich vs Borussia Dortmund

### Tester les pronostiques

1. Assurez-vous d'être connecté
2. Cliquez sur un match "À venir"
3. Choisissez un pronostic
4. Vérifiez dans Firestore que le pronostic est enregistré

## 🔧 Configuration avancée

### Modifier les ligues

Dans `services/liveMatchService.ts`, ligne ~30 :

```typescript
const SUPPORTED_LEAGUES: Record<string, string> = {
  'Premier League': '4328',
  'La Liga': '4335',
  'Bundesliga': '4331',
  'Serie A': '4332',
  'Ligue 1': '4334',
  'Champions League': '4480',
  'Europa League': '4481',
  // Ajoutez d'autres ligues ici
};
```

IDs disponibles sur : https://www.thesportsdb.com/api/v1/json/3/all_leagues.php

### Modifier la récompense

Dans `services/liveMatchService.ts`, fonction `syncMatchesToFirestore()` :

```typescript
reward_amount: 100, // Changez cette valeur
```

### Modifier l'intervalle de rafraîchissement

Dans `features/live_match/LiveMatchesPage.tsx` :

```typescript
const interval = setInterval(() => {
  loadMatches(true);
}, 60000); // 60000 = 60 secondes
```

## 📱 Intégration dans le Dashboard

### Ajouter une carte "Matchs Live" dans le dashboard

```typescript
import { Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function DashboardLiveMatchCard() {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate('/live-match')}
      className="bg-gradient-to-br from-[#208050] to-[#19DB8A] rounded-3xl p-6 cursor-pointer hover:scale-105 transition-transform"
    >
      <div className="flex items-center justify-between mb-4">
        <Trophy className="text-white" size={32} />
        <div className="bg-white/20 px-3 py-1 rounded-full">
          <span className="text-white text-xs font-bold">NOUVEAU</span>
        </div>
      </div>
      
      <h3 className="text-white text-xl font-bold mb-2">Matchs Live</h3>
      <p className="text-white/80 text-sm mb-4">
        Pronostiquez et gagnez des points
      </p>
      
      <div className="flex items-center gap-2 text-white">
        <TrendingUp size={16} />
        <span className="text-sm font-semibold">Voir les matchs →</span>
      </div>
    </div>
  );
}
```

## 🎨 Personnalisation du style

Les couleurs utilisées correspondent à la charte ChooseMe :
- Vert principal : `#208050`
- Vert clair : `#19DB8A`
- Fond sombre : `#0A0A0A`
- Fond secondaire : `#1A1A1A`

Pour personnaliser, modifiez les classes Tailwind dans les composants.

## 🐛 Résolution de problèmes

### Erreur : "Collection 'matches' not found"
→ Créez la collection dans Firestore (elle se créera automatiquement au premier match)

### Erreur : "Permission denied"
→ Vérifiez les règles Firestore et que l'utilisateur est connecté

### Aucun match ne s'affiche
→ Cliquez sur le bouton refresh pour synchroniser
→ Vérifiez la console pour les erreurs API

### Les pronostics ne s'enregistrent pas
→ Vérifiez que l'utilisateur est connecté
→ Vérifiez les règles Firestore pour `pronostics`

## 📊 Monitoring

### Vérifier les données dans Firestore

1. Console Firebase > Firestore Database
2. Collection `matches` : Voir les matchs synchronisés
3. Collection `pronostics` : Voir les pronostics des utilisateurs

### Logs de débogage

Ouvrez la console du navigateur (F12) pour voir :
- `🔍 Récupération des matchs...`
- `✅ X matchs trouvés pour [Ligue]`
- `📥 Synchronisation depuis l'API...`
- `✅ Pronostic enregistré`

## 🚀 Déploiement

### Build de production

```bash
npm run build
```

### Déployer sur Firebase Hosting

```bash
firebase deploy --only hosting
```

## 📈 Prochaines améliorations

- [ ] Ajouter un système de classement
- [ ] Notifications push pour les matchs
- [ ] Historique des pronostics utilisateur
- [ ] Statistiques de performance
- [ ] Badges et récompenses
- [ ] Partage sur les réseaux sociaux

## 🎉 C'est prêt !

Votre système de matchs live avec pronostiques est maintenant opérationnel !

Pour toute question, consultez `LIVE_MATCH_IMPLEMENTATION.md` pour plus de détails.

---

**Bon match ! ⚽🏆**
