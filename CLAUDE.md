# CLAUDE.md — Genius Group (plateforme Méthode Genius)

Ce fichier est lu automatiquement par Claude Code à chaque session. À placer à la racine du dépôt.

## Le projet
Plateforme de préparation aux concours (Côte d'Ivoire) : INP-HB, ESATIC, CME et, à partir de cette année, **ENSEA** (2 matières : Français — résumé et dissertation — et Mathématiques ; pas de génération automatique de tests).
Les règles fournies par le pôle éducatif sont dans `docs/pole-educatif.md` : **les lire avant toute tâche ENSEA** et ne jamais inventer une valeur absente (demander).
Liens Teams : saisis à la main par les profs (pas d'intégration Microsoft Graph pour l'instant).
Utilisateurs : élèves (en ligne / présentiel), professeurs, administrateurs. Langue de l'interface : **français**.

## Stack
- `frontend/` : React 19 + Vite + Tailwind 3 + react-router 7 + axios. Déployé sur **Vercel**. URL API via `VITE_API_URL` (`src/config.js`).
- `backend/` : Node + Express 5 (ES modules), déployé sur **Render**. Base de données et stockage : **Supabase** (Postgres + Storage). Auth maison : bcrypt + JWT.
- IA : Groq (`llama-3.3-70b-versatile`) pour le chatbot et la génération de quiz.

## Commandes
- Backend : `cd backend && npm install && npm run dev` (port 3001)
- Frontend : `cd frontend && npm install && npm run dev` (port 5173)
- Lint frontend : `cd frontend && npm run lint`
- Build frontend : `cd frontend && npm run build`
- Tests backend : `cd backend && npm test` (à créer — voir docs/PLAN-ENSEA.md)
- Commandes du plan : `/j1-securite`, `/j1-tests`, `/j1-frontend`, `/j2-concours`, `/j2-appliquer`, `/j2-ensea`, `/j3-evaluations`, `/j3-tests`, `/j4-notes-autoeval`, `/j5-score`, `/j6-ergonomie`, `/j7-guides`, `/j7-revue`

## Règles de travail (à respecter)
1. **Toujours proposer un plan avant de modifier plus de 2 fichiers**, et attendre validation.
2. **Une fonctionnalité = une branche git = des commits petits et clairs** (messages en français, préfixes `feat:`, `fix:`, `sec:`, `refactor:`, `docs:`).
3. **Base de données** : ne jamais modifier le schéma « à la main ». Chaque changement = un fichier SQL dans `supabase/migrations/AAAAMMJJ_description.sql`, idempotent (`if not exists`), que je lance moi-même dans l'éditeur SQL de Supabase.
4. **Secrets** : jamais de clé, mot de passe ou URL privée dans le code. Tout passe par `.env` (non commité) et `backend/.env.example` (commité, valeurs vides).
5. **Un seul client Supabase** (`backend/supabase.js`) et **un seul middleware d'auth** (`backend/middleware/`). Ne pas en recréer dans les routes.
6. **Chaque route** : authentification + contrôle de rôle + validation des entrées + vérification que l'utilisateur a le droit sur *cette* ressource (pas seulement sur le type de ressource). Ne jamais renvoyer `err.message` brut au client.
7. Ne pas casser INP-HB / ESATIC / CME : toute modification des rôles ou des concours doit rester rétro-compatible avec les comptes existants.
8. Après chaque tâche : lancer lint + build + tests, puis me résumer ce qui a changé et ce que je dois tester à la main.

## Points d'attention connus
- Les rôles combinés (`etudiant_inphb_cme`, `etudiant_both`, `etudiant_all`…) sont en cours de remplacement par un modèle `role` + liste de concours (table `inscriptions`). Utiliser le helper central de concours, ne pas ajouter de nouveaux rôles combinés.
- `EspaceProfesseur_ancien.jsx` est du code mort.
- Le schéma Supabase n'est pas versionné dans le dépôt : demander avant de supposer une colonne.
