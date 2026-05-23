-- Enums
CREATE TYPE public.asset_category AS ENUM ('mobilier','tente','sono','outillage','vaisselle','autre');
CREATE TYPE public.asset_condition AS ENUM ('neuf','bon','use','hors_service');
CREATE TYPE public.loan_status AS ENUM ('reserved','active','returned','overdue','cancelled');

-- Assets
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category asset_category NOT NULL DEFAULT 'autre',
  total_quantity integer NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  condition asset_condition NOT NULL DEFAULT 'bon',
  unit_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MGA',
  location text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents insert assets" ON public.assets FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "agents update assets" ON public.assets FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete assets" ON public.assets FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_assets_updated BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Asset loans
CREATE TABLE public.asset_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  household_id uuid,
  borrower_label text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  loan_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  returned_date date,
  deposit_amount numeric NOT NULL DEFAULT 0,
  fee_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status loan_status NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth view loans" ON public.asset_loans FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents insert loans" ON public.asset_loans FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "agents update loans" ON public.asset_loans FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete loans" ON public.asset_loans FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_loans_updated BEFORE UPDATE ON public.asset_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_loans_asset ON public.asset_loans(asset_id);
CREATE INDEX idx_loans_status ON public.asset_loans(status);