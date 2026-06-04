-- ═══════════════════════════════════════════════════════════════
-- Migración 006 — Seed: Productos y Personalizaciones
-- Ejecutar en Supabase SQL Editor
-- Asume que ya existe al menos 1 cafetería y 1 sucursal activa.
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_cafeteria_id  UUID;
  v_sucursal_id   UUID;

  -- IDs de productos (para asociar a la sucursal)
  p1  UUID; p2  UUID; p3  UUID; p4  UUID; p5  UUID;
  p6  UUID; p7  UUID; p8  UUID; p9  UUID; p10 UUID;
  p11 UUID; p12 UUID; p13 UUID; p14 UUID; p15 UUID;

  -- IDs de personalizaciones
  pers_leche   UUID;
  pers_tamaño  UUID;
  pers_shot    UUID;
  pers_extra   UUID;
  pers_azucar  UUID;
  pers_temp    UUID;

BEGIN

  -- ── Obtener cafetería y sucursal ─────────────────────────────
  SELECT id INTO v_cafeteria_id FROM cafeterias LIMIT 1;
  IF v_cafeteria_id IS NULL THEN
    RAISE EXCEPTION 'No hay cafeterías registradas. Crea una primero.';
  END IF;

  SELECT id INTO v_sucursal_id
  FROM "Sucursal"
  WHERE cafeteria_id = v_cafeteria_id AND activa = TRUE
  LIMIT 1;

  IF v_sucursal_id IS NULL THEN
    RAISE EXCEPTION 'No hay sucursales activas para esta cafetería.';
  END IF;

  RAISE NOTICE 'Usando cafeteria_id: % — sucursal_id: %', v_cafeteria_id, v_sucursal_id;

  -- ═══════════════════════════════════════════════════════════════
  -- PRODUCTOS — Bebidas calientes
  -- ═══════════════════════════════════════════════════════════════

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Americano Clásico', 'Espresso doble con agua caliente, sabor limpio e intenso', 15.00, 50, TRUE, NULL)
  RETURNING id_producto INTO p1;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Cappuccino Italiano', 'Espresso con leche texturizada y espuma sedosa. El clásico italiano', 22.00, 50, TRUE, NULL)
  RETURNING id_producto INTO p2;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Latte de Vainilla', 'Espresso suave con leche vaporizada y toque de vainilla natural', 25.00, 50, TRUE, NULL)
  RETURNING id_producto INTO p3;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Macchiato Caramelizado', 'Capas de vainilla, leche espumosa, espresso y caramelo artesanal', 28.00, 50, TRUE, NULL)
  RETURNING id_producto INTO p4;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Chocolate Caliente', 'Mezcla de cacao oscuro y leche cremosa, suave y reconfortante', 20.00, 40, TRUE, NULL)
  RETURNING id_producto INTO p5;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Matcha Latte', 'Té verde matcha ceremonial japonés con leche vaporizada', 27.00, 35, TRUE, NULL)
  RETURNING id_producto INTO p6;

  -- ═══════════════════════════════════════════════════════════════
  -- PRODUCTOS — Bebidas frías
  -- ═══════════════════════════════════════════════════════════════

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Cold Brew Premium', 'Café infusionado en frío por 18 horas. Suave, dulce y concentrado', 25.00, 30, TRUE, NULL)
  RETURNING id_producto INTO p7;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Frappé de Café', 'Bebida fría mezclada con espresso, leche y hielo. Refrescante y energizante', 30.00, 30, TRUE, NULL)
  RETURNING id_producto INTO p8;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Latte Helado de Coco', 'Espresso sobre leche de coco helada con toque de cacao', 28.00, 25, TRUE, NULL)
  RETURNING id_producto INTO p9;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Limonada Espresso', 'La combinación perfecta: espresso doble con limonada fresca', 27.00, 25, TRUE, NULL)
  RETURNING id_producto INTO p10;

  -- ═══════════════════════════════════════════════════════════════
  -- PRODUCTOS — Comida y repostería
  -- ═══════════════════════════════════════════════════════════════

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Croissant de Jamón y Queso', 'Croissant de mantequilla relleno de jamón ahumado y queso fundido', 25.00, 20, TRUE, NULL)
  RETURNING id_producto INTO p11;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Muffin de Arándanos', 'Esponjoso muffin de arándanos frescos, ligero y delicioso', 18.00, 20, TRUE, NULL)
  RETURNING id_producto INTO p12;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Tostada Avocado', 'Pan artesanal tostado con aguacate, huevo pochado y semillas', 35.00, 15, TRUE, NULL)
  RETURNING id_producto INTO p13;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Cheesecake de Maracuyá', 'Cheesecake cremoso con coulis de maracuyá natural', 28.00, 15, TRUE, NULL)
  RETURNING id_producto INTO p14;

  INSERT INTO "Producto" (nom_producto, descripcion, precio, stock, estado, imagen_producto)
  VALUES ('Brownie de Chocolate', 'Brownie denso y fudgy con chips de chocolate belga', 20.00, 20, TRUE, NULL)
  RETURNING id_producto INTO p15;

  -- ═══════════════════════════════════════════════════════════════
  -- ASOCIAR PRODUCTOS A LA SUCURSAL
  -- ═══════════════════════════════════════════════════════════════

  INSERT INTO "Sucursal_producto" (id_sucursal, id_producto) VALUES
    (v_sucursal_id, p1),
    (v_sucursal_id, p2),
    (v_sucursal_id, p3),
    (v_sucursal_id, p4),
    (v_sucursal_id, p5),
    (v_sucursal_id, p6),
    (v_sucursal_id, p7),
    (v_sucursal_id, p8),
    (v_sucursal_id, p9),
    (v_sucursal_id, p10),
    (v_sucursal_id, p11),
    (v_sucursal_id, p12),
    (v_sucursal_id, p13),
    (v_sucursal_id, p14),
    (v_sucursal_id, p15);

  RAISE NOTICE '15 productos insertados y asociados a sucursal %', v_sucursal_id;

  -- ═══════════════════════════════════════════════════════════════
  -- PERSONALIZACIONES
  -- ═══════════════════════════════════════════════════════════════

  -- 1. Tipo de leche (requerido)
  INSERT INTO personalizaciones (cafeteria_id, nombre, requerido, orden, activo)
  VALUES (v_cafeteria_id, 'Tipo de leche', TRUE, 1, TRUE)
  RETURNING id INTO pers_leche;

  INSERT INTO opciones_personalizacion (personalizacion_id, nombre, precio_adicional, orden) VALUES
    (pers_leche, 'Leche entera',       0.00, 1),
    (pers_leche, 'Leche descremada',   0.00, 2),
    (pers_leche, 'Leche de almendras', 5.00, 3),
    (pers_leche, 'Leche de avena',     5.00, 4),
    (pers_leche, 'Leche de soya',      5.00, 5);

  -- 2. Tamaño (requerido)
  INSERT INTO personalizaciones (cafeteria_id, nombre, requerido, orden, activo)
  VALUES (v_cafeteria_id, 'Tamaño', TRUE, 2, TRUE)
  RETURNING id INTO pers_tamaño;

  INSERT INTO opciones_personalizacion (personalizacion_id, nombre, precio_adicional, orden) VALUES
    (pers_tamaño, 'Pequeño 8oz',  0.00,  1),
    (pers_tamaño, 'Mediano 12oz', 5.00,  2),
    (pers_tamaño, 'Grande 16oz',  10.00, 3);

  -- 3. Shots de espresso (opcional)
  INSERT INTO personalizaciones (cafeteria_id, nombre, requerido, orden, activo)
  VALUES (v_cafeteria_id, 'Intensidad de café', FALSE, 3, TRUE)
  RETURNING id INTO pers_shot;

  INSERT INTO opciones_personalizacion (personalizacion_id, nombre, precio_adicional, orden) VALUES
    (pers_shot, 'Un shot',     0.00,  1),
    (pers_shot, 'Doble shot',  5.00,  2),
    (pers_shot, 'Triple shot', 10.00, 3);

  -- 4. Extras (opcional)
  INSERT INTO personalizaciones (cafeteria_id, nombre, requerido, orden, activo)
  VALUES (v_cafeteria_id, 'Extras', FALSE, 4, TRUE)
  RETURNING id INTO pers_extra;

  INSERT INTO opciones_personalizacion (personalizacion_id, nombre, precio_adicional, orden) VALUES
    (pers_extra, 'Sin extras',          0.00, 1),
    (pers_extra, 'Crema batida',        5.00, 2),
    (pers_extra, 'Jarabe de caramelo',  5.00, 3),
    (pers_extra, 'Shot de vainilla',    5.00, 4),
    (pers_extra, 'Chocolate en polvo',  3.00, 5);

  -- 5. Azúcar (opcional)
  INSERT INTO personalizaciones (cafeteria_id, nombre, requerido, orden, activo)
  VALUES (v_cafeteria_id, 'Nivel de azúcar', FALSE, 5, TRUE)
  RETURNING id INTO pers_azucar;

  INSERT INTO opciones_personalizacion (personalizacion_id, nombre, precio_adicional, orden) VALUES
    (pers_azucar, 'Sin azúcar',   0.00, 1),
    (pers_azucar, 'Poco dulce',   0.00, 2),
    (pers_azucar, 'Normal',       0.00, 3),
    (pers_azucar, 'Extra dulce',  0.00, 4);

  -- 6. Temperatura (requerido)
  INSERT INTO personalizaciones (cafeteria_id, nombre, requerido, orden, activo)
  VALUES (v_cafeteria_id, 'Temperatura', TRUE, 6, TRUE)
  RETURNING id INTO pers_temp;

  INSERT INTO opciones_personalizacion (personalizacion_id, nombre, precio_adicional, orden) VALUES
    (pers_temp, 'Caliente', 0.00, 1),
    (pers_temp, 'Tibio',    0.00, 2),
    (pers_temp, 'Helado',   0.00, 3);

  RAISE NOTICE '6 personalizaciones con sus opciones insertadas para cafeteria %', v_cafeteria_id;
  RAISE NOTICE 'Seed completado exitosamente.';

END $$;
