-- Retour arrière de 20261104_competences_seances_autoeval.sql
-- ATTENTION : supprime les compétences, séances et auto-évaluations. Les notes ne sont pas touchées.

begin;

drop table if exists autoeval_deblocages;
drop table if exists auto_evaluations;
drop table if exists seance_competences;
drop table if exists seances;
drop table if exists competences;

-- Retire les options ajoutées à ENSEA (conserve les autres clés)
update concours
set options = options - 'autoeval_bloquante' - 'autoeval_delai_heures' - 'autoeval_rappel_heures' - 'classement_visible'
where code = 'ensea';

commit;
