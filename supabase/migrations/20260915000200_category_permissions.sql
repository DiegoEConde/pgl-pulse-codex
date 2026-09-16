BEGIN;
-- Supabase default privileges may grant table operations absent in local PostgreSQL.
REVOKE ALL ON public.categorias,public.categoria_caracteristica FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.categorias,public.categoria_caracteristica TO anon;
REVOKE ALL ON SEQUENCE public.categorias_id_seq,public.categoria_caracteristica_id_seq FROM PUBLIC,anon,authenticated;
COMMIT;
