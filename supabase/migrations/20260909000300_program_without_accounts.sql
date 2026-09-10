-- PGL Pulse funciona sin cuentas. El rol anon representa la aplicación.
-- Las escrituras de operaciones pasan por funciones transaccionales.
ALTER TABLE public.pedido ADD COLUMN estado text NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR','PEDIDO','ENVÍO','RECIBIDO')),
  ADD COLUMN fecha_estimada date,
  ADD COLUMN cerrado_en timestamptz,
  ADD COLUMN solicitud_id uuid UNIQUE;
ALTER TABLE public.detalle_pedido ADD COLUMN precio_costo_usd numeric(10,2) NOT NULL DEFAULT 0 CHECK (precio_costo_usd >= 0);
ALTER TABLE public.unidad ADD COLUMN detalle_pedido_id bigint REFERENCES public.detalle_pedido(id) ON DELETE RESTRICT,
  ADD COLUMN variante varchar(120),
  ADD COLUMN ram varchar(60),
  ADD COLUMN precio_sugerido_usd numeric(10,2) CHECK (precio_sugerido_usd >= 0),
  ADD COLUMN fecha_ingreso_stock timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN fecha_venta timestamptz,
  ADD COLUMN solicitud_venta_id uuid UNIQUE;
CREATE INDEX idx_unidad_detalle ON public.unidad(detalle_pedido_id);
CREATE INDEX idx_unidad_fecha_venta ON public.unidad(fecha_venta);
ALTER TABLE public.unidad ADD CONSTRAINT chk_unidad_venta_completa CHECK (
  (estado IN ('RETIRADO','STOCK') AND fecha_venta IS NULL AND precio_venta_usd IS NULL AND comision_usd IS NULL)
  OR (estado IN ('REPARTO','ENTREGADA') AND fecha_venta IS NOT NULL AND precio_venta_usd IS NOT NULL AND comision_usd IS NOT NULL)
);
CREATE TABLE public.reporte_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 150),
  dimension text NOT NULL CHECK (dimension IN ('state','product','brand','category','seller','supplier','month')),
  metric text NOT NULL CHECK (metric IN ('units','sales','profit','cost','commissions')),
  chart_type text NOT NULL CHECK (chart_type IN ('bar','line','donut')),
  state text NOT NULL CHECK (state IN ('TODOS','RETIRADO','STOCK','REPARTO','ENTREGADA')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reporte_config ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text; pol record;
BEGIN
  FOR pol IN SELECT tablename,policyname FROM pg_policies WHERE schemaname='public' LOOP
    EXECUTE format('DROP POLICY %I ON public.%I',pol.policyname,pol.tablename);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['proveedor','cliente','vendedor','producto','pedido','detalle_pedido','unidad','reporte_config'] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon',t);
    EXECUTE format('CREATE POLICY app_read ON public.%I FOR SELECT TO anon USING (true)',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['proveedor','cliente','vendedor','producto','reporte_config'] LOOP
    EXECUTE format('GRANT INSERT, UPDATE ON public.%I TO anon',t);
    EXECUTE format('CREATE POLICY app_insert ON public.%I FOR INSERT TO anon WITH CHECK (true)',t);
    EXECUTE format('CREATE POLICY app_update ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true)',t);
  END LOOP;
END $$;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.proveedor_id_seq,public.cliente_id_seq,public.vendedor_id_seq,public.producto_id_seq TO anon;
GRANT DELETE ON public.reporte_config TO anon;
CREATE POLICY app_delete ON public.reporte_config FOR DELETE TO anon USING (true);

CREATE FUNCTION public.pgl_snapshot() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 SELECT jsonb_build_object(
 'products',coalesce((select jsonb_agg(t order by id desc) from public.producto t),'[]'::jsonb),
 'suppliers',coalesce((select jsonb_agg(t order by id desc) from public.proveedor t),'[]'::jsonb),
 'clients',coalesce((select jsonb_agg(t order by id desc) from public.cliente t),'[]'::jsonb),
 'sellers',coalesce((select jsonb_agg(t order by id desc) from public.vendedor t),'[]'::jsonb),
 'orders',coalesce((select jsonb_agg(t order by id desc) from public.pedido t),'[]'::jsonb),
 'lines',coalesce((select jsonb_agg(t order by id) from public.detalle_pedido t),'[]'::jsonb),
 'units',coalesce((select jsonb_agg(t order by id desc) from public.unidad t),'[]'::jsonb),
 'charts',coalesce((select jsonb_agg(t order by created_at,id) from public.reporte_config t),'[]'::jsonb));
$$;

CREATE FUNCTION public.pgl_create_order(p_supplier bigint,p_date date,p_expected date,p_shipping numeric,p_notes text,p_lines jsonb,p_request uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result bigint;
BEGIN
  IF p_request IS NULL THEN RAISE EXCEPTION 'Falta el identificador de la compra'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  SELECT id INTO result FROM public.pedido WHERE solicitud_id=p_request;
  IF FOUND THEN RETURN result; END IF;
  IF p_date IS NULL OR p_date > (now() at time zone 'America/Argentina/Buenos_Aires')::date OR
     p_expected IS NULL OR p_expected < p_date OR p_shipping IS NULL OR p_shipping < 0 OR
     jsonb_typeof(p_lines) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lines)=0 OR jsonb_array_length(p_lines)>100
  THEN RAISE EXCEPTION 'Revisá las fechas, el envío y los productos de la compra'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_lines) AS l(producto_id bigint,color text,cantidad integer,precio_costo_usd numeric)
    WHERE producto_id IS NULL OR nullif(trim(color),'') IS NULL OR cantidad IS NULL OR cantidad<1 OR cantidad>1000 OR precio_costo_usd IS NULL OR precio_costo_usd<0)
  THEN RAISE EXCEPTION 'Cada línea necesita producto, color, cantidad y costo válidos'; END IF;
  IF (SELECT sum(cantidad) FROM jsonb_to_recordset(p_lines) AS l(cantidad integer))>1000 THEN RAISE EXCEPTION 'Máximo 1000 unidades por pedido'; END IF;
  INSERT INTO public.pedido(proveedor_id,fecha_pedido,fecha_estimada,costo_envio_usd,observaciones,solicitud_id)
    VALUES(p_supplier,p_date::timestamp at time zone 'America/Argentina/Buenos_Aires',p_expected,p_shipping,nullif(trim(p_notes),''),p_request) RETURNING id INTO result;
  INSERT INTO public.detalle_pedido(pedido_id,producto_id,color,cantidad,precio_costo_usd)
    SELECT result,producto_id,trim(color),cantidad,precio_costo_usd
    FROM jsonb_to_recordset(p_lines) AS l(producto_id bigint,color text,cantidad integer,precio_costo_usd numeric);
  RETURN result;
