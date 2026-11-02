---
description: Plan ENSEA — étape 6.1
---
Avant de commencer : relis CLAUDE.md.
Commence par me présenter un PLAN détaillé (fichiers touchés, migrations SQL, risques) et attends ma validation avant de modifier quoi que ce soit.

Fais une passe ergonomie sur tout le frontend :
- vérifie chaque page sur un écran de 375 px (mobile d'abord : la plupart des élèves sont sur téléphone) ;
- états de chargement, états vides et messages d'erreur clairs partout (composants communs Loader, EmptyState, Toast) ;
- confirmation avant toute suppression ;
- navigation : regroupe le menu par usage (Accueil, Mes cours, Mes évaluations, Mes progrès, Ressources, Aide) et masque ce qui ne concerne pas le concours de l'élève ;
- accessibilité : labels sur tous les champs, contrastes, focus visible ;
- découpage du bundle (React.lazy par page) pour accélérer le chargement sur réseau mobile.
Liste-moi d'abord les problèmes trouvés page par page avant de corriger.

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
