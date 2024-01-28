-- Create the image_count materialized view
CREATE MATERIALIZED VIEW image_count_materialized_view AS
SELECT COUNT(*) AS image_count FROM public.image;

-- Create the tag_count materialized view
CREATE MATERIALIZED VIEW tag_count_materialized_view AS
SELECT COUNT(*) AS tag_count FROM public.tag;
