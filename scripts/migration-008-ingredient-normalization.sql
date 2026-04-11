-- Migration 008: Server-side ingredient normalization
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- PREREQUISITES: Enable these extensions in Dashboard → Database → Extensions:
--   1. pg_cron (for daily scheduled normalization)
--   2. fuzzystrmatch (for fuzzy matching in review queue)
--
-- This migration:
--   1. Creates lookup tables for synonyms, protected compounds, prep words
--   2. Seeds them with data from lib/ingredient-normalize.ts
--   3. Creates PL/pgSQL normalizer functions
--   4. Adds normalized_ingredients column to recipes
--   5. Creates a trigger to auto-normalize on INSERT/UPDATE
--   6. Backfills all existing recipes
--   7. Schedules a daily pg_cron job for re-normalization + fuzzy matching

-- ============================================================================
-- Step 1: Lookup tables
-- ============================================================================

-- Synonym map: variant → canonical name
CREATE TABLE IF NOT EXISTS ingredient_synonyms (
  variant TEXT PRIMARY KEY,
  canonical TEXT NOT NULL
);

-- Protected compounds: names where the "prep word" is part of the identity
CREATE TABLE IF NOT EXISTS ingredient_protected_compounds (
  name TEXT PRIMARY KEY
);

-- Prep words to strip from ingredient names
CREATE TABLE IF NOT EXISTS ingredient_prep_words (
  word TEXT PRIMARY KEY,
  position TEXT NOT NULL CHECK (position IN ('prefix', 'suffix', 'both'))
);

-- Words that should NOT be depluralized
CREATE TABLE IF NOT EXISTS ingredient_keep_plural (
  word TEXT PRIMARY KEY
);

-- Review queue for fuzzy-match suggestions
CREATE TABLE IF NOT EXISTS ingredient_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_a TEXT NOT NULL,
  raw_b TEXT NOT NULL,
  distance INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_review_queue_status
  ON ingredient_review_queue (status) WHERE status = 'pending';

-- ============================================================================
-- Step 2: Seed data from lib/ingredient-normalize.ts
-- ============================================================================

