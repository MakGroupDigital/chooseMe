# 💰 Guide - Portefeuille (Wallet)

## ✅ Fonctionnalités Complètes

La page Wallet permet aux utilisateurs de:
- ✅ Voir leur solde en temps réel
- ✅ Consulter leurs gains mensuels
- ✅ Voir leurs points CHOOSE
- ✅ Demander un retrait (Mobile Money ou Banque)
- ✅ Voir l'historique des transactions
- ✅ Suivre les retraits en attente
- ✅ Voir leur taux de réussite

## 📍 Accès

**URL:** `/wallet`

**Depuis l'app:**
- Navigation bottom bar → Icône Wallet
- Ou depuis "Mes Pronostics" → Bouton "Pronostiquer"

## 🎨 Sections de la Page

### 1. Carte de Solde (Balance Card)
Affiche:
- **Solde actuel** en XOF (Francs CFA)
- **Gains du mois** - Total des gains ce mois
- **Points CHOOSE** - Points accumulés
- **Taux de réussite** - Pourcentage de pronostics gagnés

### 2. Boutons d'Action
- **Retrait** - Ouvre le modal de retrait
- **Pronostiquer** - Redirige vers les matchs live

### 3. Retraits en Attente
Liste des demandes de retrait en cours de traitement:
- Montant
- Statut (En attente / Complété / Rejeté)
- Date de demande
- Méthode (Mobile Money / Banque)

### 4. Historique des Transactions
Liste chronologique de toutes les transactions:
- **Crédit** (vert) - Gains de pronostics, bonus
- **Débit** (rouge) - Retraits
- Date et heure
- Description

## 💸 Faire un Retrait

### Étapes:
1. Cliquez sur "Retrait"
2. Entrez le montant (minimum 1000 XOF)
3. Choisissez la méthode:
   - 📱 **Mobile Money** (Orange Money, Wave, etc.)
   - 🏦 **Virement bancaire**
4. Entrez votre numéro de téléphone ou compte
5. Cliquez sur "Confirmer le retrait"

### Validation:
- ✅ Montant minimum: 1000 XOF
- ✅ Solde suffisant
- ✅ Pas de retrait en attente
- ✅ Numéro valide

### Délai:
- ⏱️ Traitement: 24-48 heures
- 📧 Notification par email/SMS
- 💰 Argent reçu directement

## 🔄 Comment Gagner de l'Argent

### 1. Pronostics Gagnants
- Faites un pronostic sur un match
- Si vous gagnez → +100 points (ou montant du match)
- Points convertis en XOF (1 point = 1 XOF)

### 2. Bonus
- Bonus d'inscription
- Bonus de parrainage
- Bonus mensuels

### 3. Récompenses
- Séries de victoires
- Classement mensuel
- Événements spéciaux

## 📊 Structure des Données

### Wallet
```typescript
{
  id: string,
  userId: string,
  balance: number,        // Solde en XOF
  points: number,         // Points CHOOSE
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction
```typescript
{
  id: string,
  walletId: string,
  type: 'credit' | 'debit',
  amount: number,
  rewardType: string,     // 'correct_prediction', 'bonus', etc.
  description: string,
  matchId?: string,
  createdAt: Date
}
```

### Withdrawal
```typescript
{
  id: string,
  userId: string,
  amount: number,
  method: 'mobile_money' | 'bank_transfer',
  accountDetails: string,  // Numéro de téléphone ou compte
  status: 'pending' | 'completed' | 'rejected',
  requestedAt: Date,
  processedAt?: Date,
  rejectionReason?: string
}
```

## 🔧 Services Utilisés

### `walletService.ts`

**Fonctions principales:**

```typescript
// Récupérer le wallet
getUserWallet(userId: string): Promise<WalletData>

// Statistiques
getWalletStats(userId: string): Promise<WalletStats>

// Historique transactions
getTransactionHistory(userId: string, limit?: number): Promise<Transaction[]>

// Historique retraits
getWithdrawalHistory(userId: string, limit?: number): Promise<Withdrawal[]>

