-- Validación de integración sin cuentas. Todo se revierte; las secuencias pueden avanzar.
BEGIN;
SET LOCAL ROLE anon;
DO $$
DECLARE
  product_id bigint; supplier_id bigint; client_id bigint; seller_id bigint; order_id bigint; detail_id bigint; unit_id bigint;
  request_id uuid := gen_random_uuid(); sale_request uuid := gen_random_uuid();
  day date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  lines jsonb; units jsonb; failed boolean; delivery_time timestamptz; chart_id uuid;
BEGIN
  INSERT INTO public.producto(marca,nombre,categoria) VALUES ('PGL_TEST',request_id::text,'Test') RETURNING id INTO product_id;
  INSERT INTO public.proveedor(nombre) VALUES ('PGL_TEST') RETURNING id INTO supplier_id;
  INSERT INTO public.cliente(nombre) VALUES ('PGL_TEST') RETURNING id INTO client_id;
  INSERT INTO public.vendedor(nombre,porcentaje_comision) VALUES ('PGL_TEST',5) RETURNING id INTO seller_id;
  lines := jsonb_build_array(jsonb_build_object('producto_id',product_id,'color','Negro','cantidad',3,'precio_costo_usd',10));
  order_id := public.pgl_create_order(supplier_id,day,day,0.05,'Prueba transaccional',lines,request_id);
  IF public.pgl_create_order(supplier_id,day,day,0.05,'Prueba transaccional',lines,request_id) <> order_id THEN RAISE EXCEPTION 'Compra duplicada'; END IF;
  SELECT id INTO detail_id FROM public.detalle_pedido WHERE pedido_id=order_id;
  PERFORM public.pgl_order_status(order_id,'PEDIDO');

  failed := false;
  BEGIN PERFORM public.pgl_receive_order(order_id,'[]'::jsonb);
  EXCEPTION WHEN raise_exception THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION 'Recepción incompleta aceptada'; END IF;

  units := jsonb_build_array(
    jsonb_build_object('detalle_id',detail_id,'codigo',request_id::text),
    jsonb_build_object('detalle_id',detail_id,'codigo',request_id::text),
    jsonb_build_object('detalle_id',detail_id));
  failed := false;
  BEGIN PERFORM public.pgl_receive_order(order_id,units);
  EXCEPTION WHEN unique_violation THEN failed := true; END;
  IF NOT failed OR EXISTS(SELECT 1 FROM public.unidad WHERE pedido_id=order_id) THEN RAISE EXCEPTION 'Recepción no atómica'; END IF;

  units := jsonb_build_array(
    jsonb_build_object('detalle_id',detail_id,'codigo',request_id::text,'ram','8 GB','variante','128 GB','precio_sugerido_usd',15),
    jsonb_build_object('detalle_id',detail_id),
    jsonb_build_object('detalle_id',detail_id));
  PERFORM public.pgl_receive_order(order_id,units);
  PERFORM public.pgl_receive_order(order_id,units);
  IF (SELECT count(*) FROM public.unidad WHERE pedido_id=order_id)<>3 THEN RAISE EXCEPTION 'Recepción duplicada'; END IF;
  IF (SELECT sum(costo_envio_usd) FROM public.unidad WHERE pedido_id=order_id)<>0.05 THEN RAISE EXCEPTION 'Prorrateo incorrecto'; END IF;
  SELECT min(id) INTO unit_id FROM public.unidad WHERE pedido_id=order_id;
  PERFORM public.pgl_update_stock(unit_id,request_id::text,'256 GB','12 GB');
  IF (SELECT variante FROM public.unidad WHERE id=unit_id)<>'256 GB' THEN RAISE EXCEPTION 'Edición de stock falló'; END IF;

  PERFORM public.pgl_create_sale(unit_id,client_id,seller_id,day,15,1,false,sale_request);
  PERFORM public.pgl_create_sale(unit_id,client_id,seller_id,day,15,1,false,sale_request);
  failed := false;
  BEGIN PERFORM public.pgl_create_sale(unit_id,client_id,seller_id,day,15,1,false,gen_random_uuid());
  EXCEPTION WHEN raise_exception THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION 'La misma unidad se vendió dos veces'; END IF;
  IF (SELECT estado FROM public.unidad WHERE id=unit_id)<>'REPARTO' THEN RAISE EXCEPTION 'Venta no reservó stock'; END IF;
  PERFORM public.pgl_set_payment(unit_id,true);
  PERFORM public.pgl_deliver(unit_id);
  SELECT fecha_entrega INTO delivery_time FROM public.unidad WHERE id=unit_id;
  PERFORM public.pgl_deliver(unit_id);
  IF delivery_time IS NULL OR (SELECT fecha_entrega FROM public.unidad WHERE id=unit_id)<>delivery_time THEN RAISE EXCEPTION 'Entrega no idempotente'; END IF;
  IF (SELECT estado FROM public.unidad WHERE id=unit_id)<>'ENTREGADA' THEN RAISE EXCEPTION 'Entrega no persistida'; END IF;

  INSERT INTO public.reporte_config(title,dimension,metric,chart_type,state) VALUES ('PGL_TEST','state','units','bar','TODOS') RETURNING id INTO chart_id;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.pgl_snapshot()->'charts') c WHERE c->>'id'=chart_id::text) THEN RAISE EXCEPTION 'Gráfico ausente del snapshot'; END IF;
  DELETE FROM public.reporte_config WHERE id=chart_id;
  PERFORM public.pgl_close_day(day);
  IF (SELECT cerrado_en FROM public.pedido WHERE id=order_id) IS NULL THEN RAISE EXCEPTION 'Cierre no persistido'; END IF;
  IF has_table_privilege('anon','public.unidad','UPDATE') OR has_table_privilege('anon','public.pedido','INSERT') THEN RAISE EXCEPTION 'Se permiten escrituras fuera del flujo'; END IF;
END $$;
ROLLBACK;