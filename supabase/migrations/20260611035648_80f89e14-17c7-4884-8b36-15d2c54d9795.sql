
-- Create lands table (Terrain) - parent of households
CREATE TABLE public.lands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  district TEXT,
  commune TEXT,
  fokontany TEXT,
  carreau_name TEXT,
  carreau_number TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  total_area_m2 NUMERIC,
  legal_status TEXT,
  owner_label TEXT,
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  document_photos TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lands TO authenticated;
GRANT ALL ON public.lands TO service_role;

ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view lands" ON public.lands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Agents can insert lands" ON public.lands
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'agent') OR
    public.has_role(auth.uid(), 'president') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Agents can update lands" ON public.lands
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'agent') OR
    public.has_role(auth.uid(), 'president') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete lands" ON public.lands
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'president')
  );

CREATE TRIGGER update_lands_updated_at
  BEFORE UPDATE ON public.lands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link households to land
ALTER TABLE public.households
  ADD COLUMN land_id UUID REFERENCES public.lands(id) ON DELETE SET NULL;

CREATE INDEX idx_households_land_id ON public.households(land_id);
