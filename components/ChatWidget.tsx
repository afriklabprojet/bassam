'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '@/lib/site-settings-context';
import type { PublicAssistantConfig } from '@/lib/ai/assistant-config';
import ChatMarkdown from '@/components/ChatMarkdown';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const STORAGE_KEY = 'vip-chat-memory-v2';
const LEGACY_STORAGE_KEY = 'vip-chat-memory-v1';
const MEMORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_STORED_MESSAGES = 40;
const MAX_SENT_MESSAGES = 30;
const MAX_INPUT_LENGTH = 2000;
/** Below this width the chat opens full-screen (Tailwind's `md` breakpoint). */
const MOBILE_MAX_WIDTH_PX = 767;

const SUGGESTIONS = [
  'Je cherche un parfum pour homme',
  'Un parfum pour femme, floral',
  "C'est quoi la création sur mesure ?",
  'Quels sont vos modes de livraison ?',
];

/** The saved conversation never includes the greeting: it always reflects the current admin config. */
function loadMemory(): ChatMessage[] {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { savedAt?: number; messages?: ChatMessage[] };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MEMORY_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return (parsed.messages ?? []).filter(
      (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length > 0,
    );
  } catch {
    return [];
  }
}

function saveMemory(messages: ChatMessage[]) {
  try {
    if (messages.length === 0) {
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

function Avatar({ assistant, size }: Readonly<{ assistant: PublicAssistantConfig; size: number }>) {
  if (assistant.avatar_url) {
    return (
      <Image
        src={assistant.avatar_url}
        alt={assistant.name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
        color: 'var(--noir)',
        fontFamily: 'var(--font-serif)',
        fontWeight: 600,
        fontSize: size * 0.45,
      }}
    >
      {assistant.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default function ChatWidget({ assistant }: Readonly<{ assistant: PublicAssistantConfig }>) {
  const settings = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  // Restored from the previous visit. Safe for hydration: messages are only rendered
  // once the panel is open, never in the server-rendered markup.
  const [messages, setMessages] = useState<ChatMessage[]>(loadMemory);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist once a reply is complete, so a half-streamed answer is never stored.
  useEffect(() => {
    if (!isStreaming) saveMemory(messages);
  }, [messages, isStreaming]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  // Full-screen on phones: lock the page behind the panel, close with Escape.
  useEffect(() => {
    if (!isOpen) return;
    const lockScroll = window.innerWidth <= MOBILE_MAX_WIDTH_PX;
    const previousOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  function startNewConversation() {
    if (isStreaming) return;
    setMessages([]);
    setInput('');
  }

  async function sendMessage(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || isStreaming) return;

    const history: ChatMessage[] = [...messages, { role: 'user', content: text }];
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
        body: JSON.stringify({ messages: history.slice(-MAX_SENT_MESSAGES) }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setLastAssistant(data?.error ?? 'Une erreur est survenue. Réessayez dans un instant.');
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

  const canSend = !isStreaming && input.trim().length > 0;

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-label={`Discuter avec ${assistant.name}`}
          className="fixed inset-0 z-[60] flex flex-col md:inset-auto md:bottom-36 md:right-4 md:z-40 md:h-[min(560px,calc(100vh-8rem))] md:w-[min(380px,calc(100vw-2rem))] md:rounded-[var(--r-lg)] lg:bottom-24 lg:right-6"
          style={{
            background: 'var(--noir-card)',
            border: '1px solid rgba(197,165,90,0.15)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between gap-3"
            style={{
              padding: '0.875rem 1.125rem',
              paddingTop: 'max(0.875rem, env(safe-area-inset-top))',
              borderBottom: '1px solid rgba(197,165,90,0.12)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar assistant={assistant} size={38} />
              <div className="min-w-0">
                <p className="truncate" style={{ color: 'var(--gold)', fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontWeight: 600 }}>
                  {assistant.name}
                </p>
                <p className="truncate" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6875rem' }}>
                  {assistant.title || settings.site_name} · Assistant IA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {messages.length > 0 && (
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
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.75rem', lineHeight: 1, padding: '0 0.25rem' }}
              >
                ×
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                alignSelf: 'flex-start',
                maxWidth: '88%',
                background: 'rgba(255,255,255,0.06)',
                color: '#eee',
                padding: '0.625rem 0.875rem',
                borderRadius: 12,
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}
            >
              {assistant.welcome}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void sendMessage(suggestion)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(197,165,90,0.35)',
                      color: 'var(--gold)',
                      borderRadius: 999,
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  background: m.role === 'user' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                  color: m.role === 'user' ? 'var(--noir)' : '#eee',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 12,
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  whiteSpace: m.role === 'user' ? 'pre-wrap' : 'normal',
                  overflowWrap: 'anywhere',
                }}
              >
                {m.role === 'user' ? (
                  m.content
                ) : m.content ? (
                  <ChatMarkdown text={m.content} />
                ) : (
                  isStreaming && i === messages.length - 1 && '…'
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex items-center gap-2"
            style={{
              padding: '0.75rem',
              paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
              borderTop: '1px solid rgba(197,165,90,0.12)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question sur nos parfums…"
              aria-label="Votre message"
              disabled={isStreaming}
              maxLength={MAX_INPUT_LENGTH}
              // 16px on phones: smaller sizes make iOS Safari zoom the page on focus.
              className="flex-1 text-base md:text-[0.8125rem]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(197,165,90,0.15)',
                borderRadius: 8,
                padding: '0.625rem 0.75rem',
                color: '#fff',
                outline: 'none',
                minWidth: 0,
              }}
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Envoyer"
              style={{
                background: 'var(--gold)',
                color: 'var(--noir)',
                border: 'none',
                borderRadius: 8,
                padding: '0.625rem 0.875rem',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: canSend ? 'pointer' : 'not-allowed',
                opacity: canSend ? 1 : 0.5,
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
        aria-label={isOpen ? 'Fermer le chat' : `Discuter avec ${assistant.name}`}
        aria-expanded={isOpen}
        // Phones: above the bottom navigation bar, hidden while the full-screen panel is open.
        className={`fixed bottom-20 right-4 z-40 flex items-center justify-center lg:bottom-6 lg:right-[5.5rem] ${isOpen ? 'max-md:hidden' : ''}`}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))',
          color: 'var(--noir)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(197,165,90,0.35)',
          cursor: 'pointer',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {assistant.avatar_url && !isOpen ? (
          <Image
            src={assistant.avatar_url}
            alt=""
            width={56}
            height={56}
            style={{ width: 56, height: 56, objectFit: 'cover' }}
          />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
        )}
      </button>
    </>
  );
}
