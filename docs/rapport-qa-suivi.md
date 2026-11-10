# Suivi du rapport QA du 02/11/2026 (K2/\Labs)

Branche `fix/qa` — 1 commit par point. Backend : `npm test` = **160 tests verts**. Frontend : `npm run build` OK ; `npm run lint` = 13 problèmes, **identiques à `main`** (aucun ajouté ; ils sont dans `GeniusEval.jsx`, `Meetings.jsx`, `EspaceProfesseur.jsx`, `TableauDeBord.jsx`).
Le frontend n'a pas de framework de test : les points front sont vérifiés à la main (colonne « à vérifier »).

| # | Point | Corrigé | Test auto ajouté | À vérifier en prod |
|---|---|---|---|---|
| 1 | `/api/chat` et `/api/evaluations` en 404 | **Aucun code à changer** : les deux routes existent sur la branche (`backend/app.js:48,54`) et le front appelle des routes existantes. Le 404 vient très probablement d'un **déploiement Render en retard** (non confirmé : je n'ai pas accès à la prod). | `securite.test.js` : 5 routes → 401 sans jeton, jamais 404 | **Redéployer Render depuis `main`**, puis ouvrir « Assistant IA » (réponse affichée) |
| 2 | URL inconnue = page blanche | Oui — `pages/NotFound.jsx` + `<Route path="*">` | Non (front) | Ouvrir `/nimporte-quoi` : message + bouton retour |
| 3 | Table des utilisateurs sans pagination | Oui — 20 par page (côté client), Précédent/Suivant, retour page 1 au changement de filtre ; boutons d'une ligne bloqués pendant l'appel ; texte de chargement | Non (front) | Scroller puis enchaîner 10 clics |
| 4 | « Chargement… » ~10 s | Oui — `/health` appelé dès la page de connexion, bandeau « Le serveur démarre… » après 2,5 s, message si le serveur ne répond pas ; texte explicite sur la vue globale | Non (front) | Recharger 3 fois. **Limite** : Render gratuit reste lent au tout premier réveil ; seul un ping régulier externe (ex. UptimeRobot sur `/health`) l'évite |
| 5 | Formulaire incomplet silencieux | Oui — erreur sous chaque champ, bordure rouge, focus sur le premier champ fautif (connexion + création de compte) | Non (front) | Valider à vide sur les deux formulaires |
| 6 | Deux identifiants par compte | Oui — un seul numéro affiché (matricule) à la création et dans la liste ; la recherche accepte le matricule. Côté code, `username = matricule` pour un élève depuis la création actuelle : l'écart du rapport (26GEN0130 / 26GEN0114) vient d'un ancien code ou de données anciennes. | `utilisateurs.test.js` : matricule = identifiant = valeur de la liste | Créer un élève : numéro affiché = liste = connexion. **Vérifier les comptes existants** dont `username ≠ matricule` |
| 7 | Suppression sans nom | Oui — « Supprimer Prénom Nom (matricule) ? » | Non (front) | Cliquer Supprimer |
| 8 | Prénom/Nom facultatifs | Oui — `*` + contrôle dans le formulaire ; API : 400 si absents à la création (la **modification** reste souple pour les comptes existants) | `utilisateurs.test.js` : 4 cas refusés, 1 accepté | Créer sans nom. Les 2 comptes admin « David — » en base restent à compléter à la main |
| 9 | Cartes admin inaccessibles au clavier | Oui — `<Link>` (cartes admin et professeur), focus visible ; accents corrigés | Non (front) | Tab puis Entrée sur « Gérer les comptes » |
| 10 | Erreurs API en franglais | Oui — `validate.js` : « Données invalides : Matricule, Mot de passe » ; clés techniques inchangées dans `champs` | `auth.test.js` | Soumettre la connexion vide (le formulaire bloque désormais avant l'API : tester l'API avec `curl -X POST …/api/auth/login -d '{}'`) |
| 11 | `' OR 1=1 --` → 500 | Oui — l'identifiant de connexion n'accepte que lettres, chiffres, espace et `. _ @ + -` (sinon 400). Même règle à la création de compte. Je n'ai **pas pu reproduire** le 500 (la base est simulée en test) : la cause exacte n'est pas confirmée, le 400 en amont l'évite. | `auth.test.js` : 5 charges → 400 ; 5 identifiants usuels → 401 (pas refusés) | Rejouer la charge : 400. **Vérifier qu'aucun identifiant existant** n'a un caractère hors liste (sinon ce compte ne pourrait plus se connecter) |
| 12 | Contrôle d'accès par rôle | Rien à corriger : `/api/users/all` est déjà réservé admin/professeur | `utilisateurs.test.js` : élève → **403**, sans jeton → 401, admin → 200 ; élève ne peut ni créer ni supprimer → 403 | Refaire le test sur la prod avec un vrai compte élève |

## À tester à la main avant de fusionner
1. `cd backend && npm run dev` et `cd frontend && npm run dev`, puis : `/nimporte-quoi` (2), liste admin avec 20+ comptes (3), connexion et création à vide (5), création d'un élève puis connexion avec le numéro affiché (6, 8), suppression (7), Tab sur le tableau de bord admin (9).
2. Après déploiement : redéployer Render (1), puis rejouer chaque ligne « TEST » du rapport sur la prod.
3. Base de données : repérer les comptes dont `username ≠ matricule` et les identifiants avec caractères spéciaux (points 6 et 11). Aucune migration SQL n'a été nécessaire.
