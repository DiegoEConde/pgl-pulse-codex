-- Prueba remota o local; revierte registros, las secuencias pueden avanzar.
BEGIN;
SET LOCAL ROLE anon;
DO $$
DECLARE product_id bigint; supplier_id bigint; order_id bigint; request_id uuid:=gen_random_uuid(); lines jsonb; snapshot jsonb;
BEGIN
 snapshot:=public.pgl_snapshot();
 IF NOT (snapshot ? 'purchaseOptions' AND snapshot ? 'salePayments') THEN RAISE EXCEPTION 'Snapshot incompleto'; END IF;
 INSERT INTO public.producto(marca,nombre,categoria) VALUES('PGL_TEST',request_id::text,'Consolas') RETURNING id INTO product_id;
 INSERT INTO public.proveedor(nombre) VALUES('PGL_TEST') RETURNING id INTO supplier_id;
 lines:=jsonb_build_array(jsonb_build_object('producto_id',product_id,'color','Negro','cantidad',1,'precio_costo_usd',100,'atributos',jsonb_build_object('edicion','Digital')),jsonb_build_object('producto_id',product_id,'color','Negro','cantidad',1,'precio_costo_usd',120,'atributos',jsonb_build_object('edicion','Pro')));
 order_id:=public.pgl_create_order(supplier_id,(now() at time zone 'America/Argentina/Buenos_Aires')::date,NULL,0,'Prueba opciones',lines,request_id);
 IF public.pgl_create_order(supplier_id,(now() at time zone 'America/Argentina/Buenos_Aires')::date,NULL,0,'Prueba opciones',lines,request_id)<>order_id THEN RAISE EXCEPTION 'Reintento duplicado'; END IF;
 IF (SELECT count(*) FROM public.detalle_pedido WHERE pedido_id=order_id)<>2 THEN RAISE EXCEPTION 'Variantes no conservadas'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.pedido WHERE id=order_id AND fecha_estimada IS NULL AND costo_envio_usd=0 AND estado='BORRADOR') THEN RAISE EXCEPTION 'Estado incorrecto'; END IF;
 IF EXISTS(SELECT 1 FROM public.unidad WHERE pedido_id=order_id) THEN RAISE EXCEPTION 'Recepción automática'; END IF;
END $$;
ROLLBACK;
