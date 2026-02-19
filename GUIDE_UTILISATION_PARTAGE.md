# 📱 Guide d'Utilisation - Fonctionnalité de Partage

## 🎯 Où Trouver les Boutons de Partage

### 1. Page de Profil (`/profile`)

#### Bouton de Partage du Profil
```
┌─────────────────────────────────────┐
│  ←                    [Share] [Edit]│  ← Bouton Share2 en haut à droite
│                                     │
│         [Photo de profil]           │
│                                     │
│         Nom du joueur ✓             │
│         Pays • Ville • Type         │
│                                     │
│    [Abonnés] [Suivis] [Profil]     │
│                                     │
│         ...contenu...               │
│                                     │
│    ┌─────────────────────────┐     │
│    │  Performances           │     │
│    │                         │     │
│    │  [Vidéo 1]  [Vidéo 2]  │     │  ← Chaque vidéo a son propre
│    │                         │     │    bouton de partage dans
│    │  [Vidéo 3]  [Vidéo 4]  │     │    le menu "..."
│    └─────────────────────────┘     │
└─────────────────────────────────────┘
```

**Action**: Cliquer sur l'icône Share2 (en haut à droite)
**Résultat**: Partage le profil complet avec stats et informations

#### Bouton de Partage des Vidéos
```
┌─────────────────────┐
│                     │
│   [Vidéo en cours]  │
│                     │
│   ▶ 🔊 0:15/1:23   │  ← Contrôles vidéo
│                  ⋮  │  ← Bouton menu (3 points)
└─────────────────────┘

Menu déroulant:
┌─────────────────┐
│ 📤 Partager     │  ← Cliquer ici
│ 📥 Télécharger  │
│ 🚩 Signaler     │
└─────────────────┘
```

**Action**: 
1. Cliquer sur la vidéo pour la lire
2. Cliquer sur "⋮" (3 points) dans les contrôles
3. Cliquer sur "Partager"

**Résultat**: Partage la vidéo avec titre, description et hashtags

### 2. Page Explorer - Détail Reportage (`/explorer/reportage/:id`)

```
┌─────────────────────────────────────┐
│  ← Reportage              [Share]   │  ← Bouton Share2 en haut à droite
│     Titre du reportage              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    [Vidéo du reportage]     │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Titre complet                      │
│  Par [Reporter] • [Date]            │
│                                     │
│  Description                        │
│  ...                                │
└─────────────────────────────────────┘
```

**Action**: Cliquer sur l'icône Share2 (en haut à droite)
**Résultat**: Partage le lien du reportage avec titre et auteur

## 📲 Comportement sur Mobile

### iOS / Android
1. Cliquer sur le bouton de partage
2. Le menu natif du téléphone s'ouvre
3. Choisir l'application de destination:
   - WhatsApp
   - Instagram
   - Facebook
   - Twitter
   - Messages
   - Email
   - Etc.
4. Le contenu est pré-rempli avec:
   - Titre
   - Description
   - Hashtags
   - Lien

### Exemple de Contenu Partagé (Vidéo)
```
Vidéo de performance - Mamadou Diallo

Performance de Mamadou Diallo - Football (Attaquant)

#ChooseMe #Football #Senegal #Performance #Talent

https://chooseme.app/#/performance/abc123/1234567890
```

### Exemple de Contenu Partagé (Profil)
```
Découvrez le profil de Mamadou Diallo sur ChooseMe !

⚽ 45 matchs | 23 buts | 12 passes

#ChooseMe #ATHLETE #Talent

https://chooseme.app/#/profile/abc123
```

## 💻 Comportement sur Desktop

### Chrome / Firefox / Safari
1. Cliquer sur le bouton de partage
2. Le lien est automatiquement copié dans le presse-papiers
3. Une alerte confirme: "Lien copié dans le presse-papiers ! 📋"
4. Coller le lien où vous voulez (email, chat, etc.)

