-- Newsletter — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider sur une pile Supabase de test isolée avant la production.
--
-- L'inscription publique reste possible (route /api/newsletter et action
-- serveur, toutes deux via la clé anon ou la session), mais un visiteur ne
-- peut plus rattacher son inscription au compte d'un autre utilisateur,
-- usurper une autre source, s'inscrire désactivé ni envoyer une adresse
-- arbitraire. Lecture et suppression restent réservées à is_admin().
--
-- Rollback de sécurité : ne pas restaurer WITH CHECK (true).
-- Corriger le formulaire par forward-fix.

begin;

drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscriptions;
create policy "Anyone can subscribe to newsletter"
  on public.newsletter_subscriptions
  for insert
  to anon, authenticated
  with check (
    source = 'website'
    and is_active is true
    and (user_id is null or user_id = auth.uid())
    and char_length(email) <= 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and (phone is null or char_length(phone) <= 32)
  );

commit;
