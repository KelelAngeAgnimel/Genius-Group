---
description: Règles communes de la refonte de l'espace élève (lu par les autres commandes e1 à e4)
---
Règles pour toute la refonte de l'espace élève :
- Relis CLAUDE.md. Le hook frontend/src/hooks/useConcours.js donne les concours de l'utilisateur : c'est la SEULE source pour savoir à quoi un élève a accès. Un élève ne voit jamais de contenu, de note ou de carte d'un concours auquel il n'est pas inscrit. Professeurs et admins voient tous les concours.
- Le filtrage par concours doit aussi être fait CÔTÉ SERVEUR (backend/lib/concours.js), pas seulement masqué dans l'interface.
- Navigation intelligente partout : l'état de la page est dans l'URL (ex. /ressources/ensea/mathematiques) pour que le bouton « Précédent » du navigateur et les liens partagés fonctionnent ; fil d'Ariane cliquable (composant Breadcrumb existant) ; bouton « ← Retour » qui remonte d'UN niveau (pas forcément history.back()) ; si un élève n'a qu'un seul concours, on saute l'écran de choix et on l'emmène directement dans son concours (avec le fil d'Ariane pour remonter).
- Réutilise les composants communs (Loader, EmptyState, Toast, boîte de confirmation), garde la charte actuelle (navy #071020, or #C9A84C, couleurs par concours déjà utilisées), mobile d'abord (375 px).
- Composant partagé à créer ou réutiliser : <CarteConcours> / grille de cartes, utilisé par Évaluations, Ressources et Mes progrès, pour avoir un seul style.
- Travaille sur la branche courante, commits petits et clairs. À la fin : lint, build, tests, puis résumé + ce que je dois tester à la main avec un compte élève ENSEA seul, un élève INP-HB + ESATIC, et un admin. Ne fais pas de git push.