-- Synonyms (~95 entries)
INSERT INTO ingredient_synonyms (variant, canonical) VALUES
  -- Herbs & aromatics
  ('cilantro', 'coriander'),
  ('coriander leaf', 'coriander'),
  ('chinese parsley', 'coriander'),
  ('scallion', 'green onion'),
  ('spring onion', 'green onion'),
  ('green shallot', 'green onion'),
  ('capsicum', 'bell pepper'),
  ('sweet pepper', 'bell pepper'),
  ('red pepper', 'red bell pepper'),
  ('green pepper', 'green bell pepper'),
  ('chilli', 'chili'),
  ('chile', 'chili'),
  ('chili pepper', 'chili'),
  ('hot pepper', 'chili'),
  ('rocket', 'arugula'),
  ('roquette', 'arugula'),
  ('flat leaf parsley', 'parsley'),
  ('flat-leaf parsley', 'parsley'),
  ('italian parsley', 'parsley'),
  ('curly parsley', 'parsley'),
  -- Alliums
  ('yellow onion', 'onion'),
  ('white onion', 'onion'),
  ('brown onion', 'onion'),
  ('red shallot', 'shallot'),
  ('garlic clove', 'garlic'),
  ('clove garlic', 'garlic'),
  -- Dairy & eggs
  ('heavy cream', 'heavy whipping cream'),
  ('whipping cream', 'heavy whipping cream'),
  ('double cream', 'heavy whipping cream'),
  ('single cream', 'light cream'),
  ('creme fraiche', 'crème fraiche'),
  ('plain yogurt', 'yogurt'),
  ('natural yogurt', 'yogurt'),
  ('greek-style yogurt', 'greek yogurt'),
  ('parmigiano reggiano', 'parmesan'),
  ('parmigiano', 'parmesan'),
  ('parmesan cheese', 'parmesan'),
  ('cheddar cheese', 'cheddar'),
  ('mozzarella cheese', 'mozzarella'),
  ('feta cheese', 'feta'),
  ('large egg', 'egg'),
  ('medium egg', 'egg'),
  -- Oils & fats
  ('evoo', 'olive oil'),
  ('extra virgin olive oil', 'olive oil'),
  ('rapeseed oil', 'canola oil'),
  ('toasted sesame oil', 'sesame oil'),
  ('unsalted butter', 'butter'),
  ('salted butter', 'butter'),
  ('stick butter', 'butter'),
  -- Condiments & sauces
  ('tamari', 'soy sauce'),
  ('shoyu', 'soy sauce'),
  ('catsup', 'ketchup'),
  ('nam pla', 'fish sauce'),
  ('nuoc mam', 'fish sauce'),
  ('sriracha sauce', 'sriracha'),
  ('hot chili sauce', 'sriracha'),
  ('wholegrain mustard', 'whole grain mustard'),
  ('whole-grain mustard', 'whole grain mustard'),
  ('mayonnaise', 'mayo'),
  ('worcestershire', 'worcestershire sauce'),
  -- Starches & grains
  ('all-purpose flour', 'all purpose flour'),
  ('ap flour', 'all purpose flour'),
  ('plain flour', 'all purpose flour'),
  ('wholemeal flour', 'whole wheat flour'),
  ('wholewheat flour', 'whole wheat flour'),
  ('jasmine rice', 'rice'),
  ('basmati rice', 'rice'),
  ('long grain rice', 'rice'),
  ('long-grain rice', 'rice'),
  ('white rice', 'rice'),
  ('cornstarch', 'corn starch'),
  ('corn flour', 'corn starch'),
  ('maize starch', 'corn starch'),
  ('penne pasta', 'penne'),
  ('spaghetti pasta', 'spaghetti'),
  -- Proteins
  ('beef mince', 'ground beef'),
  ('minced beef', 'ground beef'),
  ('turkey mince', 'ground turkey'),
  ('minced pork', 'ground pork'),
  ('pork mince', 'ground pork'),
  ('prawn', 'shrimp'),
  ('king prawn', 'shrimp'),
  -- Canned & stock
  ('chicken broth', 'chicken stock'),
  ('beef broth', 'beef stock'),
  ('vegetable broth', 'vegetable stock'),
  ('stock cube', 'bouillon cube'),
  ('bouillon', 'bouillon cube'),
  ('tinned tomato', 'canned tomato'),
  ('chopped tomato', 'canned tomato'),
  ('crushed tomato', 'canned tomato'),
  ('tomato passata', 'tomato puree'),
  -- Sugars & sweeteners
  ('granulated sugar', 'sugar'),
  ('white sugar', 'sugar'),
  ('caster sugar', 'sugar'),
  ('castor sugar', 'sugar'),
  ('icing sugar', 'powdered sugar'),
  ('confectioner sugar', 'powdered sugar'),
  ('confectioners sugar', 'powdered sugar'),
  -- Spices
  ('ground black pepper', 'black pepper'),
  ('cracked pepper', 'black pepper'),
  ('sea salt', 'salt'),
  ('kosher salt', 'salt'),
  ('table salt', 'salt'),
  ('flaky salt', 'salt'),
  ('chili flake', 'red pepper flake'),
  ('chilli flake', 'red pepper flake'),
  ('crushed red pepper', 'red pepper flake'),
  -- Produce
  ('aubergine', 'eggplant'),
  ('courgette', 'zucchini'),
  ('mangetout', 'snow pea'),
  ('sugar snap', 'snap pea'),
  ('butternut', 'butternut squash'),
  ('cos lettuce', 'romaine lettuce'),
  ('romaine', 'romaine lettuce'),
  ('iceberg', 'iceberg lettuce'),
  ('baby spinach', 'spinach')
ON CONFLICT (variant) DO UPDATE SET canonical = EXCLUDED.canonical;

