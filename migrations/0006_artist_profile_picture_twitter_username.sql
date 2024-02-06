ALTER TABLE Artist
ADD COLUMN slug VARCHAR(256) CHECK (slug = LOWER(slug));

CREATE UNIQUE INDEX artist_unique_slug_or_null ON public.artist (slug) WHERE slug IS NOT NULL;

ALTER TABLE Artist
ADD COLUMN has_profile_picture BOOLEAN DEFAULT false;

ALTER TABLE Artist
ADD COLUMN twitter_username VARCHAR(15);
