---
description: Accueil 1/3 — page Mes statistiques différenciée par concours
---
Lis d'abord .claude/commands/a0-style-sobre.md et applique ses règles. Commence par un PLAN et attends ma validation.

Page : Accueil > Mes statistiques (pages/accueil/Statistiques.jsx). Aujourd'hui elle est titrée « 3 Semaines de Préparation » pour tout le monde, alors que :
- le programme de 3 semaines (timeline Semaine 1 / 2 / 3, « Score moyen global 72 % ») concerne UNIQUEMENT l'ESATIC ;
- les résultats d'admissibilité de l'an dernier (ESATIC 100 %, INP-HB 83,33 %) doivent être GARDÉS, chacun rattaché à son concours ;
- l'ENSEA est préparé sur plusieurs mois et c'est notre première année : nous n'avons aucune statistique historique.

Ce que je veux :
1. Titre général neutre (ex. « Mes statistiques » / « Bilan de préparation »), plus de « 3 semaines » dans le titre.
2. Contenu organisé par concours (onglets ou sections, même mécanique ?concours= que Mes progrès) et filtré sur les concours de l'élève ; prof/admin voient tous les concours.
   - ESATIC : résultat d'admissibilité de l'an dernier + programme de 3 semaines (clairement libellé « Programme ESATIC — 3 semaines »).
   - INP-HB : résultat d'admissibilité de l'an dernier (pas de timeline de 3 semaines, sauf si le code montre qu'elle s'applique aussi : dans ce cas demande-moi).
   - CME : ce qui existe aujourd'hui, sinon rien de plus.
   - ENSEA : un bloc sobre « Première promotion ENSEA — préparation sur plusieurs mois, pas encore de résultats historiques », puis les VRAIES statistiques personnelles de l'élève tirées de la plateforme (moyenne Français / Mathématiques à partir de ses notes, nombre d'évaluations rendues et corrigées, taux de remplissage des auto-évaluations, scores de compétence) en réutilisant les endpoints existants (tableaux, renforcement, notes). États vides propres si rien encore.
3. Présentation des résultats sans CountUp ni anneaux animés : un chiffre lisible, l'année concernée (demande-moi l'année si elle n'est pas dans le code) et une phrase factuelle.
4. Pas de chiffres inventés pour l'ENSEA.
