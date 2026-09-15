BEGIN;
-- Opciones ampliables por categoría y con prioridad por producto. No representan stock.
CREATE TABLE public.compra_opcion (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 categoria text NOT NULL,
 producto_id bigint REFERENCES public.producto(id) ON DELETE CASCADE,
 clave text NOT NULL CHECK (clave ~ '^[a-z][a-z0-9_]*$'),
 etiqueta text NOT NULL,
 valores text[] NOT NULL,
 UNIQUE NULLS NOT DISTINCT (categoria,producto_id,clave)
);
ALTER TABLE public.compra_opcion ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.compra_opcion TO anon;
CREATE POLICY app_read ON public.compra_opcion FOR SELECT TO anon USING (true);
ALTER TABLE public.detalle_pedido ADD COLUMN atributos jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(atributos)='object');
ALTER TABLE public.detalle_pedido DROP CONSTRAINT uq_detalle_pedido;
ALTER TABLE public.detalle_pedido ADD CONSTRAINT uq_detalle_pedido UNIQUE(pedido_id,producto_id,color,atributos);
INSERT INTO public.compra_opcion(categoria,clave,etiqueta,valores) VALUES('*','color','Color',ARRAY['Negro','Blanco','Gris','Plata','Dorado','Azul','Celeste','Verde','Rojo','Rosa','Violeta','Morado','Amarillo','Naranja','Marrón','Beige','Titanio','Natural','Transparente','Multicolor']);
INSERT INTO public.compra_opcion(categoria,clave,etiqueta,valores) VALUES('celulares','ram','RAM (GB)',ARRAY['2','3','4','6','8','12','16','18','24']);
INSERT INTO public.compra_opcion(categoria,clave,etiqueta,valores) VALUES('celulares','rom','Almacenamiento / ROM (GB)',ARRAY['32','64','128','256','512','1024','2048']);
INSERT INTO public.compra_opcion(categoria,clave,etiqueta,valores) VALUES('consolas','edicion','Variante',ARRAY['Física','Digital','Pro','Edición especial']);
CREATE OR REPLACE FUNCTION public.pgl_create_order(p_supplier bigint,p_date date,p_expected date,p_shipping numeric,p_notes text,p_lines jsonb,p_request uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result bigint; item jsonb; option_row record; chosen text;
BEGIN
  IF p_request IS NULL THEN RAISE EXCEPTION 'Falta el identificador de la compra'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
  SELECT id INTO result FROM public.pedido WHERE solicitud_id=p_request;
  IF FOUND THEN RETURN result; END IF;
  IF p_date IS NULL OR p_date > (now() at time zone 'America/Argentina/Buenos_Aires')::date OR
     (p_expected IS NOT NULL AND p_expected < p_date) OR p_shipping IS NULL OR p_shipping < 0 OR
     jsonb_typeof(p_lines) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lines)=0 OR jsonb_array_length(p_lines)>100
  THEN RAISE EXCEPTION 'Revisá las fechas, el envío y los productos de la compra'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_lines) AS l(producto_id bigint,color text,cantidad integer,precio_costo_usd numeric,atributos jsonb)
    WHERE producto_id IS NULL OR nullif(trim(color),'') IS NULL OR cantidad IS NULL OR cantidad<1 OR cantidad>1000 OR precio_costo_usd IS NULL OR precio_costo_usd<0)
  THEN RAISE EXCEPTION 'Cada línea necesita producto, color, cantidad y costo válidos'; END IF;
  IF (SELECT sum(cantidad) FROM jsonb_to_recordset(p_lines) AS l(cantidad integer))>1000 THEN RAISE EXCEPTION 'Máximo 1000 unidades por pedido'; END IF;
  -- Los clientes antiguos conservan su contrato; los nuevos envían atributos.
  FOR item IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
    IF item ? 'atributos' THEN
      IF jsonb_typeof(item->'atributos') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Variantes inválidas'; END IF;
      FOR option_row IN
        SELECT DISTINCT ON (o.clave) o.* FROM public.compra_opcion o
        JOIN public.producto p ON p.id=(item->>'producto_id')::bigint
        WHERE o.producto_id=p.id OR (o.producto_id IS NULL AND (o.categoria='*' OR lower(o.categoria)=lower(p.categoria)))
        ORDER BY o.clave, (o.producto_id IS NOT NULL) DESC, (o.categoria<>'*') DESC, o.id DESC
      LOOP
        chosen := CASE WHEN option_row.clave='color' THEN item->>'color' ELSE item->'atributos'->>option_row.clave END;
        IF chosen IS NULL OR NOT (chosen=ANY(option_row.valores)) THEN RAISE EXCEPTION 'Seleccioná una opción válida para %',option_row.etiqueta; END IF;
      END LOOP;
      IF EXISTS (SELECT 1 FROM jsonb_each(item->'atributos') a WHERE jsonb_typeof(a.value)<>'string' OR NOT EXISTS (
        SELECT 1 FROM public.compra_opcion o JOIN public.producto p ON p.id=(item->>'producto_id')::bigint
        WHERE o.clave=a.key AND o.clave<>'color' AND (o.producto_id=p.id OR (o.producto_id IS NULL AND (o.categoria='*' OR lower(o.categoria)=lower(p.categoria))))
      )) THEN RAISE EXCEPTION 'La variante no corresponde al producto'; END IF;
    END IF;
  END LOOP;
  INSERT INTO public.pedido(proveedor_id,fecha_pedido,fecha_estimada,costo_envio_usd,observaciones,solicitud_id)
    VALUES(p_supplier,p_date::timestamp at time zone 'America/Argentina/Buenos_Aires',p_expected,p_shipping,nullif(trim(p_notes),''),p_request) RETURNING id INTO result;
  INSERT INTO public.detalle_pedido(pedido_id,producto_id,color,cantidad,precio_costo_usd,atributos)
    SELECT result,producto_id,trim(color),cantidad,precio_costo_usd,coalesce(atributos,'{}'::jsonb)
    FROM jsonb_to_recordset(p_lines) AS l(producto_id bigint,color text,cantidad integer,precio_costo_usd numeric,atributos jsonb);
  RETURN result;
END $$;


CREATE OR REPLACE FUNCTION public.pgl_snapshot() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT public.pgl_snapshot_alpha() || jsonb_build_object(
 'salePayments',coalesce((SELECT jsonb_agg(t ORDER BY registrado_en,id) FROM public.venta_abono t),'[]'::jsonb),
 'purchaseOptions',coalesce((SELECT jsonb_agg(t ORDER BY id) FROM public.compra_opcion t),'[]'::jsonb));
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
