
ALTER TABLE public.households
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS commune text,
  ADD COLUMN IF NOT EXISTS carreau_name text,
  ADD COLUMN IF NOT EXISTS carreau_number text,
  ADD COLUMN IF NOT EXISTS housing_type text,
  ADD COLUMN IF NOT EXISTS house_area_m2 numeric,
  ADD COLUMN IF NOT EXISTS occupancy_status text,
  ADD COLUMN IF NOT EXISTS land_area_m2 numeric,
  ADD COLUMN IF NOT EXISTS land_legal_status text,
  ADD COLUMN IF NOT EXISTS head_phone text,
  ADD COLUMN IF NOT EXISTS head_facebook text,
  ADD COLUMN IF NOT EXISTS agent_notes text,
  ADD COLUMN IF NOT EXISTS housing_photos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS document_photos text[] DEFAULT '{}'::text[];
