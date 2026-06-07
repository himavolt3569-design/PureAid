-- Create bucket if it doesn't exist, and ensure it is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-documents', 'campaign-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any conflicting older policies if they exist (from previous migrations)
DROP POLICY IF EXISTS "Campaign documents readable by owners and admins" ON storage.objects;
DROP POLICY IF EXISTS "Recipients upload own campaign documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can select campaign documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert campaign documents" ON storage.objects;

-- Create policies for public read and authenticated insert
CREATE POLICY "Anyone can select campaign documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-documents');

CREATE POLICY "Authenticated users can insert campaign documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-documents'
  AND auth.role() = 'authenticated'
);
