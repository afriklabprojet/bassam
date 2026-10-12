import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  describePlan,
  formatRefusal,
  planTarget,
  verifyRemoteIdentity,
} from './lib/target-guard.ts';

const plan = planTarget({
  operation: 'validate-supabase-test',
  argv: process.argv.slice(2),
  processEnv: process.env,
});

if (!plan.ok) {
  console.error(formatRefusal(plan));
  process.exit(1);
}

console.log(describePlan(plan).join('\n'));

if (plan.simulate) {
  console.log(
    '\nSIMULATION : aucune requête distante et aucune donnée créée. Ajoutez --apply après avoir vérifié la cible.',
  );
  process.exit(0);
}

const identity = await verifyRemoteIdentity(plan);
if (!identity.ok) {
  console.error(formatRefusal(identity));
  process.exit(1);
}

const projectRef = plan.ref;
const supabaseUrl = plan.origin;
const anonKey = plan.secrets.anonKey;
const serviceRoleKey = plan.secrets.serviceKey;
const appBaseUrl = plan.appOrigin;

if (!projectRef || !anonKey || !serviceRoleKey) {
  throw new Error('Validated Supabase test configuration is incomplete');
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};

const service = createClient(supabaseUrl, serviceRoleKey, clientOptions);
const anonymous = createClient(supabaseUrl, anonKey, clientOptions);
const suffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const password = `Test-${randomBytes(18).toString('base64url')}!`;

const identities = {
  admin: {
    email: `bassam-admin-${suffix}@example.com`,
    appMetadata: { role: 'admin' },
  },
  client: {
    email: `bassam-client-${suffix}@example.com`,
    appMetadata: { role: 'customer' },
  },
  noRole: {
    email: `bassam-no-role-${suffix}@example.com`,
    appMetadata: {},
  },
};

const createdUserIds = [];
const cleanup = {
  orderId: randomUUID(),
  promoCode: `TEST-${suffix}`.toUpperCase(),
  reviewId: randomUUID(),
  storagePaths: [],
};

let passed = 0;

function pass(label) {
  passed += 1;
  console.log(`PASS ${label}`);
}

function requireCondition(condition, label) {
  if (!condition) throw new Error(label);
  pass(label);
}

function requireNoError(error, label) {
  if (error) {
    throw new Error(`${label}: ${error.code ?? 'unknown'} ${error.message}`);
  }
  pass(label);
}

function requireError(error, label) {
  if (!error) throw new Error(`${label}: operation unexpectedly succeeded`);
  pass(label);
}

async function createIdentity(identity) {
  const { data, error } = await service.auth.admin.createUser({
    email: identity.email,
    password,
    email_confirm: true,
    app_metadata: identity.appMetadata,
  });
  if (error || !data.user) {
    throw new Error(`Unable to create test identity: ${error?.message ?? 'missing user'}`);
  }
  createdUserIds.push(data.user.id);
  return data.user;
}

async function authenticate(email) {
  const authClient = createClient(supabaseUrl, anonKey, clientOptions);
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Unable to authenticate test identity: ${error?.message ?? 'missing session'}`);
  }
  return data.session;
}

function asBearer(accessToken) {
  return createClient(supabaseUrl, anonKey, {
    ...clientOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function sessionCookie(session) {
  const name = `sb-${projectRef}-auth-token`;
  const encoded = `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')}`;
  const chunkSize = 3180;

  if (encoded.length <= chunkSize) {
    return `${name}=${encoded}`;
  }

  return Array.from(
    { length: Math.ceil(encoded.length / chunkSize) },
    (_, index) => `${name}.${index}=${encoded.slice(index * chunkSize, (index + 1) * chunkSize)}`,
  ).join('; ');
}

async function testProfileProtection(clientUser, client) {
  const normalUpdate = await client
    .from('profiles')
    .update({ preferences: { theme: 'dark' } })
    .eq('id', clientUser.id);
  requireNoError(normalUpdate.error, 'F1 allows ordinary profile preferences');

  const escalation = await client
    .from('profiles')
    .update({ preferences: { theme: 'dark', role: 'admin' } })
    .eq('id', clientUser.id);
  requireError(escalation.error, 'F1 rejects profile role escalation');

  const adminLevel = await client
    .from('profiles')
    .update({ preferences: { theme: 'dark', admin_level: 'super' } })
    .eq('id', clientUser.id);
  requireError(adminLevel.error, 'F1 rejects profile admin_level escalation');

  const { data, error } = await service
    .from('profiles')
    .select('preferences')
    .eq('id', clientUser.id)
    .single();
  if (error) throw new Error(`Unable to verify profile protection: ${error.message}`);
  requireCondition(
    data.preferences?.role === undefined && data.preferences?.admin_level === undefined,
    'F1 leaves protected profile keys unchanged',
  );
}

