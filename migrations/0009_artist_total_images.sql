ALTER TABLE public.artist
ADD COLUMN "total_images" INTEGER DEFAULT 0 CHECK ("total_images" >= 0);