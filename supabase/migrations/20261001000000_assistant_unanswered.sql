-- Journal anonyme des questions auxquelles l'assistant IA n'a pas su répondre.
-- Sert uniquement à repérer ce qu'il faut ajouter à sa base de connaissances.
-- Aucune IP ni identifiant client n'est stocké ; e-mails et numéros sont masqués
-- avant l'enregistrement et les lignes sont purgées après 90 jours côté serveur.

CREATE TABLE IF NOT EXISTS public.assistant_unanswered (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question      TEXT        NOT NULL,
  question_key  TEXT        NOT NULL,
  reason        TEXT        NOT NULL CHECK (reason IN ('fallback', 'no_results')),
  status        TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'resolved')),
  occurrences   INTEGER     NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Une seule ligne ouverte par question (les répétitions incrémentent "occurrences").
CREATE UNIQUE INDEX IF NOT EXISTS assistant_unanswered_open_key
  ON public.assistant_unanswered (question_key) WHERE status = 'new';

CREATE INDEX IF NOT EXISTS assistant_unanswered_status_seen
  ON public.assistant_unanswered (status, last_seen_at DESC);

-- RLS activée sans aucune policy : seul le service role (serveur) peut lire/écrire.
ALTER TABLE public.assistant_unanswered ENABLE ROW LEVEL SECURITY;
