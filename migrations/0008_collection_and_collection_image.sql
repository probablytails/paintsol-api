-- Create collection table
CREATE TABLE public.collection (
    id SERIAL PRIMARY KEY,
    title VARCHAR(256),
    type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('general', 'telegram-stickers', 'discord-stickers')),
    slug VARCHAR(256) CHECK (slug = LOWER(slug)),
    stickers_url VARCHAR(2083),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX collection_unique_slug_or_null ON public.collection (slug) WHERE slug IS NOT NULL;

-- Create junction table for Collection to Image many-to-many relationship
CREATE TABLE public.collection_image (
    collection_id INTEGER REFERENCES public.collection(id) ON DELETE CASCADE,
    image_id INTEGER REFERENCES public.image(id) ON DELETE CASCADE,
    image_position INTEGER NOT NULL,
    preview_position INTEGER CHECK (preview_position >= 1 OR preview_position IS NULL),
    image_type VARCHAR(20) NOT NULL DEFAULT 'no-border' CHECK (image_type IN ('no-border', 'border', 'animation')),
    PRIMARY KEY (collection_id, image_id),
    CONSTRAINT image_position_check CHECK (image_position >= 1),
    CONSTRAINT unique_image_position_per_collection_image UNIQUE (collection_id, image_position),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add a partial unique index to enforce uniqueness of preview_position within each collection_id where preview_position is not null
CREATE UNIQUE INDEX unique_preview_position_per_collection
ON public.collection_image (collection_id, preview_position)
WHERE preview_position IS NOT NULL;
