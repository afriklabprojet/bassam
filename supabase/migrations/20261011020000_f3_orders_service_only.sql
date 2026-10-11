-- F3 — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider après F1 sur une pile Supabase de test isolée.
--
-- La création de commande de l'application passe par
-- POST /api/payment/initiate et un client service_role. Les clients publics ne
-- doivent pas pouvoir choisir eux-mêmes montant, statut ou état de paiement.
--
-- Rollback de sécurité : ne pas rétablir les politiques INSERT publiques.
-- Corriger le checkout par forward-fix si un chemin légitime est découvert.

begin;

do $$
declare
  policy record;
begin
  for policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('orders', 'order_items')
      and cmd = 'INSERT'
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy.policyname,
      policy.schemaname,
      policy.tablename
    );
  end loop;
end
$$;

commit;