async function testAdminPolicies(admin, client) {
  const clientInsert = await client.from('promo_codes').insert({
    code: `${cleanup.promoCode}-DENIED`,
    type: 'percentage',
    value: 10,
  });
  requireError(clientInsert.error, 'F1 rejects client promo-code administration');

  const adminInsert = await admin.from('promo_codes').insert({
    code: cleanup.promoCode,
    type: 'percentage',
    value: 10,
    min_order_amount: 0,
    is_active: true,
  });
  requireNoError(adminInsert.error, 'F1 allows verified-admin promo-code administration');
}

async function testOrders(clientUser, client) {
  const directOrder = await client.from('orders').insert({
    id: randomUUID(),
    user_id: clientUser.id,
    total_amount: 100,
    shipping_address: {},
    phone: '+000000000',
    email: identities.client.email,
  });
  requireError(directOrder.error, 'F3 rejects direct client order creation');

  const serviceOrder = await service.from('orders').insert({
    id: cleanup.orderId,
    user_id: clientUser.id,
    total_amount: 100,
    shipping_address: {},
    phone: '+000000000',
    email: identities.client.email,
  });
  requireNoError(serviceOrder.error, 'F3 allows service order creation');

  const directItem = await client.from('order_items').insert({
    order_id: cleanup.orderId,
    product_id: null,
    quantity: 1,
    unit_price: 100,
  });
  requireError(directItem.error, 'F3 rejects direct client order-item creation');

  const serviceItem = await service.from('order_items').insert({
    order_id: cleanup.orderId,
    product_id: null,
    quantity: 1,
    unit_price: 100,
  });
  requireNoError(serviceItem.error, 'F3 allows service order-item creation');
}

async function testPromoPrivacy() {
  const { data, error } = await anonymous
    .from('promo_codes')
    .select('id')
    .eq('code', cleanup.promoCode);
  requireNoError(error, 'F4 anonymous promo-code query completes safely');
  requireCondition(data.length === 0, 'F4 hides promo codes from anonymous clients');
}

async function testReviews(admin, client) {
  const publicSubmission = await anonymous.from('reviews').insert({
    id: cleanup.reviewId,
    name: 'Test Client',
    ville: 'Test City',
    texte: 'Test review',
    rating: 5,
    is_approved: false,
    source: 'website',
  });
  requireNoError(publicSubmission.error, 'F5 accepts an unapproved website review');

  const publicApproval = await anonymous.from('reviews').insert({
    name: 'Test Client',
    ville: 'Test City',
    texte: 'Approved review',
    rating: 5,
    is_approved: true,
    source: 'website',
  });
  requireError(publicApproval.error, 'F5 rejects public review self-approval');

  const forgedSource = await anonymous.from('reviews').insert({
    name: 'Test Client',
    ville: 'Test City',
    texte: 'Forged source',
    rating: 5,
    is_approved: false,
    source: 'admin',
  });
  requireError(forgedSource.error, 'F5 rejects forged review sources');

  const clientModeration = await client
    .from('reviews')
    .update({ is_approved: true })
    .eq('id', cleanup.reviewId)
    .select('id');
  requireNoError(clientModeration.error, 'F5 client moderation request is safely filtered');
  requireCondition(clientModeration.data.length === 0, 'F5 prevents client review moderation');

  const adminModeration = await admin
    .from('reviews')
    .update({ is_approved: true })
    .eq('id', cleanup.reviewId)
    .select('id');
  requireNoError(adminModeration.error, 'F5 allows verified-admin review moderation');
  requireCondition(adminModeration.data.length === 1, 'F5 updates exactly one review for admin');
}

async function testStorage(admin, client) {
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const clientPath = `preproduction/${suffix}-client.png`;
  const adminPath = `preproduction/${suffix}-admin.png`;

  const denied = await client.storage
    .from('product-images')
    .upload(clientPath, bytes, { contentType: 'image/png' });
  requireError(denied.error, 'F2 rejects client Storage uploads');

  const uploaded = await admin.storage
    .from('product-images')
    .upload(adminPath, bytes, { contentType: 'image/png' });
  requireNoError(uploaded.error, 'F2 allows verified-admin Storage uploads');
  cleanup.storagePaths.push(adminPath);

  const publicUrl = admin.storage.from('product-images').getPublicUrl(adminPath).data.publicUrl;
  const response = await fetch(publicUrl);
  requireCondition(response.ok, 'F2 preserves public product-image reads');

  const removed = await admin.storage.from('product-images').remove([adminPath]);
  requireNoError(removed.error, 'F2 allows verified-admin Storage deletion');
  cleanup.storagePaths = cleanup.storagePaths.filter((path) => path !== adminPath);
}