### Modal de Partage (Fallback)
Si la copie automatique échoue, un modal s'affiche:

```
┌─────────────────────────────────┐
│  Partager la vidéo          ✕   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🟢 WhatsApp             │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 🔵 Facebook             │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 🐦 Twitter              │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 💼 LinkedIn             │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 🔗 Copier le lien       │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

Cliquer sur une option pour partager sur le réseau social correspondant.

## 🎯 Cas d'Usage

### Cas 1: Joueur Partage sa Performance
**Objectif**: Montrer ses compétences aux recruteurs

1. Enregistrer une vidéo de performance
2. Aller sur son profil
3. Cliquer sur la vidéo
4. Cliquer sur "⋮" → "Partager"
5. Choisir WhatsApp
6. Envoyer à un recruteur ou groupe

**Résultat**: Le recruteur reçoit le lien avec aperçu de la vidéo

### Cas 2: Recruteur Partage un Profil
**Objectif**: Recommander un talent à un club

1. Visiter le profil d'un joueur
2. Cliquer sur l'icône Share2 en haut
3. Choisir Email
4. Envoyer au directeur sportif du club

**Résultat**: Le directeur reçoit le profil complet avec stats

### Cas 3: Journaliste Partage un Reportage
**Objectif**: Diffuser un reportage sur les réseaux sociaux

1. Ouvrir un reportage
2. Cliquer sur l'icône Share2 en haut
3. Choisir Twitter
4. Publier le tweet

**Résultat**: Le reportage est partagé avec titre et lien

## 🔍 Détails Techniques

### Métadonnées Incluses

#### Pour une Vidéo
- **Titre**: Caption de la vidéo ou "Vidéo de [Nom]"
- **Description**: "Performance de [Nom] - [Sport] ([Poste])"
- **Hashtags**: #ChooseMe, #[Sport], #[Pays], #Performance, #Talent
- **URL**: Lien direct vers la vidéo

#### Pour un Profil
- **Titre**: "[Nom] - ChooseMe"
- **Description**: Stats du joueur (matchs, buts, passes)
- **Hashtags**: #ChooseMe, #[Type], #Talent
- **URL**: Lien direct vers le profil

#### Pour un Reportage
- **Titre**: Titre du reportage
- **Description**: "Par [Reporter]"
- **URL**: Lien direct vers le reportage

### URLs Générées
- Profil: `https://[domain]/#/profile/[userId]`
- Vidéo: `https://[domain]/#/performance/[userId]/[timestamp]`
- Reportage: `https://[domain]/#/explorer/reportage/[reportageId]`

## ✅ Checklist de Test

- [ ] Partager un profil sur mobile (Web Share API)
- [ ] Partager un profil sur desktop (Clipboard)
- [ ] Partager une vidéo via le menu "⋮"
- [ ] Partager un reportage
- [ ] Vérifier que les hashtags sont corrects
- [ ] Vérifier que les URLs fonctionnent
- [ ] Tester sur iOS Safari
- [ ] Tester sur Android Chrome
- [ ] Tester sur Desktop Chrome
- [ ] Tester le modal de fallback

## 🎉 Avantages

✅ **Simple**: Un seul clic pour partager
✅ **Natif**: Utilise le menu de partage du téléphone
✅ **Complet**: Inclut toutes les métadonnées importantes
✅ **Flexible**: Fonctionne sur mobile et desktop
✅ **Professionnel**: Hashtags et formatage automatiques
✅ **Fiable**: Plusieurs fallbacks en cas d'erreur

## 💡 Conseils

1. **Sur mobile**: Utilisez le menu natif pour un partage rapide
2. **Sur desktop**: Le lien est copié automatiquement, collez-le où vous voulez
3. **Hashtags**: Sont générés automatiquement pour maximiser la visibilité
4. **URLs**: Sont courtes et faciles à partager
5. **Métadonnées**: Sont optimisées pour chaque type de contenu
