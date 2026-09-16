-- Read-only comparison before and after the category migration.
SELECT jsonb_build_object(
 'products',(SELECT md5(coalesce(jsonb_agg(to_jsonb(p)-'categoria_id' ORDER BY id)::text,'[]')) FROM public.producto p),
 'orders',(SELECT md5(coalesce(jsonb_agg(p ORDER BY id)::text,'[]')) FROM public.pedido p),
 'lines',(SELECT md5(coalesce(jsonb_agg(p ORDER BY id)::text,'[]')) FROM public.detalle_pedido p),
 'units',(SELECT md5(coalesce(jsonb_agg(p ORDER BY id)::text,'[]')) FROM public.unidad p),
 'payments',(SELECT md5(coalesce(jsonb_agg(p ORDER BY id)::text,'[]')) FROM public.venta_abono p),
 'legacyOptions',(SELECT md5(coalesce(jsonb_agg(p ORDER BY id)::text,'[]')) FROM public.compra_opcion p)
) AS fingerprint;