END $$;

CREATE FUNCTION public.pgl_order_status(p_id bigint,p_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.pedido SET estado=p_status WHERE id=p_id AND
    ((estado='BORRADOR' AND p_status='PEDIDO') OR (estado='PEDIDO' AND p_status='ENVÍO'));
  IF NOT FOUND THEN RAISE EXCEPTION 'El pedido cambió o la transición no es válida. Actualizá la pantalla'; END IF;
END $$;

CREATE FUNCTION public.pgl_receive_order(p_id bigint,p_units jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE purchase public.pedido%rowtype; total integer; cents bigint;
BEGIN
  SELECT * INTO purchase FROM public.pedido WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido inexistente'; END IF;
  IF purchase.estado='RECIBIDO' THEN RETURN; END IF;
  IF purchase.estado NOT IN ('PEDIDO','ENVÍO') THEN RAISE EXCEPTION 'Confirmá el pedido antes de recibirlo'; END IF;
  SELECT sum(cantidad) INTO total FROM public.detalle_pedido WHERE pedido_id=p_id;
  IF jsonb_typeof(p_units) IS DISTINCT FROM 'array' OR jsonb_array_length(p_units) IS DISTINCT FROM total THEN
    RAISE EXCEPTION 'La recepción debe incluir todas las unidades del pedido'; END IF;
  IF EXISTS (SELECT 1 FROM public.detalle_pedido d WHERE d.pedido_id=p_id AND d.cantidad <>
    (SELECT count(*) FROM jsonb_array_elements(p_units) u WHERE (u->>'detalle_id')::bigint=d.id)) THEN
    RAISE EXCEPTION 'Las cantidades recibidas no coinciden con las líneas del pedido'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_units) u
    WHERE NOT EXISTS(SELECT 1 FROM public.detalle_pedido d WHERE d.pedido_id=p_id AND d.id=(u->>'detalle_id')::bigint)) THEN
    RAISE EXCEPTION 'Hay unidades sin una línea de pedido válida'; END IF;
  cents := round(purchase.costo_envio_usd*100);
  INSERT INTO public.unidad(pedido_id,detalle_pedido_id,producto_id,estado,color,codigo,precio_costo_usd,costo_envio_usd,fecha_retiro,fecha_ingreso_stock,variante,ram,precio_sugerido_usd)
    SELECT p_id,d.id,d.producto_id,'STOCK',d.color,nullif(trim(u.value->>'codigo'),''),d.precio_costo_usd,
      ((cents/total)+CASE WHEN u.ordinality <= cents%total THEN 1 ELSE 0 END)::numeric/100,
      now(),now(),nullif(trim(u.value->>'variante'),''),nullif(trim(u.value->>'ram'),''),nullif(u.value->>'precio_sugerido_usd','')::numeric
    FROM jsonb_array_elements(p_units) WITH ORDINALITY u(value,ordinality)
    JOIN public.detalle_pedido d ON d.id=(u.value->>'detalle_id')::bigint AND d.pedido_id=p_id;
  UPDATE public.pedido SET estado='RECIBIDO' WHERE id=p_id;
