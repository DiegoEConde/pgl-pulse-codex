-- B2: conservar el saldo conocido de alpha sin inventar un historial de cobros.
BEGIN;
ALTER TABLE public.unidad ADD COLUMN cobrado_inicial_usd numeric(10,2) NOT NULL DEFAULT 0 CHECK (cobrado_inicial_usd >= 0);
UPDATE public.unidad SET cobrado_inicial_usd=precio_venta_usd WHERE fecha_venta IS NOT NULL AND pago_verificado;
CREATE TABLE public.venta_abono (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 unidad_id bigint NOT NULL REFERENCES public.unidad(id) ON DELETE CASCADE,
 importe_usd numeric(10,2) NOT NULL CHECK (importe_usd > 0),
 registrado_en timestamptz NOT NULL DEFAULT now(),
 solicitud_id uuid NOT NULL UNIQUE
);
CREATE INDEX venta_abono_unidad_idx ON public.venta_abono(unidad_id);
ALTER TABLE public.venta_abono ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.venta_abono FROM anon, authenticated;
GRANT SELECT ON public.venta_abono TO anon;
CREATE POLICY app_read ON public.venta_abono FOR SELECT TO anon USING (true);

CREATE FUNCTION public.pgl_add_sale_payment(p_id bigint,p_amount numeric,p_request uuid,p_delivered boolean)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item public.unidad%rowtype; previous public.venta_abono%rowtype; paid numeric; result bigint;
BEGIN
 IF p_request IS NULL THEN RAISE EXCEPTION 'Falta el identificador del abono'; END IF;
 -- Serializa reintentos y abonos simultáneos: el saldo se calcula bajo el bloqueo de la unidad.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT * INTO item FROM public.unidad WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR item.fecha_venta IS NULL THEN RAISE EXCEPTION 'No hay una venta para esta unidad'; END IF;
 SELECT * INTO previous FROM public.venta_abono WHERE solicitud_id=p_request;
 IF FOUND THEN
  IF previous.unidad_id <> p_id OR previous.importe_usd IS DISTINCT FROM p_amount THEN RAISE EXCEPTION 'El reintento no coincide con el abono original'; END IF;
  RETURN previous.id;
 END IF;
 IF p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount<=0 OR p_amount<>round(p_amount,2) THEN RAISE EXCEPTION 'Ingresá un importe positivo con hasta dos decimales'; END IF;
 IF item.estado NOT IN ('REPARTO','ENTREGADA') THEN RAISE EXCEPTION 'La venta no admite abonos'; END IF;
 SELECT item.cobrado_inicial_usd + coalesce(sum(importe_usd),0) INTO paid FROM public.venta_abono WHERE unidad_id=p_id;
 IF paid+p_amount > item.precio_venta_usd THEN RAISE EXCEPTION 'El abono supera el saldo pendiente. Actualizá la venta'; END IF;
 IF paid+p_amount=item.precio_venta_usd AND item.estado<>'ENTREGADA' AND p_delivered IS DISTINCT FROM true THEN RAISE EXCEPTION 'Confirmá el retiro para completar el pago'; END IF;
 INSERT INTO public.venta_abono(unidad_id,importe_usd,solicitud_id) VALUES(p_id,p_amount,p_request) RETURNING id INTO result;
 UPDATE public.unidad SET pago_verificado=(paid+p_amount=precio_venta_usd),
 estado=CASE WHEN p_delivered THEN 'ENTREGADA' ELSE estado END,
 fecha_entrega=CASE WHEN p_delivered THEN coalesce(fecha_entrega,now()) ELSE fecha_entrega END WHERE id=p_id;
 RETURN result;
END $$;

