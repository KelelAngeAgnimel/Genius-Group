---
description: Correctifs du rapport QA du 02/11/2026 (12 points)
---
Relis CLAUDE.md puis le rapport @docs/rapport-qa-2026-11-02.txt. Commence par un PLAN qui reprend les 12 points dans l'ordre conseillé (1, 2, 3, 5, 6, puis le reste) et attends ma validation.

Pour chaque point : corrige, ajoute un test automatisé quand c'est possible (backend : vitest + supertest ; point 12 : un élève qui appelle /api/users/all reçoit 403), et rejoue la ligne « TEST » du rapport. Point 1 : vérifie d'abord si /api/chat et /api/evaluations existent sur la branche actuelle (le rapport a testé la prod) ; si le front appelle une route qui n'existe pas, corrige le front ou ajoute la route. Point 4 : écran de chargement explicite + appel /health au chargement de la page de connexion pour réveiller Render. Point 6 : un seul identifiant (le matricule) affiché partout.

À la fin, produis docs/rapport-qa-suivi.md : tableau point par point (corrigé / test ajouté / à vérifier en prod).
