CREATE OR REPLACE FUNCTION public.pgl_update_stock(p_id bigint,p_code text,p_variant text,p_ram text,p_suggested numeric DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.unidad SET codigo=nullif(trim(p_code),''),variante=nullif(trim(p_variant),''),ram=nullif(trim(p_ram),''),precio_sugerido_usd=p_suggested
    WHERE id=p_id AND estado='STOCK';
  IF NOT FOUND THEN RAISE EXCEPTION 'La unidad ya no está en stock. Actualizá la pantalla'; END IF;
END $$;
NOTIFY pgrst, 'reload schema';