END $$;

CREATE FUNCTION public.pgl_create_sale(p_unit bigint,p_client bigint,p_seller bigint,p_date date,p_price numeric,p_commission numeric,p_paid boolean,p_request uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.unidad%rowtype;
BEGIN
  IF p_request IS NULL THEN RAISE EXCEPTION 'Falta el identificador de la venta'; END IF;
  SELECT * INTO item FROM public.unidad WHERE id=p_unit FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unidad inexistente'; END IF;
  IF item.solicitud_venta_id=p_request THEN RETURN item.id; END IF;
  IF item.estado <> 'STOCK' THEN RAISE EXCEPTION 'Esta unidad ya no está disponible. Actualizá el stock'; END IF;
  IF p_date IS NULL OR p_date < (item.fecha_ingreso_stock at time zone 'America/Argentina/Buenos_Aires')::date OR
    p_date > (now() at time zone 'America/Argentina/Buenos_Aires')::date OR p_price IS NULL OR p_price<0 OR
    p_commission IS NULL OR p_commission<0 OR p_paid IS NULL OR p_client IS NULL OR p_seller IS NULL
  THEN RAISE EXCEPTION 'Revisá fecha, cliente, vendedor, precio y comisión'; END IF;
  UPDATE public.unidad SET estado='REPARTO',cliente_id=p_client,vendedor_id=p_seller,precio_venta_usd=p_price,
    comision_usd=p_commission,pago_verificado=p_paid,fecha_venta=p_date::timestamp at time zone 'America/Argentina/Buenos_Aires',solicitud_venta_id=p_request
    WHERE id=p_unit;
  RETURN p_unit;
END $$;

CREATE FUNCTION public.pgl_deliver(p_id bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.unidad SET estado='ENTREGADA',fecha_entrega=now() WHERE id=p_id AND estado='REPARTO';
  IF NOT FOUND AND NOT EXISTS(SELECT 1 FROM public.unidad WHERE id=p_id AND estado='ENTREGADA') THEN RAISE EXCEPTION 'La unidad no está en reparto'; END IF;
END $$;

CREATE FUNCTION public.pgl_set_payment(p_id bigint,p_paid boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_paid IS NULL THEN RAISE EXCEPTION 'Indicá el estado del pago'; END IF;
  UPDATE public.unidad SET pago_verificado=p_paid WHERE id=p_id AND estado IN ('REPARTO','ENTREGADA');
  IF NOT FOUND THEN RAISE EXCEPTION 'No hay una venta para esta unidad'; END IF;
END $$;

CREATE FUNCTION public.pgl_update_stock(p_id bigint,p_code text,p_variant text,p_ram text,p_suggested numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.unidad SET codigo=nullif(trim(p_code),''),variante=nullif(trim(p_variant),''),ram=nullif(trim(p_ram),''),precio_sugerido_usd=p_suggested
    WHERE id=p_id AND estado='STOCK';
  IF NOT FOUND THEN RAISE EXCEPTION 'La unidad ya no está en stock. Actualizá la pantalla'; END IF;
END $$;

CREATE FUNCTION public.pgl_close_day(p_date date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE total integer;
BEGIN
  IF p_date IS DISTINCT FROM (now() at time zone 'America/Argentina/Buenos_Aires')::date THEN RAISE EXCEPTION 'Solo se puede cerrar la operación de hoy'; END IF;
  UPDATE public.pedido SET cerrado_en=now() WHERE cerrado_en IS NULL
    AND (fecha_pedido at time zone 'America/Argentina/Buenos_Aires')::date=p_date;
  GET DIAGNOSTICS total=ROW_COUNT;
  RETURN total;
END $$;

DO $$
DECLARE fn record;
BEGIN
  FOR fn IN SELECT p.oid::regprocedure AS name FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'pgl_%' LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',fn.name);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon',fn.name);
  END LOOP;
END $$;
NOTIFY pgrst, 'reload schema';
