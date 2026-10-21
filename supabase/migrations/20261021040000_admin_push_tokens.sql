-- admin_push_tokens — jetons Firebase Cloud Messaging des téléphones des administrateurs
-- (application Android « VIP Admin »). Un jeton = un appareil.
--
-- Écriture : POST/DELETE /api/admin/push-token (utilisateur vérifié, rôle admin lu dans app_metadata).
-- Lecture pour l'envoi : webhook de paiement (clé service, contourne la RLS) ; le rôle de chaque propriétaire
-- est relu dans Supabase Auth avant chaque envoi (lib/push/fcm.ts), un administrateur rétrogradé ne reçoit rien.
--
-- Rollback : drop table if exists public.admin_push_tokens;
-- (aucune autre table ne dépend de celle-ci ; les téléphones se réenregistrent à la prochaine connexion).

begin;

create table if not exists public.admin_push_tokens (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  token        text        not null unique check (char_length(token) between 20 and 4096),
  platform     text        not null default 'android' check (platform in ('android')),
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists admin_push_tokens_user_id_idx on public.admin_push_tokens (user_id);

alter table public.admin_push_tokens enable row level security;

-- Chaque administrateur ne voit et ne gère que ses propres appareils. Rôle : public.is_admin() (app_metadata du
-- JETON signé, non modifiable par l'utilisateur). `(select …)` : évalué une fois par requête (initplan).
drop policy if exists "Admins manage own push tokens" on public.admin_push_tokens;

create policy "Admins manage own push tokens" on public.admin_push_tokens
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and (select public.is_admin())
  )
  with check (
    user_id = (select auth.uid())
    and (select public.is_admin())
  );

commit;
