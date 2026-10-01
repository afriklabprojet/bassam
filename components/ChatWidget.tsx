'use client';

import { useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '@/lib/site-settings-context';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const STORAGE_KEY = 'vip-chat-memory-v1';
const MEMORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_STORED_MESSAGES = 40;
const MAX_SENT_MESSAGES = 30;

function loadMemory(): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; messages?: ChatMessage[] };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MEMORY_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const valid = (parsed.messages ?? []).filter(
      (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length > 0,
    );
    return valid.length > 1 ? valid : null;
  } catch {
    return null;
  }
}

function saveMemory(messages: ChatMessage[]) {
  try {
    if (messages.length <= 1) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), messages: messages.slice(-MAX_STORED_MESSAGES) }),
    );
  } catch {
    // Storage unavailable (private mode, quota…) — the chat still works, just without memory.
  }
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Bonjour, je suis votre conseillère olfactive. Dites-m'en un peu plus sur vos goûts, l'occasion, ou le budget — je suis là pour vous aider à trouver le parfum qui vous ressemble. 🌸",
};

export default function ChatWidget() {
  const settings = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  // Restored from the previous visit when available. Safe for hydration: messages are only
  // rendered once the panel is open, never in the server-rendered markup.
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMemory() ?? [WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist once a reply is complete, so a half-streamed answer is never stored.
  useEffect(() => {
    if (!isStreaming) saveMemory(messages);
  }, [messages, isStreaming]);

  function startNewConversation() {
    if (isStreaming) return;
    setMessages([WELCOME_MESSAGE]);
    setInput('');
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const history = [...messages, { role: 'user' as const, content: text }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    const setLastAssistant = (content: string) => {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content };
        return next;
      });
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-MAX_SENT_MESSAGES).filter((m) => m.content.length > 0) }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setLastAssistant(data?.error ?? "Désolée, une erreur est survenue. Réessayez dans un instant.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setLastAssistant(acc);
      }
    } catch {
      setLastAssistant('Connexion impossible. Vérifiez votre réseau et réessayez.');
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="hidden md:flex fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-40 flex-col"
          style={{
            width: 'min(380px, calc(100vw - 2rem))',
            height: 'min(560px, calc(100vh - 8rem))',
            background: 'var(--noir-card)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid rgba(197,165,90,0.15)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid rgba(197,165,90,0.12)' }}
          >
            <div>
              <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontWeight: 600 }}>
                Conseillère olfactive
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6875rem' }}>{settings.site_name}</p>
            </div>
            <div className="flex items-center gap-3">
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={startNewConversation}
                  disabled={isStreaming}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: isStreaming ? 'not-allowed' : 'pointer', fontSize: '0.6875rem', textDecoration: 'underline' }}
                >
                  Nouvelle conversation
                </button>
              )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le chat"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}
            >
              ×
            </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.role === 'user' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                  color: m.role === 'user' ? 'var(--noir)' : '#eee',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 12,
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content || (isStreaming && i === messages.length - 1 ? '…' : '')}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex items-center gap-2"
            style={{ padding: '0.75rem', borderTop: '1px solid rgba(197,165,90,0.12)' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question sur nos parfums…"
              disabled={isStreaming}
              maxLength={2000}
              className="flex-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(197,165,90,0.15)',
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
                color: '#fff',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              aria-label="Envoyer"
              style={{
                background: 'var(--gold)',
                color: 'var(--noir)',
                border: 'none',
                borderRadius: 8,
                padding: '0.5rem 0.875rem',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: isStreaming || !input.trim() ? 0.5 : 1,
              }}
            >
              Envoyer
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Fermer le chat' : "Parler à la conseillère olfactive"}
        className="hidden md:flex fixed bottom-20 right-4 lg:bottom-6 lg:right-[5.5rem] z-40 items-center justify-center"
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
          color: 'var(--noir)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(197,165,90,0.35)',
          cursor: 'pointer',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      </button>
    </>
  );
}
