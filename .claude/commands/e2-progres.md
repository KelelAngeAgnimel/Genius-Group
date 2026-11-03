---
description: Refonte élève 2/4 — Mes progrès (notes, suivi, diagramme de compétences) filtrés par concours
---
Lis d'abord .claude/commands/e0-commun.md et applique ses règles. Commence par un PLAN et attends ma validation.

1. Notes (/outils/notes) : un élève ne voit QUE les notes des concours auxquels il est inscrit. Filtrage côté serveur dans GET /api/notes/mes-notes (via lib/concours.js), puis côté interface : onglets ou cartes par concours (pas d'onglet si un seul concours), moyenne par matière et générale par concours. Teste le cas d'un élève qui a changé de concours : ses anciennes notes d'un concours quitté ne s'affichent plus.
2. Suivi de progression (/planning/suivi-progression) : même logique, courbes et statistiques séparées par concours, uniquement ses concours.
3. Mes compétences : l'élève doit voir le MÊME diagramme que celui de l'espace professeur « Gestion & suivi des étudiants » (voir l'image @docs/maquettes/radar-competences-prof.png et le code de pages/professeur/EspaceProfesseur.jsx) : carte sombre avec son nom, son matricule, sa moyenne générale /20 et son niveau (badge), le radar par matière, et les barres de progression par matière avec la note /20 colorée (vert / or / rose selon le niveau).
   - Extrais ce bloc en un composant réutilisable (ex. components/CarteProfilCompetences.jsx) utilisé à la fois par l'espace prof et par l'élève, pour qu'ils restent identiques.
   - Côté élève : un sélecteur de concours au-dessus si plusieurs concours ; données de SES notes uniquement (endpoint élève, jamais /api/users/all ni /api/notes/etudiant/:id).
   - Pour ENSEA, ajoute sous ce bloc le radar des compétences détaillées existant (MesCompetences.jsx : score de compétence, exercices de renforcement).
   - Corrige au passage les libellés tronqués « Culture . » du radar et le doublon « Culture Littéraire » visible sur l'image (regrouper par matière normalisée).
4. Regroupe dans le menu « Mes progrès » : Notes, Suivi de progression, Mes compétences (élève) ; « Élèves en difficulté » seulement pour prof/admin.
