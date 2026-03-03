#!/usr/bin/env npx tsx
/**
 * Quick utility to look up your HOME_ID and CREATED_BY values.
 * Uses the anon key (reads from the main .env) — no service key needed.
 *
 * Usage: npx tsx scripts/lookup-ids.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load main project .env
const scriptDir = import.meta.dirname ?? new URL('.', import.meta.url).pathname;
config({ path: resolve(scriptDir, '..', '.env') });

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

async function main() {
  // Sign in with the test account to get a session
  const email = process.argv[2] || 'test@hoomcook.com';
  const password = process.argv[3] || 'admin';

  console.log(`\n🔑 Signing in as ${email}...`);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    console.log('\nUsage: npx tsx scripts/lookup-ids.ts [email] [password]');
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Signed in! User ID: ${userId}`);

  // Look up the user's home
  const { data: members, error: memberError } = await supabase
    .from('home_members')
    .select('home_id, role')
    .eq('user_id', userId);

  if (memberError) {
    console.error('❌ Failed to query home_members:', memberError.message);
    process.exit(1);
  }

  if (!members || members.length === 0) {
    console.log('⚠️  No household found for this user.');
    process.exit(1);
  }

  const homeId = members[0].home_id;

  // Get home name
  const { data: home } = await supabase
    .from('homes')
    .select('name')
    .eq('id', homeId)
    .single();

  console.log(`🏠 Home: "${home?.name ?? 'Unknown'}" (${members[0].role})`);
  console.log('');
  console.log('═'.repeat(50));
  console.log('Add these to your scripts/.env file:');
  console.log('═'.repeat(50));
  console.log('');
  console.log(`SUPABASE_URL=${url}`);
  console.log(`SUPABASE_SERVICE_KEY=<get from Supabase Dashboard → Settings → API → service_role key>`);
  console.log(`HOME_ID=${homeId}`);
  console.log(`CREATED_BY=${userId}`);
  console.log('');
  console.log('═'.repeat(50));

  await supabase.auth.signOut();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
