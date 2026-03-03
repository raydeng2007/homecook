#!/usr/bin/env npx tsx
/**
 * Run a SQL migration file against the Supabase database.
 *
 * Tries multiple approaches to execute raw DDL SQL:
 *   1. Supabase Management API SQL endpoint (/pg/query)
 *   2. PostgREST RPC fallback (requires a pre-existing exec_sql function)
 *   3. Manual fallback — prints the SQL for pasting into the Supabase SQL Editor
 *
 * Usage:
 *   npx tsx scripts/run-migration.ts <migration-file.sql>
 *   npx tsx scripts/run-migration.ts scripts/migration-002-saved-recipes.sql
 *
 * Requires scripts/.env with SUPABASE_URL and SUPABASE_SERVICE_KEY.
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Load environment
// ---------------------------------------------------------------------------
const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in scripts/.env'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Resolve migration file path
// ---------------------------------------------------------------------------
const migrationArg = process.argv[2];
if (!migrationArg) {
  console.error('Usage: npx tsx scripts/run-migration.ts <migration-file.sql>');
  console.error(
    'Example: npx tsx scripts/run-migration.ts scripts/migration-002-saved-recipes.sql'
  );
  process.exit(1);
}

const migrationPath = resolve(migrationArg);
let sql: string;
try {
  sql = readFileSync(migrationPath, 'utf-8').trim();
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Failed to read migration file: ${msg}`);
  process.exit(1);
}

if (!sql) {
  console.error('Migration file is empty.');
  process.exit(1);
}

const fileName = basename(migrationPath);
console.log(`\nMigration file : ${fileName}`);
console.log(`Supabase project: ${SUPABASE_URL}`);
console.log(`SQL length      : ${sql.length} chars\n`);

// ---------------------------------------------------------------------------
// Approach 1 — Supabase /pg/query endpoint (used by Supabase Studio)
// ---------------------------------------------------------------------------
async function tryPgQuery(): Promise<boolean> {
  console.log('[1/2] Trying /pg/query endpoint...');

  const url = `${SUPABASE_URL}/pg/query`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY!,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res.ok) {
      const body = await res.json();
      console.log('  -> Success via /pg/query');
      console.log('  -> Response:', JSON.stringify(body, null, 2));
      return true;
    }

    const text = await res.text();
    console.log(`  -> Failed (${res.status}): ${text.slice(0, 300)}`);
    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  -> Network error: ${msg}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Approach 2 — PostgREST RPC call to an exec_sql function
//   This requires creating a helper function in the database first:
//     CREATE OR REPLACE FUNCTION exec_sql(query text)
//     RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
//     BEGIN EXECUTE query; END; $$;
// ---------------------------------------------------------------------------
async function tryRpc(): Promise<boolean> {
  console.log('[2/2] Trying PostgREST /rest/v1/rpc/exec_sql ...');

  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY!,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res.ok || res.status === 204) {
      console.log('  -> Success via rpc/exec_sql');
      return true;
    }

    const text = await res.text();
    console.log(`  -> Failed (${res.status}): ${text.slice(0, 300)}`);
    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  -> Network error: ${msg}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Fallback — print instructions
// ---------------------------------------------------------------------------
function printManualInstructions(): void {
  const dashboardUrl = SUPABASE_URL!;
  console.log('\n' + '='.repeat(70));
  console.log('MANUAL MIGRATION REQUIRED');
  console.log('='.repeat(70));
  console.log(
    '\nAutomatic execution failed. Please run the migration manually:\n'
  );
  console.log('1. Open the Supabase Dashboard:');
  console.log(`   ${dashboardUrl}`);
  console.log(
    '   -> Go to SQL Editor (left sidebar)\n'
  );
  console.log('2. Paste the following SQL and click "Run":\n');
  console.log('-'.repeat(70));
  console.log(sql);
  console.log('-'.repeat(70));
  console.log(
    '\n3. Verify the table was created by running:'
  );
  console.log(
    "   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';\n"
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  // Try each approach in order
  if (await tryPgQuery()) {
    console.log(`\nMigration "${fileName}" applied successfully.`);
    return;
  }

  if (await tryRpc()) {
    console.log(`\nMigration "${fileName}" applied successfully.`);
    return;
  }

  // All automatic methods failed — fall back to manual instructions
  printManualInstructions();
  process.exit(2);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
