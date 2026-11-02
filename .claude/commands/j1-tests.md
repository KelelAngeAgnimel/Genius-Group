---
description: Plan ENSEA — étape 1.2
---
Avant de commencer : relis CLAUDE.md.

Mets en place des tests backend avec vitest + supertest (Supabase mocké). Écris des tests pour : login (succès, échec, rate limit), compte bloqué refusé, chat sans token refusé, élève qui tente de supprimer un cours (403), prof qui modifie le cours d'un autre prof (403). Ajoute le script "npm test".

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
