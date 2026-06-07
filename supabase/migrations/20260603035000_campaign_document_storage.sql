INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-documents', 'campaign-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Campaign documents readable by owners and admins" ON storage.objects;
DROP POLICY IF EXISTS "Recipients upload own campaign documents" ON storage.objects;
DROP POLICY IF EXISTS "Recipients update own campaign documents" ON storage.objects;
DROP POLICY IF EXISTS "Recipients delete own campaign documents" ON storage.objects;

CREATE POLICY "Campaign documents readable by owners and admins"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'campaign-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
  )
);

CREATE POLICY "Recipients upload own campaign documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'recipient'
  )
);

CREATE POLICY "Recipients update own campaign documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'campaign-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Recipients delete own campaign documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'campaign-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