// Demander un retrait
requestWithdrawal(
  userId: string,
  amount: number,
  method: 'mobile_money' | 'bank_transfer',
  accountDetails: string
): Promise<{ success: boolean; error?: string }>
```

## 🎯 Flux Complet

### Gagner de l'Argent
```
1. Utilisateur fait un pronostic
   ↓
2. Match se termine
   ↓
3. Cloud Function traite le résultat
   ↓
4. Si gagné:
   - Wallet crédité (+100 XOF)
   - Transaction créée
   - Notification envoyée
   ↓
5. Utilisateur voit son solde augmenter
```

### Retirer de l'Argent
```
1. Utilisateur clique "Retrait"
   ↓
2. Remplit le formulaire
   ↓
3. Validation:
   - Montant ≥ 1000 XOF
   - Solde suffisant
   - Pas de retrait en attente
   ↓
4. Demande créée dans Firestore
   - Status: pending
   ↓
5. Admin traite manuellement
   - Vérifie les infos
   - Effectue le paiement
   - Met à jour status → completed
   ↓
6. Utilisateur reçoit l'argent
   - Notification envoyée
```

## 🔐 Sécurité

### Validations Côté Client
- Montant minimum: 1000 XOF
- Solde suffisant
- Format numéro valide
- Pas de retrait en attente

### Validations Côté Serveur (Cloud Functions)
- Vérification du solde
- Vérification de l'utilisateur
- Transactions atomiques
- Logs de toutes les opérations

### Règles Firestore
```javascript
// Wallets - Lecture par propriétaire, écriture Cloud Functions
match /wallets/{walletId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if false; // Seules les Cloud Functions
}

// Transactions - Lecture par propriétaire
match /transactions/{transactionId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: if false;
}

// Withdrawals - Lecture/création par propriétaire
match /withdrawals/{withdrawalId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId
                && request.resource.data.status == 'pending';
  allow update, delete: if false; // Seuls les admins
}
```

## 🎨 Design

### Couleurs
- **Vert** (#19DB8A) - Gains, succès
- **Rouge** - Retraits, pertes
- **Orange** - En attente
- **Bleu** - Informations

### Icônes
- 💰 Wallet - Portefeuille
- 📈 TrendingUp - Gains
- 📊 History - Historique
- ⬆️ ArrowUpRight - Retrait
- ⬇️ ArrowDownLeft - Crédit
- ⏰ Clock - En attente
- ✅ CheckCircle - Complété
- ❌ XCircle - Rejeté

## 📱 Responsive

La page est entièrement responsive:
- Mobile first design
- Grilles adaptatives
- Modals plein écran sur mobile
- Touch-friendly buttons

## 🚀 Améliorations Futures

- [ ] Graphique de progression des gains
- [ ] Export PDF de l'historique
- [ ] Notifications push pour retraits
- [ ] Conversion automatique points → XOF
- [ ] Retraits automatiques (sans validation admin)
- [ ] Intégration API de paiement
- [ ] Limites de retrait personnalisées
- [ ] Programme de fidélité
- [ ] Cashback sur les paris

## 🐛 Dépannage

### Le solde ne s'affiche pas
1. Vérifiez que vous êtes connecté
2. Vérifiez la console pour les erreurs
3. Le wallet est créé automatiquement au premier gain

### Le retrait ne fonctionne pas
1. Vérifiez le montant minimum (1000 XOF)
2. Vérifiez votre solde
3. Vérifiez qu'aucun retrait n'est en attente
4. Vérifiez le format du numéro

### Les transactions ne s'affichent pas
1. Vérifiez les règles Firestore
2. Vérifiez les index Firestore
3. Vérifiez la console pour les erreurs

## ✅ Checklist Déploiement

- [ ] Service `walletService.ts` créé
- [ ] Page `WalletPage.tsx` créée
- [ ] Route `/wallet` ajoutée
- [ ] Cloud Functions déployées
- [ ] Règles Firestore déployées
- [ ] Index Firestore créés
- [ ] Tests effectués
- [ ] Documentation à jour

---

**Le portefeuille est maintenant complet et fonctionnel! 💰🎉**
