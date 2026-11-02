-- Migration : concours génériques + inscriptions (remplace les rôles combinés)
-- À lancer dans l'éditeur SQL de Supabase. Idempotente : relançable sans risque.
-- Réversible : voir 20261102_concours_inscriptions_rollback.sql
--
-- Avant : users.role ∈ etudiant_inphb, etudiant_esatic, etudiant_cme, etudiant_inphb_cme,
--         etudiant_esatic_cme, etudiant_both, etudiant_all, professeur, admin
-- Après : users.role ∈ etudiant, professeur, admin  +  table inscriptions (user_id, concours_code)
-- L'ancien rôle est conservé dans users.role_ancien (aucune perte d'information).

begin;

-- 1) Référentiel des concours ---------------------------------------------------------------
create table if not exists concours (
  code    text primary key,
  nom     text not null,
  actif   boolean not null default true,
  options jsonb not null default '{}'::jsonb
);

insert into concours (code, nom, actif, options) values
  ('inphb',  'INP-HB', true, '{}'::jsonb),
  ('esatic', 'ESATIC', true, '{}'::jsonb),
  ('cme',    'CME',    true, '{}'::jsonb),
  ('ensea',  'ENSEA',  true, '{"generation_auto_tests": false}'::jsonb)
on conflict (code) do nothing;

-- 2) Inscriptions (élèves et professeurs) ---------------------------------------------------
create table if not exists inscriptions (
  user_id       uuid not null references users(id) on delete cascade,
  concours_code text not null references concours(code) on update cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, concours_code)
);
create index if not exists inscriptions_concours_idx on inscriptions (concours_code);

-- 3) Sauvegarde de l'ancien rôle (une seule fois : ne jamais écraser) -----------------------
alter table users add column if not exists role_ancien varchar;
update users set role_ancien = role where role_ancien is null;

-- 4) Conversion des anciens rôles en inscriptions -------------------------------------------
insert into inscriptions (user_id, concours_code)
select u.id, c.code
from users u
join (values
  ('etudiant_inphb',      'inphb'),
  ('etudiant_esatic',     'esatic'),
  ('etudiant_cme',        'cme'),
  ('etudiant_inphb_cme',  'inphb'), ('etudiant_inphb_cme',  'cme'),
  ('etudiant_esatic_cme', 'esatic'), ('etudiant_esatic_cme', 'cme'),
  ('etudiant_both',       'inphb'), ('etudiant_both',       'esatic'),
  ('etudiant_all',        'inphb'), ('etudiant_all',        'esatic'), ('etudiant_all', 'cme')
) as c(role_ancien, code) on c.role_ancien = u.role_ancien
on conflict do nothing;

-- 5) Rôle réduit à etudiant / professeur / admin --------------------------------------------
-- La base contient une contrainte users_role_check qui n'autorise que les anciens rôles.
-- On la remplace par une version qui accepte les nouveaux rôles ET les anciens (pendant la
-- transition, un ancien frontend ou le retour arrière peuvent encore en avoir besoin).
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in (
  'admin', 'professeur', 'etudiant',
  'etudiant_inphb', 'etudiant_esatic', 'etudiant_cme',
  'etudiant_inphb_cme', 'etudiant_esatic_cme', 'etudiant_both', 'etudiant_all'
));

update users set role = 'etudiant' where role like 'etudiant\_%' escape '\';

-- Les professeurs et admins n'ont volontairement AUCUNE inscription : « aucune inscription »
-- = accès à tous les concours (transition). Rattacher un prof à un concours le restreint.

commit;

-- Contrôles à lancer après la migration :
--   select role, count(*) from users group by 1;                          -- etudiant / professeur / admin
--   select concours_code, count(*) from inscriptions group by 1;          -- inphb 54, esatic 20, cme 17 (attendu avec les données actuelles)
--   select count(*) from users where role = 'etudiant'
--     and id not in (select user_id from inscriptions);                   -- doit être 0
