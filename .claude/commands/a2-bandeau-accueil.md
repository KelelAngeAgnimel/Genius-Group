---
description: Accueil 2/3 — bandeau (navbar) épuré et page d'accueil moins « IA »
---
Lis d'abord .claude/commands/a0-style-sobre.md et applique ses règles. Commence par un PLAN et attends ma validation.

1. Bandeau du haut (components/Navbar.jsx), à droite :
   - Supprime la pastille ronde orange qui affiche la première lettre de l'identifiant (le « 2 » de 26GEN0097 n'a aucun sens pour l'élève).
   - Affiche plutôt « Prénom Nom » en texte simple, avec le matricule en plus petit et plus discret en dessous (ou dans un menu au clic). S'il n'y a pas de prénom/nom, le matricule seul.
   - Le badge du concours (« ENSEA ») devient discret (texte fin ou petite étiquette neutre), ou disparaît si le concours est déjà visible ailleurs : propose-moi l'option la plus propre.
   - « Déconnexion » : bouton texte sobre, sans fond doré.
   - Vérifie la version mobile du menu (burger) avec les mêmes règles.
2. Page Accueil > Mon espace (pages/accueil/TableauDeBord.jsx) :
   - « Bonjour, Prénom » SANS la main 👋 (et vérifie les autres salutations : EspaceProfesseur, etc.).
   - Passe en revue toute la page selon les règles de style sobre et liste-moi d'abord tout ce qui fait « IA » (émojis, dégradés, lueurs, animations, textes marketing) avant de le corriger.
3. Applique la même passe sobre au reste de la section Accueil (Actualités, Guide, Statistiques déjà traitée par a1) et aux composants communs qui affichent des émojis (EmptyState, LecteurPDF : remplacer par des icônes SVG fines). Ne touche pas aux étoiles de l'auto-évaluation.
4. Les pages Calendrier, Fiches, Tendances, Ecoles de pages/accueil : vérifie si elles sont encore accessibles par une route ou un lien ; si elles sont orphelines, propose de les supprimer.
