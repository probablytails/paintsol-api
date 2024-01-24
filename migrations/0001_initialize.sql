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
    id SERIAL PRIMARY KEY,
    title VARCHAR(256),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Assign the updated_at trigger to the Image table

CREATE TRIGGER update_image_updated_at
BEFORE UPDATE ON image
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create Tag table

CREATE TABLE public.tag (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) UNIQUE NOT NULL CHECK (title = LOWER(title)),
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

