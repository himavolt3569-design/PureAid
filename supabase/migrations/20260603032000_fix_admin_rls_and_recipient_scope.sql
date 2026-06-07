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
