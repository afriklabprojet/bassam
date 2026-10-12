-- Durcissement des fonctions signalées par Supabase Security Advisor.
--
-- Les fonctions de trigger n'ont pas besoin d'être appelées directement par
-- les rôles API. Un search_path vide empêche la résolution d'objets contrôlés
-- par un utilisateur, et la fonction SECURITY DEFINER de création de profil
-- reste utilisable par son trigger auth.users sans droit EXECUTE public.
--
-- Rollback de sécurité : ne pas rétablir un search_path mutable ni les droits
-- EXECUTE publics. Corriger toute incompatibilité par forward-fix.

begin;

alter function public.update_site_settings_timestamp() set search_path = '';
alter function public.update_collections_content_ts() set search_path = '';
alter function public.update_services_content_ts() set search_path = '';
alter function public.update_home_hero_ts() set search_path = '';
alter function public.update_updated_at_column() set search_path = '';
alter function public.handle_new_user() set search_path = '';

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

commit;
