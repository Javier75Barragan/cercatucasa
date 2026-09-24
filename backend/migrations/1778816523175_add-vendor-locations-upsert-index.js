/**
 * Índice parcial único para vendor_locations que permite usar ON CONFLICT en UPSERT.
 * Garantiza que solo exista una fila activa por vendedor.
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  // Primero, limpiar filas duplicadas activas (mantener solo la más reciente)
  pgm.sql(`
    DELETE FROM vendor_locations
    WHERE id NOT IN (
      SELECT DISTINCT ON (vendor_id) id
      FROM vendor_locations
      WHERE is_active = true
      ORDER BY vendor_id, updated_at DESC
    )
    AND is_active = true
  `);

  // Crear índice parcial único: solo una fila activa por vendedor
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_locations_active_vendor 
    ON vendor_locations (vendor_id) 
    WHERE is_active = true
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_vendor_locations_active_vendor`);
};
