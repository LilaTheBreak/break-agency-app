-- Add upgrade_suggested column to any User-like table if missing
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name ILIKE 'user' OR table_name ILIKE 'users'
  ) LOOP
    RAISE NOTICE 'Checking table: %.%', r.table_schema, r.table_name;
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS upgrade_suggested boolean DEFAULT false',
      r.table_schema, r.table_name
    );
  END LOOP;
END
$$;
