INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qrs', 'payment-qrs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Payment QR images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own payment QR images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own payment QR images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own payment QR images" ON storage.objects;

CREATE POLICY "Payment QR images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-qrs');

CREATE POLICY "Users can upload own payment QR images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-qrs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own payment QR images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'payment-qrs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own payment QR images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-qrs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
