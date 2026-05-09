#!/usr/bin/env npx tsx
/**
 * Applique le schéma + migration + seed de données démo dans Supabase.
 *
 * Usage : npx tsx scripts/setup-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variables manquantes (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSQL(sql: string, label: string) {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).maybeSingle();
  if (error) {
    // Try via REST pg_query fallback — use fetch directly
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ sql_query: sql }),
    });
    if (!res.ok) {
      console.warn(`⚠️  ${label}: RPC non disponible, utilisation directe`);
      return false;
    }
  }
  return true;
}

// Produits démo parfumerie de luxe
const DEMO_PRODUCTS = [
  {
    name: 'Sauvage Eau de Parfum',
    slug: 'sauvage-edp',
    brand: 'Dior',
    description: 'Un parfum brut et noble, magistralement composé autour du Calabrian bergamot et de l\'ambroxan. Une fragrance masculine puissante et raffinée.',
    price: 85000,
    original_price: 95000,
    gender: 'homme',
    stock_quantity: 25,
    is_featured: true,
    images: ['/images/products/sauvage-edp.jpg'],
    notes: { top: ['Bergamote de Calabre'], heart: ['Poivre de Sichuan', 'Lavande'], base: ['Ambroxan', 'Cèdre'] },
    concentration: 'Eau de Parfum',
    volume: '100 ml',
  },
  {
    name: 'J\'adore Infinissime',
    slug: 'jadore-infinissime',
    brand: 'Dior',
    description: 'Une interprétation intense et sensuelle du bouquet floral emblématique de J\'adore. Un nectar de fleurs absolues.',
    price: 92000,
    original_price: null,
    gender: 'femme',
    stock_quantity: 18,
    is_featured: true,
    images: ['/images/products/jadore-infinissime.jpg'],
    notes: { top: ['Rose Centifolia', 'Rose de Grasse'], heart: ['Jasmin Sambac', 'Tubéreuse'], base: ['Bois de Santal', 'Musc'] },
    concentration: 'Eau de Parfum Intense',
    volume: '100 ml',
  },
  {
    name: 'Bleu de Chanel',
    slug: 'bleu-de-chanel',
    brand: 'Chanel',
    description: 'L\'essence même de la liberté masculine. Un parfum boisé aromatique profond et envoûtant.',
    price: 78000,
    original_price: null,
    gender: 'homme',
    stock_quantity: 30,
    is_featured: true,
    images: ['/images/products/bleu-de-chanel.jpg'],
    notes: { top: ['Citron', 'Menthe', 'Pamplemousse rose'], heart: ['Géranium', 'Jasmin'], base: ['Cèdre', 'Bois de Santal', 'Encens'] },
    concentration: 'Eau de Parfum',
    volume: '100 ml',
  },
  {
    name: 'La Vie est Belle',
    slug: 'la-vie-est-belle',
    brand: 'Lancôme',
    description: 'L\'Eau de Parfum iconique. Un iris gourmand, premier du genre, qui exhale un bonheur intense.',
    price: 65000,
    original_price: 72000,
    gender: 'femme',
    stock_quantity: 22,
    is_featured: true,
    images: ['/images/products/la-vie-est-belle.jpg'],
    notes: { top: ['Cassis noir', 'Poire'], heart: ['Iris', 'Jasmin Sambac', 'Fleur d\'Oranger'], base: ['Patchouli', 'Praline', 'Vanille'] },
    concentration: 'Eau de Parfum',
    volume: '75 ml',
  },
  {
    name: 'Aventus',
    slug: 'aventus',
    brand: 'Creed',
    description: 'Célèbre la force, le pouvoir, la vision et le succès. Un chef-d\'œuvre fruité boisé unique.',
    price: 195000,
    original_price: null,
    gender: 'homme',
    stock_quantity: 8,
    is_featured: true,
    images: ['/images/products/aventus.jpg'],
    notes: { top: ['Ananas', 'Pomme', 'Bergamote', 'Cassis noir'], heart: ['Rose', 'Bouleau', 'Jasmin', 'Patchouli'], base: ['Musc', 'Ambre gris', 'Vanille', 'Mousse de chêne'] },
    concentration: 'Eau de Parfum',
    volume: '100 ml',
  },
  {
    name: 'Coco Mademoiselle',
    slug: 'coco-mademoiselle',
    brand: 'Chanel',
    description: 'Un oriental frais, irrévérencieux et indéfinissable. Le parfum d\'une femme qui ose.',
    price: 82000,
    original_price: null,
    gender: 'femme',
    stock_quantity: 20,
    is_featured: false,
    images: ['/images/products/coco-mademoiselle.jpg'],
    notes: { top: ['Orange', 'Bergamote'], heart: ['Litchi', 'Rose', 'Jasmin'], base: ['Musc blanc', 'Patchouli', 'Vetiver'] },
    concentration: 'Eau de Parfum',
    volume: '100 ml',
  },
  {
    name: 'Oud Wood',
    slug: 'oud-wood',
    brand: 'Tom Ford',
    description: 'Un boisé rare et exotique. L\'oud, le bois de rose et la cardamome créent un sillage hypnotique.',
    price: 145000,
    original_price: null,
    gender: 'mixte',
    stock_quantity: 12,
    is_featured: true,
    images: ['/images/products/oud-wood.jpg'],
    notes: { top: ['Bois de rose', 'Cardamome'], heart: ['Oud', 'Bois de santal', 'Palissandre'], base: ['Tonka', 'Vetiver', 'Ambre'] },
    concentration: 'Eau de Parfum',
    volume: '50 ml',
  },
  {
    name: 'Black Orchid',
    slug: 'black-orchid',
    brand: 'Tom Ford',
    description: 'Luxueux et sensuel. Un bouquet d\'orchidée noire et d\'épices enveloppé de chocolat noir.',
    price: 125000,
    original_price: 138000,
    gender: 'mixte',
    stock_quantity: 15,
    is_featured: false,
    images: ['/images/products/black-orchid.jpg'],
    notes: { top: ['Truffe noire', 'Ylang-ylang', 'Jasmin'], heart: ['Orchidée noire', 'Lotus', 'Fruité'], base: ['Chocolat noir', 'Patchouli', 'Vanille', 'Encens'] },
    concentration: 'Eau de Parfum',
    volume: '100 ml',
  },
  {
    name: 'Acqua di Gio Profondo',
    slug: 'acqua-di-gio-profondo',
    brand: 'Giorgio Armani',
    description: 'La profondeur de l\'océan capturée dans un flacon. Un aquatique aromatique moderne.',
    price: 62000,
    original_price: null,
    gender: 'homme',
    stock_quantity: 28,
    is_featured: false,
    images: ['/images/products/acqua-di-gio-profondo.jpg'],
    notes: { top: ['Bergamote', 'Mandarine verte', 'Aquatique'], heart: ['Cyprès', 'Lavande', 'Romarin'], base: ['Musc', 'Patchouli', 'Ambre'] },
    concentration: 'Eau de Parfum',
    volume: '75 ml',
  },
  {
    name: 'Baccarat Rouge 540',
    slug: 'baccarat-rouge-540',
    brand: 'Maison Francis Kurkdjian',
    description: 'Chef-d\'œuvre olfactif lumineux et cristallin. Le safran et le cèdre se mêlent à l\'ambre et au musc.',
    price: 220000,
    original_price: null,
    gender: 'mixte',
    stock_quantity: 5,
    is_featured: true,
    images: ['/images/products/baccarat-rouge-540.jpg'],
    notes: { top: ['Safran', 'Jasmin'], heart: ['Ambroxan', 'Bois de cèdre'], base: ['Musc', 'Ambre gris'] },
    concentration: 'Eau de Parfum',
    volume: '70 ml',
  },
  {
    name: 'Miss Dior Blooming Bouquet',
    slug: 'miss-dior-blooming-bouquet',
    brand: 'Dior',
    description: 'Un bouquet de pivoine et de rose fraîche, léger et romantique comme une promenade printanière.',
    price: 58000,
    original_price: null,
    gender: 'femme',
    stock_quantity: 35,
    is_featured: false,
    images: ['/images/products/miss-dior-blooming.jpg'],
    notes: { top: ['Mandarine de Sicile', 'Pivoine'], heart: ['Rose de Damas', 'Fleur d\'abricot'], base: ['Musc blanc'] },
    concentration: 'Eau de Toilette',
    volume: '100 ml',
  },
  {
    name: 'Tobacco Vanille',
    slug: 'tobacco-vanille',
    brand: 'Tom Ford',
    description: 'Opulent, chaud et moderne. Le tabac doux et la vanille créent une signature inoubliable.',
    price: 165000,
    original_price: null,
    gender: 'mixte',
    stock_quantity: 10,
    is_featured: false,
    images: ['/images/products/tobacco-vanille.jpg'],
    notes: { top: ['Tabac', 'Épices'], heart: ['Vanille', 'Cacao', 'Tonka'], base: ['Fruits secs', 'Bois fumé'] },
    concentration: 'Eau de Parfum',
    volume: '50 ml',
  },
];

async function main() {
  console.log('🗄️  Setup Base de Données VIP Parfumerie Bar\n');

  // ── 1. Appliquer le schéma ──
  console.log('📋 1/4 — Application du schéma principal…');
  const schemaSQL = readFileSync(resolve(__dirname, '..', 'supabase', 'schema.sql'), 'utf-8');
  
  // Split by statements and execute via supabase client
  // We'll use the raw REST endpoint for SQL execution
  const execSQL = async (sql: string) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({}),
    });
    return res.ok;
  };

  // Use the Supabase Management API or direct pg for DDL
  // Since we can't run raw DDL through PostgREST, we'll insert data via the client
  // The schema must be applied via the Supabase SQL Editor
  console.log('   ⚠️  Le schéma DDL doit être appliqué via Supabase SQL Editor.');
  console.log('   📄 Fichiers à exécuter dans l\'ordre :');
  console.log('      1. supabase/schema.sql');
  console.log('      2. supabase/migration-001-admin-extended.sql\n');

  // ── 2. Vérifier si les tables existent ──
  console.log('📋 2/4 — Vérification des tables…');
  const { data: catCheck, error: catError } = await supabase.from('categories').select('id').limit(1);
  
  if (catError) {
    console.error(`\n❌ La table 'categories' n'existe pas.`);
    console.log('\n👉 Copiez le contenu de supabase/schema.sql et collez-le dans :');
    console.log(`   ${SUPABASE_URL.replace('.supabase.co', '')}/project/sql/new`);
    console.log('   Puis exécutez ce script à nouveau.\n');
    process.exit(1);
  }
  console.log('   ✅ Tables détectées\n');

  // ── 3. Seed catégories ──
  console.log('📋 3/4 — Insertion des catégories…');
  const categories = [
    { name: 'Parfums Homme', slug: 'homme', description: 'Des fragrances masculines puissantes et raffinées', display_order: 1 },
    { name: 'Parfums Femme', slug: 'femme', description: 'Des senteurs féminines élégantes et envoûtantes', display_order: 2 },
    { name: 'Parfums Mixtes', slug: 'mixte', description: 'Des fragrances unisexes modernes et audacieuses', display_order: 3 },
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    if (error) {
      console.warn(`   ⚠️  Catégorie "${cat.name}": ${error.message}`);
    }
  }
  console.log('   ✅ 3 catégories\n');

  // ── 4. Récupérer les IDs catégories ──
  const { data: cats } = await supabase.from('categories').select('id, slug');
  const catMap = new Map(cats?.map(c => [c.slug, c.id]) || []);

  // ── 5. Seed produits ──
  console.log('📋 4/4 — Insertion des produits démo…');
  let inserted = 0;
  for (const product of DEMO_PRODUCTS) {
    const categoryId = catMap.get(product.gender) || null;
    const { error } = await supabase.from('products').upsert(
      {
        ...product,
        category_id: categoryId,
      },
      { onConflict: 'slug' }
    );
    if (error) {
      console.warn(`   ⚠️  "${product.name}": ${error.message}`);
    } else {
      inserted++;
    }
  }
  console.log(`   ✅ ${inserted}/${DEMO_PRODUCTS.length} produits insérés\n`);

  // ── Résumé ──
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });

  console.log('┌──────────────────────────────────────────┐');
  console.log('│     🎉 Base de données prête !            │');
  console.log('├──────────────────────────────────────────┤');
  console.log(`│  📦 Produits    : ${String(productCount).padEnd(22)}│`);
  console.log(`│  📁 Catégories  : ${String(catCount).padEnd(22)}│`);
  console.log('│  👤 Admin       : admin@vip-parfumerie.com │');
  console.log('├──────────────────────────────────────────┤');
  console.log('│  → npm run dev   (lancer le site)        │');
  console.log('│  → /admin/login  (accès admin)           │');
  console.log('└──────────────────────────────────────────┘');
}

main().catch(console.error);
