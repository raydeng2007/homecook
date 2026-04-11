#!/usr/bin/env npx tsx
/**
 * Fix RLS policies on the recipes table to allow public reads.
 *
 * Tries multiple approaches:
 * 1. Supabase Management API (if SUPABASE_ACCESS_TOKEN is set)
 * 2. Direct SQL via /pg endpoint (some Supabase instances)
 * 3. Falls back to printing instructions for manual fix
 *
 * Usage:
 *   npx tsx scripts/fix-rls.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env') });

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!url || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in scripts/.env');
  process.exit(1);
}

// Extract project ref from URL (e.g., "dozpqcxznvbesaifymny" from "https://dozpqcxznvbesaifymny.supabase.co")
const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project ref from URL:', url);
  process.exit(1);
}

const adminClient = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// Read the migration SQL
const migrationSql = readFileSync(
  resolve(__dirname, 'migration-003-public-recipes.sql'),
  'utf-8'
);

// ── Step 1: Verify the problem ────────────────────────────────────────

async function verifyProblem() {
  console.log('\n🔍 Step 1: Verifying the problem...\n');

  // Count with service role (bypasses RLS)
  const { count, error } = await adminClient
    .from('recipes')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('   ❌ Could not count recipes:', error.message);
    return false;
  }

  console.log(`   📊 Total recipes in database (via service role): ${count}`);

  if (count === null || count <= 1) {
    console.log('   ⚠️  Only 0-1 recipes found. The import may not have run yet.');
    console.log('   Run: npx tsx scripts/import-themealdb.ts');
    return false;
  }

  console.log(`   ✅ Found ${count} recipes — RLS is blocking your app from seeing them.`);
  return true;
}

// ── Step 2: Try to fix automatically ──────────────────────────────────

async function tryFixViaSQL(): Promise<boolean> {
  console.log('\n🔧 Step 2: Attempting automatic fix...\n');

  // Approach A: Try /pg/query endpoint (Supabase internal)
  try {
    console.log('   Trying /pg/query endpoint...');
    const res = await fetch(`${url}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ query: migrationSql }),
    });

    if (res.ok) {
      console.log('   ✅ Migration applied via /pg/query!');
      return true;
    }

    const text = await res.text();
    console.log(`   ❌ /pg/query returned ${res.status}: ${text.substring(0, 200)}`);
  } catch (err) {
    console.log(`   ❌ /pg/query not available`);
  }

  // Approach B: Try the Supabase Management API SQL endpoint
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (accessToken) {
    try {
      console.log('   Trying Supabase Management API...');
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ query: migrationSql }),
        }
      );

      if (res.ok) {
        console.log('   ✅ Migration applied via Management API!');
        return true;
      }

      const text = await res.text();
      console.log(`   ❌ Management API returned ${res.status}: ${text.substring(0, 200)}`);
    } catch (err) {
      console.log(`   ❌ Management API not available`);
    }
  }

  // Approach C: Try creating a temporary RPC function
  try {
    console.log('   Trying RPC exec_sql function...');
    const { error } = await adminClient.rpc('exec_sql', {
      sql: `CREATE POLICY "Anyone can read recipes" ON recipes FOR SELECT USING (true);`,
    });

    if (!error) {
      console.log('   ✅ Policy created via exec_sql RPC!');
      return true;
    }
    console.log(`   ❌ RPC exec_sql not available: ${error.message}`);
  } catch {
    console.log('   ❌ RPC approach failed');
  }

  return false;
}

// ── Step 3: Verify the fix ────────────────────────────────────────────

async function verifyFix() {
  console.log('\n✅ Step 3: Verifying fix...\n');

  // Create a client with the anon key to test
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    // Read from parent .env
    try {
      const envContent = readFileSync(resolve(__dirname, '..', '.env'), 'utf-8');
      const match = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
      if (match) {
        const anonClient = createClient(url, match[1].trim(), {
          auth: { persistSession: false },
        });
        const { count, error } = await anonClient
          .from('recipes')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ⚠️  Anon query error: ${error.message}`);
          return;
        }
        console.log(`   📊 Recipes visible via anon key: ${count}`);
        if (count && count > 1) {
          console.log('   🎉 Fix confirmed! Your app should now see all recipes.');
        } else {
          console.log('   ❌ Still not working. You may need to run the SQL manually.');
        }
        return;
      }
    } catch {}
  }
  console.log('   ⚠️  Could not verify (no anon key available for testing).');
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  Homecook — Fix RLS for Public Recipe Access  ║');
  console.log('╚════════════════════════════════════════════════╝');

  const hasProblem = await verifyProblem();
  if (!hasProblem) {
    console.log('\n⚠️  No RLS problem detected (or no recipes to fix). Exiting.');
    return;
  }

  const fixed = await tryFixViaSQL();

  if (fixed) {
    await verifyFix();
  } else {
    console.log('\n' + '═'.repeat(60));
    console.log('⚠️  AUTOMATIC FIX FAILED — Please run SQL manually:');
    console.log('═'.repeat(60));
    console.log('\n1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('2. Paste this SQL and click "Run":\n');
    console.log('─'.repeat(60));
    console.log(`
-- Make recipes publicly readable (fix RLS blocking imported recipes)

CREATE POLICY "Anyone can read recipes"
  ON recipes
  FOR SELECT
  USING (true);
`);
    console.log('─'.repeat(60));
    console.log('\n3. After running, pull-to-refresh in your app — you should see all recipes!\n');
  }
}

main().catch(console.error);
