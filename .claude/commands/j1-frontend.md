---
description: Plan ENSEA — étape 1.3
---
Avant de commencer : relis CLAUDE.md.

Côté frontend : passe vite en version stable, supprime EspaceProfesseur_ancien.jsx s'il n'est importé nulle part, crée un client axios unique (src/api.js) qui ajoute le token et déconnecte automatiquement l'utilisateur sur une réponse 401. Remplace les appels axios dispersés par ce client.

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
