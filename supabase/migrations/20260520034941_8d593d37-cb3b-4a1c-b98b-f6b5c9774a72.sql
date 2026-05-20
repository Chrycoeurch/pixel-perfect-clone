
CREATE OR REPLACE FUNCTION public.prevent_document_delete()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Documents cannot be deleted, use status=cancelled'; END; $$;
