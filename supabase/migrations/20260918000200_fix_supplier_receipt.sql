BEGIN;
CREATE OR REPLACE FUNCTION public.pgl_receive_and_pay_order(p_id bigint,p_units jsonb,p_amount numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE purchase public.pedido%ROWTYPE; detail public.detalle_pedido%ROWTYPE; accepted integer; total numeric:=0; unit_count integer; shipping_cents bigint; item_index integer; inserted_count integer:=0;
BEGIN
 SELECT * INTO purchase FROM public.pedido WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR purchase.estado NOT IN ('PEDIDO','ENVÍO') THEN RAISE EXCEPTION 'El pedido no está pendiente de recepción'; END IF;
 IF jsonb_typeof(p_units) IS DISTINCT FROM 'array' OR jsonb_array_length(p_units)=0 THEN RAISE EXCEPTION 'Seleccioná al menos una unidad recibida'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_units) AS received(value) WHERE NOT EXISTS (SELECT 1 FROM public.detalle_pedido d WHERE d.pedido_id=p_id AND d.id=(received.value->>'detalle_id')::bigint)) THEN RAISE EXCEPTION 'Hay unidades sin una línea válida'; END IF;
 unit_count:=jsonb_array_length(p_units); shipping_cents:=round(purchase.costo_envio_usd*100);
 FOR detail IN SELECT * FROM public.detalle_pedido WHERE pedido_id=p_id ORDER BY id LOOP
  SELECT count(*) INTO accepted FROM jsonb_array_elements(p_units) AS received(value) WHERE (received.value->>'detalle_id')::bigint=detail.id;
  IF accepted>detail.cantidad THEN RAISE EXCEPTION 'La cantidad recibida no es válida'; END IF;
  FOR item_index IN 1..accepted LOOP
   inserted_count:=inserted_count+1;
   INSERT INTO public.unidad(pedido_id,detalle_pedido_id,producto_id,estado,color,codigo,precio_costo_usd,costo_envio_usd,fecha_retiro,fecha_ingreso_stock)
   VALUES(p_id,detail.id,detail.producto_id,'STOCK',detail.color,NULL,detail.precio_costo_usd,((shipping_cents/unit_count)+CASE WHEN inserted_count<=shipping_cents%unit_count THEN 1 ELSE 0 END)::numeric/100,now(),now());
  END LOOP;
  total:=total+(accepted*detail.precio_costo_usd);
  IF accepted=0 THEN DELETE FROM public.detalle_pedido WHERE id=detail.id;
  ELSE UPDATE public.detalle_pedido SET cantidad=accepted WHERE id=detail.id;
  END IF;
 END LOOP;
 total:=total+purchase.costo_envio_usd;
 IF p_amount IS NULL OR p_amount<0 OR p_amount>total THEN RAISE EXCEPTION 'El importe abonado no puede superar el total'; END IF;
 INSERT INTO public.proveedor_pago(pedido_id,proveedor_id,importe_usd) VALUES(p_id,purchase.proveedor_id,p_amount);
 UPDATE public.pedido SET estado='RECIBIDO' WHERE id=p_id;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
