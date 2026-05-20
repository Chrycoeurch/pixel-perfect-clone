
-- ============ ENUMS ============
CREATE TYPE public.document_type AS ENUM (
  'residence', 'vie', 'bonne_conduite', 'naissance', 'celibat', 'vente', 'deces', 'autre'
);

CREATE TYPE public.document_status AS ENUM ('active', 'cancelled');

CREATE TYPE public.sex AS ENUM ('M', 'F');

CREATE TYPE public.marital_status AS ENUM ('single', 'married', 'divorced', 'widowed');

-- ============ HOUSEHOLDS ============
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_number TEXT NOT NULL UNIQUE,
  head_full_name TEXT NOT NULL,
  address TEXT,
  fokontany TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  socio_level TEXT,
  member_count INT DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_households_number ON public.households(household_number);
CREATE INDEX idx_households_fokontany ON public.households(fokontany);

-- ============ CITIZENS ============
CREATE TABLE public.citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  last_name TEXT NOT NULL,
  first_names TEXT NOT NULL,
  sex public.sex NOT NULL,
  birth_date DATE,
  birth_place TEXT,
  cin TEXT UNIQUE,
  profession TEXT,
  education TEXT,
  marital_status public.marital_status,
  phone TEXT,
  is_head BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_citizens_household ON public.citizens(household_id);
CREATE INDEX idx_citizens_cin ON public.citizens(cin);
CREATE INDEX idx_citizens_name ON public.citizens(last_name, first_names);

-- ============ DOCUMENTS ISSUED ============
CREATE TABLE public.documents_issued (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type public.document_type NOT NULL,
  doc_number TEXT NOT NULL UNIQUE,
  verify_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE SET NULL,
  citizen_snapshot JSONB NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.document_status NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by UUID REFERENCES auth.users(id),
  issuer_name TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_docs_verify ON public.documents_issued(verify_code);
CREATE INDEX idx_docs_number ON public.documents_issued(doc_number);
CREATE INDEX idx_docs_citizen ON public.documents_issued(citizen_id);
CREATE INDEX idx_docs_type ON public.documents_issued(doc_type);

-- ============ TRIGGER updated_at ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_households_updated BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_citizens_updated BEFORE UPDATE ON public.citizens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TRIGGER member_count ============
CREATE OR REPLACE FUNCTION public.refresh_household_count()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.household_id IS NOT NULL THEN
      UPDATE public.households SET member_count = (SELECT count(*) FROM public.citizens WHERE household_id = OLD.household_id) WHERE id = OLD.household_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.household_id IS NOT NULL THEN
      UPDATE public.households SET member_count = (SELECT count(*) FROM public.citizens WHERE household_id = NEW.household_id) WHERE id = NEW.household_id;
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.household_id IS DISTINCT FROM NEW.household_id AND OLD.household_id IS NOT NULL THEN
      UPDATE public.households SET member_count = (SELECT count(*) FROM public.citizens WHERE household_id = OLD.household_id) WHERE id = OLD.household_id;
    END IF;
    RETURN NEW;
  END IF;
END; $$;

CREATE TRIGGER trg_citizens_count
  AFTER INSERT OR UPDATE OR DELETE ON public.citizens
  FOR EACH ROW EXECUTE FUNCTION public.refresh_household_count();

-- ============ PREVENT DOC DELETE ============
CREATE OR REPLACE FUNCTION public.prevent_document_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Documents cannot be deleted, use status=cancelled'; END; $$;

CREATE TRIGGER trg_docs_no_delete BEFORE DELETE ON public.documents_issued
  FOR EACH ROW EXECUTE FUNCTION public.prevent_document_delete();

-- ============ PUBLIC VERIFY FUNCTION ============
CREATE OR REPLACE FUNCTION public.verify_document(_code TEXT)
RETURNS TABLE (
  doc_number TEXT,
  doc_type public.document_type,
  status public.document_status,
  issued_at TIMESTAMPTZ,
  issuer_name TEXT,
  citizen_snapshot JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT doc_number, doc_type, status, issued_at, issuer_name, citizen_snapshot
  FROM public.documents_issued WHERE verify_code = _code LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_document(TEXT) TO anon, authenticated;

-- ============ RLS ============
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_issued ENABLE ROW LEVEL SECURITY;

-- Households: tous les rôles authentifiés peuvent voir; agents+ peuvent créer/modifier
CREATE POLICY "auth view households" ON public.households FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents insert households" ON public.households FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "agents update households" ON public.households FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete households" ON public.households FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

-- Citizens
CREATE POLICY "auth view citizens" ON public.citizens FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents insert citizens" ON public.citizens FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "agents update citizens" ON public.citizens FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete citizens" ON public.citizens FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

-- Documents: lecture par tout authentifié, insert agents+, update (annulation) président+admin
CREATE POLICY "auth view docs" ON public.documents_issued FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents issue docs" ON public.documents_issued FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "president cancel docs" ON public.documents_issued FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
