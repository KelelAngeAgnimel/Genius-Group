---
description: Plan ENSEA — étape 3.1
---
Avant de commencer : relis CLAUDE.md et docs/pole-educatif.md.
Commence par me présenter un PLAN détaillé (fichiers touchés, migrations SQL, risques) et attends ma validation avant de modifier quoi que ce soit.

Conçois le workflow d'évaluation ENSEA :
- Table evaluations (id, concours_code, matiere, titre, consignes, sujet_storage_path, date_ouverture, date_limite, retard_autorise, competences text[], created_by).
- Table copies (id, evaluation_id, etudiant_id, fichiers jsonb, deposee_le, en_retard, statut [deposee|en_correction|corrigee], note numeric, commentaire, corrige_storage_path, corrige_par, corrige_le). Unique (evaluation_id, etudiant_id), redépôt possible tant que non corrigée.
- Buckets Supabase PRIVÉS : sujets et copies. Accès uniquement via le backend et URL signées de courte durée (5 min).
- Upload élève : PDF, JPG, PNG, jusqu'à 10 fichiers et 20 Mo au total ; vérifier le vrai type du fichier (magic bytes, pas seulement le mimetype) ; fusionner les images en un PDF unique côté serveur (pdf-lib).
- Prof : liste des copies par évaluation avec filtres (non corrigées, en retard), visionneuse, saisie note /20 + commentaire + dépôt optionnel d'un corrigé annoté. La note corrigée alimente automatiquement la table notes.
- Élève : page « Mes évaluations » : à faire / déposées / corrigées, téléchargement du sujet, compte à rebours, consultation note + commentaire.
- Sur mobile, l'élève doit pouvoir prendre ses pages en photo directement (input capture).
Migration SQL d'abord, puis backend, puis frontend.

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