-- Protected compounds (~55 entries)
INSERT INTO ingredient_protected_compounds (name) VALUES
  -- Proteins
  ('ground beef'), ('ground pork'), ('ground turkey'), ('ground chicken'),
  ('ground lamb'), ('ground veal'), ('ground meat'),
  -- Spices (ground = form factor)
  ('ground cinnamon'), ('ground cumin'), ('ground ginger'),
  ('ground nutmeg'), ('ground turmeric'), ('ground coriander'),
  ('ground cardamom'), ('ground clove'), ('ground allspice'),
  ('ground pepper'), ('ground mustard'), ('ground paprika'),
  -- Dark/light variants
  ('dark chocolate'), ('dark rum'), ('dark soy sauce'),
  ('light soy sauce'), ('light cream'), ('light coconut milk'),
  -- Dry/whole/frozen as identity
  ('dry sherry'), ('dry white wine'), ('dry red wine'),
  ('whole milk'), ('whole wheat flour'), ('whole grain mustard'),
  ('frozen pea'), ('frozen corn'), ('frozen spinach'),
  ('frozen berry'), ('frozen banana'),
  -- Canned as identity
  ('canned tomato'), ('canned bean'), ('canned chickpea'),
  ('canned coconut milk'), ('canned tuna'),
  -- Roasted/toasted as identity
  ('roasted garlic'), ('roasted pepper'), ('roasted peanut'),
  ('toasted sesame oil'), ('toasted sesame seed'),
  ('chopped tomato'), ('crushed tomato'), ('crushed red pepper'),
  -- Unsalted/salted as identity for butter
  ('unsalted butter'), ('salted butter')
ON CONFLICT (name) DO NOTHING;

-- Prep words (~65 entries)
INSERT INTO ingredient_prep_words (word, position) VALUES
  -- Prefix-only
  ('fresh', 'prefix'), ('dried', 'prefix'), ('frozen', 'prefix'),
  ('canned', 'prefix'), ('raw', 'prefix'), ('cooked', 'prefix'),
  ('large', 'prefix'), ('small', 'prefix'), ('medium', 'prefix'),
  ('thin', 'prefix'), ('thick', 'prefix'),
  ('finely', 'prefix'), ('roughly', 'prefix'), ('thinly', 'prefix'),
  ('thickly', 'prefix'), ('lightly', 'prefix'), ('firmly', 'prefix'),
  ('packed', 'prefix'), ('sifted', 'prefix'), ('peeled', 'prefix'),
  ('deveined', 'prefix'), ('boneless', 'prefix'), ('skinless', 'prefix'),
  ('bone-in', 'prefix'), ('skin-on', 'prefix'),
  ('sweetened', 'prefix'), ('unsweetened', 'prefix'),
  ('low-fat', 'prefix'), ('nonfat', 'prefix'), ('fat-free', 'prefix'),
  ('reduced-fat', 'prefix'), ('extra-virgin', 'prefix'), ('virgin', 'prefix'),
  ('light', 'prefix'), ('dark', 'prefix'), ('golden', 'prefix'),
  ('ripe', 'prefix'), ('uncooked', 'prefix'), ('dry', 'prefix'),
  ('warm', 'prefix'), ('cold', 'prefix'), ('hot', 'prefix'),
  ('room-temperature', 'prefix'), ('whole', 'prefix'),
  ('ground', 'prefix'), ('unsalted', 'prefix'), ('salted', 'prefix'),
  -- Suffix-only
  ('divided', 'suffix'), ('optional', 'suffix'),
  ('garnish', 'suffix'), ('reserve', 'suffix'),
  -- Both prefix and suffix
  ('chopped', 'both'), ('diced', 'both'), ('sliced', 'both'),
  ('minced', 'both'), ('grated', 'both'), ('shredded', 'both'),
  ('crushed', 'both'), ('crumbled', 'both'), ('toasted', 'both'),
  ('roasted', 'both'), ('softened', 'both'), ('melted', 'both')
ON CONFLICT (word) DO UPDATE SET position = EXCLUDED.position;

