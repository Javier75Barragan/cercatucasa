-- ============================================
-- CercaYa - Datos de prueba (Seed)
-- ============================================

-- Crear usuarios vendedores de prueba
INSERT INTO users (id, email, password, name, phone, role) VALUES
  ('aaaa0001-0001-0001-0001-000000000001', 'frutas.maria@test.com', '$2a$10$8KzVx1h6C8OISL1jYcTk5O3QR0MYhMKZk2qzKJcF8oN5m7GrK0rXq', 'María García', '+573001234567', 'seller'),
  ('aaaa0001-0001-0001-0001-000000000002', 'panaderia.carlos@test.com', '$2a$10$8KzVx1h6C8OISL1jYcTk5O3QR0MYhMKZk2qzKJcF8oN5m7GrK0rXq', 'Carlos Rodríguez', '+573009876543', 'seller'),
  ('aaaa0001-0001-0001-0001-000000000003', 'aseo.ciudad@test.com', '$2a$10$8KzVx1h6C8OISL1jYcTk5O3QR0MYhMKZk2qzKJcF8oN5m7GrK0rXq', 'Limpieza Urbana S.A.', '+573005551234', 'seller'),
  ('aaaa0001-0001-0001-0001-000000000004', 'recibos.energia@test.com', '$2a$10$8KzVx1h6C8OISL1jYcTk5O3QR0MYhMKZk2qzKJcF8oN5m7GrK0rXq', 'ElectroServicios', '+573005554321', 'seller'),
  ('aaaa0001-0001-0001-0001-000000000005', 'claro.movil@test.com', '$2a$10$8KzVx1h6C8OISL1jYcTk5O3QR0MYhMKZk2qzKJcF8oN5m7GrK0rXq', 'Claro Colombia', '+573005559999', 'seller'),
  ('aaaa0001-0001-0001-0001-000000000006', 'farmacia.salud@test.com', '$2a$10$8KzVx1h6C8OISL1jYcTk5O3QR0MYhMKZk2qzKJcF8oN5m7GrK0rXq', 'Farmacia La Salud', '+573005558888', 'seller'),
  ('aaaa0001-0001-0001-0001-000000000007', 'gas.domicilio@test.com', '$2a$10$8KzVx1h6C8OISL1jYcTk5O3QR0MYhMKZk2qzKJcF8oN5m7GrK0rXq', 'Gas Express', '+573005557777', 'seller')
ON CONFLICT (id) DO NOTHING;

-- Garantizar que no haya conflicto de emails
-- (Los passwords son hash de '123456')

-- Crear vendedores/negocios de prueba
-- Coordenadas cercanas a Bucaramanga (7.1193, -73.1227)
INSERT INTO vendors (id, user_id, name, description, type, category, subcategories, phone, whatsapp, address, rating, review_count, is_active, is_verified) VALUES
  -- Vendedores tradicionales
  ('bbbb0001-0001-0001-0001-000000000001', 'aaaa0001-0001-0001-0001-000000000001',
   'Frutas y Verduras María', 'Las frutas más frescas del barrio. Traídas directamente de la plaza mayorista cada mañana. ¡Prueba nuestro surtido especial de frutas tropicales!',
   'ambulant', 'fruits_vegetables', '{"frutas","verduras","hierbas"}',
   '+573001234567', '+573001234567', 'Calle 55 con Carrera 35',
   4.5, 23, true, true),

  ('bbbb0001-0001-0001-0001-000000000002', 'aaaa0001-0001-0001-0001-000000000002',
   'Panadería Don Carlos', 'Pan artesanal recién horneado. Nuestras almojábanas y pandebonos son los favoritos del barrio desde hace 15 años.',
   'ambulant', 'bakery', '{"pan","pasteles","ponqués"}',
   '+573009876543', '+573009876543', 'Carrera 34 entre Calles 54 y 55',
   4.8, 47, true, true),

  -- Empresas de servicios públicos
  ('bbbb0001-0001-0001-0001-000000000003', 'aaaa0001-0001-0001-0001-000000000003',
   'Aseo Urbano - Ruta 7', 'Camión recolector de basura. Ruta 7 - Zona Centro. Horario: Lunes, Miércoles y Viernes 6:00 AM - 2:00 PM',
   'service', 'garbage_collection', '{"recoleccion","reciclaje"}',
   '+573005551234', '+573005551234', 'Ruta 7 - Centro',
   4.2, 15, true, true),

  ('bbbb0001-0001-0001-0001-000000000004', 'aaaa0001-0001-0001-0001-000000000004',
   'Repartidor de Recibos - Zona 3', 'Entrega de recibos de energía, agua y gas. Zona 3 - Barrios Centro y Sotomayor.',
   'service', 'utility_delivery', '{"energia","agua","gas"}',
   '+573005554321', '+573005554321', 'Zona 3 - Centro',
   3.9, 8, true, false),

  -- Empresa de telecomunicaciones
  ('bbbb0001-0001-0001-0001-000000000005', 'aaaa0001-0001-0001-0001-000000000005',
   'Claro - Punto de Servicio Móvil', 'Punto de atención móvil de Claro. Recargas, activaciones, cambio de SIM, soporte técnico y venta de equipos.',
   'service', 'telecom', '{"recargas","planes","equipos","soporte"}',
   '+573005559999', '+573005559999', 'Calle 55 #34-12',
   4.1, 31, true, true),

  -- Farmacia
  ('bbbb0001-0001-0001-0001-000000000006', 'aaaa0001-0001-0001-0001-000000000006',
   'Farmacia La Salud 24h', 'Farmacia de turno las 24 horas. Medicamentos, productos de salud, y servicio a domicilio.',
   'pharmacy', 'pharmacy', '{"medicamentos","salud","belleza"}',
   '+573005558888', '+573005558888', 'Carrera 35 #55-20',
   4.6, 52, true, true),

  -- Servicio de gas  
  ('bbbb0001-0001-0001-0001-000000000007', 'aaaa0001-0001-0001-0001-000000000007',
   'Gas Express Domicilios', 'Entrega de cilindros de gas a domicilio. Servicio rápido en menos de 30 minutos.',
   'service', 'gas_delivery', '{"gas","cilindros","domicilio"}',
   '+573005557777', '+573005557777', 'Cobertura zona centro',
   4.3, 19, true, true)
