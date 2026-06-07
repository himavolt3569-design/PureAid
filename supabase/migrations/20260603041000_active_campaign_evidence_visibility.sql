DROP POLICY IF EXISTS "Authenticated users read active campaign documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users read active campaign files" ON storage.objects;

CREATE POLICY "Authenticated users read active campaign documents"
ON public.documents FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE campaigns.id = documents.campaign_id
      AND campaigns.status = 'active'
  )
);

CREATE POLICY "Authenticated users read active campaign files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'campaign-documents'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.documents
    JOIN public.campaigns ON campaigns.id = documents.campaign_id
    WHERE documents.file_url = storage.objects.name
      AND campaigns.status = 'active'
  )
);
