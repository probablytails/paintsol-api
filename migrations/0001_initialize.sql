-- Create a trigger to update 'updated_at' on every update

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Image table

CREATE TABLE public.image (
    id INTEGER PRIMARY KEY,
    title VARCHAR(256),
    artist VARCHAR(256),
    has_animation BOOLEAN DEFAULT false,
    has_border BOOLEAN DEFAULT false,
    has_no_border BOOLEAN DEFAULT false,
    slug VARCHAR(256) CHECK (slug = LOWER(slug)),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unique_slug_or_null ON public.image (slug) WHERE slug IS NOT NULL;

-- Assign the updated_at trigger to the Image table

CREATE TRIGGER update_image_updated_at
BEFORE UPDATE ON image
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create Tag table

CREATE TABLE public.tag (
    id SERIAL PRIMARY KEY,
    title VARCHAR(256) UNIQUE NOT NULL CHECK (title = LOWER(title)),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Assign the updated_at trigger to the Tag table

CREATE TRIGGER update_tag_updated_at
BEFORE UPDATE ON tag
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create junction table for Image to Tag many-to-many relationship

CREATE TABLE public.image_tag (
    image_id INTEGER REFERENCES public.image(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES public.tag(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, tag_id)
);
