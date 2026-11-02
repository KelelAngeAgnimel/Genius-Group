# Plan de travail — Refonte Genius Group + lancement ENSEA
*Version du 2 novembre 2026 — 7 jours, du mardi 3 au lundi 9 novembre*

> ⚠️ **Les dates de la feuille de route (fonctionnalités prêtes le 23 octobre, lancement le 1er novembre) sont déjà passées.** Ce plan vise une version finale le **lundi 9 novembre**. Si les élèves ENSEA ont déjà commencé, le jour 2 (inscription ENSEA) doit être mis en ligne en priorité, même avant le reste.

---

## 0. Ce que j'ai trouvé dans le code (audit rapide)

### Failles de sécurité — à corriger en premier
| # | Problème | Où | Gravité |
|---|---|---|---|
| 1 | `/api/chat` **sans authentification** : n'importe qui sur Internet peut consommer ta clé Groq. L'historique est gardé en mémoire sans limite → le serveur peut saturer. | `routes/chat.js` | 🔴 Critique |
| 2 | **Aucune limite de tentatives** sur `/api/auth/login` → mots de passe attaquables par force brute. Les messages d'erreur différents (« identifiant incorrect » / « mot de passe incorrect ») révèlent quels matricules existent. | `routes/auth.js` | 🔴 Critique |
| 3 | **Un compte bloqué reste connecté** jusqu'à 24 h : le JWT n'est jamais revérifié (bloqué, rôle modifié, compte supprimé). | `middleware/authMiddleware.js` | 🟠 Élevée |
| 4 | **Messagerie ouverte** : un élève peut envoyer un message à n'importe quel `id`, sans validation ni limite (spam, usurpation de ton). | `routes/messages.js` | 🟠 Élevée |
| 5 | Un professeur peut **modifier/supprimer les cours de n'importe qui** et voir la liste complète des comptes (admins compris). | `meetings.js`, `users.js` | 🟠 Élevée |
| 6 | `err.message` et erreurs Supabase renvoyées au client (fuite d'infos internes). | presque toutes les routes | 🟡 Moyenne |
| 7 | Token stocké dans `localStorage` (volable en cas de faille XSS). Pas d'en-têtes de sécurité (`helmet`), pas de limite de taille sur `express.json`. | `AuthContext.jsx`, `server.js` | 🟡 Moyenne |
| 8 | Notes : pas de contrôle de type (`"abc"` passe), un prof peut noter n'importe quel élève de n'importe quel concours. | `routes/notes.js` | 🟡 Moyenne |
| 9 | Vérifier que la `SUPABASE_KEY` utilisée est bien la **service_role** côté backend uniquement, et qu'elle n'a jamais été commitée dans l'historique git. | config | à vérifier |

### Défauts de conception qui bloquent l'ajout d'ENSEA
- **Les concours sont codés dans les noms de rôles** (`etudiant_inphb_cme`, `etudiant_esatic_cme`, `etudiant_both`, `etudiant_all`…) et la logique est **copiée différemment dans 4 fichiers** (`meetings.js`, `ressources.js`, `messages.js`, `AuthContext.jsx`). Ajouter ENSEA de la même façon doublerait le nombre de rôles. → On passe à : `role ∈ {etudiant, professeur, admin}` + une table `inscriptions(user_id, concours)`.
- `AuthContext.isEtudiant()` ne reconnaît pas les rôles CME / `all` → certains élèves sont mal traités côté interface.
- Deux `verifyToken` différents (`routes/auth.js` renvoie 403, `middleware/` renvoie 401) et **un client Supabase recréé dans chaque route**.
- Pas de tests, pas de schéma de base versionné, `vite` en version **bêta** en production, code mort (`EspaceProfesseur_ancien.jsx`).

### Teams
**Décision du 2 novembre :** on garde la méthode actuelle (lien Teams collé à la main par le prof dans « Cours à distance »). La génération automatique sera traitée plus tard.

---

## 1. Informations du pôle éducatif
ENSEA = **2 matières** : **Français** (compétences de *résumé* et de *dissertation*) et **Mathématiques**. Les réponses détaillées vont dans `docs/pole-educatif.md` (à compléter), que Claude Code lit avant chaque tâche ENSEA.

Points à couvrir dans ce fichier :
1. **Liste des matières et des compétences ENSEA** (par matière), avec un identifiant court pour chacune.
2. **Seuil** du score de compétence (ex. 50/100 ?) et **pondération** auto-évaluation / notes réelles (proposition par défaut : 30 % auto-éval, 70 % notes).
3. Une note saisie par un prof porte-t-elle sur **une ou plusieurs compétences** ? (Sinon le score ne peut utiliser les notes que par matière.)
4. Formulaire post-séance « obligatoire » : **bloquant** (l'élève ne peut plus rien faire tant qu'il n'a pas répondu) ou simple rappel insistant ? Délai ?
5. Exercices de renforcement : **envoi automatique** dès que le seuil est franchi, ou **suggestion** validée par un prof ? Qui fournit la banque d'exercices par compétence ?
6. Copies scannées : formats acceptés (PDF seul ou aussi photos JPG/PNG ?), taille max, plusieurs pages, **date limite de dépôt** et dépôt en retard autorisé ?
7. Correction : le prof rend-il seulement une note + commentaire, ou aussi une **copie annotée** (PDF) ?
9. ENSEA concerne-t-il aussi les élèves en **présentiel** ? Un élève peut-il préparer ENSEA **et** INP-HB ?

---

## 2. Préparation (aujourd'hui, ~30 min)

### Installer Claude Code (Linux / WSL)
```bash
# 1. Installer Claude Code (installateur officiel, pas besoin de Node)
curl -fsSL https://claude.ai/install.sh | bash

# 2. Recharger le terminal puis vérifier
source ~/.bashrc
claude --version

# (Alternative si tu préfères npm — nécessite Node 18+)
# npm install -g @anthropic-ai/claude-code
```
Pour le projet lui-même il faut aussi Node.js (≥ 20 conseillé) et git :
```bash
node -v && npm -v && git --version
# Si Node manque :  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
```

### Récupérer et ouvrir le projet
```bash
cd ~                                   # ou ton dossier de travail
git clone https://github.com/KelelAngeAgnimel/Genius-Group.git
cd Genius-Group

# Copier les deux fichiers fournis à la racine
cp ~/Téléchargements/CLAUDE.md .
mkdir -p docs && cp ~/Téléchargements/PLAN-ENSEA.md docs/

# Installer les dépendances
(cd backend && npm install) && (cd frontend && npm install)

# Créer une branche de travail (on ne touche jamais main directement)
git checkout -b refonte-ensea
git add CLAUDE.md docs/ && git commit -m "docs: CLAUDE.md et plan de refonte ENSEA"

# Lancer Claude Code dans le dossier du projet
claude
```
Au premier lancement, Claude Code te demande de te connecter à ton compte Claude (un lien s'ouvre dans le navigateur).

### Créer un projet Supabase de TEST
Ne travaille **pas** sur la base de production pendant la semaine : Supabase → *New project* « genius-test », puis copie le schéma de prod (Supabase → *Database → Backups* ou `pg_dump --schema-only`). Mets ses clés dans `backend/.env`.

### Commandes utiles dans Claude Code
| Commande | Usage |
|---|---|
| `Shift + Tab` | Basculer en **mode plan** : Claude analyse et propose sans rien modifier. **Utilise-le au début de chaque tâche.** |
| `/clear` | Repartir d'un contexte vide (à faire entre deux tâches différentes) |
| `/compact` | Résumer la conversation quand elle devient longue |
| `/cost` ou `/status` | Voir la consommation |
| `Échap` | Interrompre Claude s'il part dans la mauvaise direction |
| `Échap Échap` | Revenir à un message précédent |
| `@chemin/fichier` | Pointer un fichier précis dans ta demande |
| `!commande` | Lancer une commande shell sans quitter Claude Code |
| `claude --continue` | Reprendre la dernière session le lendemain |

**Routine pour chaque tâche :** mode plan → lire et corriger le plan → valider → Claude code → tu testes à la main → `git commit` → `/clear`.

---

## 3. Planning jour par jour

Chaque bloc ci-dessous contient le **prompt à copier-coller dans Claude Code**. Fais-les dans l'ordre ; ne passe pas au jour suivant si les tests du jour ne passent pas.

### Jour 1 — Mardi 3 : Sécurité et socle technique
**Objectif :** fermer les failles 1 à 8, poser des tests.

Prompt 1.1 (mode plan) :
```
Lis docs/PLAN-ENSEA.md section 0 et CLAUDE.md. Propose un plan pour corriger les failles de sécurité 1 à 8 du backend :
- un seul client Supabase (supabase.js) et un seul middleware auth dans middleware/ (supprimer le verifyToken de routes/auth.js et mettre à jour les imports) ;
- le middleware recharge l'utilisateur depuis la base à chaque requête (ou cache 60 s) et refuse les comptes bloqués/supprimés ; ajoute un middleware requireRole(...roles) ;
- helmet, express.json({ limit: '1mb' }), express-rate-limit (login : 5 essais / 15 min par IP + matricule ; chat et IA : 20 / min par utilisateur) ;
- message d'erreur de login unique « Identifiants incorrects » ;
- /api/chat protégé par auth, historique limité à 20 messages par utilisateur, clé = id utilisateur (plus de sessionId client) ;
- validation des entrées avec zod sur toutes les routes POST/PATCH ;
- gestionnaire d'erreurs central qui logue côté serveur et renvoie un message générique ;
- messagerie : un élève ne peut écrire qu'aux professeurs/admins ; longueur max sujet/contenu ;
- meetings : un professeur ne modifie/supprime que ses propres cours (created_by), l'admin tout ;
- users/all : un professeur ne voit que les élèves, sans les admins ;
- notes : note numérique entre 0 et 20, etudiant_id doit exister et être un élève.
Crée backend/.env.example. Ne modifie rien avant ma validation.
```
Prompt 1.2 :
```
Mets en place des tests backend avec vitest + supertest (Supabase mocké). Écris des tests pour : login (succès, échec, rate limit), compte bloqué refusé, chat sans token refusé, élève qui tente de supprimer un cours (403), prof qui modifie le cours d'un autre prof (403). Ajoute le script "npm test".
```
Prompt 1.3 :
```
Côté frontend : passe vite en version stable, supprime EspaceProfesseur_ancien.jsx s'il n'est importé nulle part, crée un client axios unique (src/api.js) qui ajoute le token et déconnecte automatiquement l'utilisateur sur une réponse 401. Remplace les appels axios dispersés par ce client.
```
**Tests à la main :** connexion OK, 6 mauvais mots de passe → blocage temporaire, bloquer un élève depuis l'admin → il est déconnecté à l'action suivante.
**À faire en parallèle :** envoyer les questions du §1.

### Jour 2 — Mercredi 4 : Modèle de concours générique + ENSEA
**Objectif :** ENSEA devient un concours comme les autres, sans nouveaux rôles combinés.

Prompt 2.1 (mode plan) :
```
Les concours sont aujourd'hui codés dans les noms de rôles (etudiant_inphb_cme, etudiant_both, etudiant_all…) avec une logique dupliquée dans meetings.js, ressources.js, messages.js, quiz.js, planning.js et AuthContext.jsx. Propose une migration vers :
- une table concours (code, nom, actif, options jsonb) avec inphb, esatic, cme, ensea ;
- une table inscriptions (user_id, concours_code, unique) ;
- users.role réduit à etudiant / professeur / admin ;
- un script SQL de migration qui convertit chaque ancien rôle en inscriptions (etudiant_all → inphb+esatic+cme, etc.) SANS perte, réversible ;
- un module backend unique lib/concours.js (concoursDeLUtilisateur, peutAcceder) utilisé partout ;
- le JWT et /api/users/me renvoient la liste des concours ;
- côté frontend, un hook useConcours() qui remplace les helpers isEtudiantInphb… ;
- l'admin choisit les concours par cases à cocher à la création d'un élève.
Les professeurs peuvent aussi être rattachés à des concours (un prof ENSEA ne voit que les élèves ENSEA). Fais d'abord le fichier SQL dans supabase/migrations/.
```
Prompt 2.2 : `Applique le plan validé. Mets à jour les tests. Ajoute un test qui vérifie qu'un élève ENSEA ne voit pas une ressource INP-HB et inversement.`

Prompt 2.3 :
```
Ajoute un champ options sur le concours : pour ENSEA, generation_auto_tests = false. Masque pour les élèves ENSEA les pages de génération automatique de quiz (GeniusEval) et affiche à la place l'entrée « Évaluations ENSEA » (créée demain). Ajoute ENSEA dans Ecoles.jsx, Navbar et les filtres admin.
```
**Tests :** lancer la migration sur la base de **test**, vérifier qu'un ancien élève `etudiant_all` voit toujours tout, créer un élève ENSEA.

### Jour 3 — Jeudi 5 : Évaluations papier (sujet → copie scannée → correction)
Prompt 3.1 (mode plan) :
```
Conçois le workflow d'évaluation ENSEA :
- Table evaluations (id, concours_code, matiere, titre, consignes, sujet_storage_path, date_ouverture, date_limite, retard_autorise, competences text[], created_by).
- Table copies (id, evaluation_id, etudiant_id, fichiers jsonb, deposee_le, en_retard, statut [deposee|en_correction|corrigee], note numeric, commentaire, corrige_storage_path, corrige_par, corrige_le). Unique (evaluation_id, etudiant_id), redépôt possible tant que non corrigée.
- Buckets Supabase PRIVÉS : sujets et copies. Accès uniquement via le backend et URL signées de courte durée (5 min).
- Upload élève : PDF, JPG, PNG, jusqu'à 10 fichiers et 20 Mo au total ; vérifier le vrai type du fichier (magic bytes, pas seulement le mimetype) ; fusionner les images en un PDF unique côté serveur (pdf-lib).
- Prof : liste des copies par évaluation avec filtres (non corrigées, en retard), visionneuse, saisie note /20 + commentaire + dépôt optionnel d'un corrigé annoté. La note corrigée alimente automatiquement la table notes.
- Élève : page « Mes évaluations » : à faire / déposées / corrigées, téléchargement du sujet, compte à rebours, consultation note + commentaire.
- Sur mobile, l'élève doit pouvoir prendre ses pages en photo directement (input capture).
Migration SQL d'abord, puis backend, puis frontend.
```
Prompt 3.2 : `Écris les tests : élève qui télécharge la copie d'un autre (403), dépôt après date limite, fichier .exe renommé en .pdf refusé, prof d'un autre concours refusé.`

### Jour 4 — Vendredi 6 : Dashboard des notes + auto-évaluation post-séance
Prompt 4.1 (mode plan) :
```
1) Référentiel de compétences : table competences (id, concours_code, matiere, code, libelle, ordre) + écran admin d'import CSV (le pôle éducatif fournit la liste) et d'édition.
2) Séances : relie chaque cours (meetings/planning) à une liste de compétences abordées et à une date de fin.
3) Auto-évaluation : table auto_evaluations (seance_id, etudiant_id, competence_id, niveau 0..5, commentaire, cree_le), unique par (seance, élève, compétence). Après la fin d'une séance, l'élève voit une fenêtre [BLOQUANTE ou RAPPEL selon réponse du pôle] listant les compétences avec un curseur 0–5 en étoiles. Endpoint GET /api/auto-eval/en-attente.
4) Dashboard des notes :
   - Prof : grille élèves × évaluations avec saisie rapide au clavier (Tab/Entrée), moyennes par matière, export CSV, filtre par concours/matière/période.
   - Élève : courbe d'évolution par matière, moyenne, rang optionnel (désactivé par défaut), dernières corrections.
   - Admin : vue globale par concours, taux de remplissage des auto-évaluations.
Graphiques avec recharts. Rester cohérent avec le style Tailwind existant.
```

### Jour 5 — Samedi 7 : Score de compétence et renforcement ciblé
Prompt 5.1 (mode plan) :
```
Implémente le score de compétence (0–100) par élève et par compétence :
score = α × (moyenne auto-éval / 5 × 100) + (1−α) × (moyenne des notes liées à la compétence / 20 × 100)
- α et le seuil sont paramétrables par concours dans la table concours.options (valeurs par défaut α = 0,3, seuil = 50) via un écran admin.
- Si l'élève n'a pas encore de note sur la compétence, on n'utilise que l'auto-éval mais le score est marqué « provisoire ».
- On pondère davantage les données récentes (les 5 dernières mesures).
- Vue SQL ou fonction Postgres pour le calcul, recalcul à chaque nouvelle note ou auto-éval.
Renforcement :
- Table exercices_renforcement (competence_id, titre, fichier, niveau) gérée par les profs.
- Quand un score passe sous le seuil : mode AUTO (envoi immédiat d'un exercice non encore reçu + notification) ou mode MANUEL (alerte dans l'espace prof, envoi en un clic). Mode choisi par concours.
- Réutiliser la table exercices existante pour l'envoi et le suivi (fait / pas fait).
- Pas de doublon d'envoi pour la même compétence dans les 7 derniers jours.
- Espace prof : liste « Élèves en difficulté » triée par score, avec historique.
- Espace élève : radar de ses compétences + exercices recommandés.
Écris des tests unitaires du calcul de score (cas limites : aucune donnée, que des 0, que des 5).
```

### Jour 6 — Dimanche 8 : Ergonomie
Les liens Teams restent saisis à la main (aucun changement).

Prompt 6.1 (ergonomie) :
```
Fais une passe ergonomie sur tout le frontend :
- vérifie chaque page sur un écran de 375 px (mobile d'abord : la plupart des élèves sont sur téléphone) ;
- états de chargement, états vides et messages d'erreur clairs partout (composants communs Loader, EmptyState, Toast) ;
- confirmation avant toute suppression ;
- navigation : regroupe le menu par usage (Accueil, Mes cours, Mes évaluations, Mes progrès, Ressources, Aide) et masque ce qui ne concerne pas le concours de l'élève ;
- accessibilité : labels sur tous les champs, contrastes, focus visible ;
- découpage du bundle (React.lazy par page) pour accélérer le chargement sur réseau mobile.
Liste-moi d'abord les problèmes trouvés page par page avant de corriger.
```

### Jour 7 — Lundi 9 : Recette, guides, mise en production
Prompt 7.1 :
```
Rédige deux guides utilisateurs en français simple, avec étapes numérotées et emplacements des captures d'écran indiqués [CAPTURE: …] :
- docs/guide-eleve.md : connexion, trouver ses cours et rejoindre le cours Teams, télécharger un sujet, photographier/scanner et déposer sa copie, consulter sa note, remplir l'auto-évaluation, comprendre ses scores de compétence, faire les exercices de renforcement, FAQ.
- docs/guide-professeur.md : créer une séance et coller le lien Teams, publier une évaluation, corriger les copies, saisir des notes, consulter les élèves en difficulté, envoyer un exercice, FAQ.
Maximum 2 pages chacun. Ajoute aussi une page « Guide » dans l'application qui affiche le bon guide selon le rôle.
```
Prompt 7.2 : `Fais une revue de sécurité complète de la branche refonte-ensea par rapport à main (git diff main), en particulier autorisations, uploads, et fuites de données entre concours. Liste les problèmes avant de corriger.`

**Mise en production (dans cet ordre) :**
1. Sauvegarde de la base de prod (Supabase → Database → Backups).
2. Lancer les migrations SQL sur la prod, vérifier un compte de chaque ancien rôle.
3. Ajouter les nouvelles variables d'env sur Render et Vercel.
4. `git checkout main && git merge refonte-ensea && git push` → Render et Vercel redéploient.
5. Test de bout en bout avec un compte élève ENSEA et un compte prof réels.
6. Envoyer les guides (exportés en PDF) aux profs et élèves.

---

## 4. Conseils pour bien travailler avec Claude Code
- **Toujours commencer en mode plan** (`Shift+Tab`) et relire le plan : c'est là que tu évites 90 % des erreurs.
- **Une tâche par session**, puis `/clear`. Une conversation trop longue = moins de précision.
- **Commite après chaque étape qui marche** (`!git add -A && git commit -m "..."`) : si Claude casse quelque chose, `git checkout .` te ramène en arrière.
- Si Claude se trompe deux fois sur la même chose, arrête, `/clear`, et reformule plus précisément en pointant les fichiers avec `@`.
- Ne lui donne **jamais** tes vraies clés de prod dans le chat ; elles restent dans `.env`.
- Quand tu découvres une règle importante (« les notes sont toujours sur 20 »), ajoute-la dans `CLAUDE.md` : elle sera respectée dans toutes les sessions suivantes.
