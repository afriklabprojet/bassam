'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { GOLD, CARD_BG, tint } from '@/lib/admin-theme';
import { TOAST_DURATION_LONG_MS } from '@/lib/constants';
import {
  ASSISTANT_LIMITS,
  ASSISTANT_TONES,
  DEFAULT_ASSISTANT_CONFIG,
  buildWelcomeMessage,
  type AssistantConfig,
  type AssistantToneId,
  type KnowledgeEntry,
} from '@/lib/ai/assistant-config';

/* Everything the assistant reads on its own, straight from the site — nothing to type for these. */
const AUTO_SOURCES = [
  'Catalogue produits : prix, stock, promotions, notes olfactives (en direct)',
  'Livraison : modes et frais (page Livraison)',
  'Paiement : opérateurs Mobile Money acceptés',
  'Services et création sur mesure : formules, prix, délais (Contenu & Design)',
  'Collections, catégories, À propos, FAQ et coordonnées de la boutique',
];

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(197,165,90,0.3)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  padding: '10px 14px',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = { color: '#A0A0A0', fontSize: 12, letterSpacing: '0.04em' };
const hintStyle: React.CSSProperties = { color: '#777', fontSize: 11 };

function Card({ title, subtitle, children }: Readonly<{ title: string; subtitle?: string; children: React.ReactNode }>) {
  return (
    <section style={{ background: CARD_BG, border: `1px solid ${tint(GOLD, 20)}`, borderRadius: 12, padding: '24px 28px', marginBottom: 20 }}>
      <h2 style={{ color: GOLD, fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: subtitle ? 6 : 18 }}>{title}</h2>
      {subtitle && <p style={{ ...hintStyle, fontSize: 12, marginBottom: 18 }}>{subtitle}</p>}
      {children}
    </section>
  );
}

function Toggle({ value, onChange, label }: Readonly<{ value: boolean; onChange: (v: boolean) => void; label: string }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, flexShrink: 0, border: 'none', padding: 0, background: value ? GOLD : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
    >
      <span style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: value ? 'var(--noir)' : '#666', transition: 'left 0.2s' }} />
    </button>
  );
}

function Counter({ value, max }: Readonly<{ value: string; max: number }>) {
  return <span style={{ ...hintStyle, color: value.length > max * 0.9 ? 'var(--warning)' : '#777' }}>{value.length}/{max}</span>;
}

