-- Script de inicialización para PostgreSQL con PostGIS en Railway
-- Ejecutar en el panel de Railway o vía conexión directa

-- Habilitar extensión PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verificar que PostGIS está habilitado
SELECT postgis_version();

-- Índice geoespacial optimizado para vendor_locations
CREATE INDEX IF NOT EXISTS idx_vendor_locations_geog
ON vendor_locations USING gist (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Función para calcular distancia en metros (más precisa con PostGIS)
-- Nota: El código actual usa fórmula Haversine que también funciona sin PostGIS
