-- Agrega columna categoria a la tabla Producto (DDD)
ALTER TABLE "Producto" ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'Café';

-- Actualiza productos existentes con categorías apropiadas
-- Café: bebidas a base de café
UPDATE "Producto" SET categoria = 'Café' WHERE nom_producto IN (
  'Americano Clásico', 'Cappuccino Italiano', 'Latte de Vainilla',
  'Macchiato Caramelizado', 'Cold Brew Premium'
);

-- Bebidas: bebidas sin café (chocolate, matcha, frappé, limonada)
UPDATE "Producto" SET categoria = 'Bebidas' WHERE nom_producto IN (
  'Chocolate Caliente', 'Matcha Latte', 'Frappé de Café',
  'Latte Helado de Coco', 'Limonada Espresso'
);

-- Repostería: postres, muffins, cheesecakes, brownies
UPDATE "Producto" SET categoria = 'Repostería' WHERE nom_producto IN (
  'Muffin de Arándanos', 'Cheesecake de Maracuyá', 'Brownie de Chocolate'
);

-- Salados: croissants, tostadas, sándwiches
UPDATE "Producto" SET categoria = 'Salados' WHERE nom_producto IN (
  'Croissant de Jamón y Queso', 'Tostada Avocado'
);
