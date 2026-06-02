DROP POLICY IF EXISTS "Authed can upload study assets" ON storage.objects;
DROP POLICY IF EXISTS "Authed can update study assets" ON storage.objects;
DROP POLICY IF EXISTS "Authed can delete study assets" ON storage.objects;
DROP POLICY IF EXISTS "Researchers can read own study assets" ON storage.objects;
DROP POLICY IF EXISTS "Signed in users can upload study assets" ON storage.objects;
DROP POLICY IF EXISTS "Signed in users can update study assets" ON storage.objects;
DROP POLICY IF EXISTS "Signed in users can delete study assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view study assets" ON storage.objects;

CREATE POLICY "Signed in users can upload study assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'study-assets');

CREATE POLICY "Signed in users can update study assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'study-assets')
WITH CHECK (bucket_id = 'study-assets');

CREATE POLICY "Signed in users can delete study assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'study-assets');

CREATE POLICY "Anyone can view study assets"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'study-assets');