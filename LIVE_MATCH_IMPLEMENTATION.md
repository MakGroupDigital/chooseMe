# Implémentation des Matchs Live avec Pronostiques

## 🎯 Vue d'ensemble

Cette implémentation fournit un système complet de matchs live avec pronostiques en temps réel, utilisant **TheSportsDB** - une API 100% gratuite sans clé requise.

## 🔑 Caractéristiques principales

### ✅ API Gratuite Sans Clé
- **TheSportsDB** : API complètement gratuite
- Aucune inscription requise
- Aucune limite de requêtes stricte
- Données en temps réel pour les principales ligues européennes

### ⚽ Ligues Supportées
- Premier League (Angleterre)
- La Liga (Espagne)
- Bundesliga (Allemagne)
- Serie A (Italie)
- Ligue 1 (France)
- Champions League
- Europa League

### 🎮 Fonctionnalités

1. **Liste des matchs**
   - Filtrage par statut (En direct, À venir, Terminés)
   - Rafraîchissement automatique toutes les 60 secondes
   - Synchronisation avec Firestore
   - Indicateur de cache/en ligne

2. **Détail du match**
   - Informations complètes du match
   - Scores en temps réel
   - Système de pronostiques
   - Statistiques des pronostiques

3. **Système de pronostiques**
   - 3 options : Victoire équipe A, Match nul, Victoire équipe B
   - Un seul pronostic par utilisateur par match
   - Récompenses en points (100 points par défaut)
   - Traitement automatique des résultats

## 📁 Structure des fichiers

```
choose-me web app/
├── services/
│   └── liveMatchService.ts          # Service principal pour l'API et Firestore
├── features/
│   └── live_match/
│       ├── LiveMatchesPage.tsx      # Page liste des matchs
│       └── MatchDetailPage.tsx      # Page détail + pronostiques
└── LIVE_MATCH_IMPLEMENTATION.md     # Ce fichier
```

## 🔧 Configuration

### 1. Firestore Collections

Assurez-vous que ces collections existent dans Firestore :

