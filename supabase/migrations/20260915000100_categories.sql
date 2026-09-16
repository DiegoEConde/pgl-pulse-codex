BEGIN;

CREATE TABLE public.categorias (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nombre text NOT NULL UNIQUE CHECK (nombre = lower(trim(nombre)) AND nombre <> '')
);
CREATE TABLE public.categoria_caracteristica (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 categoria_id bigint NOT NULL REFERENCES public.categorias(id),
 clave text NOT NULL CHECK (clave ~ '^[a-z][a-z0-9_]*$'),
 etiqueta text NOT NULL,
 tipo text NOT NULL DEFAULT 'lista' CHECK (tipo IN ('lista','entero')),
 valores text[] NOT NULL DEFAULT '{}',
 minimo integer,
 maximo integer,
 obligatoria boolean NOT NULL DEFAULT true,
 UNIQUE(categoria_id,clave),
 CHECK ((tipo='lista' AND cardinality(valores)>0 AND minimo IS NULL AND maximo IS NULL)
     OR (tipo='entero' AND cardinality(valores)=0 AND minimo IS NOT NULL AND maximo IS NOT NULL AND minimo<=maximo))
);
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria_caracteristica ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.categorias,public.categoria_caracteristica TO anon;
CREATE POLICY app_read ON public.categorias FOR SELECT TO anon USING(true);
CREATE POLICY app_read ON public.categoria_caracteristica FOR SELECT TO anon USING(true);

INSERT INTO public.categorias(nombre) SELECT unnest(ARRAY['celulares','notebooks','tablets','macbooks','ipads','consolas','audio','joysticks','perifericos','smartwatchs','applewatchs','televisores','rayban meta','cargadores','camaras']);
-- Preserve categories already referenced by the catalog, including custom ones.
INSERT INTO public.categorias(nombre) SELECT DISTINCT lower(trim(categoria)) FROM public.producto
 ON CONFLICT DO NOTHING;
ALTER TABLE public.producto ADD COLUMN categoria_id bigint REFERENCES public.categorias(id);
UPDATE public.producto p SET categoria_id=c.id FROM public.categorias c WHERE c.nombre=lower(trim(p.categoria));
ALTER TABLE public.producto ALTER COLUMN categoria_id SET NOT NULL;

-- Keep the legacy display column synchronized while consumers migrate to the FK.
CREATE FUNCTION public.pgl_product_category() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' AND NEW.categoria_id IS NULL OR TG_OP='UPDATE' AND NEW.categoria IS DISTINCT FROM OLD.categoria AND NEW.categoria_id=OLD.categoria_id THEN
   SELECT id INTO NEW.categoria_id FROM public.categorias WHERE nombre=lower(trim(NEW.categoria));
 END IF;
 SELECT nombre INTO NEW.categoria FROM public.categorias WHERE id=NEW.categoria_id;
 IF NEW.categoria IS NULL THEN RAISE EXCEPTION 'Seleccioná una categoría existente'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER product_category BEFORE INSERT OR UPDATE ON public.producto FOR EACH ROW EXECUTE FUNCTION public.pgl_product_category();

INSERT INTO public.categoria_caracteristica(categoria_id,clave,etiqueta,valores)
 SELECT id,'color','Color',ARRAY['Negro','Blanco','Gris','Plata','Dorado','Azul','Rojo','Verde','Rosa','Violeta'] FROM public.categorias
 WHERE nombre IN ('celulares','notebooks','tablets','macbooks','ipads','audio','joysticks');
INSERT INTO public.categoria_caracteristica(categoria_id,clave,etiqueta,valores)
 SELECT id,'ram','RAM',CASE
 WHEN nombre IN ('notebooks','macbooks') THEN ARRAY['8 GB','12 GB','16 GB','24 GB','32 GB','64 GB','128 GB']
 WHEN nombre='ipads' THEN ARRAY['2 GB','4 GB','6 GB','8 GB','12 GB','16 GB','24 GB','32 GB','64 GB']
 ELSE ARRAY['2 GB','4 GB','6 GB','8 GB','12 GB','16 GB','24 GB','32 GB'] END
 FROM public.categorias WHERE nombre IN ('celulares','notebooks','tablets','macbooks','ipads');
INSERT INTO public.categoria_caracteristica(categoria_id,clave,etiqueta,valores)
 SELECT id,'rom','Almacenamiento',CASE
 WHEN nombre IN ('notebooks','macbooks') THEN ARRAY['256 GB','512 GB','1 TB','2 TB','3 TB','4 TB','5 TB']
 WHEN nombre='consolas' THEN ARRAY['256 GB','512 GB','825 GB','1 TB','2 TB','3 TB','4 TB','5 TB']
 WHEN nombre IN ('tablets','ipads') THEN ARRAY['32 GB','64 GB','128 GB','256 GB','512 GB','1 TB','2 TB']
 ELSE ARRAY['64 GB','128 GB','256 GB','512 GB','1 TB','2 TB'] END
 FROM public.categorias WHERE nombre IN ('celulares','notebooks','tablets','macbooks','ipads','consolas');
