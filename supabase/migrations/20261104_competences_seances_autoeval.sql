-- Référentiel de compétences, séances, auto-évaluations post-séance
-- À lancer dans l'éditeur SQL de Supabase APRÈS 20261102 (concours) et 20261103 (évaluations).
-- Idempotente. Retour arrière : 20261104_competences_seances_autoeval_rollback.sql
--
-- Les 31 compétences ENSEA proviennent de docs/pole-educatif.md (Français : résumé et
-- dissertation ; Mathématiques : 19 leçons). Elles restent modifiables en administration.

begin;

-- 1) Référentiel de compétences ---------------------------------------------------------------
create table if not exists competences (
  id            uuid primary key default gen_random_uuid(),
  concours_code text not null references concours(code) on update cascade,
  matiere       text not null,
  code          text not null,
  libelle       text not null,
  ordre         integer not null default 0,
  url           text,                         -- lien de la leçon (fourni pour les mathématiques)
  actif         boolean not null default true, -- désactiver plutôt que supprimer ce qui a déjà servi
  constraint competences_code_unique unique (concours_code, code)
);
create index if not exists competences_concours_idx on competences (concours_code, matiere, ordre);

insert into competences (concours_code, matiere, code, libelle, ordre, url) values
  -- Français — Résumé
  ('ensea', 'Français', 'FR-RES-1', 'Comprendre le texte et identifier les idées essentielles', 1, null),
  ('ensea', 'Français', 'FR-RES-2', 'Dégager la structure et la progression de l''argumentation', 2, null),
  ('ensea', 'Français', 'FR-RES-3', 'Reformuler avec ses propres mots (sans recopier le texte)', 3, null),
  ('ensea', 'Français', 'FR-RES-4', 'Respecter le nombre de mots imposé', 4, null),
  ('ensea', 'Français', 'FR-RES-5', 'Rédiger un texte cohérent, fidèle au point de vue de l''auteur (connecteurs logiques)', 5, null),
  ('ensea', 'Français', 'FR-RES-6', 'Maîtriser la langue et l''orthographe', 6, null),
  -- Français — Dissertation
  ('ensea', 'Français', 'FR-DIS-1', 'Analyser le sujet (termes clés, problématique)', 7, null),
  ('ensea', 'Français', 'FR-DIS-2', 'Construire un plan structuré et équilibré', 8, null),
  ('ensea', 'Français', 'FR-DIS-3', 'Argumenter et illustrer par des exemples précis', 9, null),
  ('ensea', 'Français', 'FR-DIS-4', 'Rédiger l''introduction (amorce, problématique, annonce du plan)', 10, null),
  ('ensea', 'Français', 'FR-DIS-5', 'Rédiger la conclusion et soigner les transitions', 11, null),
  ('ensea', 'Français', 'FR-DIS-6', 'Maîtriser la langue, l''orthographe et le style', 12, null),
  -- Mathématiques — une compétence par leçon (ordre = numéro de leçon)
  ('ensea', 'Mathématiques', 'MA-ANA-1', 'Limite et continuité (limites, indéterminations, continuité)', 1, 'https://lyc.ecole-ci.org/course/view.php?id=3698'),
  ('ensea', 'Mathématiques', 'MA-GEO-1', 'Barycentre', 2, 'https://lyc.ecole-ci.org/course/view.php?id=3697'),
  ('ensea', 'Mathématiques', 'MA-ARI-1', 'Divisibilité dans Z', 3, 'https://lyc.ecole-ci.org/course/view.php?id=3696'),
  ('ensea', 'Mathématiques', 'MA-ANA-2', 'Dérivabilité et étude de fonctions', 4, 'https://lyc.ecole-ci.org/course/view.php?id=2087'),
  ('ensea', 'Mathématiques', 'MA-GEO-2', 'Géométrie analytique de l''espace', 5, 'https://lyc.ecole-ci.org/course/view.php?id=2088'),
  ('ensea', 'Mathématiques', 'MA-ANA-3', 'Primitives', 6, 'https://lyc.ecole-ci.org/course/view.php?id=2089'),
  ('ensea', 'Mathématiques', 'MA-GEO-3', 'Coniques', 7, 'https://lyc.ecole-ci.org/course/view.php?id=2090'),
  ('ensea', 'Mathématiques', 'MA-ANA-4', 'Fonctions logarithmes', 8, 'https://lyc.ecole-ci.org/course/view.php?id=2091'),
  ('ensea', 'Mathématiques', 'MA-CPX-1', 'Nombres complexes', 9, 'https://lyc.ecole-ci.org/course/view.php?id=2092'),
  ('ensea', 'Mathématiques', 'MA-ANA-5', 'Fonction exponentielle et fonction puissance', 10, 'https://lyc.ecole-ci.org/course/view.php?id=2093'),
  ('ensea', 'Mathématiques', 'MA-ARI-2', 'PPCM et PGCD de deux entiers relatifs', 11, 'https://lyc.ecole-ci.org/course/view.php?id=2094'),
  ('ensea', 'Mathématiques', 'MA-ANA-6', 'Suites numériques', 12, 'https://lyc.ecole-ci.org/course/view.php?id=2095'),
  ('ensea', 'Mathématiques', 'MA-CPX-2', 'Nombres complexes et géométrie du plan', 13, 'https://lyc.ecole-ci.org/course/view.php?id=2096'),
  ('ensea', 'Mathématiques', 'MA-GEO-4', 'Isométries du plan', 14, 'https://lyc.ecole-ci.org/course/view.php?id=2097'),
  ('ensea', 'Mathématiques', 'MA-ANA-7', 'Calcul intégral', 15, 'https://lyc.ecole-ci.org/course/view.php?id=2098'),
  ('ensea', 'Mathématiques', 'MA-GEO-5', 'Similitudes directes du plan', 16, 'https://lyc.ecole-ci.org/course/view.php?id=1223'),
  ('ensea', 'Mathématiques', 'MA-PRO-1', 'Probabilité', 17, 'https://lyc.ecole-ci.org/course/view.php?id=112'),
  ('ensea', 'Mathématiques', 'MA-ANA-8', 'Équations différentielles', 18, 'https://lyc.ecole-ci.org/course/view.php?id=1302'),
  ('ensea', 'Mathématiques', 'MA-PRO-2', 'Statistiques', 19, 'https://lyc.ecole-ci.org/course/view.php?id=98')
