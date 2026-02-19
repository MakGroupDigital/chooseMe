# 🔥 Index Firestore Requis

## ⚠️ Important

Pour que la page "Mes Pronostics" fonctionne correctement, vous devez créer un index Firestore.

## 📋 Index à Créer

### Index 1: Pronostics par Utilisateur (REQUIS)

**Collection:** `pronostics`

**Champs:**
1. `user_ref` - Ascending
2. `submitted_at` - Descending

**Pourquoi?**
Cet index permet de récupérer tous les pronostics d'un utilisateur triés par date (plus récent en premier).

## 🚀 Comment Créer l'Index

### Méthode 1: Via la Console Firebase (Recommandé)

1. Allez sur [Firebase Console](https://console.firebase.google.com/project/choose-me-l1izsi/firestore/indexes)
2. Cliquez sur "Créer un index"
3. Sélectionnez la collection: `pronostics`
4. Ajoutez les champs:
   - `user_ref` → Ascending
   - `submitted_at` → Descending
5. Cliquez sur "Créer"
6. Attendez quelques minutes que l'index soit créé

### Méthode 2: Via le Fichier firestore.indexes.json

Ajoutez ceci dans `firebase/firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "pronostics",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user_ref",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submitted_at",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

Puis déployez:
```bash
firebase deploy --only firestore:indexes --project choose-me-l1izsi
```

### Méthode 3: Automatique (Lors de la Première Erreur)

1. Essayez d'accéder à `/my-predictions`
2. Ouvrez la console du navigateur
3. Vous verrez une erreur avec un lien direct vers la création de l'index
4. Cliquez sur le lien
5. L'index sera créé automatiquement

## 📊 Autres Index Recommandés

### Index 2: Pronostics par Match et Statut

**Collection:** `pronostics`
**Champs:**
- `match_ref` → Ascending
- `status` → Ascending

**Utilité:** Pour les statistiques de pronostics par match

### Index 3: Transactions par Wallet

**Collection:** `transactions`
**Champs:**
- `wallet_ref` → Ascending
- `created_at` → Descending

**Utilité:** Pour l'historique des transactions dans le wallet

### Index 4: Matchs par Date et Statut

**Collection:** `matches`
**Champs:**
- `start_time` → Ascending
- `status` → Ascending

**Utilité:** Pour filtrer les matchs par date et statut

### Index 5: Withdrawals par Utilisateur

**Collection:** `withdrawals`
**Champs:**
- `user_ref` → Ascending
- `requested_at` → Descending

**Utilité:** Pour l'historique des retraits

## 🔍 Vérifier les Index

### Via Firebase Console
1. Allez sur [Firestore Indexes](https://console.firebase.google.com/project/choose-me-l1izsi/firestore/indexes)
2. Vérifiez que tous les index sont en statut "Enabled" (vert)

### Via la Console du Navigateur
```javascript
// Si vous voyez cette erreur:
// "The query requires an index"
// Cliquez sur le lien dans l'erreur pour créer l'index automatiquement
```

## ⏱️ Temps de Création

- **Petite base de données** (< 1000 documents): 1-2 minutes
- **Base moyenne** (1000-10000 documents): 5-10 minutes
- **Grande base** (> 10000 documents): 15-30 minutes

## 🐛 Dépannage

### Erreur: "The query requires an index"

**Solution:**
1. Copiez le lien dans l'erreur
2. Collez-le dans votre navigateur
3. Cliquez sur "Créer l'index"
4. Attendez que l'index soit créé
5. Rechargez la page

### L'index est en statut "Building"

**Solution:**
- Attendez quelques minutes
- L'index se créera automatiquement
- Vous pouvez continuer à utiliser l'app, mais la requête échouera jusqu'à ce que l'index soit prêt

### L'index ne se crée pas

**Solution:**
1. Vérifiez que vous avez les permissions nécessaires
2. Vérifiez que le projet Firebase est correct
3. Essayez de créer l'index manuellement via la console
4. Contactez le support Firebase si le problème persiste

## 📝 Fichier firestore.indexes.json Complet

Voici le fichier complet avec tous les index recommandés:

```json
{
  "indexes": [
    {
      "collectionGroup": "pronostics",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user_ref",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "submitted_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "pronostics",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "match_ref",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "wallet_ref",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "created_at",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "matches",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "start_time",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "withdrawals",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user_ref",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "requested_at",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## 🚀 Déploiement

```bash
# Déployer tous les index
firebase deploy --only firestore:indexes --project choose-me-l1izsi

# Vérifier le statut
firebase firestore:indexes --project choose-me-l1izsi
```

## ✅ Checklist

- [ ] Index `pronostics` (user_ref, submitted_at) créé
- [ ] Index `pronostics` (match_ref, status) créé
- [ ] Index `transactions` (wallet_ref, created_at) créé
- [ ] Index `matches` (start_time, status) créé
- [ ] Index `withdrawals` (user_ref, requested_at) créé
- [ ] Tous les index en statut "Enabled"
- [ ] Page "Mes Pronostics" fonctionne sans erreur

---

**Une fois l'index créé, la page "Mes Pronostics" fonctionnera parfaitement! 🎉**