INSERT INTO public.categoria_caracteristica(categoria_id,clave,etiqueta,valores)
 SELECT id,'edicion','Modelo',ARRAY['Digital','Física','Pro','Ed. especial'] FROM public.categorias WHERE nombre='consolas';
INSERT INTO public.categoria_caracteristica(categoria_id,clave,etiqueta,tipo,minimo,maximo)
 SELECT id,'potencia','Potencia (W)','entero',2,350 FROM public.categorias WHERE nombre='audio';
INSERT INTO public.categoria_caracteristica(categoria_id,clave,etiqueta,valores)
 SELECT id,'consola','Consola',ARRAY['PS4','PS5','PS6','Xbox One','Xbox Series','Nintendo Switch','Nintendo Switch 2'] FROM public.categorias WHERE nombre='perifericos';
INSERT INTO public.categoria_caracteristica(categoria_id,clave,etiqueta,valores)
 SELECT id,'pulgadas','Pulgadas',ARRAY['32','42','43','45','50','55','60','65','70','75','77','80','85','90','95','98','100'] FROM public.categorias WHERE nombre='televisores';

CREATE FUNCTION public.pgl_add_category_value(p_characteristic bigint,p_value text) RETURNS text
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE field public.categoria_caracteristica; value text; amount numeric; unit text;
BEGIN
 SELECT * INTO field FROM public.categoria_caracteristica WHERE id=p_characteristic FOR UPDATE;
 IF NOT FOUND OR field.tipo<>'lista' THEN RAISE EXCEPTION 'Seleccioná una característica de lista existente'; END IF;
 value:=regexp_replace(trim(p_value),'\s+',' ','g');
 IF value IS NULL OR value='' OR length(value)>60 THEN RAISE EXCEPTION 'Ingresá un valor de hasta 60 caracteres'; END IF;
 IF field.clave IN ('ram','rom') THEN
   IF upper(value) !~ '^[0-9]+\s*(GB|TB)$' THEN RAISE EXCEPTION 'Ingresá una capacidad entera con GB o TB'; END IF;
   amount:=substring(value from '^[0-9]+')::numeric;
   unit:=substring(upper(value) from '(GB|TB)$');
   IF amount<1 OR amount>1048576 THEN RAISE EXCEPTION 'Capacidad fuera de rango'; END IF;
   IF unit='GB' AND amount>=1024 AND mod(amount,1024)=0 THEN amount:=amount/1024; unit:='TB'; END IF;
   value:=amount::bigint::text||' '||unit;
 ELSIF field.clave='pulgadas' THEN
   IF value !~ '^[0-9]+$' OR length(value)>3 THEN RAISE EXCEPTION 'Ingresá pulgadas como número entero positivo'; END IF;
   IF value::integer<1 THEN RAISE EXCEPTION 'Ingresá pulgadas como número entero positivo'; END IF;
   value:=value::integer::text;
 ELSE
   value:=upper(left(value,1))||substring(value from 2);
 END IF;
 SELECT v INTO p_value FROM unnest(field.valores) v WHERE lower(v)=lower(value);
 IF FOUND THEN RETURN p_value; END IF;
 UPDATE public.categoria_caracteristica SET valores=array_append(valores,value) WHERE id=field.id;
 RETURN value;
