-- Create the artist_count materialized view
CREATE MATERIALIZED VIEW artist_count_materialized_view AS
SELECT COUNT(*) AS artist_count FROM public.artist;
