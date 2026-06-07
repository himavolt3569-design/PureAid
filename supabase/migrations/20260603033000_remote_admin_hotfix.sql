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

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS support_tickets_set_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_set_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = check_user_id
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.user_role;
BEGIN
  requested_role :=
    CASE NEW.raw_user_meta_data ->> 'role'
      WHEN 'recipient' THEN 'recipient'::public.user_role
      ELSE 'donor'::public.user_role
    END;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone_number,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    requested_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone_number = COALESCE(public.profiles.phone_number, EXCLUDED.phone_number);

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins read all payment methods" ON public.recipient_payment_methods;
DROP POLICY IF EXISTS "Admins update all payment methods" ON public.recipient_payment_methods;
DROP POLICY IF EXISTS "Admins update documents" ON public.documents;
DROP POLICY IF EXISTS "Admins update donations" ON public.donations;
DROP POLICY IF EXISTS "Admins create campaign activity" ON public.campaign_activity;
DROP POLICY IF EXISTS "Ticket owners read their support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Authenticated users create support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins update support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Recipients create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Campaign documents readable by owners and admins" ON public.documents;
DROP POLICY IF EXISTS "Donation visibility" ON public.donations;
DROP POLICY IF EXISTS "Campaign activity readable by owners and admins" ON public.campaign_activity;

CREATE POLICY "Admins update profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all campaigns"
ON public.campaigns FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update campaigns"
ON public.campaigns FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Recipients create campaigns"
ON public.campaigns FOR INSERT
WITH CHECK (
  auth.uid() = recipient_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'recipient'
  )
);

CREATE POLICY "Campaign documents readable by owners and admins"
ON public.documents FOR SELECT
USING (
  profile_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND recipient_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Admins update documents"
ON public.documents FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Donation visibility"
ON public.donations FOR SELECT
USING (
  donor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND recipient_id = auth.uid())
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Admins update donations"
ON public.donations FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Campaign activity readable by owners and admins"
ON public.campaign_activity FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND (status = 'active' OR recipient_id = auth.uid()))
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Admins create campaign activity"
ON public.campaign_activity FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all payment methods"
ON public.recipient_payment_methods FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins update all payment methods"
ON public.recipient_payment_methods FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Ticket owners read their support tickets"
ON public.support_tickets FOR SELECT
USING (
  requester_id = auth.uid()
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Authenticated users create support tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Admins update support tickets"
ON public.support_tickets FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS support_tickets_status_created_idx ON public.support_tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_requester_idx ON public.support_tickets (requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_admin_queue_idx ON public.campaigns (verification_status, status, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_admin_verification_idx ON public.profiles (verification_status, role, created_at DESC);