END $$;
REVOKE ALL ON FUNCTION public.pgl_add_category_value(bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pgl_add_category_value(bigint,text) TO anon;

CREATE FUNCTION public.pgl_create_product(p_category bigint,p_name text,p_brand text) RETURNS bigint
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result bigint;
BEGIN
 IF nullif(trim(p_name),'') IS NULL OR length(trim(p_name))>150 OR length(coalesce(trim(p_brand),''))>80 THEN RAISE EXCEPTION 'Revisá el nombre y la marca del producto'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.categorias WHERE id=p_category) THEN RAISE EXCEPTION 'Seleccioná una categoría existente'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(lower(trim(p_name))||':'||lower(coalesce(trim(p_brand),'')),0));
 SELECT id INTO result FROM public.producto WHERE lower(trim(nombre))=lower(trim(p_name)) AND lower(trim(marca))=lower(coalesce(trim(p_brand),'')) AND categoria_id=p_category ORDER BY id LIMIT 1;
 IF FOUND THEN RETURN result; END IF;
 INSERT INTO public.producto(nombre,marca,categoria_id) VALUES(trim(p_name),coalesce(trim(p_brand),''),p_category) RETURNING id INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.pgl_create_product(bigint,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pgl_create_product(bigint,text,text) TO anon;

CREATE OR REPLACE FUNCTION public.pgl_create_order(p_supplier bigint,p_date date,p_expected date,p_shipping numeric,p_notes text,p_lines jsonb,p_request uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result bigint; item jsonb; field record; chosen text; category bigint;
BEGIN
 IF p_request IS NULL THEN RAISE EXCEPTION 'Falta el identificador de la compra'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT id INTO result FROM public.pedido WHERE solicitud_id=p_request;
 IF FOUND THEN RETURN result; END IF;
 IF p_date IS NULL OR p_date>(now() at time zone 'America/Argentina/Buenos_Aires')::date OR (p_expected IS NOT NULL AND p_expected<p_date)
 OR p_shipping IS NULL OR p_shipping<0 OR p_shipping::text='NaN' OR jsonb_typeof(p_lines) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Revisá las fechas, el envío y los productos de la compra'; END IF;
 IF jsonb_array_length(p_lines) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Ingresá entre 1 y 100 líneas'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_to_recordset(p_lines) AS l(producto_id bigint,cantidad integer,precio_costo_usd numeric)
 WHERE producto_id IS NULL OR cantidad IS NULL OR cantidad NOT BETWEEN 1 AND 1000 OR precio_costo_usd IS NULL OR precio_costo_usd<0 OR precio_costo_usd::text='NaN')
 THEN RAISE EXCEPTION 'Cada línea necesita producto, cantidad y costo válidos'; END IF;
 IF (SELECT sum(cantidad) FROM jsonb_to_recordset(p_lines) AS l(cantidad integer))>1000 THEN RAISE EXCEPTION 'Máximo 1000 unidades por pedido'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
   SELECT categoria_id INTO category FROM public.producto WHERE id=(item->>'producto_id')::bigint;
   IF NOT FOUND THEN RAISE EXCEPTION 'Seleccioná un producto existente'; END IF;
   IF jsonb_typeof(item->'atributos') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Actualizá el formulario de compra y completá las características'; END IF;
   FOR field IN SELECT * FROM public.categoria_caracteristica WHERE categoria_id=category LOOP
     chosen:=CASE WHEN field.clave='color' THEN item->>'color' ELSE item->'atributos'->>field.clave END;
     IF field.obligatoria AND nullif(trim(chosen),'') IS NULL THEN RAISE EXCEPTION 'Seleccioná una opción válida para %',field.etiqueta; END IF;
     IF nullif(trim(chosen),'') IS NULL THEN CONTINUE; END IF;
     IF field.tipo='lista' AND NOT(chosen=ANY(field.valores)) THEN RAISE EXCEPTION 'Seleccioná una opción válida para %',field.etiqueta; END IF;
     IF field.tipo='entero' THEN
       IF chosen !~ '^[0-9]+$' OR length(chosen)>9 THEN RAISE EXCEPTION 'Ingresá un número entero para %',field.etiqueta; END IF;
       IF chosen::integer NOT BETWEEN field.minimo AND field.maximo THEN RAISE EXCEPTION '% debe estar entre % y %',field.etiqueta,field.minimo,field.maximo; END IF;
     END IF;
   END LOOP;
   IF EXISTS(SELECT 1 FROM jsonb_each(item->'atributos') a WHERE jsonb_typeof(a.value)<>'string' OR NOT EXISTS(
     SELECT 1 FROM public.categoria_caracteristica WHERE categoria_id=category AND clave=a.key AND clave<>'color'))
   OR (nullif(item->>'color','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.categoria_caracteristica WHERE categoria_id=category AND clave='color'))
   THEN RAISE EXCEPTION 'La característica no corresponde a la categoría'; END IF;
 END LOOP;
 INSERT INTO public.pedido(proveedor_id,fecha_pedido,fecha_estimada,costo_envio_usd,observaciones,solicitud_id)
 VALUES(p_supplier,p_date::timestamp at time zone 'America/Argentina/Buenos_Aires',p_expected,p_shipping,nullif(trim(p_notes),''),p_request) RETURNING id INTO result;
 INSERT INTO public.detalle_pedido(pedido_id,producto_id,color,cantidad,precio_costo_usd,atributos)
 SELECT result,producto_id,coalesce(color,''),cantidad,precio_costo_usd,atributos FROM jsonb_to_recordset(p_lines)
 AS l(producto_id bigint,color text,cantidad integer,precio_costo_usd numeric,atributos jsonb);
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.pgl_snapshot() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT public.pgl_snapshot_alpha() || jsonb_build_object(
 'salePayments',coalesce((SELECT jsonb_agg(t ORDER BY registrado_en,id) FROM public.venta_abono t),'[]'::jsonb),
 'categories',coalesce((SELECT jsonb_agg(t ORDER BY nombre) FROM public.categorias t),'[]'::jsonb),
 'categoryCharacteristics',coalesce((SELECT jsonb_agg(t ORDER BY id) FROM public.categoria_caracteristica t),'[]'::jsonb));
$$;
-- Retain the former configuration as an archive; no current RPC reads it.
COMMENT ON TABLE public.compra_opcion IS 'Configuracion anterior a categorias. Archivo conservado; no usar para nuevas compras.';
NOTIFY pgrst,'reload schema';
COMMIT;
