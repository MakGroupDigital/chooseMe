# Algorithme de Feed Type TikTok 🎯

## Vue d'ensemble

L'algorithme de recommandation de vidéos est conçu pour :
- ✅ Donner une chance aux nouveaux créateurs de devenir viraux
- ✅ Mélanger contenu populaire et nouvelles découvertes
- ✅ Éviter la monotonie (pas toujours les mêmes créateurs)
- ✅ Favoriser l'engagement (likes, commentaires, partages)
- ✅ Booster les vidéos récentes

## Critères de Scoring

### 1. Score d'Engagement (0-50 points)
Calcule la popularité d'une vidéo basée sur les interactions :
- **Likes** : poids 1
- **Commentaires** : poids 3 (plus précieux que les likes)
- **Partages** : poids 5 (encore plus précieux)

Formule : `log10(likes + comments*3 + shares*5 + 1) * 10`

Le logarithme évite que les vidéos très populaires écrasent complètement les nouvelles.

### 2. Score de Fraîcheur (0-30 points)
Boost pour les vidéos récentes :
- **< 24h** : +30 points (boost maximum)
- **< 3 jours** : +20 points
- **< 7 jours** : +10 points
- **> 7 jours** : 0 points

Cela donne une chance aux nouvelles vidéos d'être vues.

### 3. Score Viral (0-50 points)
Détecte les vidéos qui montent rapidement :
- Calcule le ratio `engagement / âge_en_heures`
- Une vidéo avec beaucoup d'engagement en peu de temps = virale
- Cap à 50 points maximum

### 4. Score de Diversité (-20 à +15 points)
Évite de montrer trop de vidéos du même créateur :
- **Utilisateur déjà vu récemment** : -20 points (pénalité)
- **Premier post du créateur** : +15 points (gros boost)
- **2-3 posts** : +10 points
- **4-5 posts** : +5 points
- **Plus de 5 posts** : 0 points

### 5. Boost Abonnements (+25 points)
Les vidéos des personnes que vous suivez ont un boost automatique.

### 6. Facteur Aléatoire (0-10 points)
Ajoute un peu de hasard pour la découverte de nouveaux contenus.

## Stratégie de Mélange

L'algorithme ne trie pas simplement par score. Il utilise une stratégie intelligente :

1. **70% des vidéos** : Triées par score (contenu de qualité)
2. **30% des vidéos** : Aléatoires (découverte)

Les vidéos aléatoires sont insérées tous les 5-7 posts pour maintenir la découverte.

## Exemple de Calcul

### Vidéo A (Nouveau créateur)
- Likes: 10, Comments: 2, Shares: 1
- Âge: 12 heures
- Premier post du créateur

**Calcul :**
- Engagement: log10(10 + 2*3 + 1*5 + 1) * 10 = 13.2 points
- Fraîcheur: 30 points (< 24h)
- Viral: (10 + 6 + 5) / 12 * 2 = 3.5 points
- Diversité: 15 points (premier post)
- Aléatoire: 5 points
- **TOTAL: 66.7 points**

### Vidéo B (Créateur populaire)
- Likes: 500, Comments: 50, Shares: 20
- Âge: 48 heures
- 10 posts déjà publiés

**Calcul :**
- Engagement: log10(500 + 50*3 + 20*5 + 1) * 10 = 28.1 points
- Fraîcheur: 20 points (< 3 jours)
- Viral: (500 + 150 + 100) / 48 * 2 = 31.3 points
- Diversité: 0 points (beaucoup de posts)
- Aléatoire: 7 points
- **TOTAL: 86.4 points**

La vidéo B a un meilleur score, mais la vidéo A a quand même une bonne chance d'être vue grâce aux 30% de vidéos aléatoires.

## Avantages de cet Algorithme

### Pour les Nouveaux Créateurs
- Boost de fraîcheur (+30 points pour < 24h)
- Boost de diversité (+15 points pour premier post)
- 30% de chance d'apparaître aléatoirement
- Détection virale si engagement rapide

### Pour les Créateurs Établis
- Score d'engagement élevé
- Boost si l'utilisateur les suit (+25 points)
- Maintien de la visibilité grâce à l'engagement

### Pour les Utilisateurs
- Contenu varié (pas toujours les mêmes)
- Découverte de nouveaux talents
- Contenu de qualité (70% trié par score)
- Personnalisation (boost des abonnements)

## Tracking et Amélioration

L'algorithme track :
- Les vidéos vues (pour ne pas les remontrer)
- Les créateurs récemment vus (pour la diversité)
- Les interactions (likes, commentaires, partages)

Ces données peuvent être utilisées pour améliorer les recommandations au fil du temps.

## Comparaison avec TikTok

| Critère | TikTok | Notre Algorithme |
|---------|--------|------------------|
| Engagement | ✅ | ✅ |
| Fraîcheur | ✅ | ✅ |
| Viralité | ✅ | ✅ |
| Diversité | ✅ | ✅ |
| Machine Learning | ✅ | ❌ (pour l'instant) |
| Personnalisation | ✅ | ✅ (basique) |

## Évolutions Futures

1. **Machine Learning** : Apprendre des préférences utilisateur
2. **Catégories** : Boost selon les sports préférés
3. **Temps de visionnage** : Tracker combien de temps l'utilisateur regarde
4. **Interactions négatives** : Permettre de cacher des vidéos
5. **A/B Testing** : Tester différentes stratégies de mélange

## Code Source

- **Algorithme** : `services/feedAlgorithm.ts`
- **Service Feed** : `services/feedService.ts`
- **Page Feed** : `features/home/HomeChoosePage.tsx`
