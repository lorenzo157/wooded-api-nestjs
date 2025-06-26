{
  "treeName": "Arbolito",
  "pathPhoto": "/images/trees/arbolito.jpg",
  "cityBlock": 101,
  "perimeter": 10.5,
  "height": 20.0,
  "incline": 2.5,
  "treesInTheBlock": 5,
  "useUnderTheTree": "Shade",
  "frequencyUse": 3,
  "potentialDamage": 500,
  "isMovable": false,
  "isRestrictable": true,
  "isMissing": false,
  "isDead": false,
  "exposedRoots": true,
  "dch": 35,
  "windExposure": "protegido",
  "vigor": "excelente",
  "canopyDensity": "densa",
  "growthSpace": "cazuela > 2 m2",
  "treeValue": "singular",
  "streetMateriality": "asfalto",
  "conflictsNames": ["obstruccion visual de señaletica vial", "obstruccion de visual(transito humano y vehicular)"],
  "createDefectsDtos": [
    {
      "defectName": "ramas colgantes o quebradas",
      "defectValue": 4,
      "textDefectValue": "> 10 cm de diametro",
      "branches": 3
    },
    {
      "defectName": "raices estrangulantes",
      "defectValue": 4,
      "textDefectValue": "afecta > 50% del perimetro de la base"
    }
  ],
  "diseasesNames": ["Enfermedad1", "Enfermedad2"],
  "interventionsNames": ["extraccion del arbol", "poda"],
  "pestsNames": ["Plaga1", "Plaga2"],
  "latitude": -34.603722,
  "longitude": -58.381592,
  "projectId": 2,
  "treeTypeName": "Tipo1",
  "risk": 12,
  "address": "direccion1"
}

{
  "userName": "Lorenzo",
  "lastName": "Lopez",
  "email": "lorenzito@example.com",
  "password": "contra",
  "phonenumber": "123456789",
  "address": "123 Main St",
  "cityName": "Santa Fe",
  "provinceName": "Santa Fe",
  "roleName": "Administrador"
}
{
  "email": "lorenzito@example.com",
  "password": "contra"
}

INSERT INTO pests (pest_name) VALUES ('Plaga1'), ('Plaga2');
INSERT INTO conflicts (conflict_name) VALUES ('Conflicto1'), ('Conflicto2');
INSERT INTO diseases (disease_name) VALUES ('Enfermedad1'), ('Enfermedad2');
INSERT INTO interventions (intervention_name) VALUES ('Intervencion1'), ('Intervencion2');
INSERT INTO defects (defect_name, defect_zone) VALUES ('Defecto1', 'raiz'), ('Defecto2', 'tronco');

INSERT INTO tree_types (tree_type_name, gender, species, scientific_name) VALUES 
('Tipo no definido', 'Genero no definido', 'Especie no definida', 'Nombre Cientifico no definido'),
INSERT INTO tree_types (tree_type_name) VALUES 
('solo tipo' )

INSERT INTO provinces (province_name) VALUES 
('Santa Fe');
INSERT INTO cities (city_name,province_id) VALUES  
('Santa Fe',1);
INSERT INTO neighborhoods (neighborhood_name, neighborhood_metres, city_id) VALUES   
('Candioti',10000,1);

INSERT INTO roles (role_name) VALUES ('Administrador');

INSERT INTO projects (project_name, project_description, start_date, end_date, project_type, city_id, user_id) VALUES 
('Proyecto de Reforestación', 'Reforestación en zonas rurales', '2023-01-01', '2024-01-01', TRUE, 1, 1);
INSERT INTO project_user (project_id,user_id) VALUES (2,1);
SELECT * from neighborhoods
SELECT * from trees
SELECT * from coordinates

UPDATE trees SET neighborhood_id = 1 WHERE id_tree = 8;

TRUNCATE TABLE trees CASCADE;
select * from trees

SELECT * FROM convert_lat_long_to_xy(40.7128, -74.0060);
SELECT point_in_polygon(4.5, 2.5, ARRAY[0, 2, 6, 4,6], ARRAY[0, 4, 4, 2,0]);

INSERT INTO neighborhoods (neighborhood_name, neighborhood_metres, city_id)
VALUES ('Los hornos', 20000, 1);

select * from neighborhoods
INSERT INTO coordinates (longitude, latitude, neighborhood_id)
VALUES
  (-59.45678901, -30.67890123, 1),
  (-60.45678901, -31.67890123, 1),
  (-61.45678901, -30.67890123, 1),
  (-62.45678901, -31.67890123, 1),
  (-61.45678901, -32.67890123, 1),
  (-60.45678901, -32.67890123, 1);

  SELECT n.id_neighborhood, n.city_id,
        json_agg(json_build_object('latitude', c.latitude, 'longitude', c.longitude)) AS coordinates
    FROM neighborhoods n
    INNER JOIN coordinates c ON n.id_neighborhood = c.neighborhood_id
    INNER JOIN cities ci ON n.city_id = ci.id_city
	WHERE n.city_id = 1
    GROUP BY n.id_neighborhood
    Having n.city_id = 1;  

    -- Select a point inside the polygon (adjust coordinates as needed)
SELECT * FROM determine_tree_neighborhoods(1, 46.5, 25);
SELECT * FROM determine_tree_neighborhoods(1, 46.67890123, 24.45678901);
SELECT * FROM determine_tree_neighborhoods(1, -31.67890123, -60.45678902);
SELECT * FROM determine_tree_neighborhoods(1, -31.6296, -60.693);