begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(53);

select ok(
  to_regprocedure('public.is_admin()') is not null,
  'F1 installs public.is_admin()'
);

select is(
  (select provolatile from pg_proc where oid = 'public.is_admin()'::regprocedure),
  's'::"char",
  'public.is_admin() is stable'
);

select is(
  (select prosecdef from pg_proc where oid = 'public.is_admin()'::regprocedure),
  false,
  'public.is_admin() is not security definer'
);

select ok(
  (select array_to_string(proconfig, ',') like 'search_path=%'
          and array_to_string(proconfig, ',') not ilike '%public%'
   from pg_proc
   where oid = 'public.is_admin()'::regprocedure),
  'public.is_admin() has an empty search_path'
);

select ok(
  to_regprocedure('public.protect_profile_privileges()') is not null,
  'F1 installs the profile privilege trigger function'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'protect_profile_privileges'
      and tgenabled <> 'D'
  ),
  'F1 enables the profile privilege trigger'
);

select ok(
  (select array_to_string(proconfig, ',') like 'search_path=%'
          and array_to_string(proconfig, ',') not ilike '%public%'
   from pg_proc
   where oid = 'public.protect_profile_privileges()'::regprocedure),
  'profile privilege trigger function has an empty search_path'
);

select is(
  (
    select count(*)::integer
    from pg_proc
    where oid = any (array[
      'public.update_site_settings_timestamp()'::regprocedure,
      'public.update_collections_content_ts()'::regprocedure,
      'public.update_services_content_ts()'::regprocedure,
      'public.update_home_hero_ts()'::regprocedure,
      'public.update_updated_at_column()'::regprocedure,
      'public.handle_new_user()'::regprocedure
    ])
      and array_to_string(proconfig, ',') like 'search_path=%'
      and array_to_string(proconfig, ',') not ilike '%public%'
  ),
  6,
  'all Security Advisor trigger functions have a hardened search_path'
);

select is(
  has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE'),
  false,
  'anonymous clients cannot execute handle_new_user directly'
);

select is(
  has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE'),
  false,
  'authenticated clients cannot execute handle_new_user directly'
);

select is(
  coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('public.rls_auto_enable()'),
      'EXECUTE'
    ),
    false
  ),
  false,
  'anonymous clients cannot execute rls_auto_enable directly'
);

select is(
  coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('public.rls_auto_enable()'),
      'EXECUTE'
    ),
    false
  ),
  false,
  'authenticated clients cannot execute rls_auto_enable directly'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'inventory',
        'inventory_movements',
        'payments',
        'refunds',
        'barcodes',
        'maintenance_logs',
        'stock_alerts',
        'newsletter_campaigns',
        'promo_codes',
        'banners'
      ])
      and (
        coalesce(qual, '') ilike '%preferences%'
        or coalesce(with_check, '') ilike '%preferences%'
      )
  ),
  0,
  'F1 removes profile-preference authorization from admin policies'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'inventory',
        'inventory_movements',
        'payments',
        'refunds',
        'barcodes',
        'maintenance_logs',
        'stock_alerts',
        'newsletter_campaigns',
        'promo_codes',
        'banners'
      ])
      and policyname = 'Admins manage ' || tablename
      and coalesce(qual, '') ilike '%is_admin%'
      and coalesce(with_check, '') ilike '%is_admin%'
  ),
  10,
  'F1 installs verified-admin policies on every sensitive table'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product-images: upload admin'
      and cmd = 'INSERT'
      and roles @> array['authenticated']::name[]
      and coalesce(with_check, '') ilike '%is_admin%'
  ),
  'F2 restricts product image uploads to verified admins'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product-images: suppression admin'
      and cmd = 'DELETE'
      and roles @> array['authenticated']::name[]
      and coalesce(qual, '') ilike '%is_admin%'
  ),
  'F2 restricts product image deletion to verified admins'
);

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'product-images'
  ),
  'F2 provisions the product-images bucket'
);

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'product-images'
      and public
      and file_size_limit = 5242880
  ),
  'product-images is public with a 5 MiB limit'
);

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'product-images'
      and allowed_mime_types @> array[
        'image/avif',
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        'image/webp',
        'image/x-icon'
      ]::text[]
  ),
  'product-images accepts every MIME type used by application upload routes'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in ('orders', 'order_items')
      and cmd = 'INSERT'
  ),
  0,
  'F3 removes direct order and order-item INSERT policies'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'promo_codes'
      and cmd = 'SELECT'
      and (
        roles @> array['public']::name[]
        or roles @> array['anon']::name[]
      )
  ),
  0,
  'F4 removes public promo-code SELECT policies'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'Submission publique'
      and cmd = 'INSERT'
      and roles @> array['anon', 'authenticated']::name[]
      and coalesce(with_check, '') ilike '%is_approved%false%'
      and coalesce(with_check, '') ilike '%source%website%'
  ),
  'F5 only accepts unapproved website review submissions'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'Admins manage reviews'
      and cmd = 'ALL'
      and roles @> array['authenticated']::name[]
      and coalesce(qual, '') ilike '%is_admin%'
      and coalesce(with_check, '') ilike '%is_admin%'
  ),
  'F5 reserves review moderation for verified admins'
);

