-- Phase 1: Stitch-Design Database Schema Updates
-- Expanding on the initial schema to support Stitch-Design features like
-- rigorous verification, AI confidence scoring, payment screenshots, etc.

-- 1. Updates to Profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Updates to Campaigns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- 3. Campaign Updates Table
CREATE TABLE IF NOT EXISTS public.campaign_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for campaign_updates
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign updates are viewable by everyone"
    ON public.campaign_updates FOR SELECT
    USING (true);

CREATE POLICY "Recipients can create updates for their campaigns"
    ON public.campaign_updates FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.campaigns
        WHERE campaigns.id = campaign_updates.campaign_id
        AND campaigns.user_id = auth.uid()
    ));

-- 4. Expanded Donations Table
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_screenshot TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- 5. Verification Documents Table (For AI OCR and Admin review)
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- e.g., 'citizenship', 'hospital_bill', 'recommendation_letter'
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    ai_confidence NUMERIC(5,2), -- AI OCR score
    ai_extracted_text TEXT,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for verification_documents
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
    ON public.verification_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents"
    ON public.verification_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.verification_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Force RLS on everything to ensure security
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns FORCE ROW LEVEL SECURITY;
ALTER TABLE public.donations FORCE ROW LEVEL SECURITY;
