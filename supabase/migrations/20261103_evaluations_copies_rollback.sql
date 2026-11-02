-- Retour arrière de 20261103_evaluations_copies.sql
-- ATTENTION : supprime les évaluations, les copies et les fichiers des buckets 'sujets' et 'copies'.
-- Les notes déjà recopiées dans la table notes sont conservées.

begin;

delete from storage.objects where bucket_id in ('sujets', 'copies');
delete from storage.buckets where id in ('sujets', 'copies');

drop table if exists copies;
drop table if exists evaluations;

commit;
