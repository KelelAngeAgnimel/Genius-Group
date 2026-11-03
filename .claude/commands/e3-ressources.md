---
description: Refonte élève 3/4 — Ressources en grille de cartes avec navigation intuitive
---
Lis d'abord .claude/commands/e0-commun.md et applique ses règles. Commence par un PLAN et attends ma validation.

Situation actuelle : @docs/maquettes/ressources-actuel.png (pages/Ressources.jsx + menu Ressources avec INP-HB, ESATIC, CME, ENSEA).
Référence de design à suivre : @docs/maquettes/ref-design-cartes.png (vue « Course overview » d'une plateforme de cours) : grandes cartes avec une bannière illustrée en haut, titre coloré, sous-titre, menu « ⋮ », barre d'outils au-dessus (filtre, recherche, tri, affichage Cartes / Liste).

Ce que je veux :
1. Niveaux de navigation, chacun avec sa propre URL :
   /ressources → cartes des concours de l'élève
   /ressources/:concours → cartes des matières de ce concours
   /ressources/:concours/:matiere → documents de la matière (cartes ou liste), ouverture dans le lecteur PDF existant
   Garde la compatibilité avec les anciennes URL /ressources?ecole=ENSEA (redirection).
2. Style des cartes inspiré de la référence : bannière en haut (illustration SVG générée par nous ou dégradé + icône de la matière, pas d'images externes ni de logos dont on n'a pas les droits — garde les logos INP-HB/ESATIC déjà présents), titre dans la couleur du concours, sous-titre (« 4 matières », « 12 documents »), badge « Nouveau » sur les documents de moins de 7 jours.
3. Barre d'outils : recherche instantanée, tri (nom, plus récent), filtre par type (cours, fiche, annale, exercice corrigé), bascule Cartes / Liste mémorisée (localStorage avec try/catch).
4. Navigation intuitive : fil d'Ariane « Ressources / ENSEA / Mathématiques » cliquable, bouton Retour qui remonte d'un niveau, élève à un seul concours envoyé directement sur ses matières, état vide clair (« Aucun document pour l'instant — votre professeur n'a encore rien publié »).
5. Menu Ressources de la Navbar : pour un élève, n'afficher que « Tous mes documents » + ses concours.
6. Côté serveur, vérifie que GET /api/ressources ne renvoie déjà que les ressources de ses concours (sinon corrige).
