-- Solo lectura. Ejecutar en el proyecto hxoofxapwgebihkyuvrv.
-- Devuelve metadatos, sin registros comerciales.
WITH targets AS (
  SELECT c.oid, n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
)
SELECT jsonb_build_object(
  'tables', (SELECT jsonb_agg(jsonb_build_object('name', relname, 'rls', relrowsecurity, 'force_rls', relforcerowsecurity)) FROM targets),
  'columns', (SELECT jsonb_agg(to_jsonb(x)) FROM (
    SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default,
           is_identity, identity_generation, character_maximum_length, numeric_precision, numeric_scale
    FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position
  ) x),
  'constraints', (SELECT jsonb_agg(jsonb_build_object('table', t.relname, 'name', c.conname, 'type', c.contype, 'definition', pg_get_constraintdef(c.oid)))
    FROM pg_constraint c JOIN targets t ON t.oid = c.conrelid),
  'indexes', (SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public') x),
  'policies', (SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public') x),
  'grants', (SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT table_name, grantee, privilege_type FROM information_schema.table_privileges WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'PUBLIC')) x),
  'triggers', (SELECT jsonb_agg(jsonb_build_object('table', t.relname, 'name', g.tgname, 'definition', pg_get_triggerdef(g.oid))) FROM pg_trigger g JOIN targets t ON t.oid = g.tgrelid WHERE NOT g.tgisinternal)
) AS auditoria;
