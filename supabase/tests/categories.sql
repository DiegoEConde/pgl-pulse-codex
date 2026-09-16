BEGIN;
SET LOCAL ROLE anon;
DO $$
DECLARE category record; field record; product bigint; supplier bigint; purchase bigint;
 attrs jsonb; color text; item jsonb; failed boolean; option_id bigint; result text; before_count integer;
 token uuid:=gen_random_uuid(); day date:=(now() at time zone 'America/Argentina/Buenos_Aires')::date;
BEGIN
 IF (SELECT count(*) FROM public.categorias WHERE nombre=ANY(ARRAY['celulares','notebooks','tablets','macbooks','ipads','consolas','audio','joysticks','perifericos','smartwatchs','applewatchs','televisores','rayban meta','cargadores','camaras']))<>15 THEN RAISE EXCEPTION 'Faltan categorias'; END IF;
 IF EXISTS(SELECT 1 FROM public.producto WHERE categoria_id IS NULL) THEN RAISE EXCEPTION 'Producto sin categoria'; END IF;
 IF EXISTS(SELECT 1 FROM public.categoria_caracteristica f JOIN public.categorias c ON c.id=f.categoria_id WHERE c.nombre IN ('smartwatchs','applewatchs','rayban meta','cargadores','camaras')) THEN RAISE EXCEPTION 'Campos inesperados'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.categoria_caracteristica f JOIN public.categorias c ON c.id=f.categoria_id WHERE c.nombre='televisores' AND '100'=ANY(f.valores) AND NOT('10'=ANY(f.valores))) THEN RAISE EXCEPTION 'Pulgadas incorrectas'; END IF;
 INSERT INTO public.proveedor(nombre) VALUES('CATEGORY_TEST') RETURNING id INTO supplier;
 FOR category IN SELECT * FROM public.categorias WHERE nombre=ANY(ARRAY['celulares','notebooks','tablets','macbooks','ipads','consolas','audio','joysticks','perifericos','smartwatchs','applewatchs','televisores','rayban meta','cargadores','camaras']) LOOP
   product:=public.pgl_create_product(category.id,'CATEGORY_TEST_'||token::text||category.id,'');
   IF product<>public.pgl_create_product(category.id,'CATEGORY_TEST_'||token::text||category.id,'') THEN RAISE EXCEPTION 'Producto duplicado en reintento'; END IF;
   attrs:='{}'; color:='';
   FOR field IN SELECT * FROM public.categoria_caracteristica WHERE categoria_id=category.id LOOP
     IF field.clave='color' THEN color:=field.valores[1];
     ELSE attrs:=attrs||jsonb_build_object(field.clave,CASE WHEN field.tipo='entero' THEN field.minimo::text ELSE field.valores[1] END); END IF;
   END LOOP;
   item:=jsonb_build_object('producto_id',product,'color',color,'cantidad',1,'precio_costo_usd',10,'atributos',attrs);
   purchase:=public.pgl_create_order(supplier,day,NULL,0,'',jsonb_build_array(item),gen_random_uuid());
   IF NOT EXISTS(SELECT 1 FROM public.detalle_pedido d WHERE pedido_id=purchase AND atributos=attrs AND d.color=item->>'color') THEN RAISE EXCEPTION 'Caracteristicas no persistidas'; END IF;
   -- Every configured characteristic is enforced, including color.
   FOR field IN SELECT * FROM public.categoria_caracteristica WHERE categoria_id=category.id LOOP
     failed:=false;
     BEGIN
       PERFORM public.pgl_create_order(supplier,day,NULL,0,'',jsonb_build_array(CASE WHEN field.clave='color' THEN item-'color' ELSE jsonb_set(item,'{atributos}',attrs-field.clave) END),gen_random_uuid());
     EXCEPTION WHEN raise_exception THEN failed:=true; END;
     IF NOT failed THEN RAISE EXCEPTION 'Se acepto campo obligatorio ausente: %',field.clave; END IF;
   END LOOP;
   failed:=false;
   BEGIN PERFORM public.pgl_create_order(supplier,day,NULL,0,'',jsonb_build_array(jsonb_set(item,'{atributos}',attrs||'{"campo_inventado":"X"}'::jsonb)),gen_random_uuid());
   EXCEPTION WHEN raise_exception THEN failed:=true; END;
   IF NOT failed THEN RAISE EXCEPTION 'Se acepto campo inexistente'; END IF;
   IF category.nombre='audio' THEN
     FOREACH result IN ARRAY ARRAY['1','351','2.5','2W','-2','NaN'] LOOP
       failed:=false;
       BEGIN PERFORM public.pgl_create_order(supplier,day,NULL,0,'',jsonb_build_array(jsonb_set(item,'{atributos,potencia}',to_jsonb(result))),gen_random_uuid());
       EXCEPTION WHEN raise_exception THEN failed:=true; END;
       IF NOT failed THEN RAISE EXCEPTION 'Potencia invalida aceptada'; END IF;
     END LOOP;
     PERFORM public.pgl_create_order(supplier,day,NULL,0,'',jsonb_build_array(jsonb_set(item,'{atributos,potencia}','"350"')),gen_random_uuid());
   END IF;
 END LOOP;
 SELECT f.id INTO option_id FROM public.categoria_caracteristica f JOIN public.categorias c ON c.id=f.categoria_id WHERE c.nombre='celulares' AND clave='ram';
 result:=public.pgl_add_category_value(option_id,' 48gb ');
 IF result<>'48 GB' THEN RAISE EXCEPTION 'Normalizacion incorrecta'; END IF;
 SELECT cardinality(valores) INTO before_count FROM public.categoria_caracteristica WHERE id=option_id;
 PERFORM public.pgl_add_category_value(option_id,'48 GB');
 IF before_count<>(SELECT cardinality(valores) FROM public.categoria_caracteristica WHERE id=option_id) THEN RAISE EXCEPTION 'Valor duplicado'; END IF;
 IF public.pgl_add_category_value(option_id,'1024gb')<>'1 TB' THEN RAISE EXCEPTION 'Conversion de capacidad incorrecta'; END IF;
 IF has_table_privilege('anon','public.categoria_caracteristica','INSERT') OR has_table_privilege('anon','public.categoria_caracteristica','UPDATE') THEN RAISE EXCEPTION 'Campos modificables directamente'; END IF;
END $$;
ROLLBACK;
