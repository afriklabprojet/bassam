import { describe, expect, it } from 'vitest';
import { trimChatHistory } from '@/lib/ai/chat-history';

const user = (content: string) => ({ role: 'user' as const, content });
const assistant = (content: string) => ({ role: 'assistant' as const, content });

describe('trimChatHistory', () => {
  it('garde un historique court intact', () => {
    const history = [user('Bonjour'), assistant('Bienvenue'), user('Un parfum boisé ?')];
    expect(trimChatHistory(history)).toEqual(history);
  });

  it('retire le message d accueil de l assistante en tête de conversation', () => {
    const history = [assistant('Bonjour, je suis votre conseillère'), user('Un parfum boisé ?')];
    expect(trimChatHistory(history)).toEqual([user('Un parfum boisé ?')]);
  });

  it('abandonne les tours les plus anciens au-delà du budget', () => {
    const history = [user('a'.repeat(10)), assistant('b'.repeat(10)), user('c'.repeat(10)), assistant('d'.repeat(10)), user('e'.repeat(5))];
    expect(trimChatHistory(history, 30)).toEqual([user('c'.repeat(10)), assistant('d'.repeat(10)), user('e'.repeat(5))]);
  });

  it('recommence toujours par un tour utilisateur après coupure', () => {
    const history = [user('a'.repeat(10)), assistant('b'.repeat(10)), user('c'.repeat(5))];
    expect(trimChatHistory(history, 16)).toEqual([user('c'.repeat(5))]);
  });

  it('renvoie un tableau vide si aucun tour utilisateur ne tient', () => {
    expect(trimChatHistory([assistant('Bonjour')])).toEqual([]);
    expect(trimChatHistory([user('a'.repeat(50))], 10)).toEqual([]);
  });
});
