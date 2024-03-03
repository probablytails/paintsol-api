-- Add image.type column
ALTER TABLE public.image
ADD COLUMN "type" VARCHAR(17) DEFAULT 'painting' CHECK (type IN ('painting', 'meme', 'painting-and-meme'))
