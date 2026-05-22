
-- Enums
CREATE TYPE public.campaign_status AS ENUM ('active','closed','draft');
CREATE TYPE public.expense_category AS ENUM ('infrastructure','sanitaire','education','securite','evenement','administration','autre');
CREATE TYPE public.meeting_status AS ENUM ('scheduled','ongoing','closed','cancelled');

-- Campagnes de cotisations
CREATE TABLE public.contribution_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_amount_per_household NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MGA',
  deadline DATE,
  status campaign_status NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contribution_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth view campaigns" ON public.contribution_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents insert campaigns" ON public.contribution_campaigns FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "agents update campaigns" ON public.contribution_campaigns FOR UPDATE TO authenticated USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete campaigns" ON public.contribution_campaigns FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_camp_upd BEFORE UPDATE ON public.contribution_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contributions
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.contribution_campaigns(id) ON DELETE CASCADE,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  household_label TEXT,
  amount NUMERIC(12,2) NOT NULL,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT,
  receipt_number TEXT,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contrib_camp ON public.contributions(campaign_id);
CREATE INDEX idx_contrib_house ON public.contributions(household_id);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth view contributions" ON public.contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents insert contributions" ON public.contributions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "agents update contributions" ON public.contributions FOR UPDATE TO authenticated USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete contributions" ON public.contributions FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- Dépenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category expense_category NOT NULL DEFAULT 'autre',
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MGA',
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT,
  invoice_ref TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth view expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "agents update expenses" ON public.expenses FOR UPDATE TO authenticated USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete expenses" ON public.expenses FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_exp_upd BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Réunions
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  agenda TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  attendance_code TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(8),'hex') UNIQUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth view meetings" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "agents insert meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "agents update meetings" ON public.meetings FOR UPDATE TO authenticated USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete meetings" ON public.meetings FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_meet_upd BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Présences
CREATE TABLE public.meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES public.citizens(id) ON DELETE SET NULL,
  citizen_label TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID,
  UNIQUE(meeting_id, citizen_id)
);
CREATE INDEX idx_att_meeting ON public.meeting_attendance(meeting_id);
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth view attendance" ON public.meeting_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert attendance" ON public.meeting_attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "agents delete attendance" ON public.meeting_attendance FOR DELETE TO authenticated USING (has_role(auth.uid(),'agent') OR has_role(auth.uid(),'president') OR has_role(auth.uid(),'admin'));