select is(
  (
    select count(*)::integer
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relname = any (array[
        'profiles',
        'orders',
        'order_items',
        'promo_codes',
        'reviews',
        'inventory',
        'inventory_movements',
        'payments',
        'refunds',
        'barcodes',
        'maintenance_logs',
        'stock_alerts',
        'newsletter_campaigns',
        'banners'
      ])
      and pg_class.relrowsecurity
  ),
  14,
  'RLS is enabled on every F1-F5 public table'
);

select set_config('request.jwt.claims', '{}'::text, true);
select is(public.is_admin(), false, 'missing JWT claims are not admin');

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);
select is(public.is_admin(), true, 'app_metadata.role=admin is accepted');

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","user_metadata":{"role":"admin"}}',
  true
);
select is(public.is_admin(), false, 'user_metadata.role=admin is rejected');

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","app_metadata":{"role":"customer"}}',
  true
);
select is(public.is_admin(), false, 'non-admin app_metadata is rejected');

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'admin@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"],"role":"admin"}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'client@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

select is(
  (
    select count(*)::integer
    from public.profiles
    where id in (
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222'
    )
  ),
  2,
  'test Auth identities receive profiles'
);

select is(
  (
    select count(*)::integer
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
  ),
  1,
  'hardened handle_new_user still creates an admin profile'
);

select is(
  (
    select count(*)::integer
    from public.profiles
    where id = '22222222-2222-4222-8222-222222222222'
  ),
  1,
  'hardened handle_new_user still creates a client profile'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"role":"customer"}}',
  true
);
set local role authenticated;

select lives_ok(
  $$update public.profiles
      set preferences = '{"theme":"dark"}'
    where id = '22222222-2222-4222-8222-222222222222'$$,
  'ordinary profile preferences remain editable'
);

reset role;
set local role service_role;

select lives_ok(
  $$update public.site_settings
      set value = value
    where key = 'phone'$$,
  'hardened site settings timestamp trigger remains operational'
);

select lives_ok(
  $$update public.collections_content
      set tagline = tagline
    where slug = 'femme'$$,
  'hardened collections content timestamp trigger remains operational'
);

select lives_ok(
  $$update public.services_content
      set titre = titre
    where slug = 'quiz-olfactif'$$,
  'hardened services content timestamp trigger remains operational'
);

select lives_ok(
  $$update public.home_hero
      set title = title
    where id = 'home'$$,
  'hardened home hero timestamp trigger remains operational'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"role":"customer"}}',
  true
);
set local role authenticated;

select throws_ok(
  $$update public.profiles
      set preferences = '{"theme":"dark","role":"admin"}'
    where id = '22222222-2222-4222-8222-222222222222'$$,
  '42501',
  'Les clés role et admin_level de preferences ne sont pas modifiables',
  'authenticated users cannot assign themselves role=admin'
);

select throws_ok(
  $$update public.profiles
      set preferences = '{"theme":"dark","admin_level":"super"}'
    where id = '22222222-2222-4222-8222-222222222222'$$,
  '42501',
  'Les clés role et admin_level de preferences ne sont pas modifiables',
  'authenticated users cannot assign themselves admin_level'
);

select throws_ok(
  $$insert into public.promo_codes (code, type, value)
    values ('CLIENT-DENIED', 'percentage', 10)$$,
  '42501',
  'new row violates row-level security policy for table "promo_codes"',
  'non-admin clients cannot create promo codes'
);

