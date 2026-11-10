---
description: Règles de style « sobre, pas IA » pour la refonte de l'Accueil (lu par a1 à a3)
---
Règles communes à la refonte de l'Accueil (à appliquer dans a1, a2, a3) :
- Relis CLAUDE.md et docs/pole-educatif.md. Pour un élève, n'affiche que ce qui concerne SES concours (hook useConcours).
- Objectif visuel : un portail d'école sérieux et épuré, qui ne ressemble pas à un site généré par IA. Concrètement :
  - pas d'émojis dans les titres, cartes, badges et salutations (garder les icônes SVG fines déjà utilisées dans la Navbar si une icône est utile) ;
  - pas de dégradés décoratifs, de lueurs (box-shadow colorés), de compteurs animés (CountUp) ni de traits dégradés autour des titres de section ;
  - une seule couleur d'accent (l'or #C9A84C) utilisée avec parcimonie, fonds unis, bordures fines grises, typographie hiérarchisée (un titre, un sous-titre, du texte) ;
  - des libellés courts et factuels, pas de formules marketing (« Une performance majeure… », « excellence », « maximiser vos chances »).
- Ne change pas les données ni les chiffres réels (résultats d'admissibilité), seulement leur présentation.
- N'invente aucune information sur l'ENSEA : utilise ce qui est déjà dans pages/aides/Orientation.jsx et docs/pole-educatif.md ; sinon écris « À confirmer » et liste-le-moi à la fin.
- Mobile d'abord (375 px). À la fin : lint + build, captures avant/après si tu peux (Playwright sur localhost), et liste de ce que je dois vérifier avec un élève ENSEA seul, un élève INP-HB + ESATIC et un admin. Pas de git push.
