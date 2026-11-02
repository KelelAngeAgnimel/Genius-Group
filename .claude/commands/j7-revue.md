---
description: Plan ENSEA — étape 7.2
---
Avant de commencer : relis CLAUDE.md.
Commence par me présenter un PLAN détaillé (fichiers touchés, migrations SQL, risques) et attends ma validation avant de modifier quoi que ce soit.

Fais une revue de sécurité complète de la branche refonte-ensea par rapport à main (git diff main), en particulier autorisations, uploads, et fuites de données entre concours. Liste les problèmes avant de corriger.

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
