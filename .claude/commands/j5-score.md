---
description: Plan ENSEA — étape 5.1
---
Avant de commencer : relis CLAUDE.md et docs/pole-educatif.md.
Commence par me présenter un PLAN détaillé (fichiers touchés, migrations SQL, risques) et attends ma validation avant de modifier quoi que ce soit.

Implémente le score de compétence (0–100) par élève et par compétence :
score = α × (moyenne auto-éval / 5 × 100) + (1−α) × (moyenne des notes liées à la compétence / 20 × 100)
- α et le seuil sont paramétrables par concours dans la table concours.options (valeurs : voir docs/pole-educatif.md ; à défaut α = 0,3 et seuil = 50) via un écran admin.
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

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
