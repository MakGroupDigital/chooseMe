# Guide pour Pousser vers GitHub 🚀

## Étapes pour créer le dépôt GitHub

### 1. Créer un nouveau dépôt sur GitHub

1. Allez sur https://github.com/new
2. Nom du dépôt : `choose-me-web-app`
3. Description : `Choose-Me Web App - Plateforme de recrutement sportif avec algorithme TikTok`
4. Visibilité : **Private** (recommandé) ou Public
5. **NE PAS** initialiser avec README, .gitignore ou licence (on les a déjà)
6. Cliquez sur "Create repository"

### 2. Lier le dépôt local au dépôt GitHub

Après avoir créé le dépôt, GitHub vous donnera des commandes. Utilisez celles-ci :

```bash
# Remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/YOUR_USERNAME/choose-me-web-app.git

# Ou avec SSH (si configuré)
git remote add origin git@github.com:YOUR_USERNAME/choose-me-web-app.git
```

### 3. Pousser le code

```bash
# Pousser vers la branche main
git branch -M main
git push -u origin main
```

### 4. Vérifier

Allez sur https://github.com/YOUR_USERNAME/choose-me-web-app pour voir votre code !

## Commandes Git Utiles

### Voir l'état
```bash
git status
```

### Ajouter des modifications
```bash
git add .
git commit -m "Description des changements"
git push
```

### Créer une nouvelle branche
```bash
git checkout -b feature/nouvelle-fonctionnalite
git push -u origin feature/nouvelle-fonctionnalite
```

### Mettre à jour depuis GitHub
```bash
git pull
```

## Configuration Git (si pas déjà fait)

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"
```

## Fichiers Générés ✅

- ✅ Favicons (16x16, 32x32, 180x180, 192x192, 512x512)
- ✅ manifest.json (PWA)
- ✅ .gitignore
- ✅ README.md
- ✅ Git initialisé
- ✅ Premier commit créé

## Prochaines Étapes

1. Créer le dépôt sur GitHub
2. Lier avec `git remote add origin`
3. Pousser avec `git push -u origin main`
4. Configurer GitHub Pages ou déployer sur Firebase Hosting

## Déploiement

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

**Note** : Assurez-vous de ne PAS pousser vos clés API Firebase. Elles sont déjà dans le code mais devraient être dans des variables d'environnement pour la production.
