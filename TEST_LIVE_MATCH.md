# Test des Matchs Live

## Problèmes résolus

### 1. ✅ Hook useAuth manquant
- Ajouté le hook `useAuth` dans `services/firebase.ts`
- Export de `auth` et `db` pour compatibilité

### 2. ✅ Import de db incorrect
- Changé `import { db } from './firebase'` en `import { getFirestoreDb } from './firebase'`
- Initialisation de `const db = getFirestoreDb()` dans le service

### 3. ✅ Paramètre de route incorrect
- Route définie comme `/live-match/:id` dans App.tsx
- Changé `matchId` en `id` dans MatchDetailPage.tsx

## Comment tester

### 1. Démarrer l'application

```bash
cd "choose-me web app"
npm run dev
```

### 2. Naviguer vers les matchs live

Dans votre navigateur, allez à :
```
http://localhost:3001/#/live-match
```

### 3. Vérifier la console

Ouvrez la console du navigateur (F12) et vérifiez :
- Pas d'erreurs rouges
- Messages de log comme "🔍 Récupération des matchs..."
- "✅ X matchs trouvés..."

### 4. Tester la synchronisation

1. Cliquez sur le bouton refresh (icône circulaire en haut à droite)
2. Attendez quelques secondes
3. Des matchs devraient apparaître (soit réels, soit de test)

### 5. Tester un pronostic

1. Cliquez sur un match "À venir"
2. Choisissez un pronostic (Victoire équipe A, Match nul, ou Victoire équipe B)
3. Vérifiez que le pronostic est enregistré

## Données de test

Si aucun match réel n'est disponible, l'application affichera automatiquement 3 matchs de test :
- Real Madrid vs Barcelona (À venir)
- Manchester United vs Liverpool (En direct)
- Bayern Munich vs Borussia Dortmund (À venir)

## Vérification Firestore

### Collections créées automatiquement

Après la première synchronisation, vérifiez dans Firebase Console :

1. **Collection `matches`**
   - Devrait contenir les matchs du jour
   - Champs : team_a_name, team_b_name, status, scores, etc.

2. **Collection `pronostics`** (après avoir fait un pronostic)
   - Devrait contenir votre pronostic
   - Champs : user_ref, match_ref, prediction, status

## Dépannage

### Page blanche

Si la page reste blanche :
1. Ouvrez la console (F12)
2. Regardez les erreurs
3. Vérifiez que Firebase est bien initialisé
4. Vérifiez que les routes sont bien définies

### Erreur "Permission denied"

Si vous voyez cette erreur :
1. Vérifiez les règles Firestore
2. Assurez-vous d'être connecté
3. Vérifiez que la collection existe

### Aucun match ne s'affiche

Si aucun match n'apparaît :
1. Cliquez sur le bouton refresh
2. Attendez 5-10 secondes
3. Vérifiez la console pour les erreurs API
4. Les données de test devraient s'afficher en fallback

### Erreur CORS

Si vous voyez des erreurs CORS :
- C'est normal pour TheSportsDB
- L'application utilise automatiquement les données de test
- En production, utilisez un proxy ou Cloud Functions

## Prochaines étapes

Une fois que tout fonctionne :

1. **Configurer les règles Firestore** (voir QUICK_START_LIVE_MATCH.md)
2. **Créer les index** dans Firebase Console
3. **Tester avec un vrai utilisateur connecté**
4. **Ajouter la navigation** dans le menu principal
5. **Déployer** sur Firebase Hosting

## Commandes utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Build pour production
npm run build

# Déployer sur Firebase
firebase deploy --only hosting

# Voir les logs Firebase
firebase functions:log
```

## Support

Si vous rencontrez des problèmes :
1. Vérifiez ce fichier de test
2. Consultez LIVE_MATCH_IMPLEMENTATION.md
3. Regardez la console du navigateur
4. Vérifiez les logs Firebase

---

**Dernière mise à jour :** Corrections appliquées pour résoudre la page blanche
