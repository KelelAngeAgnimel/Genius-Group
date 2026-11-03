---
description: Refonte élève 1/4 — un seul menu Évaluations avec une carte par concours
---
Lis d'abord .claude/commands/e0-commun.md et applique ses règles. Commence par un PLAN et attends ma validation.

Problème : le menu « Mes évaluations » contient « Évaluation » ET « Évaluations ENSEA », c'est confus.

Ce que je veux :
1. Dans la Navbar, le groupe « Mes évaluations » ne contient plus que « Évaluations » (et « Quiz » seulement si useConcours().peutVoirQuiz). Supprime l'entrée « Évaluations ENSEA » ; garde l'ancienne URL /outils/evaluations-ensea comme redirection vers la nouvelle pour ne casser aucun lien.
2. /outils/evaluations affiche une grille de cartes, une par concours auquel l'élève est inscrit (même style que les cartes concours de la Bibliothèque : logo/titre, couleur du concours, nombre d'évaluations à faire, badge « X à rendre » s'il y a une échéance proche).
3. Clic sur une carte → /outils/evaluations/:concours :
   - pour INP-HB, ESATIC, CME : la liste actuelle de pages/eval/Evaluations.jsx filtrée sur ce concours ;
   - pour ENSEA : le workflow sujet → copie scannée → correction (pages/eval/ensea/VueEleveEnsea.jsx), car ENSEA n'a pas de génération automatique.
   Le choix du composant se fait selon l'option du concours (generation_auto_tests), pas avec un if codé en dur sur 'ensea'.
4. Élève inscrit à un seul concours : redirection directe vers sa page, avec fil d'Ariane « Évaluations / ENSEA ».
5. Professeurs/admins : même grille avec tous les concours ; dans un concours ENSEA ils arrivent sur VueProfEnsea (gestion des copies).
6. Corrige labelConcours() dans Evaluations.jsx qui ignore ENSEA.
