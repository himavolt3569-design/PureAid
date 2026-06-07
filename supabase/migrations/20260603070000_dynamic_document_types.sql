ALTER TABLE public.documents
ALTER COLUMN document_type TYPE TEXT USING document_type::TEXT;
