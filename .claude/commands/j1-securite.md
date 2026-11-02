---
description: Plan ENSEA — étape 1.1
---
Avant de commencer : relis CLAUDE.md.
Commence par me présenter un PLAN détaillé (fichiers touchés, migrations SQL, risques) et attends ma validation avant de modifier quoi que ce soit.

Lis docs/PLAN-ENSEA.md section 0 et CLAUDE.md. Propose un plan pour corriger les failles de sécurité 1 à 8 du backend :
- un seul client Supabase (supabase.js) et un seul middleware auth dans middleware/ (supprimer le verifyToken de routes/auth.js et mettre à jour les imports) ;
- le middleware recharge l'utilisateur depuis la base à chaque requête (ou cache 60 s) et refuse les comptes bloqués/supprimés ; ajoute un middleware requireRole(...roles) ;
- helmet, express.json({ limit: '1mb' }), express-rate-limit (login : 5 essais / 15 min par IP + matricule ; chat et IA : 20 / min par utilisateur) ;
- message d'erreur de login unique « Identifiants incorrects » ;
- /api/chat protégé par auth, historique limité à 20 messages par utilisateur, clé = id utilisateur (plus de sessionId client) ;
- validation des entrées avec zod sur toutes les routes POST/PATCH ;
- gestionnaire d'erreurs central qui logue côté serveur et renvoie un message générique ;
- messagerie : un élève ne peut écrire qu'aux professeurs/admins ; longueur max sujet/contenu ;
- meetings : un professeur ne modifie/supprime que ses propres cours (created_by), l'admin tout ;
- users/all : un professeur ne voit que les élèves, sans les admins ;
- notes : note numérique entre 0 et 20, etudiant_id doit exister et être un élève.
Crée backend/.env.example. Ne modifie rien avant ma validation.

À la fin : lance lint, build et tests, puis résume ce qui a changé et ce que je dois tester à la main. Ne fais pas de git push.
