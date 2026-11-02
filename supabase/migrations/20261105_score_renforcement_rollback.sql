-- Retour arrière de 20261105_score_renforcement.sql
-- ATTENTION : supprime les scores, l'historique, la bibliothèque d'exercices de renforcement et leurs
-- fichiers. Les exercices déjà envoyés aux élèves restent dans `exercices` (sans lien de compétence).

begin;

delete from storage.objects where bucket_id = 'exercices_renforcement';
delete from storage.buckets where id = 'exercices_renforcement';

drop table if exists scores_historique;
drop table if exists scores_competences;
drop table if exists exercices_renforcement;
drop table if exists notes_competences;

drop index if exists exercices_etudiant_competence_idx;
alter table exercices drop column if exists envoye_par_mode;
alter table exercices drop column if exists renforcement_id;
alter table exercices drop column if exists competence_id;

update concours
set options = options - 'score_alpha' - 'score_seuil' - 'renforcement_mode'
where code = 'ensea';

commit;
