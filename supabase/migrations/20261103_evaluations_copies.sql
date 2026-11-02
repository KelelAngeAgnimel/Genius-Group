-- Évaluations papier ENSEA : sujet → copie scannée → correction
-- À lancer dans l'éditeur SQL de Supabase APRÈS 20261102_concours_inscriptions.sql.
-- Idempotente. Retour arrière : 20261103_evaluations_copies_rollback.sql
--
-- Accès : uniquement via le backend (clé service_role). RLS activée SANS politique sur les
-- nouvelles tables et buckets privés : aucun accès direct depuis le navigateur.

begin;

-- 1) Évaluations -----------------------------------------------------------------------------
create table if not exists evaluations (
  id                 uuid primary key default gen_random_uuid(),
  concours_code      text not null references concours(code) on update cascade,
  matiere            text not null,
  titre              text not null,
  consignes          text,
  sujet_storage_path text,
  date_ouverture     timestamptz not null default now(),
  date_limite        timestamptz not null,
  retard_autorise    boolean not null default true,
  competences        text[] not null default '{}',
  created_by         uuid references users(id) on delete set null,
  created_at         timestamptz not null default now(),
  constraint evaluations_dates_ok check (date_limite > date_ouverture)
);
create index if not exists evaluations_concours_idx on evaluations (concours_code, date_limite);

-- 2) Copies ----------------------------------------------------------------------------------
create table if not exists copies (
  id                   uuid primary key default gen_random_uuid(),
  evaluation_id        uuid not null references evaluations(id) on delete cascade,
  etudiant_id          uuid not null references users(id) on delete cascade,
  fichiers             jsonb not null default '[]'::jsonb,  -- [{ path, nom, taille, type }]
  deposee_le           timestamptz not null default now(),
  en_retard            boolean not null default false,
  statut               text not null default 'deposee',
  note                 numeric(4,2),
  commentaire          text,
  corrige_storage_path text,
  corrige_par          uuid references users(id) on delete set null,
  corrige_le           timestamptz,
  constraint copies_statut_ok check (statut in ('deposee', 'en_correction', 'corrigee')),
  constraint copies_note_ok check (note is null or (note >= 0 and note <= 20)),
  constraint copies_unique unique (evaluation_id, etudiant_id)
);
create index if not exists copies_eval_statut_idx on copies (evaluation_id, statut);
create index if not exists copies_etudiant_idx on copies (etudiant_id);

-- 3) Sécurité : RLS sans politique (le backend utilise la clé service_role, qui la contourne)
alter table evaluations enable row level security;
alter table copies enable row level security;

-- 4) Buckets PRIVÉS (jamais d'URL publique : URL signées de 5 minutes émises par le backend)
insert into storage.buckets (id, name, public) values
  ('sujets', 'sujets', false),
  ('copies', 'copies', false)
on conflict (id) do update set public = false;

commit;

-- Contrôles après exécution :
--   select id, public from storage.buckets where id in ('sujets', 'copies');   -- public = false pour les deux
--   select count(*) from evaluations; select count(*) from copies;             -- 0 / 0
