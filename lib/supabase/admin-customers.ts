import { createClient } from './server';
import { ADMIN_PAGE_DEFAULT, ADMIN_LIMIT_DEFAULT } from '@/lib/constants';

/** Get all customers (profiles with basic info) */
export async function getAdminCustomers(page = ADMIN_PAGE_DEFAULT, limit = ADMIN_LIMIT_DEFAULT) {
  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) return { customers: [], total: 0, page, totalPages: 0 };

  return {
    customers: data.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
    })),
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}
