-- Retour arrière de 20261102_concours_inscriptions.sql
-- Restaure users.role depuis users.role_ancien puis supprime les nouvelles tables.
-- ATTENTION : les inscriptions créées APRÈS la migration (ex. élèves ENSEA, professeurs
-- rattachés) seront perdues. Pour les élèves créés après la migration (role_ancien vide),
-- l'ancien rôle est reconstruit à partir de leurs inscriptions.

begin;

-- 1) Élèves créés après la migration : reconstruire un rôle combiné depuis les inscriptions
update users u
set role_ancien = case
  when s.codes @> array['inphb','esatic','cme'] then 'etudiant_all'
  when s.codes @> array['inphb','esatic']       then 'etudiant_both'
  when s.codes @> array['inphb','cme']          then 'etudiant_inphb_cme'
  when s.codes @> array['esatic','cme']         then 'etudiant_esatic_cme'
  when s.codes @> array['inphb']                then 'etudiant_inphb'
  when s.codes @> array['esatic']               then 'etudiant_esatic'
  when s.codes @> array['cme']                  then 'etudiant_cme'
  else 'etudiant_inphb'  -- ex. ENSEA seul : aucun équivalent dans l'ancien modèle
end
from (
  select user_id, array_agg(concours_code) as codes from inscriptions group by user_id
) s
where s.user_id = u.id and u.role = 'etudiant' and u.role_ancien is null;

-- 2) Restaurer les rôles
update users set role = role_ancien where role_ancien is not null and role <> role_ancien;

-- 2 bis) Contrainte d'origine : seuls les anciens rôles sont autorisés
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in (
  'admin', 'professeur',
  'etudiant_inphb', 'etudiant_esatic', 'etudiant_cme',
  'etudiant_inphb_cme', 'etudiant_esatic_cme', 'etudiant_both', 'etudiant_all'
));

-- 3) Supprimer les nouvelles structures
drop table if exists inscriptions;
drop table if exists concours;
alter table users drop column if exists role_ancien;

commit;
