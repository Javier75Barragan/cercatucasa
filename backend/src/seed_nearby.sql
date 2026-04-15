-- ============================================
-- CercaYa - Datos de prueba Cerca del Usuario (Barrancabermeja / Sector Actual)
-- ============================================

-- Coordenadas detectadas: 7.065, -73.840
-- Agregamos un par de vendedores justo ahí para que el mapa aparezca con vida inmediatamente

-- Usuario vendedor local
INSERT INTO users (id, email, password, name, phone, role) VALUES
  ('aaaa0002-0001-0001-0001-000000000001', 'demo.cerca@test.com', '$2a$10$8KzVx1h6C8OISL1jYcTk5O3QR0MYhMKZk2qzKJcF8oN5m7GrK0rXq', 'Juan Demo', '+573004445555', 'seller')
ON CONFLICT (id) DO NOTHING;

-- Vendedores locales
INSERT INTO vendors (id, user_id, name, description, type, category, subcategories, phone, whatsapp, address, rating, review_count, is_active, is_verified) VALUES
  ('bbbb0002-0001-0001-0001-000000000001', 'aaaa0002-0001-0001-0001-000000000001',
   'Tienda La Esquina (Demo)', 'Tu tienda de confianza justo aquí. Tenemos de todo un poco para el diario.',
   'store', 'groceries', '{"leche","huevos","pan"}',
   '+573004445555', '+573004445555', 'Calle Principal #12-34',
   4.9, 120, true, true),

  ('bbbb0002-0001-0001-0001-000000000002', 'aaaa0001-0001-0001-0001-000000000003',
   'Aseo Urbano - Sector 4 (Demo)', 'Camión recolector pasando actualmente por tu zona. ¡Saca tu basura!',
   'service', 'garbage_collection', '{"recoleccion"}',
   '+573001112222', '+573001112222', 'Sector 4',
   4.5, 30, true, true)
ON CONFLICT (id) DO NOTHING;

-- Ubicaciones EXACTAS cerca de 7.065, -73.840
INSERT INTO vendor_locations (id, vendor_id, latitude, longitude, accuracy, is_active) VALUES
  ('cccc0002-0001-0001-0001-000000000001', 'bbbb0002-0001-0001-0001-000000000001',
   7.0655, -73.8405, 5, true),
  ('cccc0002-0001-0001-0001-000000000002', 'bbbb0002-0001-0001-0001-000000000002',
   7.0645, -73.8395, 10, true)
ON CONFLICT (id) DO NOTHING;
