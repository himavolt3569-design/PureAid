CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.user_role AS ENUM ('donor', 'recipient', 'admin');
CREATE TYPE public.campaign_category AS ENUM ('medical', 'education', 'startup', 'relief', 'other');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'pending_verification', 'active', 'completed', 'rejected');
CREATE TYPE public.verification_status AS ENUM ('unsubmitted', 'in_review', 'verified', 'rejected');
CREATE TYPE public.document_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.payment_provider AS ENUM ('esewa', 'khalti', 'imepay', 'bank');
CREATE TYPE public.donation_status AS ENUM ('pending', 'successful', 'failed', 'cancelled');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'donor',
  phone_number TEXT,
  organization_name TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unsubmitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.recipient_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL,
  display_name TEXT,
  qr_image_url TEXT,
  account_reference TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (profile_id, provider)
);

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT NOT NULL,
  category public.campaign_category NOT NULL,
  goal_amount NUMERIC(12,2) NOT NULL CHECK (goal_amount > 0),
  raised_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (raised_amount >= 0),
  cover_image_url TEXT,
  location TEXT,
  impact_statement TEXT,
  status public.campaign_status NOT NULL DEFAULT 'pending_verification',
  verification_status public.verification_status NOT NULL DEFAULT 'in_review',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  mime_type TEXT,
  document_type public.campaign_category,
  ocr_excerpt TEXT,
  ai_confidence_score NUMERIC(5,2),
  status public.document_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (campaign_id IS NOT NULL OR profile_id IS NOT NULL)
);

CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  donor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  donor_name TEXT,
  donor_email TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NPR',
  payment_method public.payment_provider NOT NULL,
  transaction_id TEXT UNIQUE,
  status public.donation_status NOT NULL DEFAULT 'pending',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.campaign_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER recipient_payment_methods_set_updated_at
BEFORE UPDATE ON public.recipient_payment_methods
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER campaigns_set_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER donations_set_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_campaign_raised_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_campaign UUID;
BEGIN
  target_campaign = COALESCE(NEW.campaign_id, OLD.campaign_id);

  UPDATE public.campaigns
  SET raised_amount = COALESCE((
    SELECT SUM(amount)
    FROM public.donations
    WHERE campaign_id = target_campaign AND status = 'successful'
  ), 0)
  WHERE id = target_campaign;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER donations_refresh_campaign_raised_amount
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.refresh_campaign_raised_amount();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users insert their own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Active payment methods are publicly readable"
ON public.recipient_payment_methods FOR SELECT
USING (is_active = true OR profile_id = auth.uid());

CREATE POLICY "Recipients manage their payment methods"
ON public.recipient_payment_methods FOR ALL
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Active campaigns are publicly readable"
ON public.campaigns FOR SELECT
USING (status = 'active' OR recipient_id = auth.uid());

CREATE POLICY "Recipients create campaigns"
ON public.campaigns FOR INSERT
WITH CHECK (
  auth.uid() = recipient_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('recipient', 'admin')
  )
);

CREATE POLICY "Recipients update their campaigns"
ON public.campaigns FOR UPDATE
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Campaign documents readable by owners and admins"
ON public.documents FOR SELECT
USING (
  profile_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND recipient_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Recipients insert their documents"
ON public.documents FOR INSERT
WITH CHECK (
  profile_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND recipient_id = auth.uid())
);

CREATE POLICY "Users update their documents"
ON public.documents FOR UPDATE
USING (
  profile_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND recipient_id = auth.uid())
);

CREATE POLICY "Donation visibility"
ON public.donations FOR SELECT
USING (
  donor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND recipient_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can create a donation intent"
ON public.donations FOR INSERT
WITH CHECK (donor_id IS NULL OR donor_id = auth.uid());

CREATE POLICY "Donors can update pending donation intents"
ON public.donations FOR UPDATE
USING (status = 'pending' AND (donor_id IS NULL OR donor_id = auth.uid()));

CREATE POLICY "Campaign activity readable by owners and admins"
ON public.campaign_activity FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND (status = 'active' OR recipient_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Campaign owners create activity"
ON public.campaign_activity FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND recipient_id = auth.uid())
);

CREATE INDEX campaigns_public_idx ON public.campaigns (status, category, published_at DESC);
CREATE INDEX campaigns_recipient_idx ON public.campaigns (recipient_id, created_at DESC);
CREATE INDEX donations_campaign_status_idx ON public.donations (campaign_id, status, created_at DESC);
CREATE INDEX recipient_payment_methods_profile_idx ON public.recipient_payment_methods (profile_id, provider);
