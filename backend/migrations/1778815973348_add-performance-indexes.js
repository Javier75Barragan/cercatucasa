/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Índices para búsquedas geográficas (Mapa)
  pgm.createIndex('vendor_locations', ['latitude', 'longitude'], { name: 'idx_vendor_locations_coords' });
  pgm.createIndex('vendor_locations', ['is_active']);

  // Índices para filtrado de negocios
  pgm.createIndex('vendors', ['category', 'type', 'is_active'], { name: 'idx_vendors_search' });
  pgm.createIndex('vendors', ['user_id']);

  // Índices para productos y reseñas
  pgm.createIndex('products', ['vendor_id', 'category']);
  pgm.createIndex('reviews', ['vendor_id', 'user_id']);
  
  // Índices para alertas
  pgm.createIndex('notification_alerts', ['user_id', 'is_active']);
};

export const down = (pgm) => {
  pgm.dropIndex('notification_alerts', ['user_id', 'is_active']);
  pgm.dropIndex('reviews', ['vendor_id', 'user_id']);
  pgm.dropIndex('products', ['vendor_id', 'category']);
  pgm.dropIndex('vendors', ['user_id']);
  pgm.dropIndex('vendors', ['category', 'type', 'is_active'], { name: 'idx_vendors_search' });
  pgm.dropIndex('vendor_locations', ['is_active']);
  pgm.dropIndex('vendor_locations', ['latitude', 'longitude'], { name: 'idx_vendor_locations_coords' });
};