async function testApplicationRoutes(adminSession, clientSession) {
  if (!appBaseUrl) return;

  const adminCookie = sessionCookie(adminSession);

  const cookieAdmin = await fetch(`${appBaseUrl}/api/admin/reviews`, {
    headers: { Cookie: adminCookie },
  });
  requireCondition(cookieAdmin.status === 200, 'admin cookie session receives 200');

  const invalid = await fetch(`${appBaseUrl}/api/admin/reviews`, {
    headers: { Authorization: 'Bearer invalid-test-token' },
  });
  requireCondition(invalid.status === 401, 'invalid Bearer receives 401');

  const invalidWithCookie = await fetch(`${appBaseUrl}/api/admin/reviews`, {
    headers: {
      Authorization: 'Bearer invalid-test-token',
      Cookie: adminCookie,
    },
  });
  requireCondition(
    invalidWithCookie.status === 401,
    'invalid Bearer never does not fall back to a valid admin cookie',
  );

  const client = await fetch(`${appBaseUrl}/api/admin/reviews`, {
    headers: { Authorization: `Bearer ${clientSession.access_token}` },
  });
  requireCondition(client.status === 403, 'non-admin Bearer receives 403');

  const admin = await fetch(`${appBaseUrl}/api/admin/reviews`, {
    headers: { Authorization: `Bearer ${adminSession.access_token}` },
  });
  requireCondition(admin.status === 200, 'admin Bearer receives 200');

  const validPromo = await fetch(`${appBaseUrl}/api/promo-codes/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: cleanup.promoCode, orderAmount: 1000 }),
  });
  const validPromoBody = await validPromo.json();
  requireCondition(
    validPromo.status === 200 && validPromoBody.valid === true,
    'F4 server route validates an exact promo code',
  );

  const invalidPromo = await fetch(`${appBaseUrl}/api/promo-codes/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: `${cleanup.promoCode}-UNKNOWN`, orderAmount: 1000 }),
  });
  const invalidPromoBody = await invalidPromo.json();
  requireCondition(
    invalidPromo.status === 200 && invalidPromoBody.valid === false,
    'F4 server route rejects an unknown promo code',
  );
}

async function cleanupTestData() {
  const failures = [];

  if (cleanup.storagePaths.length > 0) {
    const { error } = await service.storage.from('product-images').remove(cleanup.storagePaths);
    if (error) failures.push(`storage: ${error.message}`);
  }

  for (const [table, column, value] of [
    ['order_items', 'order_id', cleanup.orderId],
    ['orders', 'id', cleanup.orderId],
    ['reviews', 'id', cleanup.reviewId],
    ['promo_codes', 'code', cleanup.promoCode],
    ['promo_codes', 'code', `${cleanup.promoCode}-DENIED`],
  ]) {
    const { error } = await service.from(table).delete().eq(column, value);
    if (error) failures.push(`${table}: ${error.message}`);
  }

  for (const userId of createdUserIds.reverse()) {
    const { error } = await service.auth.admin.deleteUser(userId);
    if (error) failures.push(`auth user: ${error.message}`);
  }

  if (failures.length > 0) {
    throw new Error(`Cleanup failed: ${failures.join('; ')}`);
  }
}

let validationError;

try {
  await createIdentity(identities.admin);
  const clientUser = await createIdentity(identities.client);
  await createIdentity(identities.noRole);
  pass('created three fictitious Auth identities');

  const adminSession = await authenticate(identities.admin.email);
  const clientSession = await authenticate(identities.client.email);
  await authenticate(identities.noRole.email);
  pass('issued real Supabase sessions for all test roles');

  const admin = asBearer(adminSession.access_token);
  const client = asBearer(clientSession.access_token);

  await testProfileProtection(clientUser, client);
  await testAdminPolicies(admin, client);
  await testOrders(clientUser, client);
  await testPromoPrivacy();
  await testReviews(admin, client);
  await testStorage(admin, client);
  await testApplicationRoutes(adminSession, clientSession);
} catch (error) {
  validationError = error;
} finally {
  try {
    await cleanupTestData();
    pass('removed every temporary Auth identity, row, and Storage object');
  } catch (cleanupError) {
    validationError = validationError
      ? new AggregateError([validationError, cleanupError], 'Validation and cleanup failed')
      : cleanupError;
  }
}

if (validationError) throw validationError;

console.log(`Supabase TEST validation passed (${passed} checks).`);
