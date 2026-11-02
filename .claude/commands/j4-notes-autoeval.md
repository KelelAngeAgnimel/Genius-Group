---
description: Plan ENSEA — étape 4.1
---
Avant de commencer : relis CLAUDE.md et docs/pole-educatif.md.
Commence par me présenter un PLAN détaillé (fichiers touchés, migrations SQL, risques) et attends ma validation avant de modifier quoi que ce soit.

1) Référentiel de compétences (ENSEA : Français — résumé, dissertation — et Mathématiques ; liste détaillée dans docs/pole-educatif.md) : table competences (id, concours_code, matiere, code, libelle, ordre) + écran admin d'import CSV (le pôle éducatif fournit la liste) et d'édition.
2) Séances : relie chaque cours (meetings/planning) à une liste de compétences abordées et à une date de fin.
3) Auto-évaluation : table auto_evaluations (seance_id, etudiant_id, competence_id, niveau 0..5, commentaire, cree_le), unique par (seance, élève, compétence). Après la fin d'une séance, l'élève voit une fenêtre [bloquante ou rappel : voir docs/pole-educatif.md] listant les compétences avec un curseur 0–5 en étoiles. Endpoint GET /api/auto-eval/en-attente.
4) Dashboard des notes :
   - Prof : grille élèves × évaluations avec saisie rapide au clavier (Tab/Entrée), moyennes par matière, export CSV, filtre par concours/matière/période.
   - Élève : courbe d'évolution par matière, moyenne, rang optionnel (désactivé par défaut), dernières corrections.
   - Admin : vue globale par concours, taux de remplissage des auto-évaluations.
Graphiques avec recharts. Rester cohérent avec le style Tailwind existant.

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
