-- Coordenadas de prueba para sucursales en Cochabamba, Bolivia
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- Prueba 1 — Zona Calle Sucre / Centro Histórico
UPDATE "Sucursal" SET latitud = -17.3935, longitud = -66.1556
WHERE lower(nombre) LIKE '%prueba 1%';

-- prueba 2 — Plaza 14 de Septiembre
UPDATE "Sucursal" SET latitud = -17.3944, longitud = -66.1569
WHERE lower(nombre) LIKE '%prueba 2%';

-- Prueba 3 — Campus UMSS
UPDATE "Sucursal" SET latitud = -17.3957, longitud = -66.1539
WHERE lower(nombre) LIKE '%prueba 3%';

-- PRUEBA Aaaaa — Av. Pando / UMSS Norte
UPDATE "Sucursal" SET latitud = -17.3975, longitud = -66.1501
WHERE lower(nombre) LIKE '%prueba aaaaa%';

-- prueba b — Zona Cala Cala (Norte)
UPDATE "Sucursal" SET latitud = -17.3712, longitud = -66.1548
WHERE lower(nombre) LIKE '%prueba b%';

-- Prueba2 — Av. América
UPDATE "Sucursal" SET latitud = -17.3889, longitud = -66.1450
WHERE lower(nombre) LIKE '%prueba2%';
