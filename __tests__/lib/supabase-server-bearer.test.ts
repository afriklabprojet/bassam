import { describe, it, expect, vi, beforeEach } from 'vitest';

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJl';

const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn();
const mockCookies = vi.fn();
const mockHeaders = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

vi.mock('next/headers', () => ({
  cookies: () => mockCookies(),
  headers: () => mockHeaders(),
}));

type ServerOptions = {
  cookies: { getAll(): unknown[]; setAll(c: unknown[]): void };
  global?: { headers: Record<string, string> };
};

function optionsOfLastClient(): ServerOptions {
  return mockCreateServerClient.mock.calls.at(-1)?.[2] as ServerOptions;
}

describe('createClient (lib/supabase/server)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockCreateServerClient.mockImplementation(() => ({ auth: { getUser: mockGetUser } }));
    mockCookies.mockResolvedValue({
      getAll: () => [{ name: 'sb-token', value: 'cookie-value' }],
      set: vi.fn(),
    });
  });

  async function load() {
    const mod = await import('@/lib/supabase/server');
    return mod.createClient;
  }

  it('sans Authorization : utilise les cookies du site, sans toucher à getUser', async () => {
    mockHeaders.mockResolvedValue(new Headers());
    const createClient = await load();
    const client = await createClient();

    expect(optionsOfLastClient().cookies.getAll()).toEqual([{ name: 'sb-token', value: 'cookie-value' }]);
    expect(optionsOfLastClient().global).toBeUndefined();

    await client.auth.getUser();
    expect(mockGetUser).toHaveBeenCalledWith();
  });

  it('avec Bearer : agit au nom du jeton et ignore les cookies', async () => {
    mockHeaders.mockResolvedValue(new Headers({ authorization: `Bearer ${JWT}` }));
    const createClient = await load();
    await createClient();

    expect(optionsOfLastClient().global?.headers).toEqual({ Authorization: `Bearer ${JWT}` });
    expect(optionsOfLastClient().cookies.getAll()).toEqual([]);
    expect(mockCookies).not.toHaveBeenCalled();
  });

  it('avec Bearer : auth.getUser() sans argument vérifie le jeton de la requête', async () => {
    mockHeaders.mockResolvedValue(new Headers({ authorization: `Bearer ${JWT}` }));
    const createClient = await load();
    const client = await createClient();

    const { data } = await client.auth.getUser();
    expect(mockGetUser).toHaveBeenCalledWith(JWT);
    expect(data.user).toEqual({ id: 'u1' });
  });

  it('avec Bearer : un jeton passé explicitement à getUser est conservé', async () => {
    mockHeaders.mockResolvedValue(new Headers({ authorization: `Bearer ${JWT}` }));
    const createClient = await load();
    const client = await createClient();

    await client.auth.getUser('autre.jeton.explicite');
    expect(mockGetUser).toHaveBeenCalledWith('autre.jeton.explicite');
  });

  it('avec Bearer mal formé : n\'envoie aucun jeton et ne retombe pas sur les cookies', async () => {
    mockHeaders.mockResolvedValue(new Headers({ authorization: 'Bearer pas-un-jwt' }));
    const createClient = await load();
    await createClient();

    expect(optionsOfLastClient().global?.headers).toEqual({});
    expect(optionsOfLastClient().cookies.getAll()).toEqual([]);
    expect(mockCookies).not.toHaveBeenCalled();
  });

  it('échoue clairement si Supabase n\'est pas configuré', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_URL', '');
    mockHeaders.mockResolvedValue(new Headers());
    const createClient = await load();
    await expect(createClient()).rejects.toThrow('Supabase is not configured');
  });
});
