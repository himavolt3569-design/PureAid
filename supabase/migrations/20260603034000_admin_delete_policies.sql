DROP POLICY IF EXISTS "Admins delete campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins delete donations" ON public.donations;
DROP POLICY IF EXISTS "Admins delete support tickets" ON public.support_tickets;

CREATE POLICY "Admins delete campaigns"
ON public.campaigns FOR DELETE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete profiles"
ON public.profiles FOR DELETE
USING (public.is_admin(auth.uid()) AND id <> auth.uid());

CREATE POLICY "Admins delete donations"
ON public.donations FOR DELETE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete support tickets"
ON public.support_tickets FOR DELETE
USING (public.is_admin(auth.uid()));
