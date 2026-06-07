DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_status') THEN
    CREATE TYPE public.support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_priority') THEN
    CREATE TYPE public.support_ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requester_email TEXT,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status public.support_ticket_status NOT NULL DEFAULT 'open',
  priority public.support_ticket_priority NOT NULL DEFAULT 'normal',
  admin_notes TEXT,
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS support_tickets_set_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_set_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles admin_profile WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin')
);

CREATE POLICY "Admins update profiles"
ON public.profiles FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles admin_profile WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles admin_profile WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin')
);

CREATE POLICY "Admins read all campaigns"
ON public.campaigns FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins update campaigns"
ON public.campaigns FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins read all payment methods"
ON public.recipient_payment_methods FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins update all payment methods"
ON public.recipient_payment_methods FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins update documents"
ON public.documents FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins update donations"
ON public.donations FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins create campaign activity"
ON public.campaign_activity FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Ticket owners read their support tickets"
ON public.support_tickets FOR SELECT
USING (
  requester_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Authenticated users create support tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admins update support tickets"
ON public.support_tickets FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE INDEX IF NOT EXISTS support_tickets_status_created_idx ON public.support_tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_requester_idx ON public.support_tickets (requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_admin_queue_idx ON public.campaigns (verification_status, status, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_admin_verification_idx ON public.profiles (verification_status, role, created_at DESC);
