ALTER TABLE games ADD COLUMN image_url TEXT;

-- Create game-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-images', 'game-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for game-images bucket
CREATE POLICY "Anyone can view game images"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-images');

CREATE POLICY "Admins can upload game images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-images'
  AND EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update game images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'game-images'
  AND EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete game images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'game-images'
  AND EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  )
);