ON CONFLICT (id) DO NOTHING;

-- Crear ubicaciones para los vendedores (cerca de la ubicación del usuario)
-- Las coordenadas son cercanas al centro de Bucaramanga
INSERT INTO vendor_locations (id, vendor_id, latitude, longitude, accuracy, is_active) VALUES
  ('cccc0001-0001-0001-0001-000000000001', 'bbbb0001-0001-0001-0001-000000000001',
   7.11980, -73.12320, 5, true),

  ('cccc0001-0001-0001-0001-000000000002', 'bbbb0001-0001-0001-0001-000000000002',
   7.11880, -73.12180, 5, true),

  ('cccc0001-0001-0001-0001-000000000003', 'bbbb0001-0001-0001-0001-000000000003',
   7.12050, -73.12400, 8, true),

  ('cccc0001-0001-0001-0001-000000000004', 'bbbb0001-0001-0001-0001-000000000004',
   7.11850, -73.12350, 10, true),

  ('cccc0001-0001-0001-0001-000000000005', 'bbbb0001-0001-0001-0001-000000000005',
   7.11920, -73.12150, 3, true),

  ('cccc0001-0001-0001-0001-000000000006', 'bbbb0001-0001-0001-0001-000000000006',
   7.11960, -73.12250, 3, true),

  ('cccc0001-0001-0001-0001-000000000007', 'bbbb0001-0001-0001-0001-000000000007',
   7.11800, -73.12280, 15, true)
ON CONFLICT (id) DO NOTHING;

-- Crear algunos productos para los vendedores
INSERT INTO products (id, vendor_id, name, description, price, currency, category, is_available) VALUES
  -- Productos de Frutas María
  ('dddd0001-0001-0001-0001-000000000001', 'bbbb0001-0001-0001-0001-000000000001',
   'Aguacate Hass', 'Aguacate Hass maduro, listo para comer', 3500, 'COP', 'fruits_vegetables', true),
  ('dddd0001-0001-0001-0001-000000000002', 'bbbb0001-0001-0001-0001-000000000001',
   'Mango Tommy', 'Mango Tommy dulce y jugoso', 2000, 'COP', 'fruits_vegetables', true),
  ('dddd0001-0001-0001-0001-000000000003', 'bbbb0001-0001-0001-0001-000000000001',
   'Tomate Chonto (lb)', 'Tomate chonto fresco por libra', 2500, 'COP', 'fruits_vegetables', true),

  -- Productos de Panadería Don Carlos
  ('dddd0001-0001-0001-0001-000000000004', 'bbbb0001-0001-0001-0001-000000000002',
   'Almojábana', 'Almojábana artesanal con queso', 1500, 'COP', 'bakery', true),
  ('dddd0001-0001-0001-0001-000000000005', 'bbbb0001-0001-0001-0001-000000000002',
   'Pandebono', 'Pandebono crujiente recién horneado', 1200, 'COP', 'bakery', true),
  ('dddd0001-0001-0001-0001-000000000006', 'bbbb0001-0001-0001-0001-000000000002',
   'Pan de Bono (docena)', 'Docena de pandebonos frescos', 12000, 'COP', 'bakery', true),

  -- Productos de Farmacia
  ('dddd0001-0001-0001-0001-000000000007', 'bbbb0001-0001-0001-0001-000000000006',
   'Acetaminofén 500mg', 'Caja x 20 tabletas', 5500, 'COP', 'pharmacy', true),
  ('dddd0001-0001-0001-0001-000000000008', 'bbbb0001-0001-0001-0001-000000000006',
   'Ibuprofeno 400mg', 'Caja x 10 tabletas', 4800, 'COP', 'pharmacy', true),

  -- Servicios de Claro
  ('dddd0001-0001-0001-0001-000000000009', 'bbbb0001-0001-0001-0001-000000000005',
   'Recarga $10.000', 'Recarga prepago Claro', 10000, 'COP', 'telecom', true),
  ('dddd0001-0001-0001-0001-000000000010', 'bbbb0001-0001-0001-0001-000000000005',
   'Plan Postpago Básico', 'Plan con 8GB + redes ilimitadas', 39900, 'COP', 'telecom', true),

  -- Servicio de Gas
  ('dddd0001-0001-0001-0001-000000000011', 'bbbb0001-0001-0001-0001-000000000007',
   'Cilindro 40 lbs', 'Cilindro de gas propano 40 libras', 85000, 'COP', 'gas_delivery', true),
  ('dddd0001-0001-0001-0001-000000000012', 'bbbb0001-0001-0001-0001-000000000007',
   'Cilindro 20 lbs', 'Cilindro de gas propano 20 libras', 48000, 'COP', 'gas_delivery', true)
ON CONFLICT (id) DO NOTHING;