-- La creación y su primer abono se confirman juntos o se revierten juntos.
ALTER FUNCTION public.pgl_create_sale(bigint,bigint,bigint,date,numeric,numeric,boolean,uuid) RENAME TO pgl_create_sale_alpha;
REVOKE ALL ON FUNCTION public.pgl_create_sale_alpha(bigint,bigint,bigint,date,numeric,numeric,boolean,uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.pgl_create_sale_partial(p_unit bigint,p_client bigint,p_seller bigint,p_date date,p_price numeric,p_commission numeric,p_amount numeric,p_request uuid,p_delivered boolean)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result bigint; item public.unidad%rowtype;
BEGIN
 IF p_request IS NULL THEN RAISE EXCEPTION 'Falta el identificador de la venta'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT * INTO item FROM public.unidad WHERE id=p_unit FOR UPDATE;
 IF item.solicitud_venta_id=p_request THEN
  IF item.cliente_id IS DISTINCT FROM p_client OR item.vendedor_id IS DISTINCT FROM p_seller OR
     (item.fecha_venta at time zone 'America/Argentina/Buenos_Aires')::date IS DISTINCT FROM p_date OR
     item.precio_venta_usd IS DISTINCT FROM p_price OR item.comision_usd IS DISTINCT FROM p_commission OR
     coalesce((SELECT importe_usd FROM public.venta_abono WHERE solicitud_id=p_request),0) IS DISTINCT FROM p_amount
  THEN RAISE EXCEPTION 'El reintento no coincide con la venta original'; END IF;
  RETURN item.id;
 END IF;
 IF p_price IS NULL OR p_price::text IN ('NaN','Infinity','-Infinity') OR p_price<>round(p_price,2) OR p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount<0 OR p_amount>p_price OR p_amount<>round(p_amount,2) THEN RAISE EXCEPTION 'Revisá el precio y el importe abonado'; END IF;
 IF p_amount=p_price AND p_delivered IS DISTINCT FROM true THEN RAISE EXCEPTION 'Confirmá el retiro para completar el pago'; END IF;
 result:=public.pgl_create_sale_alpha(p_unit,p_client,p_seller,p_date,p_price,p_commission,false,p_request);
 IF p_amount>0 THEN PERFORM public.pgl_add_sale_payment(result,p_amount,p_request,p_delivered); END IF;
 UPDATE public.unidad SET pago_verificado=(p_amount=p_price),estado=CASE WHEN p_delivered THEN 'ENTREGADA' ELSE estado END,
 fecha_entrega=CASE WHEN p_delivered THEN coalesce(fecha_entrega,now()) ELSE fecha_entrega END WHERE id=result;
 RETURN result;
END $$;
-- Clientes antiguos no pueden modificar el saldo por el interruptor booleano.
CREATE OR REPLACE FUNCTION public.pgl_set_payment(p_id bigint,p_paid boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Actualizá la aplicación y registrá el importe del abono'; END $$;
CREATE FUNCTION public.pgl_create_sale(p_unit bigint,p_client bigint,p_seller bigint,p_date date,p_price numeric,p_commission numeric,p_paid boolean,p_request uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Actualizá la aplicación para registrar el importe abonado'; END $$;
ALTER FUNCTION public.pgl_snapshot() RENAME TO pgl_snapshot_alpha;
REVOKE ALL ON FUNCTION public.pgl_snapshot_alpha() FROM PUBLIC,anon,authenticated;
-- Invoker conserva las políticas existentes; la función base solo permite lectura.
GRANT EXECUTE ON FUNCTION public.pgl_snapshot_alpha() TO anon;
CREATE FUNCTION public.pgl_snapshot() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT public.pgl_snapshot_alpha() || jsonb_build_object('salePayments',coalesce((SELECT jsonb_agg(t ORDER BY registrado_en,id) FROM public.venta_abono t),'[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.pgl_add_sale_payment(bigint,numeric,uuid,boolean),public.pgl_create_sale_partial(bigint,bigint,bigint,date,numeric,numeric,numeric,uuid,boolean),public.pgl_create_sale(bigint,bigint,bigint,date,numeric,numeric,boolean,uuid),public.pgl_snapshot() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.pgl_add_sale_payment(bigint,numeric,uuid,boolean),public.pgl_create_sale_partial(bigint,bigint,bigint,date,numeric,numeric,numeric,uuid,boolean),public.pgl_create_sale(bigint,bigint,bigint,date,numeric,numeric,boolean,uuid),public.pgl_snapshot() TO anon;
NOTIFY pgrst, 'reload schema';
COMMIT;
