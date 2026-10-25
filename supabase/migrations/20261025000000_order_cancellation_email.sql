-- E-mail au client quand sa commande est annulée automatiquement (non payée après 48 h).
--
-- La tâche cancel-abandoned-orders (migration 20261021020000) annule en SQL et ne peut pas envoyer d'e-mail.
-- Une route planifiée du site (/api/cron/abandoned-orders, une fois par jour) prévient le client puis renseigne
-- cancellation_email_sent_at : une commande n'est prévenue qu'une seule fois.
--
-- Les commandes déjà annulées automatiquement avant cette migration sont marquées comme traitées : aucun ancien
-- client ne reçoit d'e-mail tardif. Seules ces lignes sont touchées (le trigger réécrit updated_at) : les autres
-- commandes annulées ne sont jamais lues par la route.
--
-- Rollback : alter table public.orders drop column if exists cancellation_email_sent_at;

begin;

alter table public.orders add column if not exists cancellation_email_sent_at timestamptz;

update public.orders
set cancellation_email_sent_at = now()
where status = 'cancelled'
  and payment_status = 'pending'
  and notes like '%Annulée automatiquement : non payée%'
  and cancellation_email_sent_at is null;

commit;
