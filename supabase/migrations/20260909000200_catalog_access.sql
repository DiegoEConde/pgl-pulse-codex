-- Solo usuarios habilitados por un administrador pueden operar los catálogos.
-- app_metadata.pgl_pulse_access debe ser true (booleano).
GRANT SELECT, INSERT, UPDATE ON public.proveedor TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.proveedor_id_seq TO authenticated;
CREATE POLICY pgl_select ON public.proveedor FOR SELECT TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
CREATE POLICY pgl_insert ON public.proveedor FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
CREATE POLICY pgl_update ON public.proveedor FOR UPDATE TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
GRANT SELECT, INSERT, UPDATE ON public.cliente TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.cliente_id_seq TO authenticated;
CREATE POLICY pgl_select ON public.cliente FOR SELECT TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
CREATE POLICY pgl_insert ON public.cliente FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
CREATE POLICY pgl_update ON public.cliente FOR UPDATE TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
GRANT SELECT, INSERT, UPDATE ON public.vendedor TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.vendedor_id_seq TO authenticated;
CREATE POLICY pgl_select ON public.vendedor FOR SELECT TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
CREATE POLICY pgl_insert ON public.vendedor FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
CREATE POLICY pgl_update ON public.vendedor FOR UPDATE TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
GRANT SELECT, INSERT, UPDATE ON public.producto TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.producto_id_seq TO authenticated;
CREATE POLICY pgl_select ON public.producto FOR SELECT TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
CREATE POLICY pgl_insert ON public.producto FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');
CREATE POLICY pgl_update ON public.producto FOR UPDATE TO authenticated
USING ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true')
WITH CHECK ((select auth.jwt() -> 'app_metadata' ->> 'pgl_pulse_access') = 'true');

