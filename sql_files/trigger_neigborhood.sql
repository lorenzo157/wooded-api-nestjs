CREATE OR REPLACE FUNCTION convert_lat_long_to_xy(latitude DOUBLE PRECISION, longitude DOUBLE PRECISION)
RETURNS TABLE (x DOUBLE PRECISION, y DOUBLE PRECISION) AS $$
DECLARE
    semi_mayor DOUBLE PRECISION := 6378137;  
    semi_menor DOUBLE PRECISION := 6356752.314;  
    alfa DOUBLE PRECISION := 6367449.146;  
    beta DOUBLE PRECISION := -0.002518828;  
    gama DOUBLE PRECISION := 0.00000264354;  
    delta DOUBLE PRECISION := -0.00000000345262; 
    radi DOUBLE PRECISION := 0.017453293;  -- Conversion factor from degrees to radians
    Bfi DOUBLE PRECISION;
    Nf DOUBLE PRECISION;
    Cf DOUBLE PRECISION;
    dif DOUBLE PRECISION;
    Nt DOUBLE PRECISION;
    I DOUBLE PRECISION;
    Ttan DOUBLE PRECISION;
    np DOUBLE PRECISION;
    ep DOUBLE PRECISION;
    neta DOUBLE PRECISION;
BEGIN
    -- Calculate Bfi
    Bfi := alfa * (((90 + latitude) * radi) + (beta * sin(2 * latitude * radi)) + 
            (gama * sin(4 * latitude * radi)) + (delta * sin(9 * latitude * radi)));

    -- Calculate Nf
    Nf := (((75 + longitude) / 3) + 0.5);

    -- Calculate Cf
    Cf := (3 * Nf - 75);

    -- Calculate dif
    dif := (longitude - Cf);

    -- Calculate Nt
    Nt := ((Nf * 1000000) + 500000);

    -- Calculate I
    I := (dif * 3600 * 0.000004848136811);

    -- Calculate Ttan
    Ttan := (sin(latitude * radi) / cos(latitude * radi));

    -- Calculate np
    np := (power(semi_mayor, 2)) / sqrt((power(semi_mayor, 2) * power(cos(latitude * radi), 2)) + 
            (power(semi_menor, 2) * power(sin(latitude * radi), 2)));

    -- Calculate ep
    ep := ((power(semi_mayor, 2)) - (power(semi_menor, 2))) / (power(semi_menor, 2));

    -- Calculate neta
    neta := ep * power(cos(latitude * radi), 2);

    -- Calculate X
    x := Bfi + (0.5 * np * power(cos(latitude * radi), 2) * Ttan * power(I, 2)) + 
         (0.0416666666666667 * np * power(cos(latitude * radi), 4) * Ttan * 
         (5 - power(Ttan, 2) + (9 * power(neta, 2))) * power(I, 4));

    -- Calculate Y
    y := Nt + (np * cos(latitude * radi) * I) + 
         (0.1666666666666667 * np * power(cos(latitude * radi), 3) * 
         (1 - power(Ttan, 2) + neta) * power(I, 3)) + 
         (0.0083333333333333 * np * power(cos(latitude * radi), 5) * 
         (5 - 18 * power(Ttan, 2) + power(Ttan, 4)) * power(I, 5));

    -- Return result
    RETURN QUERY SELECT x, y;
END;
$$ LANGUAGE plpgsql;

--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION point_in_polygon(
    x_input DOUBLE PRECISION,
    y_input DOUBLE PRECISION,
    x_coords DOUBLE PRECISION[],
    y_coords DOUBLE PRECISION[]
)
RETURNS BOOLEAN AS $$
DECLARE
    i INT;
    j INT;
    is_inside BOOLEAN := FALSE;
BEGIN
    -- The number of points in the polygon
    j := array_length(x_coords, 1); -- Initialize j to the last index
    IF j IS NULL THEN
        RETURN FALSE; -- If the polygon has no vertices, return false
    END IF;

    -- Loop through each edge of the polygon
    FOR i IN 1 .. array_length(x_coords, 1) LOOP
        -- Check if the point is on a vertex
        IF x_input = x_coords[i] AND y_input = y_coords[i] THEN
            RETURN TRUE; -- Point is exactly on a vertex, so it's inside
        END IF;

        -- Check if the point is on the edge (between vertices)
        IF ((x_input BETWEEN LEAST(x_coords[i], x_coords[j]) AND GREATEST(x_coords[i], x_coords[j])) AND
            (y_input BETWEEN LEAST(y_coords[i], y_coords[j]) AND GREATEST(y_coords[i], y_coords[j]))) THEN
            IF (y_coords[j] - y_coords[i]) * (x_input - x_coords[i]) = (x_coords[j] - x_coords[i]) * (y_input - y_coords[i]) THEN
                RETURN TRUE; -- Point is on the edge, so it's inside
            END IF;
        END IF;

        -- Ray-casting algorithm: check if the point crosses an edge of the polygon
        IF (y_coords[i] > y_input) != (y_coords[j] > y_input) AND
           (x_input < (x_coords[j] - x_coords[i]) * (y_input - y_coords[i]) / (y_coords[j] - y_coords[i]) + x_coords[i]) THEN
            -- Toggle the boolean flag each time the ray crosses an edge
            is_inside := NOT is_inside;
        END IF;

        j := i; -- Move j to the current vertex before the next iteration
    END LOOP;

    -- Return the result: TRUE if inside, FALSE if outside
    RETURN is_inside;
