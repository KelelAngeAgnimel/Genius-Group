---
description: Plan ENSEA — étape 2.1
---
Avant de commencer : relis CLAUDE.md et docs/pole-educatif.md.
Commence par me présenter un PLAN détaillé (fichiers touchés, migrations SQL, risques) et attends ma validation avant de modifier quoi que ce soit.

Les concours sont aujourd'hui codés dans les noms de rôles (etudiant_inphb_cme, etudiant_both, etudiant_all…) avec une logique dupliquée dans meetings.js, ressources.js, messages.js, quiz.js, planning.js et AuthContext.jsx. Propose une migration vers :
- une table concours (code, nom, actif, options jsonb) avec inphb, esatic, cme, ensea ;
- une table inscriptions (user_id, concours_code, unique) ;
- users.role réduit à etudiant / professeur / admin ;
- un script SQL de migration qui convertit chaque ancien rôle en inscriptions (etudiant_all → inphb+esatic+cme, etc.) SANS perte, réversible ;
- un module backend unique lib/concours.js (concoursDeLUtilisateur, peutAcceder) utilisé partout ;
- le JWT et /api/users/me renvoient la liste des concours ;
- côté frontend, un hook useConcours() qui remplace les helpers isEtudiantInphb… ;
- l'admin choisit les concours par cases à cocher à la création d'un élève.
Les professeurs peuvent aussi être rattachés à des concours (un prof ENSEA ne voit que les élèves ENSEA). Fais d'abord le fichier SQL dans supabase/migrations/.

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
