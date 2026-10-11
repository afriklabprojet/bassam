import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockIsAdmin = vi.fn();
const mockGetAllReviews = vi.fn();
const mockSetReviewApproval = vi.fn();
const mockDeleteReview = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  isCurrentUserAdmin: () => mockIsAdmin(),
}));

vi.mock('@/lib/supabase/reviews', () => ({
  getAllReviews: () => mockGetAllReviews(),
  setReviewApproval: (id: string, approved: boolean) => mockSetReviewApproval(id, approved),
  deleteReview: (id: string) => mockDeleteReview(id),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

const request = (body: unknown) =>
  new NextRequest('http://localhost/api/admin/reviews', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('/api/admin/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin.mockResolvedValue(true);
    mockGetAllReviews.mockResolvedValue([]);
    mockSetReviewApproval.mockResolvedValue(undefined);
    mockDeleteReview.mockResolvedValue(undefined);
  });

  it('refuse un non-administrateur sans lire les avis', async () => {
    mockIsAdmin.mockResolvedValue(false);
    const { GET } = await import('@/app/api/admin/reviews/route');
    const response = await GET();
    expect(response.status).toBe(403);
    expect(mockGetAllReviews).not.toHaveBeenCalled();
  });

  it('renvoie les avis à un administrateur', async () => {
    const reviews = [{ id: 'review-1' }];
    mockGetAllReviews.mockResolvedValue(reviews);
    const { GET } = await import('@/app/api/admin/reviews/route');
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reviews });
  });

  it('ne masque pas un refus de lecture de la base comme une liste vide', async () => {
    mockGetAllReviews.mockRejectedValue(new Error('RLS denied'));
    const { GET } = await import('@/app/api/admin/reviews/route');
    const response = await GET();
    expect(response.status).toBe(500);
  });

  it.each([
    ['approve', true],
    ['reject', false],
  ])('applique l’action %s', async (action, approved) => {
    const { PATCH } = await import('@/app/api/admin/reviews/route');
    const response = await PATCH(request({ id: 'review-1', action }));
    expect(response.status).toBe(200);
    expect(mockSetReviewApproval).toHaveBeenCalledWith('review-1', approved);
  });

  it('supprime un avis', async () => {
    const { PATCH } = await import('@/app/api/admin/reviews/route');
    const response = await PATCH(request({ id: 'review-1', action: 'delete' }));
    expect(response.status).toBe(200);
    expect(mockDeleteReview).toHaveBeenCalledWith('review-1');
  });

  it('ne renvoie pas un succès si la base refuse la modération', async () => {
    mockSetReviewApproval.mockRejectedValue(new Error('RLS denied'));
    const { PATCH } = await import('@/app/api/admin/reviews/route');
    const response = await PATCH(request({ id: 'review-1', action: 'approve' }));
    expect(response.status).toBe(500);
  });
});
