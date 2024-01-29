-- Create Artist table

CREATE TABLE public.artist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) COLLATE "C" UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Assign the updated_at trigger to the Artist table

CREATE TRIGGER update_artist_updated_at
BEFORE UPDATE ON artist
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create junction table for Image to Artist many-to-many relationship

CREATE TABLE public.image_artist (
    image_id INTEGER REFERENCES public.image(id) ON DELETE CASCADE,
    artist_id INTEGER REFERENCES public.artist(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, artist_id)
);