function Avatar({ url, name, size }: Readonly<{ url: string; name: string; size: number }>) {
  if (url) {
    return <Image src={url} alt={name} width={size} height={size} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${GOLD}, var(--gold-deep))`, color: 'var(--noir)', fontWeight: 600, fontSize: size * 0.45 }}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

function AvatarUpload({ value, name, onChange, onError }: Readonly<{ value: string; name: string; onChange: (url: string) => void; onError: (msg: string) => void }>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Échec de l'envoi");
      onChange(json.url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Avatar url={value} name={name} size={72} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={{ ...inputStyle, width: 'auto', cursor: uploading ? 'wait' : 'pointer', color: GOLD }}>
            {uploading ? 'Envoi…' : value ? "Changer l'avatar" : 'Choisir une image'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} style={{ ...inputStyle, width: 'auto', cursor: 'pointer', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
              Retirer
            </button>
          )}
        </div>
        <span style={hintStyle}>JPEG, PNG, WebP ou AVIF · 5 Mo max · carré de préférence (affiché en rond)</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

interface UnansweredQuestion {
  id: string;
  question: string;
  reason: 'fallback' | 'no_results';
  occurrences: number;
  last_seen_at: string;
}

const REASON_LABEL: Record<UnansweredQuestion['reason'], string> = {
  fallback: 'Réponse introuvable',
  no_results: 'Aucun produit trouvé',
};

export default function AssistantIaPage() {
  const [config, setConfig] = useState<AssistantConfig>(DEFAULT_ASSISTANT_CONFIG);
  const [saved, setSaved] = useState<string>(JSON.stringify(DEFAULT_ASSISTANT_CONFIG));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [setupRequired, setSetupRequired] = useState(false);
  const knowledgeRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(config) !== saved;

  function notify(type: 'ok' | 'error', text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), TOAST_DURATION_LONG_MS);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/ai-assistant');
        const json = (await res.json()) as { config?: AssistantConfig; error?: string };
        if (!res.ok || !json.config) throw new Error(json.error ?? 'Chargement impossible');
        if (!cancelled) {
          setConfig(json.config);
          setSaved(JSON.stringify(json.config));
        }
      } catch (err) {
        if (!cancelled) notify('error', err instanceof Error ? err.message : 'Chargement impossible');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/ai-assistant/questions');
        const json = (await res.json()) as { questions?: UnansweredQuestion[]; setupRequired?: boolean };
        if (!cancelled && res.ok) {
          setQuestions(json.questions ?? []);
          setSetupRequired(Boolean(json.setupRequired));
        }
      } catch {
        // The journal is optional: the rest of the page works without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function resolveQuestion(id: string, method: 'PATCH' | 'DELETE') {
    const res = await fetch(
      method === 'DELETE' ? `/api/admin/ai-assistant/questions?id=${id}` : '/api/admin/ai-assistant/questions',
      method === 'PATCH'
        ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }
        : { method },
    );
    if (!res.ok) {
      notify('error', 'Action impossible, réessayez.');
      return false;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    return true;
  }

  async function teachQuestion(q: UnansweredQuestion) {
    if (config.knowledge.length >= ASSISTANT_LIMITS.knowledgeEntries) {
      notify('error', "Limite de connaissances atteinte : supprimez-en une d'abord.");
      return;
    }
    if (!(await resolveQuestion(q.id, 'PATCH'))) return;
    update('knowledge', [...config.knowledge, { id: crypto.randomUUID(), title: q.question.slice(0, ASSISTANT_LIMITS.knowledgeTitle), content: '', active: true }]);
    knowledgeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notify('ok', 'Fiche créée : rédigez la réponse puis enregistrez.');
  }

  function update<K extends keyof AssistantConfig>(key: K, value: AssistantConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function updateEntry(id: string, patch: Partial<KnowledgeEntry>) {
    update('knowledge', config.knowledge.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function addEntry() {
    if (config.knowledge.length >= ASSISTANT_LIMITS.knowledgeEntries) return;
    update('knowledge', [...config.knowledge, { id: crypto.randomUUID(), title: '', content: '', active: true }]);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ai-assistant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const json = (await res.json()) as { config?: AssistantConfig; error?: string };
      if (!res.ok || !json.config) throw new Error(json.error ?? 'Enregistrement impossible');
      setConfig(json.config);
      setSaved(JSON.stringify(json.config));
      notify('ok', "Assistant mis à jour — c'est en ligne immédiatement.");
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: '#888', padding: 32 }}>Chargement…</p>;
  }

  const activeCount = config.knowledge.filter((e) => e.active).length;
  const knowledgeChars = config.knowledge.filter((e) => e.active).reduce((n, e) => n + e.content.length + e.title.length, 0);

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Assistant IA</h1>
          <p style={{ color: '#888', fontSize: 14, maxWidth: 560 }}>
            Personnalisez le conseiller qui répond à vos clients (nom, avatar, style) et enseignez-lui ce qui est propre à votre boutique.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {dirty && <span style={{ color: 'var(--warning)', fontSize: 12 }}>Modifications non enregistrées</span>}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !dirty}
            style={{ background: GOLD, color: 'var(--noir)', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, fontSize: 14, cursor: saving || !dirty ? 'not-allowed' : 'pointer', opacity: saving || !dirty ? 0.5 : 1 }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {toast && (
        <div role="status" style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13, background: toast.type === 'ok' ? tint('var(--success)', 15) : tint('var(--danger)', 15), color: toast.type === 'ok' ? 'var(--success)' : 'var(--danger)' }}>
          {toast.text}
        </div>
      )}

      <Card title="Identité" subtitle="Ce que le client voit dans le chat.">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
          <div>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Assistant actif sur la boutique</p>
            <p style={hintStyle}>Désactivé, le bouton de chat disparaît du site et l&apos;API répond « indisponible ».</p>
          </div>
          <Toggle value={config.enabled} onChange={(v) => update('enabled', v)} label="Activer l'assistant" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>Nom de l&apos;assistant *</span>
            <input style={inputStyle} value={config.name} maxLength={ASSISTANT_LIMITS.name} onChange={(e) => update('name', e.target.value)} placeholder="ex : Aïcha" />
            <span style={hintStyle}>Le prénom que le client voit et que l&apos;assistant utilise pour se présenter.</span>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>Titre / rôle</span>
            <input style={inputStyle} value={config.title} maxLength={ASSISTANT_LIMITS.title} onChange={(e) => update('title', e.target.value)} placeholder="ex : Conseillère olfactive" />
            <span style={hintStyle}>Affiché sous le nom. Laissez vide pour afficher le nom de la boutique.</span>
          </label>
        </div>

        <div style={{ marginBottom: 20 }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: 10 }}>Avatar</span>
          <AvatarUpload value={config.avatar_url} name={config.name} onChange={(url) => update('avatar_url', url)} onError={(m) => notify('error', m)} />
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          <span style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
            Message d&apos;accueil <Counter value={config.welcome_message} max={ASSISTANT_LIMITS.welcome} />
          </span>
          <textarea
            style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }}
            value={config.welcome_message}
            maxLength={ASSISTANT_LIMITS.welcome}
            onChange={(e) => update('welcome_message', e.target.value)}
            placeholder={buildWelcomeMessage({ ...config, welcome_message: '' })}
          />
          <span style={hintStyle}>Laissez vide pour utiliser le message par défaut (affiché en grisé ci-dessus).</span>
        </label>

        <div>
          <span style={{ ...labelStyle, display: 'block', marginBottom: 10 }}>Style de communication</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
            {(Object.keys(ASSISTANT_TONES) as AssistantToneId[]).map((id) => {
              const active = config.tone === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => update('tone', id)}
                  aria-pressed={active}
                  style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', background: active ? tint(GOLD, 12) : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.08)'}` }}
                >
                  <span style={{ display: 'block', color: active ? GOLD : '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{ASSISTANT_TONES[id].label}</span>
                  <span style={{ display: 'block', color: '#888', fontSize: 11, lineHeight: 1.4 }}>{ASSISTANT_TONES[id].description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card title="Aperçu" subtitle="Rendu approximatif de l'en-tête et du premier message sur le site.">
        <div style={{ maxWidth: 380, borderRadius: 14, overflow: 'hidden', border: `1px solid ${tint(GOLD, 15)}`, background: 'var(--noir-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${tint(GOLD, 12)}` }}>
            <Avatar url={config.avatar_url} name={config.name} size={38} />
            <div>
              <p style={{ color: GOLD, fontSize: 15, fontWeight: 600 }}>{config.name || 'Nom'}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{config.title || 'Nom de la boutique'} · Assistant IA</p>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ maxWidth: '88%', background: 'rgba(255,255,255,0.06)', color: '#eee', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {buildWelcomeMessage(config)}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Questions sans réponse" subtitle="Ce que vos clients ont demandé et que l'assistant n'a pas su traiter. Cliquez sur « Enseigner » pour créer une fiche de connaissance à partir d'une question.">
        {setupRequired ? (
          <p style={{ color: 'var(--warning)', fontSize: 13, lineHeight: 1.6 }}>
            Le journal n&apos;est pas encore activé : exécutez le fichier <code>supabase/migrations/20261001000000_assistant_unanswered.sql</code> dans l&apos;éditeur SQL de Supabase, puis rechargez cette page.
          </p>
        ) : questions.length === 0 ? (
          <p style={{ color: '#777', fontSize: 13 }}>Aucune question en attente. Les prochaines questions sans réponse apparaîtront ici.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questions.map((q) => (
              <div key={q.id} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                  <p style={{ color: '#fff', fontSize: 14, marginBottom: 4, overflowWrap: 'anywhere' }}>{q.question}</p>
                  <p style={hintStyle}>
                    {REASON_LABEL[q.reason]} · demandée {q.occurrences} fois · dernière : {new Date(q.last_seen_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => void teachQuestion(q)} style={{ ...inputStyle, width: 'auto', padding: '7px 14px', cursor: 'pointer', color: GOLD }}>
                    Enseigner
                  </button>
                  <button type="button" onClick={() => void resolveQuestion(q.id, 'DELETE')} style={{ ...inputStyle, width: 'auto', padding: '7px 14px', cursor: 'pointer', color: '#999' }}>
                    Ignorer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ ...hintStyle, marginTop: 14 }}>
          Journal anonyme : aucune adresse IP ni identité n&apos;est enregistrée, les e-mails et numéros sont masqués, et les questions sont supprimées automatiquement après 90 jours.
        </p>
      </Card>

      <div ref={knowledgeRef} style={{ scrollMarginTop: 80 }} />
      <Card title="Base de connaissances" subtitle="Nourrissez l'assistant avec ce que lui seul ne peut pas deviner : politique maison, conseils de l'équipe, réponses types, offres du moment…">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {config.knowledge.length === 0 && (
            <p style={{ color: '#777', fontSize: 13, padding: '8px 0' }}>
              Aucune connaissance ajoutée. Exemples : « Comment choisir son premier parfum », « Politique d&apos;échange », « Offre de la fête des mères »…
            </p>
          )}
          {config.knowledge.map((entry) => (
            <div key={entry.id} style={{ border: `1px solid ${entry.active ? tint(GOLD, 25) : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: 16, opacity: entry.active ? 1 : 0.55 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <input style={{ ...inputStyle, flex: 1 }} value={entry.title} maxLength={ASSISTANT_LIMITS.knowledgeTitle} onChange={(e) => updateEntry(entry.id, { title: e.target.value })} placeholder="Titre (ex : Politique d'échange)" aria-label="Titre de la connaissance" />
                <Toggle value={entry.active} onChange={(v) => updateEntry(entry.id, { active: v })} label="Connaissance active" />
                <button
                  type="button"
                  onClick={() => update('knowledge', config.knowledge.filter((e) => e.id !== entry.id))}
                  aria-label="Supprimer cette connaissance"
                  style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
              <textarea style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }} value={entry.content} maxLength={ASSISTANT_LIMITS.knowledgeContent} onChange={(e) => updateEntry(entry.id, { content: e.target.value })} placeholder="Ce que l'assistant doit savoir et pouvoir répéter aux clients…" aria-label="Contenu de la connaissance" />
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <Counter value={entry.content} max={ASSISTANT_LIMITS.knowledgeContent} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={addEntry} disabled={config.knowledge.length >= ASSISTANT_LIMITS.knowledgeEntries} style={{ ...inputStyle, width: 'auto', cursor: 'pointer', color: GOLD }}>
            + Ajouter une connaissance
          </button>
          <span style={hintStyle}>
            {activeCount} active{activeCount > 1 ? 's' : ''} · {config.knowledge.length}/{ASSISTANT_LIMITS.knowledgeEntries} · ≈ {knowledgeChars.toLocaleString('fr-FR')} caractères envoyés à chaque conversation
          </span>
        </div>
      </Card>

      <Card title="Consignes personnalisées" subtitle="Des instructions de comportement en plus de celles déjà intégrées. Elles ne peuvent pas lever la règle « ne jamais inventer ».">
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
            Consignes <Counter value={config.custom_instructions} max={ASSISTANT_LIMITS.instructions} />
          </span>
          <textarea
            style={{ ...inputStyle, minHeight: 130, resize: 'vertical' }}
            value={config.custom_instructions}
            maxLength={ASSISTANT_LIMITS.instructions}
            onChange={(e) => update('custom_instructions', e.target.value)}
            placeholder={"Ex :\n- Toujours proposer la création sur mesure pour un cadeau.\n- Ne jamais parler des produits d'une autre marque.\n- Mentionner la promotion de la semaine quand c'est pertinent."}
          />
        </label>
      </Card>

      <Card title="Ce que l'assistant apprend tout seul" subtitle="Lu en direct sur votre site à chaque conversation : si vous modifiez ces pages, l'assistant est à jour immédiatement.">
        <ul style={{ margin: 0, paddingLeft: 18, color: '#bbb', fontSize: 13, lineHeight: 1.8 }}>
          {AUTO_SOURCES.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
