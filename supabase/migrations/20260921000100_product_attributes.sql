BEGIN;
ALTER TABLE public.producto ADD COLUMN atributos jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(atributos) = 'object');
ALTER TABLE public.producto DROP CONSTRAINT uq_producto_marca_nombre;
CREATE UNIQUE INDEX uq_producto_datos ON public.producto (categoria_id, lower(trim(marca)), lower(trim(nombre)), atributos);

-- The purchase shortcut creates or selects the base model without attributes.
CREATE OR REPLACE FUNCTION public.pgl_create_product(p_category bigint,p_name text,p_brand text) RETURNS bigint
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result bigint;
BEGIN
 IF nullif(trim(p_name),'') IS NULL OR length(trim(p_name))>150 OR length(coalesce(trim(p_brand),''))>80 THEN RAISE EXCEPTION 'Revisá el nombre y la marca del producto'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.categorias WHERE id=p_category) THEN RAISE EXCEPTION 'Seleccioná una categoría existente'; END IF;
 INSERT INTO public.producto(nombre,marca,categoria_id) VALUES(trim(p_name),coalesce(trim(p_brand),''),p_category)
 ON CONFLICT (categoria_id, lower(trim(marca)), lower(trim(nombre)), atributos) DO UPDATE SET nombre=public.producto.nombre
 RETURNING id INTO result;
 RETURN result;
END $$;
COMMIT;
