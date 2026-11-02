-- Score de compétence et exercices de renforcement
-- À lancer dans l'éditeur SQL de Supabase APRÈS 20261102, 20261103 et 20261104.
-- Idempotente. Retour arrière : 20261105_score_renforcement_rollback.sql
--
-- Le score est calculé par le backend (fonction pure testée, lib/score.js) puis enregistré ici ;
-- il est recalculé à chaque nouvelle note, auto-évaluation ou changement de paramètre.

begin;

-- 1) Rattachement des notes aux compétences -------------------------------------------------
-- Une « évaluation de notes » = (concours, matière, période) : c'est la colonne de la grille de notes.
-- Les notes qui en font partie comptent pour les compétences listées ici.
create table if not exists notes_competences (
  concours_code text not null references concours(code) on update cascade,
  matiere       text not null,
  periode       text not null,
  competence_id uuid not null references competences(id) on delete cascade,
  primary key (concours_code, matiere, periode, competence_id)
);

-- 2) Scores ----------------------------------------------------------------------------------
create table if not exists scores_competences (
  etudiant_id   uuid not null references users(id) on delete cascade,
  competence_id uuid not null references competences(id) on delete cascade,
  score         numeric(5,2) not null,
  provisoire    boolean not null default false,  -- auto-évaluation seule (aucune note rattachée)
  nb_autoeval   integer not null default 0,
  nb_notes      integer not null default 0,
  calcule_le    timestamptz not null default now(),
  primary key (etudiant_id, competence_id),
  constraint scores_plage_ok check (score between 0 and 100)
);

create table if not exists scores_historique (
  id            uuid primary key default gen_random_uuid(),
  etudiant_id   uuid not null references users(id) on delete cascade,
  competence_id uuid not null references competences(id) on delete cascade,
  score         numeric(5,2) not null,
  provisoire    boolean not null default false,
  calcule_le    timestamptz not null default now()
);
create index if not exists scores_historique_idx on scores_historique (etudiant_id, competence_id, calcule_le desc);

-- 3) Bibliothèque d'exercices de renforcement ------------------------------------------------
create table if not exists exercices_renforcement (
  id            uuid primary key default gen_random_uuid(),
  concours_code text not null references concours(code) on update cascade,
  competence_id uuid not null references competences(id) on delete restrict,
  titre         text not null,
  fichier_path  text not null,                 -- chemin dans le bucket privé, jamais d'URL publique
  niveau        text not null default 'moyen',
  actif         boolean not null default true,
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint exercices_renforcement_niveau_ok check (niveau in ('facile', 'moyen', 'difficile'))
);
create index if not exists exercices_renforcement_comp_idx on exercices_renforcement (competence_id, actif);

-- 4) Envoi et suivi : on réutilise la table `exercices` existante (statut fait / pas fait)
alter table exercices add column if not exists competence_id uuid;
alter table exercices add column if not exists renforcement_id uuid;
alter table exercices add column if not exists envoye_par_mode text;   -- 'auto' | 'manuel'
create index if not exists exercices_etudiant_competence_idx on exercices (etudiant_id, competence_id);

-- 5) Sécurité : RLS sans politique (accès uniquement via le backend, clé service_role)
alter table notes_competences enable row level security;
alter table scores_competences enable row level security;
alter table scores_historique enable row level security;
alter table exercices_renforcement enable row level security;

insert into storage.buckets (id, name, public) values ('exercices_renforcement', 'exercices_renforcement', false)
on conflict (id) do update set public = false;

-- 6) Paramètres ENSEA (valeurs du pôle éducatif « à valider », modifiables en administration).
--    Les valeurs déjà présentes l'emportent. α = poids de l'auto-évaluation (0,3 = 30 % / 70 % notes).
update concours
set options = '{"score_alpha": 0.3, "score_seuil": 50, "renforcement_mode": "manuel"}'::jsonb || options
where code = 'ensea';

commit;

-- Contrôles après exécution :
--   select options from concours where code = 'ensea';
--   select column_name from information_schema.columns where table_name = 'exercices'
--     and column_name in ('competence_id', 'renforcement_id', 'envoye_par_mode');   -- 3 lignes
