BEGIN;
-- Color belongs to purchase lines and units, not product identity.
-- Preserve historical data while excluding color from uniqueness checks.
DROP INDEX public.uq_producto_datos;
CREATE UNIQUE INDEX uq_producto_datos ON public.producto (categoria_id, lower(trim(marca)), lower(trim(nombre)), (atributos - 'color'));
CREATE OR REPLACE FUNCTION public.pgl_create_product(p_category bigint,p_name text,p_brand text) RETURNS bigint
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result bigint;
BEGIN
 IF nullif(trim(p_name),'') IS NULL OR length(trim(p_name))>150 OR length(coalesce(trim(p_brand),''))>80 THEN RAISE EXCEPTION 'Revisá el nombre y la marca del producto'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.categorias WHERE id=p_category) THEN RAISE EXCEPTION 'Seleccioná una categoría existente'; END IF;
 INSERT INTO public.producto(nombre,marca,categoria_id) VALUES(trim(p_name),coalesce(trim(p_brand),''),p_category)
 ON CONFLICT (categoria_id, lower(trim(marca)), lower(trim(nombre)), (atributos - 'color')) DO UPDATE SET nombre=public.producto.nombre
 RETURNING id INTO result;
 RETURN result;
END $$;
COMMIT;