on conflict (concours_code, code) do nothing;

-- 2) Séances (occurrences datées d'un cours) --------------------------------------------------
create table if not exists seances (
  id            uuid primary key default gen_random_uuid(),
  concours_code text not null references concours(code) on update cascade,
  titre         text not null,
  debut         timestamptz not null,
  fin           timestamptz not null,
  meeting_id    uuid,                          -- cours à distance associé (facultatif, sans contrainte : types variables)
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint seances_dates_ok check (fin > debut)
);
create index if not exists seances_concours_fin_idx on seances (concours_code, fin);

create table if not exists seance_competences (
  seance_id     uuid not null references seances(id) on delete cascade,
  competence_id uuid not null references competences(id) on delete restrict,
  primary key (seance_id, competence_id)
);

-- 3) Auto-évaluations --------------------------------------------------------------------------
create table if not exists auto_evaluations (
  id            uuid primary key default gen_random_uuid(),
  seance_id     uuid not null references seances(id) on delete cascade,
  etudiant_id   uuid not null references users(id) on delete cascade,
  competence_id uuid not null references competences(id) on delete restrict,
  niveau        smallint not null,
  commentaire   text,
  cree_le       timestamptz not null default now(),
  constraint auto_eval_niveau_ok check (niveau between 0 and 5),
  constraint auto_eval_unique unique (seance_id, etudiant_id, competence_id)
);
create index if not exists auto_eval_etudiant_idx on auto_evaluations (etudiant_id);

-- Déblocage manuel d'un élève par un professeur
create table if not exists autoeval_deblocages (
  seance_id   uuid not null references seances(id) on delete cascade,
  etudiant_id uuid not null references users(id) on delete cascade,
  par         uuid references users(id) on delete set null,
  le          timestamptz not null default now(),
  primary key (seance_id, etudiant_id)
);

-- 4) Sécurité : RLS sans politique (accès uniquement via le backend, clé service_role)
alter table competences enable row level security;
alter table seances enable row level security;
alter table seance_competences enable row level security;
alter table auto_evaluations enable row level security;
alter table autoeval_deblocages enable row level security;

-- 5) Options ENSEA (valeurs « à valider » du pôle éducatif, modifiables en administration).
--    `'{...}' || options` : les valeurs déjà présentes (éventuellement modifiées par l'admin) l'emportent.
update concours
set options = '{"autoeval_bloquante": true, "autoeval_delai_heures": 48, "autoeval_rappel_heures": 24, "classement_visible": false}'::jsonb || options
where code = 'ensea';

commit;

-- Contrôles après exécution :
--   select matiere, count(*) from competences where concours_code = 'ensea' group by 1;   -- Français 12, Mathématiques 19
--   select options from concours where code = 'ensea';
