-- Performance RLS et index des clés étrangères — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider sur la pile Supabase TEST avant la production.
--
-- Avis Supabase « auth_rls_initplan » : 13 policies appelaient auth.uid() /
-- auth.jwt() directement, donc une fois par ligne lue. Envelopper l'appel dans
-- (select …) le fait évaluer une seule fois par requête ; la condition et donc
-- les droits sont strictement identiques (seule la forme change).
-- Avis « unindexed_foreign_keys » : 13 clés étrangères sans index, ce qui
-- ralentit les jointures et les suppressions en cascade.
--
-- Généré à partir des définitions exportées de la production (identiques en TEST).
-- Rollback de sécurité : forward-fix ; les index peuvent être supprimés sans effet fonctionnel.

begin;

-- about_hero — ALL
alter policy "admin_write_about_hero" on public.about_hero
  using ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));

-- about_story — ALL
alter policy "admin_write_about_story" on public.about_story
  using ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));

-- audit_logs — ALL
alter policy "Service role can manage audit logs" on public.audit_logs
  using ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));

-- collections_content — ALL
alter policy "Admins can manage collections_content" on public.collections_content
  using (((((select auth.jwt()) ->> 'role'::text) = 'admin'::text) OR ((((select auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)));

-- contact_faq — ALL
alter policy "admin_write_contact_faq" on public.contact_faq
  using ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));

-- newsletter_subscriptions — INSERT
alter policy "Anyone can subscribe to newsletter" on public.newsletter_subscriptions
  with check (((source = 'website'::text) AND (is_active IS TRUE) AND ((user_id IS NULL) OR (user_id = (select auth.uid()))) AND (char_length(email) <= 254) AND (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text) AND ((phone IS NULL) OR (char_length(phone) <= 32))));

-- order_items — SELECT
alter policy "Users can view their own order items" on public.order_items
  using ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = (select auth.uid()))))));

-- orders — SELECT
alter policy "Users can view their own orders" on public.orders
  using (((select auth.uid()) = user_id));

-- profiles — INSERT
alter policy "Users can insert their own profile" on public.profiles
  with check (((select auth.uid()) = id));

-- profiles — UPDATE
alter policy "Users can update their own profile" on public.profiles
  using (((select auth.uid()) = id));

-- profiles — SELECT
alter policy "Users can view their own profile" on public.profiles
  using (((select auth.uid()) = id));

-- services_content — ALL
alter policy "Admins can manage services_content" on public.services_content
  using (((((select auth.jwt()) ->> 'role'::text) = 'admin'::text) OR ((((select auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)));

-- site_settings — ALL
alter policy "Admins can upsert site_settings" on public.site_settings
  using (((((select auth.jwt()) ->> 'role'::text) = 'admin'::text) OR ((((select auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)));

-- Index des clés étrangères
create index if not exists barcodes_created_by_fkey_idx on public.barcodes (created_by);
create index if not exists categories_parent_id_fkey_idx on public.categories (parent_id);
create index if not exists collections_parent_id_fkey_idx on public.collections (parent_id);
create index if not exists inventory_movements_performed_by_fkey_idx on public.inventory_movements (performed_by);
create index if not exists maintenance_logs_created_by_fkey_idx on public.maintenance_logs (created_by);
create index if not exists newsletter_campaigns_created_by_fkey_idx on public.newsletter_campaigns (created_by);
create index if not exists newsletter_subscriptions_user_id_fkey_idx on public.newsletter_subscriptions (user_id);
create index if not exists order_items_product_id_fkey_idx on public.order_items (product_id);
create index if not exists refunds_processed_by_fkey_idx on public.refunds (processed_by);
create index if not exists refunds_requested_by_fkey_idx on public.refunds (requested_by);
create index if not exists reviews_order_id_fkey_idx on public.reviews (order_id);
create index if not exists reviews_product_id_fkey_idx on public.reviews (product_id);
create index if not exists stock_alerts_acknowledged_by_fkey_idx on public.stock_alerts (acknowledged_by);

commit;