-- Keep-plural words (~20 entries)
INSERT INTO ingredient_keep_plural (word) VALUES
  ('hummus'), ('couscous'), ('asparagus'), ('citrus'), ('molasses'),
  ('quinoa'), ('polenta'), ('ricotta'), ('pasta'), ('salsa'), ('feta'),
  ('sriracha'), ('tahini'), ('miso'), ('tofu'), ('tempeh'),
  ('lemongrass'), ('swiss'), ('brioche'), ('jus'), ('surplus')
ON CONFLICT (word) DO NOTHING;

-- ============================================================================
-- Step 3: PL/pgSQL normalizer functions
-- ============================================================================

-- Depluralize a single word
CREATE OR REPLACE FUNCTION depluralize_word(p_word TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  w TEXT := p_word;
BEGIN
  -- Check keep-plural list
  IF EXISTS (SELECT 1 FROM ingredient_keep_plural kp WHERE kp.word = w) THEN
    RETURN w;
  END IF;

  -- -ies → -y (berries → berry)
  IF length(w) > 4 AND w LIKE '%ies' THEN
    RETURN left(w, length(w) - 3) || 'y';
  END IF;

  -- -lves → -lf (halves → half, calves → calf)
  IF w LIKE '%lves' THEN
    RETURN left(w, length(w) - 3) || 'f';
  END IF;

  -- -eaves → -eaf (leaves → leaf)
  IF w LIKE '%eaves' THEN
    RETURN left(w, length(w) - 3) || 'f';
  END IF;

  -- loaves → loaf
  IF w = 'loaves' THEN
    RETURN 'loaf';
  END IF;

  -- -ches, -shes, -sses, -xes, -zes → drop -es
  IF w ~ '(ch|sh|ss|x|z)es$' THEN
    RETURN left(w, length(w) - 2);
  END IF;

  -- -oes → -o (tomatoes → tomato)
  IF length(w) > 4 AND w LIKE '%oes' THEN
    RETURN left(w, length(w) - 2);
  END IF;

  -- general -s (but not -ss, -us, -is)
  IF w LIKE '%s'
     AND w NOT LIKE '%ss'
     AND w NOT LIKE '%us'
     AND w NOT LIKE '%is' THEN
    RETURN left(w, length(w) - 1);
  END IF;

  RETURN w;
END;
$$;

-- Depluralize the last word of a multi-word name
CREATE OR REPLACE FUNCTION depluralize_last_word(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  words TEXT[];
  last_idx INT;
BEGIN
  words := string_to_array(p_name, ' ');
  last_idx := array_length(words, 1);
  IF last_idx IS NULL OR last_idx < 1 THEN RETURN p_name; END IF;
  words[last_idx] := depluralize_word(words[last_idx]);
  RETURN array_to_string(words, ' ');
END;
$$;

-- Main normalizer function
CREATE OR REPLACE FUNCTION normalize_ingredient_name(p_raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_depluraled TEXT;
  v_is_protected BOOLEAN;
  v_words TEXT[];
  v_canonical TEXT;
BEGIN
  IF p_raw IS NULL OR trim(p_raw) = '' THEN RETURN ''; END IF;

  -- Step 1: lowercase + trim
  v_name := lower(trim(p_raw));

  -- Step 2: strip parentheticals — (optional), (about 2 cups), (diced)
  v_name := regexp_replace(v_name, '\s*\(.*?\)\s*', ' ', 'g');

  -- Step 3: strip stray punctuation
  v_name := regexp_replace(v_name, '^[\s,:\-]+|[\s,:\-]+$', '', 'g');

  -- Step 4: collapse whitespace
  v_name := regexp_replace(v_name, '\s+', ' ', 'g');
  v_name := trim(v_name);

  IF v_name = '' THEN RETURN ''; END IF;

  -- Step 5: check if this is a protected compound BEFORE stripping prefixes
  v_depluraled := depluralize_last_word(v_name);
  SELECT EXISTS (
    SELECT 1 FROM ingredient_protected_compounds c
    WHERE c.name = v_name
       OR c.name = v_depluraled
  ) INTO v_is_protected;

  IF NOT v_is_protected THEN
    -- Step 6: strip prep prefixes
    v_words := string_to_array(v_name, ' ');
    WHILE array_length(v_words, 1) > 1
      AND EXISTS (
        SELECT 1 FROM ingredient_prep_words pw
        WHERE pw.word = v_words[1]
          AND pw.position IN ('prefix', 'both')
      )
    LOOP
      v_words := v_words[2:array_length(v_words, 1)];
    END LOOP;
    v_name := array_to_string(v_words, ' ');

    -- Step 7: strip prep suffixes
    v_words := string_to_array(v_name, ' ');
    WHILE array_length(v_words, 1) > 1
      AND EXISTS (
        SELECT 1 FROM ingredient_prep_words pw
        WHERE pw.word = v_words[array_length(v_words, 1)]
          AND pw.position IN ('suffix', 'both')
      )
    LOOP
      v_words := v_words[1:array_length(v_words, 1) - 1];
    END LOOP;
    v_name := array_to_string(v_words, ' ');
  END IF;

  -- Step 8: depluralize last word
  v_name := depluralize_last_word(v_name);

  -- Step 9: synonym lookup
  SELECT s.canonical INTO v_canonical
  FROM ingredient_synonyms s
  WHERE s.variant = v_name;

  IF v_canonical IS NOT NULL THEN
    v_name := v_canonical;
  END IF;

  -- Step 10: final trim
  RETURN trim(v_name);
END;
$$;

-- Category guesser (regex-based, matches lib/ingredient-categories.ts)
CREATE OR REPLACE FUNCTION guess_ingredient_category(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  n TEXT := lower(p_name);
BEGIN
  -- Meat
  IF n ~ 'chicken|turkey|duck|beef|steak|pork|lamb|bacon|sausage|ham|veal|venison|bison|mince|meatball' THEN
    RETURN 'meat';
  END IF;
  -- Seafood
  IF n ~ 'salmon|shrimp|prawn|tuna|cod|tilapia|crab|lobster|mussel|clam|oyster|squid|anchov|sardine|fish|scallop|mackerel' THEN
    RETURN 'seafood';
  END IF;
  -- Dairy & Eggs
  IF n ~ 'milk|cream|cheese|butter|yogurt|yoghurt|sour cream|crème|creme|whey|ricotta|mozzarella|parmesan|cheddar|feta|brie|mascarpone|ghee|\megg\M|\meggs\M' THEN
    RETURN 'dairy';
  END IF;
  -- Produce
  IF n ~ 'onion|garlic|tomato|potato|carrot|celery|pepper|lettuce|spinach|kale|broccoli|cauliflower|zucchini|squash|cucumber|avocado|corn|bean|pea|mushroom|ginger|lemon|lime|orange|apple|banana|berry|grape|mango|pineapple|coconut|cabbage|eggplant|radish|beet|turnip|leek|shallot|chili|jalape|herb|basil|cilantro|parsley|mint|rosemary|thyme|dill|chive|scallion|asparagus|artichoke|fennel|arugula|watercress|endive' THEN
    RETURN 'produce';
  END IF;
  -- Grains & Starches
  IF n ~ 'flour|rice|pasta|noodle|bread|oat|cereal|couscous|quinoa|barley|bulgur|corn meal|polenta|tortilla|pita|cracker|panko|breadcrumb|spaghetti|penne|macaroni|fettuccine|lasagna|gnocchi|ramen' THEN
    RETURN 'grains';
  END IF;
  -- Spices & Seasonings
  IF n ~ 'salt|pepper|cumin|paprika|oregano|cinnamon|nutmeg|clove|turmeric|cayenne|chili powder|garlic powder|onion powder|bay leaf|cardamom|coriander|fennel seed|mustard seed|saffron|vanilla|allspice|anise|curry|garam|seasoning' THEN
    RETURN 'spices';
  END IF;
  -- Condiments & Sauces
  IF n ~ 'oil|vinegar|soy sauce|ketchup|mustard|mayo|hot sauce|worcestershire|teriyaki|sriracha|hoisin|fish sauce|oyster sauce|tahini|pesto|salsa|bbq|barbecue|honey|maple|molasses|jam|jelly|relish|chutney|dressing|marinade' THEN
    RETURN 'condiments';
  END IF;
  -- Baking
  IF n ~ 'sugar|baking soda|baking powder|yeast|cocoa|chocolate|extract|food color|sprinkle|frosting|icing|powdered sugar|brown sugar|confectioner|cornstarch|gelatin|cream of tartar' THEN
    RETURN 'baking';
  END IF;
  -- Canned goods
  IF n ~ 'canned|can of|tin of|broth|stock|bouillon|tomato paste|tomato sauce|coconut milk|condensed' THEN
    RETURN 'canned';
  END IF;

  RETURN 'other';
END;
$$;

-- ============================================================================
-- Step 4: Schema change — add normalized_ingredients column
-- ============================================================================

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS normalized_ingredients JSONB;

CREATE INDEX IF NOT EXISTS idx_recipes_normalized_ingredients
  ON recipes USING GIN (normalized_ingredients);

-- ============================================================================
-- Step 5: Batch normalization function
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_recipe_ingredients(p_recipe_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_ingredients JSONB;
  normalized JSONB := '[]'::jsonb;
  ing JSONB;
  raw_name TEXT;
  norm_name TEXT;
  cat TEXT;
BEGIN
  SELECT ingredients INTO raw_ingredients FROM recipes WHERE id = p_recipe_id;
  IF raw_ingredients IS NULL THEN RETURN; END IF;

  FOR ing IN SELECT * FROM jsonb_array_elements(raw_ingredients)
  LOOP
    raw_name := ing->>'name';
    norm_name := normalize_ingredient_name(raw_name);
    cat := guess_ingredient_category(COALESCE(norm_name, raw_name));

    normalized := normalized || jsonb_build_array(jsonb_build_object(
      'name', norm_name,
      'raw_name', raw_name,
      'quantity', ing->>'quantity',
      'unit', ing->>'unit',
      'category', cat
    ));
  END LOOP;

  UPDATE recipes SET normalized_ingredients = normalized WHERE id = p_recipe_id;
END;
$$;

-- ============================================================================
-- Step 6: Trigger — auto-normalize on INSERT/UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_normalize_ingredients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ing JSONB;
  raw_name TEXT;
  norm_name TEXT;
  cat TEXT;
  normalized JSONB := '[]'::jsonb;
BEGIN
  IF NEW.ingredients IS NULL THEN
    NEW.normalized_ingredients := NULL;
    RETURN NEW;
  END IF;

  FOR ing IN SELECT * FROM jsonb_array_elements(NEW.ingredients)
  LOOP
    raw_name := ing->>'name';
    norm_name := normalize_ingredient_name(raw_name);
    cat := guess_ingredient_category(COALESCE(norm_name, raw_name));

    normalized := normalized || jsonb_build_array(jsonb_build_object(
      'name', norm_name,
      'raw_name', raw_name,
      'quantity', ing->>'quantity',
      'unit', ing->>'unit',
      'category', cat
    ));
  END LOOP;

  NEW.normalized_ingredients := normalized;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_normalize_ingredients
  BEFORE INSERT OR UPDATE OF ingredients ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_ingredients();

-- ============================================================================
-- Step 7: Backfill all existing recipes
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  batch_count INT := 0;
BEGIN
  FOR r IN SELECT id FROM recipes WHERE ingredients IS NOT NULL
  LOOP
    PERFORM normalize_recipe_ingredients(r.id);
    batch_count := batch_count + 1;
    IF batch_count % 100 = 0 THEN
      RAISE NOTICE 'Normalized % recipes...', batch_count;
    END IF;
  END LOOP;
  RAISE NOTICE 'Backfill complete: % recipes normalized', batch_count;
END;
$$;

-- ============================================================================
-- Step 8: pg_cron daily re-normalization + fuzzy matching
-- ============================================================================

-- Enable extensions (must already be enabled in Dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Daily job at 11 PM local time: re-normalize all recipes
SELECT cron.schedule(
  'daily-ingredient-normalization',
  '0 23 * * *',
  $$
    DO $job$
    DECLARE
      r RECORD;
      batch_count INT := 0;
    BEGIN
      -- Re-normalize all recipes (picks up synonym table changes)
      FOR r IN SELECT id FROM recipes WHERE ingredients IS NOT NULL
      LOOP
        PERFORM normalize_recipe_ingredients(r.id);
        batch_count := batch_count + 1;
      END LOOP;
      RAISE NOTICE '[cron] Re-normalized % recipes', batch_count;
    END;
    $job$;
  $$
);

-- Weekly job (Sunday 3 AM): find fuzzy-match candidates for new synonyms
SELECT cron.schedule(
  'weekly-ingredient-fuzzy-match',
  '0 3 * * 0',
  $$
    DO $job$
    DECLARE
      a_rec RECORD;
      b_rec RECORD;
      dist INT;
      suggestions INT := 0;
    BEGIN
      -- Get all distinct normalized ingredient names currently in use
      FOR a_rec IN
        SELECT DISTINCT elem->>'name' AS name
        FROM recipes, jsonb_array_elements(normalized_ingredients) AS elem
        WHERE normalized_ingredients IS NOT NULL
          AND (elem->>'name') IS NOT NULL
          AND (elem->>'name') != ''
      LOOP
        FOR b_rec IN
          SELECT DISTINCT elem->>'name' AS name
          FROM recipes, jsonb_array_elements(normalized_ingredients) AS elem
          WHERE normalized_ingredients IS NOT NULL
            AND (elem->>'name') IS NOT NULL
            AND (elem->>'name') != ''
            AND (elem->>'name') > a_rec.name  -- avoid duplicates
        LOOP
          dist := levenshtein(a_rec.name, b_rec.name);
          -- Only suggest pairs with distance 1-2 (very similar)
          IF dist BETWEEN 1 AND 2
             AND NOT EXISTS (
               SELECT 1 FROM ingredient_synonyms
               WHERE variant = a_rec.name OR variant = b_rec.name
             )
             AND NOT EXISTS (
               SELECT 1 FROM ingredient_review_queue
               WHERE (raw_a = a_rec.name AND raw_b = b_rec.name)
                  OR (raw_a = b_rec.name AND raw_b = a_rec.name)
             )
          THEN
            INSERT INTO ingredient_review_queue (raw_a, raw_b, distance)
            VALUES (a_rec.name, b_rec.name, dist);
            suggestions := suggestions + 1;
          END IF;
        END LOOP;
      END LOOP;
      RAISE NOTICE '[cron] Found % new fuzzy-match suggestions', suggestions;
    END;
    $job$;
  $$
);

-- ============================================================================
-- Step 9: RLS policies for new tables
-- ============================================================================

-- Lookup tables are read-only for all authenticated users
ALTER TABLE ingredient_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_protected_compounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prep_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_keep_plural ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_review_queue ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read lookup tables
CREATE POLICY "Anyone can read synonyms"
  ON ingredient_synonyms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read protected compounds"
  ON ingredient_protected_compounds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read prep words"
  ON ingredient_prep_words FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read keep plural"
  ON ingredient_keep_plural FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read review queue"
  ON ingredient_review_queue FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Done! Verify with:
--   SELECT normalize_ingredient_name('Diced Yellow Onions');  -- → 'onion'
--   SELECT normalize_ingredient_name('Ground Beef');          -- → 'ground beef'
--   SELECT normalize_ingredient_name('Fresh Cilantro');       -- → 'coriander'
--   SELECT normalize_ingredient_name('frozen chicken breast');-- → 'chicken breast'
--   SELECT id, normalized_ingredients FROM recipes LIMIT 3;
--   SELECT * FROM cron.job;
-- ============================================================================