END;
$$ LANGUAGE plpgsql;

--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION determine_tree_neighborhoods(
    city_id_input INTEGER,
    latitude_input DOUBLE PRECISION,
    longitude_input DOUBLE PRECISION
)
RETURNS TABLE (
    id_neighborhood INTEGER
) AS $$
DECLARE
    x_input NUMERIC;
    y_input NUMERIC;
    neighborhood_x NUMERIC;
    neighborhood_y NUMERIC;
    neighborhood_x_coords NUMERIC[] := ARRAY[]::NUMERIC[]; -- Array to hold X coordinates
    neighborhood_y_coords NUMERIC[] := ARRAY[]::NUMERIC[]; -- Array to hold Y coordinates

    -- Cursor to loop through neighborhoods
    neighborhood_cursor CURSOR FOR
    SELECT 
        n.id_neighborhood,
        json_agg(json_build_object('latitude', c.latitude, 'longitude', c.longitude)) AS coordinates
    FROM neighborhoods n
    INNER JOIN coordinates c ON n.id_neighborhood = c.neighborhood_id
    INNER JOIN cities ci ON n.city_id = ci.id_city
    GROUP BY n.id_neighborhood
	HAVING n.city_id = city_id_input;

BEGIN
    -- Convert input latitude and longitude to X, Y
	
    SELECT x,y INTO x_input,y_input FROM convert_lat_long_to_xy(latitude_input, longitude_input);
	
    -- Loop through each neighborhood
    FOR rec IN neighborhood_cursor LOOP
		
        -- Initialize coordinates arrays
        neighborhood_x_coords := ARRAY[]::NUMERIC[];
        neighborhood_y_coords := ARRAY[]::NUMERIC[];
		
        FOR i IN 0 .. json_array_length(rec.coordinates)-1 LOOP
            -- Convert neighborhood latitude and longitude to X, Y using the same conversion function
            SELECT x,y INTO neighborhood_x, neighborhood_y FROM convert_lat_long_to_xy(
                (rec.coordinates->i->>'latitude')::NUMERIC,
                (rec.coordinates->i->>'longitude')::NUMERIC
            );
            -- Add the converted X, Y coordinates to the arrays
            neighborhood_x_coords := array_append(neighborhood_x_coords, neighborhood_x);
            neighborhood_y_coords := array_append(neighborhood_y_coords, neighborhood_y);
        END LOOP;
            -- If the point is inside, set is_inside to TRUE and break the loop.
            -- Example:
        IF point_in_polygon(x_input, y_input, neighborhood_x_coords, neighborhood_y_coords) THEN
            RETURN QUERY SELECT rec.id_neighborhood;
        END IF;
    END LOOP;
    RETURN; -- Explicitly return if no neighborhoods matched    
END;
$$ LANGUAGE plpgsql; 

--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

CREATE OR REPLACE FUNCTION set_neighborhood()
RETURNS TRIGGER AS $$
DECLARE
    latitude_input DOUBLE PRECISION;
    longitude_input DOUBLE PRECISION;
    id_neighborhood_output INTEGER;
    id_city_input INTEGER;
BEGIN
    -- Obtener latitud y longitud de la tabla coordinates basada en coordinates_id
    SELECT c.latitude, c.longitude INTO latitude_input, longitude_input
    FROM coordinates c
    WHERE c.id_coordinate = NEW.coordinate_id;

    SELECT c.id_city INTO id_city_input FROM projects p
    INNER JOIN cities c ON p.city_id = c.id_city
    WHERE p.id_project = NEW.project_id;

    SELECT id_neighborhood INTO id_neighborhood_output
    FROM determine_tree_neighborhoods(id_city_input, latitude_input, longitude_input);

    UPDATE trees
    SET neighborhood_id = id_neighborhood_output
    WHERE id_tree = NEW.id_tree;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_neighborhood_trigger
AFTER INSERT ON trees
FOR EACH ROW
EXECUTE FUNCTION set_neighborhood();

--DROP TRIGGER set_neighborhood_trigger ON trees;