select throws_ok(
  $$insert into public.orders (
      id, user_id, total_amount, shipping_address, phone, email
    ) values (
      '33333333-3333-4333-8333-333333333333',
      '22222222-2222-4222-8222-222222222222',
      100,
      '{}',
      '+000000000',
      'client@example.com'
    )$$,
  '42501',
  'new row violates row-level security policy for table "orders"',
  'F3 rejects direct authenticated order creation'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('product-images', 'client-denied.jpg')$$,
  '42501',
  'new row violates row-level security policy for table "objects"',
  'F2 rejects product image uploads from non-admin clients'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);
set local role authenticated;

select lives_ok(
  $$insert into public.promo_codes (code, type, value)
    values ('ADMIN-ALLOWED', 'percentage', 10)$$,
  'verified admins can create promo codes'
);

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('product-images', 'admin-allowed.jpg')$$,
  'verified admins can upload product images'
);

reset role;

set local role service_role;

select lives_ok(
  $$insert into public.orders (
      id, user_id, total_amount, shipping_address, phone, email
    ) values (
      '33333333-3333-4333-8333-333333333333',
      '22222222-2222-4222-8222-222222222222',
      100,
      '{}',
      '+000000000',
      'client@example.com'
    )$$,
  'service_role can create orders'
);

select lives_ok(
  $$insert into public.order_items (
      id, order_id, product_id, quantity, unit_price
    ) values (
      '44444444-4444-4444-8444-444444444444',
      '33333333-3333-4333-8333-333333333333',
      null,
      1,
      100
    )$$,
  'service_role can create order items'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"role":"customer"}}',
  true
);
set local role authenticated;

select throws_ok(
  $$insert into public.order_items (
      order_id, product_id, quantity, unit_price
    ) values (
      '33333333-3333-4333-8333-333333333333',
      null,
      1,
      100
    )$$,
  '42501',
  'new row violates row-level security policy for table "order_items"',
  'F3 rejects direct authenticated order-item creation'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"role":"anon"}',
  true
);
set local role anon;

select lives_ok(
  $$insert into public.reviews (
      id, name, ville, texte, rating, is_approved, source
    ) values (
      '55555555-5555-4555-8555-555555555555',
      'Test Client',
      'Test City',
      'Test review',
      5,
      false,
      'website'
    )$$,
  'F5 allows unapproved website review submissions'
);

select throws_ok(
  $$insert into public.reviews (
      name, ville, texte, rating, is_approved, source
    ) values (
      'Test Client',
      'Test City',
      'Approved review',
      5,
      true,
      'website'
    )$$,
  '42501',
  'new row violates row-level security policy for table "reviews"',
  'F5 rejects public self-approval'
);

select throws_ok(
  $$insert into public.reviews (
      name, ville, texte, rating, is_approved, source
    ) values (
      'Test Client',
      'Test City',
      'Forged source',
      5,
      false,
      'admin'
    )$$,
  '42501',
  'new row violates row-level security policy for table "reviews"',
  'F5 rejects forged public review sources'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","app_metadata":{"role":"customer"}}',
  true
);
set local role authenticated;

select results_eq(
  $$update public.reviews
      set is_approved = true
    where id = '55555555-5555-4555-8555-555555555555'
    returning id$$,
  array[]::uuid[],
  'non-admin clients cannot moderate reviews'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","app_metadata":{"role":"admin"}}',
  true
);
set local role authenticated;

select results_eq(
  $$update public.reviews
      set is_approved = true
    where id = '55555555-5555-4555-8555-555555555555'
    returning id$$,
  array['55555555-5555-4555-8555-555555555555'::uuid],
  'verified admins can moderate reviews'
);

reset role;

select is(
  (
    select is_approved
    from public.reviews
    where id = '55555555-5555-4555-8555-555555555555'
  ),
  true,
  'admin review moderation persists inside the test transaction'
);

select set_config(
  'request.jwt.claims',
  '{"role":"anon"}',
  true
);
set local role anon;

select is(
  (
    select count(*)::integer
    from public.promo_codes
    where code = 'ADMIN-ALLOWED'
  ),
  0,
  'F4 hides promo codes from anonymous clients'
);

reset role;

select * from finish();
rollback;
