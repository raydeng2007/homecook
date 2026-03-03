/**
 * Supabase admin client for import scripts.
 * Uses the service role key to bypass RLS.
 *
 * Required env vars (in scripts/.env):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   HOME_ID          — target household to import recipes into
 *   CREATED_BY       — user ID to attribute imported recipes to
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from scripts/ directory
const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
const homeId = process.env.HOME_ID;
const createdBy = process.env.CREATED_BY;

if (!url || !key) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in scripts/.env'
  );
}

if (!homeId || !createdBy) {
  throw new Error('Missing HOME_ID or CREATED_BY in scripts/.env');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export const TARGET_HOME_ID = homeId;
export const TARGET_CREATED_BY = createdBy;