#### Collection `matches`
```typescript
{
  externalId: string,           // ID du match depuis l'API
  team_a_name: string,
  team_a_logo: string,
  team_b_name: string,
  team_b_logo: string,
  competition: string,
  start_time: Timestamp,
  status: 'scheduled' | 'live' | 'finished' | 'postponed',
  score_a: number,
  score_b: number,
  match_minute: number,
  predictions_enabled: boolean,
  reward_amount: number,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### Collection `pronostics`
```typescript
{
  user_ref: DocumentReference,  // Référence vers users/{userId}
  match_ref: DocumentReference, // Référence vers matches/{matchId}
  prediction: 'team_a' | 'draw' | 'team_b',
  submitted_at: Timestamp,
  status: 'pending' | 'won' | 'lost',
  user_name: string
}
```

### 2. Règles Firestore

Ajoutez ces règles dans `firestore.rules` :

```javascript
// Matches - Lecture publique, écriture admin uniquement
match /matches/{matchId} {
  allow read: if true;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Pronostics - Lecture/écriture authentifiée
match /pronostics/{pronosticId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
    request.resource.data.user_ref == /databases/$(database)/documents/users/$(request.auth.uid) &&
    request.resource.data.status == 'pending';
  allow update: if false; // Seules les Cloud Functions peuvent mettre à jour
  allow delete: if false;
}
```

### 3. Index Firestore

Créez ces index composites dans Firestore :

1. **Collection `matches`**
   - Champs : `start_time` (Ascending), `status` (Ascending)
   - Champs : `externalId` (Ascending)

2. **Collection `pronostics`**
   - Champs : `user_ref` (Ascending), `match_ref` (Ascending)
   - Champs : `match_ref` (Ascending), `status` (Ascending)

## 🚀 Utilisation

### Intégration dans l'application

1. **Ajouter les routes** dans votre router :

```typescript
import LiveMatchesPage from './features/live_match/LiveMatchesPage';
import MatchDetailPage from './features/live_match/MatchDetailPage';

// Dans vos routes
<Route path="/live-match" element={<LiveMatchesPage />} />
<Route path="/live-match/:matchId" element={<MatchDetailPage />} />
```

2. **Ajouter un lien de navigation** :

```typescript
<Link to="/live-match">
  <Trophy size={20} />
  Matchs Live
</Link>
```

### Synchronisation des matchs

La synchronisation se fait automatiquement, mais vous pouvez aussi la déclencher manuellement :

```typescript
import { syncMatchesToFirestore } from './services/liveMatchService';

// Synchroniser les matchs
await syncMatchesToFirestore();
```

### Récupérer les matchs

```typescript
import { getMatchesFromFirestore, fetchTodayMatches } from './services/liveMatchService';

// Depuis Firestore (recommandé)
const matches = await getMatchesFromFirestore();

// Directement depuis l'API
const matches = await fetchTodayMatches();
```

### Soumettre un pronostic

```typescript
import { submitPrediction } from './services/liveMatchService';

const result = await submitPrediction(
  userId,
  userName,
  matchId,
  'team_a' // ou 'draw' ou 'team_b'
);

if (result.success) {
  console.log('Pronostic enregistré !');
} else {
  console.error(result.error);
}
```

## 🔄 Flux de données

### 1. Chargement initial
```
API TheSportsDB → Service → Firestore → Interface utilisateur
```

### 2. Rafraîchissement
```
Timer (60s) → API → Mise à jour Firestore → Interface mise à jour
```

### 3. Soumission de pronostic
```
Utilisateur → Service → Firestore → Confirmation
```

### 4. Traitement des résultats
```
Match terminé → Cloud Function → Mise à jour pronostics → Crédit portefeuille
```

## 🎨 Personnalisation

### Modifier les ligues supportées

Dans `liveMatchService.ts` :

```typescript
const SUPPORTED_LEAGUES: Record<string, string> = {
  'Premier League': '4328',
  'La Liga': '4335',
  // Ajoutez d'autres ligues ici
};
```

### Modifier la récompense

Dans `syncMatchesToFirestore()` :

```typescript
reward_amount: 100, // Changez cette valeur
```

### Modifier l'intervalle de rafraîchissement

Dans `LiveMatchesPage.tsx` :

```typescript
const interval = setInterval(() => {
  loadMatches(true);
}, 60000); // Changez 60000 (60 secondes)
```

## 🐛 Dépannage

### Aucun match ne s'affiche

1. Vérifiez la console pour les erreurs
2. Vérifiez que les règles Firestore sont correctes
3. Essayez de synchroniser manuellement avec le bouton refresh
4. Vérifiez que l'API TheSportsDB est accessible

### Les pronostics ne fonctionnent pas

1. Vérifiez que l'utilisateur est connecté
2. Vérifiez les règles Firestore pour la collection `pronostics`
3. Vérifiez que le match est en statut `scheduled`
4. Vérifiez la console pour les erreurs

### Les scores ne se mettent pas à jour

1. Vérifiez que la synchronisation automatique fonctionne
2. Essayez de rafraîchir manuellement
3. Vérifiez les logs de la console

## 📊 Cloud Functions (Optionnel)

Pour automatiser le traitement des pronostics, créez une Cloud Function :

```typescript
// firebase/functions/index.js
exports.updateMatchScores = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    // Récupérer les matchs live
    const matchesSnapshot = await admin.firestore()
      .collection('matches')
      .where('status', '==', 'live')
      .get();
    
    // Mettre à jour les scores depuis l'API
    // ...
  });

exports.processMatchResults = functions.firestore
  .document('matches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Si le match vient de se terminer
    if (before.status !== 'finished' && after.status === 'finished') {
      // Traiter les pronostics
      // ...
    }
  });
```

## 🎯 Prochaines étapes

1. **Ajouter un système de classement** (leaderboard)
2. **Implémenter les notifications** pour les matchs à venir
3. **Ajouter des statistiques utilisateur** (taux de réussite, etc.)
4. **Créer un système de paris** avec mise de points
5. **Ajouter des badges** et récompenses

## 📝 Notes importantes

- L'API TheSportsDB est gratuite mais peut avoir des limitations de débit
- Les données de test sont utilisées en fallback si l'API est indisponible
- Le cache est utilisé pour réduire les appels API
- Les matchs sont synchronisés automatiquement toutes les 5 minutes (configurable)

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez la console du navigateur pour les erreurs
2. Consultez la documentation de TheSportsDB : https://www.thesportsdb.com/api.php
3. Vérifiez les règles Firestore et les index

---

**Développé avec ❤️ pour ChooseMe**
