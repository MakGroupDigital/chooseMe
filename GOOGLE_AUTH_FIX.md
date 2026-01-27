# Correction Authentification Google ✅

## Problèmes identifiés et corrigés

### 1. ❌ Problème : Flux cassé pour nouveaux utilisateurs Google

**Avant :**
- Connexion Google → Création document avec `type: 'visitor'` → Redirection `/home`
- L'utilisateur n'avait jamais l'opportunité de choisir son vrai type de profil
- Tous les nouveaux utilisateurs Google restaient bloqués en tant que "visitor"

**Après :**
- Connexion Google → Vérification si première connexion
- **Si nouveau** → Création document → Redirection `/onboarding/type` (choix du profil)
- **Si existant** → Redirection `/home` directement

### 2. ✅ Corrections appliquées

#### LoginPage.tsx
```typescript
// Maintenant on vérifie si l'utilisateur existe déjà
const userSnap = await getDoc(userRef);

if (!userSnap.exists()) {
  // Nouveau → Créer document + Rediriger vers choix du profil
  await setDoc(userRef, { ... });
  navigate('/onboarding/type');
} else {
  // Existant → Rediriger vers accueil
  navigate('/home');
}
```

#### OnboardingCreateAccountPage.tsx
```typescript
// Même logique pour l'inscription
if (!userSnap.exists()) {
  await createUserProfile(...);
  navigate('/onboarding/type');
} else {
  navigate('/home');
}
```

### 3. 🔍 Logs de débogage ajoutés

Les logs suivants permettent de tracer le flux :
- `🔵 Début connexion Google...`
- `✅ Auth instance récupérée`
- `✅ Provider Google créé`
- `🔵 Ouverture popup Google...`
- `✅ Popup fermée, résultat: email`
- `🆕 Première connexion - Création du document`
- `✅ Utilisateur existant - Connexion directe`

### 4. 🎯 Gestion des erreurs améliorée

Messages d'erreur spécifiques :
- `auth/popup-blocked` → "La popup a été bloquée. Autorisez les popups pour ce site."
- `auth/popup-closed-by-user` → "Connexion annulée."
- `auth/unauthorized-domain` → "Domaine non autorisé. Contactez l'administrateur."

## Configuration Firebase requise

Pour que l'authentification Google fonctionne, vérifiez dans Firebase Console :

1. **Authentication → Sign-in method**
   - Google doit être activé (Enabled)

2. **Authentication → Settings → Authorized domains**
   - `localhost` (pour développement)
   - `choose-me-l1izsi.firebaseapp.com` (domaine Firebase)
   - Votre domaine de production

## Test du flux

### Nouveau utilisateur :
1. Clic sur "Continuer avec Google"
2. Popup Google s'ouvre
3. Sélection du compte Google
4. Document créé dans Firestore
5. Redirection vers `/onboarding/type`
6. Choix du type de profil (Athlète, Recruteur, etc.)
7. Redirection vers `/home`

### Utilisateur existant :
1. Clic sur "Continuer avec Google"
2. Popup Google s'ouvre
3. Sélection du compte Google
4. Redirection directe vers `/home`

## Structure du document utilisateur

```typescript
{
  email: string,
  displayName: string,
  photoUrl?: string,
  type: 'visitor' | 'athlete' | 'recruiter' | 'club' | 'press',
  statut: 'no' | 'ok',
  etat: 'nv' | 'ac',
  createdAt: string,
  updatedAt: string
}
```

## Commandes de test

```bash
# Lancer en développement
cd "choose-me web app"
npm run dev

# Build pour production
npm run build

# Preview du build
npm run preview
```

## Vérification dans la console du navigateur

Ouvrez la console (F12) et vérifiez les logs lors de la connexion Google.
Vous devriez voir la séquence complète des logs de débogage.
