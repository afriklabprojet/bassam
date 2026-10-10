import { createClient } from './server';

/**
 * Check if the current user is an admin.
 * L'utilisateur vient des cookies du site, ou du jeton `Authorization: Bearer` de l'application
 * mobile (voir `createClient`). Dans les deux cas le rôle est relu auprès de Supabase Auth.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return user.app_metadata?.role === 'admin';
}

export { getDashboardStats, getTopProducts, getLowStockProducts, getPaymentMethodStats, getTopCustomers, getRecentOrders } from './admin-stats';
export { getAdminOrders, getOrderCountByPhone, updateOrderStatus } from './admin-orders';
export { getAdminProducts, createProduct, updateProduct, deleteProduct } from './admin-products';
export { getAdminCustomers } from './admin-customers';
